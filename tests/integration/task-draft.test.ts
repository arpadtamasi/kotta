import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";

/**
 * A capture is drafted in place (SM-01m0f0wn89gjy6dbk1j6fjpv6j, EX-01m0mzvcvdvxzpr59p8v7387n3):
 * `task define --draft` iterates a backlog task's text through the CLI with its structure
 * validated and no coverage demanded, so hand-editing the stored file is never the path.
 * Coverage keeps guarding the boundary where executability begins: backlog -> defined.
 */

const cli = resolve("dist/cli/index.js");

const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = attempt(cwd, args);
  if (result.status !== 0) throw new Error(result.stdout || result.stderr);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown> };
};

const BODY = (condition: string) => [
  "## Outcome", "", "The capture is iterated in the open.", "",
  "## Scope", "", "What is included.", "",
  "## Non-goals", "", "What is excluded.", "",
  "## Acceptance", "", `- ${condition}`, "",
  "## Verification", "", "- Run the draft test.", "",
  "## Constraints", "", "None.", "",
  "## Open decisions", "", "None.", "",
  "## Execution notes", "", "None.", "",
].join("\n");

function fixture(label: string, options: { legacyGate?: boolean } = {}) {
  const root = mkdtempSync(join(tmpdir(), `kotta-draft-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "initial"], { cwd: root });
  run(root, ["init"]);
  if (options.legacyGate) retainLegacySignGate(root);
  const created = (run(root, ["task", "new", "--title", "Draft me", "--type", "feature"]) as { data: { id: string; path: string } }).data;
  return { root, id: created.id, path: created.path };
}

describe("a capture is drafted in place", () => {
  test("--draft stores corrected text and a new title without coverage, and the task stays in backlog", () => {
    const { root, id, path } = fixture("store");
    const definition = join(root, "draft.md");
    writeFileSync(definition, `---\ntitle: Draft me properly\ntypes:\n  - feature\n---\n${BODY("The corrected condition holds.")}\n`);

    const drafted = run(root, ["task", "define", id, "--from", "draft.md", "--draft"]).data as { state: string; path: string; nextStep: string };
    expect(drafted.state).toBe("backlog");
    expect(drafted.path).toContain("/process/tasks/draft-me-properly-");
    expect(existsSync(path)).toBe(false);
    const stored = readFileSync(drafted.path, "utf8");
    expect(stored).toMatch(/^status: backlog$/m);
    expect(stored).toContain("The corrected condition holds.");
    expect(drafted.nextStep).toContain("task define");
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
  });

  test("the same definition without --draft is refused until coverage cites a landed spec node", () => {
    const { root, id } = fixture("gate");
    const definition = join(root, "draft.md");
    writeFileSync(definition, `---\ntypes:\n  - feature\n---\n${BODY("The uncovered condition holds.")}\n`);

    const refused = attempt(root, ["task", "define", id, "--from", "draft.md"]);
    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain("ACCEPTANCE_NOT_COVERED");
    // The draft path takes the identical definition.
    expect(run(root, ["task", "define", id, "--from", "draft.md", "--draft"]).data).toMatchObject({ state: "backlog" });
  });

  test("--draft on a task that left backlog is refused by name", () => {
    const { root, id, path } = fixture("defined", { legacyGate: true });
    writeFileSync(path, readFileSync(path, "utf8")
      .replace("Describe the observable outcome.", "The outcome is observable.")
      .replace("- Define an observable condition.", "- The signed condition holds.")
      .replace("- Explain how acceptance will be checked.", "- Inspect it."));
    run(root, ["task", "sign", id, "--approve"]);

    const definition = join(root, "draft.md");
    writeFileSync(definition, `---\ntypes:\n  - feature\n---\n${BODY("A late correction.")}\n`);
    const refused = attempt(root, ["task", "define", id, "--from", "draft.md", "--draft"]);
    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain("--draft amends a captured task");
    expect(refused.stdout).toContain("is defined");
  });

  test("a structurally broken draft is still refused: no coverage does not mean no validation", () => {
    const { root, id } = fixture("structure");
    const definition = join(root, "draft.md");
    writeFileSync(definition, `---\ntypes:\n  - feature\n---\n## Outcome\n\nOnly an outcome.\n`);

    const refused = attempt(root, ["task", "define", id, "--from", "draft.md", "--draft"]);
    expect(refused.status).toBe(1);
    expect(refused.stdout).toContain("MISSING_SECTION");
  });
});
