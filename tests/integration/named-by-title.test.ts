import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { APPROVAL_ACTIONS, approvalDescription } from "../../src/commands/approval.js";
import { named, namedWithId } from "../../src/core/naming.js";
import { displayId } from "../../src/core/identity.js";

/**
 * Nothing a human reads names work by an identifier alone (BR-01m0f0wn89c50fe1mz5yn1nw85,
 * QA-01m0fp2hdkq55yrx9qr5t8pweh, UC-01m0f0wn89p42025mt5vg5012n).
 *
 * The three surfaces are asserted from what they actually emit: the terminal from its printed
 * output, the gate from the description the elicitation carries, and the chat from the sentence
 * every tool returns beside its structured data.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

const SPEC_ID = "GT-01m0c0000000000000000000nt";
const TITLE = "Ship the filtered exporter";
/** A minted id is 26 Crockford characters after the prefix: unreadable by construction. */
const UNREADABLE = /\b[TFPD]-[0-9a-hjkmnp-tv-z]{26}\b/;

function fixture(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-titled-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", "."); git(root, "commit", "-m", "initial");
  if (attempt(root, ["init", "--json"]).status !== 0) throw new Error("init failed");
  mkdirSync(join(root, ".kotta/spec/glossary-terms"), { recursive: true });
  writeFileSync(join(root, ".kotta/spec/glossary-terms/named-0000000nt.md"), [
    "---", `id: ${SPEC_ID}`, "form: glossary-term", "title: Named", "---", "",
    "## Definition", "The work is named.", "", "## Usage", "Naming fixture.", "", "## Non-examples", "An unnamed thing.", "",
  ].join("\n"));
  git(root, "add", "."); git(root, "commit", "-m", "workspace");
  return root;
}

function definedTask(root: string, title = TITLE): string {
  const created = JSON.parse(say(attempt(root, ["task", "new", "--title", title, "--type", "feature", "--json"]))) as { data: { id: string; path: string } };
  const body = readFileSync(created.data.path, "utf8").split(/^---$/m).slice(2).join("---").replace(/^\n+/, "")
    .replace("Describe the observable outcome.", "The work is named.")
    .replace("- Define an observable condition.", "- The work is named.")
    .replace("- Explain how acceptance will be checked.", "- Run the naming test.");
  const source = join(mkdtempSync(join(tmpdir(), "kotta-titled-def-")), "definition.md");
  writeFileSync(source, `---\nspec:\n  - ${SPEC_ID}\ncoverage:\n  "The work is named.":\n    - ${SPEC_ID}\n---\n\n${body}`);
  if (attempt(root, ["task", "define", created.data.id, "--from", source, "--json"]).status !== 0) throw new Error("define failed");
  return created.data.id;
}

describe("an entity is named to a human by its title", () => {
  test("the terminal names the task through its whole lifecycle, and never by id alone", () => {
    const root = fixture("terminal");
    expect(say(attempt(root, ["task", "new", "--title", TITLE, "--type", "feature"]))).toContain(TITLE);

    const id = definedTask(root);
    // `define`, `start`, `review` and `close` printed `kotta task <verb> completed.` before this
    // task: a line that named neither the entity nor what happened to it.
    expect(say(attempt(root, ["task", "validate", id]))).toContain(TITLE);

    const started = JSON.parse(say(attempt(root, ["task", "start", id, "--agent", "codex", "--json"]))) as { data: { branch: string } };
    const worktree = join(root, ".worktrees", id);
    writeFileSync(join(worktree, "done.md"), "# Done\n");
    git(worktree, "add", "."); git(worktree, "commit", "-m", "feat: deliver");

    const reviewed = attempt(worktree, ["task", "review", id, "--evidence", "The work is named.=delivered and read"]);
    expect(reviewed.status).toBe(0);
    expect(say(reviewed), "review names the task").toContain(TITLE);

    git(root, "merge", "--no-ff", started.data.branch, "-m", "merge");
    const closed = attempt(root, ["task", "close", id, "--approve"]);
    expect(closed.status).toBe(0);
    expect(say(closed), "close names the task").toContain(TITLE);
    expect(say(closed), "and says how it ended").toContain("completed");
  }, 120_000);

  test("a start line leads with the title and still carries the id the reader types back", () => {
    const root = fixture("start");
    const id = definedTask(root);
    const started = say(attempt(root, ["task", "start", id, "--agent", "codex"]));
    expect(started).toContain(TITLE);
    // The short id travels with it: what resolved before still resolves.
    expect(started).toContain(id.slice(-8));
    // The name leads; the full id appears in the line only as part of a path, never as the name.
    expect(started.indexOf(TITLE)).toBeLessThan(started.indexOf("branch"));
    expect(started.slice(0, started.indexOf(TITLE))).not.toMatch(UNREADABLE);
  });

  test("every gate description names the judgement by title, and none of them carries an id", () => {
    const payloads: Record<string, Record<string, unknown>> = {
      "observation.resolve": { disposition: "amend-spec", spec: ["BR-01m0c000000000000000000000"] },
      "task.cancel": { resolution: "obsolete", reason: "The work has no object.", supersededBy: "T-01m0c000000000000000000000", supersededByTitle: "The successor" },
      "decision.create": { source: "---\ntitle: Adopt blue-green cutover\n---\n## Decision\n\nUse it.\n" },
    };
    for (const action of APPROVAL_ACTIONS) {
      const description = approvalDescription(action, "T-01m0c000000000000000000000", payloads[action] ?? {}, TITLE);
      const subject = action === "decision.create" ? "Adopt blue-green cutover" : TITLE;
      expect(description, `${action} names its subject`).toContain(subject);
      expect(description, `${action} carries no unreadable id`).not.toMatch(UNREADABLE);
      // The action name is not what a human reads: no gate says `task.close` at them.
      expect(description, `${action} is not spelled as its operation id`).not.toContain(action);
    }
  });

  test("a gate falls back to the id only when the workspace holds no title for the entity", () => {
    const orphan = "T-01m0c000000000000000000000";
    expect(approvalDescription("task.close", orphan, {}, "")).toContain(orphan);
    expect(approvalDescription("task.close", orphan, {}, undefined)).toContain(orphan);
  });

  test("naming falls back rather than to nothing, and the id never replaces a title it has", () => {
    expect(named(TITLE, "T-01m0c000000000000000000000")).toBe(TITLE);
    expect(named("   ", "T-01m0c000000000000000000000")).toBe("T-01m0c000000000000000000000");
    expect(named(undefined, "T-042")).toBe("T-042");
    expect(namedWithId(TITLE, "T-01m0c000000000000000000000")).toBe(`${TITLE} (${displayId("T-01m0c000000000000000000000")})`);
    expect(namedWithId(TITLE, "T-042")).toBe(`${TITLE} (T-042)`);
    expect(namedWithId("", "T-042")).toBe("T-042");
  });

  test("the structured payload keeps the id: the title is for the reader, not instead of the data", () => {
    const root = fixture("json");
    const created = JSON.parse(say(attempt(root, ["task", "new", "--title", TITLE, "--type", "feature", "--json"]))) as { data: { id: string; title: string } };
    expect(created.data.id).toMatch(UNREADABLE);
    expect(created.data.title).toBe(TITLE);
  });

  test("the rules file tells the agent to write about entities the same way", () => {
    const rules = readFileSync(resolve(".kotta/AGENTS.md"), "utf8");
    expect(rules).toContain("name it by its title");
  });
});
