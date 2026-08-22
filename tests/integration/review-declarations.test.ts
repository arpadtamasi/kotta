import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

const setup = () => {
  const root = mkdtempSync(join(tmpdir(), "kotta-review-decl-"));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", "."); git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  retainLegacySignGate(root);
  git(root, "add", ".gitattributes", ".gitignore"); git(root, "commit", "-m", "initialize Kotta metadata");
  const created = (run(root, ["task", "new", "--title", "Document flow", "--type", "documentation"]) as { data: { id: string; path: string } }).data;
  const id = created.id;
  const path = created.path;
  writeFileSync(path, readFileSync(path, "utf8").replace("Describe the observable outcome.", "The flow is documented.").replace("- Define an observable condition.", "- Documentation describes the flow.").replace("- Explain how acceptance will be checked.", "- Read the rendered documentation."));
  run(root, ["task", "sign", id, "--approve"]);
  run(root, ["task", "start", id, "--agent", "codex"]);
  const worktree = join(root, ".worktrees", id);
  writeFileSync(join(worktree, "flow.md"), "# Flow\n");
  git(worktree, "add", "."); git(worktree, "commit", "-m", "docs: document flow");
  return { root, worktree, id, filename: basename(path) };
};

const reviewedTask = (root: string, filename: string) => readFileSync(join(root, ".kotta/process/tasks", filename), "utf8");
const reviewEvidenceBlock = (content: string) => content.slice(content.indexOf("## Review evidence"));

describe("review declarations", () => {
  test("writes caller-declared deviations, observations, and concerns verbatim", () => {
    const { root, worktree, id, filename } = setup();
    run(worktree, ["task", "review", id, "--evidence", "flow.md inspected", "--deviations", "Skipped the diagram; task allowed text only.", "--observations-created", "F-101", "--known-concerns", "Rendering untested on Windows."]);
    const content = reviewEvidenceBlock(reviewedTask(root, filename));
    expect(content).toContain("### Deviations\n\nSkipped the diagram; task allowed text only.\n");
    expect(content).toContain("### Observations created\n\nF-101\n");
    expect(content).toContain("### Known concerns\n\nRendering untested on Windows.\n");
    expect(content).not.toContain("Not declared.");
  });

  test("records 'Not declared.' — never 'None.' — when the caller stays silent", () => {
    const { root, worktree, id, filename } = setup();
    run(worktree, ["task", "review", id, "--evidence", "flow.md inspected"]);
    const content = reviewEvidenceBlock(reviewedTask(root, filename));
    expect(content).toContain("### Deviations\n\nNot declared.\n");
    expect(content).toContain("### Observations created\n\nNot declared.\n");
    expect(content).toContain("### Known concerns\n\nNot declared.\n");
    expect(content).not.toContain("None.");
  });

  test("writes 'None.' only when explicitly declared", () => {
    const { root, worktree, id, filename } = setup();
    run(worktree, ["task", "review", id, "--evidence", "flow.md inspected", "--deviations", "None."]);
    const content = reviewEvidenceBlock(reviewedTask(root, filename));
    expect(content).toContain("### Deviations\n\nNone.\n");
    expect(content).toContain("### Observations created\n\nNot declared.\n");
  });
});
