import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";
import { findTask } from "../../src/filesystem/entities.js";

/**
 * A declared check is run, not transcribed (BR-01m0m33yxt2vqxb3jvqc186ssy). An evidence value
 * starting with `run:` names a command; the review submission executes it in the execution
 * checkout, refuses the whole submission when it fails, and records the successful run — command,
 * commit, exit 0 — as a receipt next to the evidence. Prose entries stay prose.
 */

const cli = resolve("dist/cli/index.js");
const FIRST = "Documentation describes the flow.";
const SECOND = "Rendered documentation remains readable.";

function run(cwd: string, args: string[]) {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stdout || result.stderr);
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "kotta-machine-evidence-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "initial"], { cwd: root });
  run(root, ["init"]);
  retainLegacySignGate(root);
  execFileSync("git", ["add", ".gitattributes", ".gitignore"], { cwd: root });
  execFileSync("git", ["commit", "-m", "initialize Kotta metadata"], { cwd: root });
  const created = (run(root, ["task", "new", "--title", "Document flow", "--type", "documentation"]) as { data: { id: string; path: string } }).data;
  writeFileSync(created.path, readFileSync(created.path, "utf8")
    .replace("Describe the observable outcome.", "The flow is documented.")
    .replace("- Define an observable condition.", `- ${FIRST}\n- ${SECOND}`)
    .replace("- Explain how acceptance will be checked.", "- Inspect the rendered documentation."));
  run(root, ["task", "sign", created.id, "--approve"]);
  run(root, ["task", "start", created.id, "--agent", "codex"]);
  return { root, worktree: join(root, ".worktrees", created.id), id: created.id, filename: basename(created.path) };
}

describe("machine-checkable review evidence", () => {
  test("a passing declared check is executed and recorded as a receipt; the prose entry stays prose", () => {
    const { root, worktree, id, filename } = fixture();
    run(worktree, [
      "task", "review", id,
      "--evidence", `${FIRST}=run: node -e "process.exit(0)"`,
      "--evidence", `${SECOND}=rendered page inspected at 320px and 1440px`,
    ]);

    const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: worktree, encoding: "utf8" }).trim().slice(0, 7);
    const reviewed = readFileSync(join(root, ".kotta/process/tasks", filename), "utf8");
    expect(reviewed).toMatch(/^status: review$/m);
    expect(reviewed).toContain(`| ${FIRST} | run: node -e "process.exit(0)" — verified: exit 0 at ${commit} |`);
    expect(reviewed).toContain(`| ${SECOND} | rendered page inspected at 320px and 1440px |`);
    expect(reviewed).not.toContain(`${SECOND} | rendered page inspected at 320px and 1440px — verified`);
  });

  test("a failing declared check refuses the whole submission by name, and nothing is written", () => {
    const { root, worktree, id, filename } = fixture();
    const stable = join(root, ".kotta/process/tasks", filename);
    const before = readFileSync(stable, "utf8");

    const refused = spawnSync("node", [
      cli, "task", "review", id,
      "--evidence", `${FIRST}=run: node -e "process.exit(3)"`,
      "--evidence", `${SECOND}=rendered page inspected at 320px and 1440px`,
      "--json",
    ], { cwd: worktree, encoding: "utf8" });

    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain(`Declared check for '${FIRST}' failed`);
    expect(refused.stdout).toContain("exited with 3");
    expect(findTask(root, id).state).toBe("active");
    expect(readFileSync(stable, "utf8")).toBe(before);
  });

  test("the declared command runs in the execution checkout, not the control checkout", () => {
    const { root, worktree, id, filename } = fixture();
    // A file that exists only in the execution worktree: the check passes only when cwd is right.
    writeFileSync(join(worktree, "only-here.txt"), "present\n");
    execFileSync("git", ["add", "only-here.txt"], { cwd: worktree });
    execFileSync("git", ["commit", "-m", "worktree-only file"], { cwd: worktree });

    run(worktree, [
      "task", "review", id,
      "--evidence", `${FIRST}=run: node -e "require('node:fs').accessSync('only-here.txt')"`,
      "--evidence", `${SECOND}=rendered page inspected at 320px and 1440px`,
    ]);
    expect(readFileSync(join(root, ".kotta/process/tasks", filename), "utf8")).toContain("verified: exit 0 at");
  });
});
