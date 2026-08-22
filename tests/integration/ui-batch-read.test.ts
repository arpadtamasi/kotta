import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test, vi } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";

// Counts every git subprocess the module under test spawns, and can force `git archive`
// to fail so the per-file fallback path is exercised. (T-029)
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

function measure(): string[][] {
  const captured = gitCalls.list;
  gitCalls.list = [];
  return captured;
}

function task(id: string, status: string): string {
  return `---\nid: ${id}\ntitle: Synthetic task ${id}\nstatus: ${status}\ntypes: [bug]\nprofiles: [bug]\n---\n# ${id} — Synthetic task\n\n## Outcome\n\nBatch reads stay fast.\n`;
}

function run(root: string, args: string[]): void {
  const result = spawnSync("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.com", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
}

// Legacy-name fixture on purpose (T-020): the batched ref read must work on a `.a-team/` workspace too.
function bigWorkspace(entities: number, options: { checkoutSideBranch: boolean }): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "kotta-ui-batch-")));
  mkdirSync(join(root, ".a-team/process/tasks"), { recursive: true });
  writeFileSync(join(root, ".a-team/config.yaml"), "version: 5\nproject:\n  name: batch-fixture\n");
  for (let index = 1; index <= entities; index++) {
    const id = `T-${String(index).padStart(3, "0")}`;
    writeFileSync(join(root, `.a-team/process/tasks/${id}-synthetic.md`), task(id, "defined"));
  }
  mkdirSync(join(root, ".a-team/process/claims"), { recursive: true });
  writeFileSync(join(root, ".a-team/process/claims/T-001.yaml"), "task: T-001\nagent: codex\nbranch: feat/T-001\nworktree: .worktrees/T-001\nstarted_at: 2026-08-14T08:30:00Z\n");
  run(root, ["init", "-b", "main"]);
  run(root, ["add", "-A"]);
  run(root, ["commit", "-m", "fixture: synthetic workspace"]);
  if (options.checkoutSideBranch) run(root, ["checkout", "-q", "-b", "work"]);
  return root;
}

function commitTaskOnMain(root: string, id: string): void {
  run(root, ["checkout", "-q", "main"]);
  writeFileSync(join(root, `.a-team/process/tasks/${id}-synthetic.md`), task(id, "defined"));
  run(root, ["add", "-A"]);
  run(root, ["commit", "-m", `fixture: add ${id}`]);
  run(root, ["checkout", "-q", "work"]);
}

describe("batched, cached base-ref reads (T-029)", () => {
  const root = bigWorkspace(210, { checkoutSideBranch: true });

  test("assembles a 200+ entity workspace with at most 2 git subprocesses (rev-parse + batch)", () => {
    measure();
    const workspace = readWorkspace(root);
    const calls = measure();

    expect(workspace.tasks).toHaveLength(210);
    expect(workspace.tasks.every((entry) => entry.status === "defined")).toBe(true);
    expect(workspace.tasks.find((entry) => entry.id === "T-210")).toMatchObject({ title: "Synthetic task T-210" });
    expect(workspace.tasks.find((entry) => entry.id === "T-001")).toMatchObject({ claim: { agent: "codex", started_at: "2026-08-14T08:30:00Z" } });
    expect(workspace.claims).toHaveLength(1);
    expect(calls.length).toBeLessThanOrEqual(2);
    expect(calls.map((args) => args[0]).sort()).toEqual(["archive", "rev-parse"]);
  });

  test("second assembly on the same base hash is a cache hit: no batch read", () => {
    measure();
    const workspace = readWorkspace(root);
    const calls = measure();

    expect(workspace.tasks).toHaveLength(210);
    expect(calls.map((args) => args[0])).not.toContain("archive");
    expect(calls.map((args) => args[0])).not.toContain("show");
    expect(calls).toHaveLength(1); // rev-parse only
  });

  test("a new commit on the base ref invalidates the cache and refreshes the data", () => {
    commitTaskOnMain(root, "T-211");
    measure();
    const workspace = readWorkspace(root);
    const calls = measure();

    expect(calls.map((args) => args[0])).toContain("archive");
    expect(workspace.tasks).toHaveLength(211);
    expect(workspace.tasks.find((entry) => entry.id === "T-211")).toMatchObject({ status: "defined" });
  });

  test("on the base branch, uncommitted additions still show with one extra status call", () => {
    const base = bigWorkspace(3, { checkoutSideBranch: false });
    writeFileSync(join(base, ".a-team/process/tasks/T-004-synthetic.md"), task("T-004", "defined"));
    measure();
    const workspace = readWorkspace(base);
    const calls = measure();

    expect(workspace.tasks).toHaveLength(4);
    expect(workspace.tasks.find((entry) => entry.id === "T-004")).toMatchObject({ status: "defined" });
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

      expect(workspace.tasks).toHaveLength(5);
      expect(workspace.tasks.find((entry) => entry.id === "T-003")).toMatchObject({ status: "defined" });
      expect(calls.map((args) => args[0])).toContain("show");
      expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining("falling back to per-file git reads"));
    } finally {
      gitCalls.failArchive = false;
      stderrSpy.mockRestore();
    }
  });
});
