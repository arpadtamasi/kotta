import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test, vi } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";

// Counts every git subprocess the module under test spawns, and can force `git archive`
// to fail so the per-file fallback path is exercised.
const gitCalls = vi.hoisted(() => ({ list: [] as string[][], failArchive: false }));
vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  const spawnSync = (command: unknown, args?: unknown, options?: unknown) => {
    if (command === "git" && Array.isArray(args)) {
      gitCalls.list.push(args as string[]);
      if (gitCalls.failArchive && args[0] === "archive") {
        return { status: 1, stdout: Buffer.alloc(0), stderr: Buffer.from("forced archive failure"), pid: 0, output: [], signal: null };
      }
    }
    return (actual.spawnSync as (...rest: unknown[]) => unknown)(command, args, options);
  };
  return { ...actual, spawnSync };
});

const cli = resolve("dist/cli/index.js");

function measure(): string[][] {
  const captured = gitCalls.list;
  gitCalls.list = [];
  return captured;
}

function term(index: number): string {
  const id = `GT-01m0c${String(index).padStart(21, "0")}`;
  return `---\nid: ${id}\nform: glossary-term\ntitle: Synthetic term ${index}\n---\n# Term\n\n## Definition\n\nDefined.\n\n## Usage\n\nUsed.\n\n## Non-examples\n\nNone.\n`;
}

function run(root: string, args: string[]): void {
  const result = spawnSync("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.com", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
}

function bigWorkspace(nodes: number, options: { checkoutSideBranch: boolean }): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "kotta-ui-batch-")));
  run(root, ["init", "-b", "main"]);
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  const terms = join(root, ".kotta/spec/glossary-terms");
  mkdirSync(terms, { recursive: true });
  for (let index = 1; index <= nodes; index++) writeFileSync(join(terms, `term-${index}.md`), term(index));
  run(root, ["add", "-A"]);
  run(root, ["commit", "-m", "fixture: synthetic specification"]);
  if (options.checkoutSideBranch) run(root, ["checkout", "-q", "-b", "work"]);
  return root;
}

function commitTermOnMain(root: string, index: number): void {
  run(root, ["checkout", "-q", "main"]);
  writeFileSync(join(root, `.kotta/spec/glossary-terms/term-${index}.md`), term(index));
  run(root, ["add", "-A"]);
  run(root, ["commit", "-m", `fixture: add term ${index}`]);
  run(root, ["checkout", "-q", "work"]);
}

describe("batched, cached base-ref reads", () => {
  const root = bigWorkspace(210, { checkoutSideBranch: true });

  test("assembles a 200+ node specification with at most 2 git subprocesses (rev-parse + batch)", () => {
    measure();
    const workspace = readWorkspace(root);
    const calls = measure();

    expect(workspace.spec).toHaveLength(210);
    expect(workspace.spec.find((entry) => entry.title === "Synthetic term 210")).toMatchObject({ form: "glossary-term" });
    expect(calls.length).toBeLessThanOrEqual(2);
    expect(calls.map((args) => args[0]).sort()).toEqual(["archive", "rev-parse"]);
  });

  test("second assembly on the same base hash is a cache hit: no batch read", () => {
    measure();
    const workspace = readWorkspace(root);
    const calls = measure();

    expect(workspace.spec).toHaveLength(210);
    expect(calls.map((args) => args[0])).not.toContain("archive");
    expect(calls.map((args) => args[0])).not.toContain("show");
    expect(calls).toHaveLength(1); // rev-parse only
  });

  test("a new commit on the base ref invalidates the cache and refreshes the data", () => {
    commitTermOnMain(root, 211);
    measure();
    const workspace = readWorkspace(root);
    const calls = measure();

    expect(calls.map((args) => args[0])).toContain("archive");
    expect(workspace.spec).toHaveLength(211);
  });

  test("on the base branch, uncommitted additions still show with one extra status call", () => {
    const base = bigWorkspace(3, { checkoutSideBranch: false });
    writeFileSync(join(base, ".kotta/spec/glossary-terms/term-4.md"), term(4));
    measure();
    const workspace = readWorkspace(base);
    const calls = measure();

    expect(workspace.spec).toHaveLength(4);
    expect(calls.map((args) => args[0]).sort()).toEqual(["archive", "rev-parse", "status"]);
  });

  test("a failing batch read falls back to per-file reads with a loud warning", () => {
    const fallbackRoot = bigWorkspace(5, { checkoutSideBranch: true });
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    gitCalls.failArchive = true;
    try {
      measure();
      const workspace = readWorkspace(fallbackRoot);
      const calls = measure();

      expect(workspace.spec).toHaveLength(5);
      expect(calls.map((args) => args[0])).toContain("show");
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("falling back to per-file git reads"));
    } finally {
      gitCalls.failArchive = false;
      stderrSpy.mockRestore();
    }
  });
});
