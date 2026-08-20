import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";
import { findContract } from "../../src/filesystem/entities.js";

const cli = resolve("dist/cli/index.js");
const FIRST = "Documentation describes the flow.";
const SECOND = "Rendered documentation remains readable.";

function run(cwd: string, args: string[]) {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stdout || result.stderr);
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "kotta-review-evidence-"));
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
  const created = (run(root, ["contract", "new", "--title", "Document flow", "--type", "documentation"]) as { data: { id: string; path: string } }).data;
  writeFileSync(created.path, readFileSync(created.path, "utf8")
    .replace("Describe the observable outcome.", "The flow is documented.")
    .replace("- Define an observable condition.", `- ${FIRST}\n- ${SECOND}`)
    .replace("- Explain how acceptance will be checked.", "- Inspect the rendered documentation."));
  run(root, ["contract", "sign", created.id, "--approve"]);
  run(root, ["contract", "start", created.id, "--agent", "codex"]);
  return { root, worktree: join(root, ".worktrees", created.id), id: created.id, filename: basename(created.path) };
}

describe("review evidence mapping", () => {
  test("reproduces and refuses the duplicated F-018 shape without moving the task", () => {
    const { root, worktree, id, filename } = fixture();
    const result = spawnSync("node", [
      cli, "contract", "review", id,
      "--evidence", `${FIRST}=one long blob`,
      "--evidence", `${SECOND}=one   long\nblob`,
      "--json",
    ], { cwd: worktree, encoding: "utf8" });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain(FIRST);
    expect(result.stdout).toContain(SECOND);
    expect(result.stdout).toContain("Evidence answers its own check");
    expect(findContract(root, id).state).toBe("active");
    expect(existsSync(join(root, ".kotta/process/review", filename))).toBe(false);
  });

  test("submits distinct named evidence into its own rows", () => {
    const { root, worktree, id, filename } = fixture();
    run(worktree, [
      "contract", "review", id,
      "--evidence", `${FIRST}=docs/flow.md inspected against the written steps`,
      "--evidence", `${SECOND}=rendered page inspected at 320px and 1440px`,
    ]);

    const reviewed = readFileSync(join(root, ".kotta/process/review", filename), "utf8");
    expect(reviewed).toContain(`| ${FIRST} | docs/flow.md inspected against the written steps |`);
    expect(reviewed).toContain(`| ${SECOND} | rendered page inspected at 320px and 1440px |`);
  });
});
