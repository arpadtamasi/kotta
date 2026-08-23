import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * A rendering never claims more than the result carries (BR-01m0pw5bc7b1rkg5dct5qgdkmb).
 *
 * Two halves of one defect. `kotta validate` printed `kotta validate completed.` while exiting 1,
 * which left two specification errors red across three review submissions that cited the command
 * as clean (EX-01m0pw5bc716gdz5qbb8yv6t2m). And a task retired by `task cancel` is stored with
 * `status: done` and `resolution: cancelled`, but nothing displayed the resolution, so retired work
 * read exactly like delivered work (EX-01m0pw5bc7qdenh5j2pefb13ed).
 *
 * These tests drive the built binary in both renderings, because the defect lived only in the one
 * a human reads — every service result behind it was already correct.
 */

const cli = resolve("dist/cli/index.js");

const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = attempt(cwd, [...args, "--json"]);
  if (result.status !== 0) throw new Error(result.stdout || result.stderr);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown> };
};

const BODY = [
  "## Outcome", "", "Something observable.", "",
  "## Scope", "", "What is included.", "",
  "## Non-goals", "", "What is excluded.", "",
  "## Acceptance", "", "- An observable condition.", "",
  "## Verification", "", "- Run the suite.", "",
  "## Constraints", "", "None.", "",
  "## Open decisions", "", "None.", "",
  "## Execution notes", "", "None.", "",
].join("\n");

function fixture(label: string) {
  const root = mkdtempSync(join(tmpdir(), `kotta-fidelity-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "initial"], { cwd: root });
  run(root, ["init"]);
  // The workspace `init` wrote is untracked until committed, and a lifecycle command refuses a
  // dirty repository — the fixture starts where a real project starts, from a clean tree.
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "workspace"], { cwd: root });
  return root;
}

/** A task carried to `done` by the resolution given, the way a human retires work. */
function retire(root: string, title: string, resolution: string, supersededBy?: string): string {
  const id = (run(root, ["task", "new", "--title", title, "--type", "feature"]) as { data: { id: string } }).data.id;
  // Outside the repository: an untracked file in it would make the next lifecycle command refuse.
  const draft = join(mkdtempSync(join(tmpdir(), "kotta-fidelity-draft-")), `${resolution}.md`);
  writeFileSync(draft, BODY);
  run(root, ["task", "define", id, "--from", draft, "--draft"]);
  run(root, ["task", "cancel", id, "--resolution", resolution, "--reason", "Retired so the display can be read back.",
    ...(supersededBy ? ["--superseded-by", supersededBy] : []), "--approve"]);
  return id;
}

describe("a rendering never claims more than the result carries", () => {
  test("a failed validation is not printed as completed", () => {
    const root = fixture("validate");
    // A task file whose frontmatter status is not a lifecycle state: invalid, and nothing else is.
    const id = (run(root, ["task", "new", "--title", "Broken", "--type", "feature"]) as { data: { id: string; path: string } }).data.id;
    const path = (run(root, ["task", "show", id]) as { data: { path: string } }).data.path;
    writeFileSync(path, readFileSync(path, "utf8").replace(/^status: .*$/m, "status: nonsense"));

    const human = attempt(root, ["validate"]);
    expect(human.status, "a failing validation exits non-zero").not.toBe(0);
    expect(human.stdout, "no line reports that the command completed").not.toContain("completed");
    expect(human.stdout, "the violated rule is named").toContain("INVALID_STATE");
    expect(human.stdout, "the file holding it is named").toContain(path);
  });

  test("the human rendering and --json never disagree about the outcome", () => {
    const root = fixture("agree");
    retire(root, "Retired work", "cancelled");
    const successor = retire(root, "Successor work", "cancelled");
    const path = (run(root, ["task", "show", retire(root, "Overtaken work", "obsolete", successor)]) as { data: { path: string } }).data.path;

    // Every read-only command the fixture can answer, before and after the workspace is broken.
    const commands = [["status"], ["validate"], ["task", "list"], ["observation", "list"], ["gap"]];
    const outcomes = () => commands.map((command) => {
      const human = attempt(root, command);
      const machine = attempt(root, [...command, "--json"]);
      const said = { human: human.status === 0, machine: machine.status === 0, json: (JSON.parse(machine.stdout) as { ok: boolean }).ok };
      // The line a human reads must not announce success the result denies, or the reverse.
      const claimsSuccess = !/\bfailed\b/.test(human.stdout);
      return { command: command.join(" "), ...said, claimsSuccess };
    });

    for (const outcome of outcomes()) {
      expect(outcome.human, `${outcome.command} exit codes agree`).toBe(outcome.machine);
      expect(outcome.claimsSuccess, `${outcome.command} rendering agrees with its result`).toBe(outcome.json);
    }

    writeFileSync(path, readFileSync(path, "utf8").replace(/^status: .*$/m, "status: nonsense"));
    for (const outcome of outcomes()) {
      expect(outcome.human, `${outcome.command} exit codes agree on a broken workspace`).toBe(outcome.machine);
      expect(outcome.claimsSuccess, `${outcome.command} rendering agrees with its result on a broken workspace`).toBe(outcome.json);
    }
    // Ten command invocations against a real binary, twice; the default timeout is for unit work.
  }, 120_000);

  test("a retired task is named by its resolution, and completed work is not relabelled", () => {
    const root = fixture("retired");
    const cancelled = retire(root, "Abandoned work", "cancelled");
    const obsolete = retire(root, "Overtaken work", "obsolete", cancelled);

    const listing = attempt(root, ["task", "list"]).stdout;
    expect(listing, "the retired task reads as retired").toMatch(/cancelled\s+Abandoned work/);
    expect(listing, "the overtaken task reads as overtaken").toMatch(/obsolete\s+Overtaken work/);
    expect(listing, "no retired task reads as done").not.toMatch(/done\s+(Abandoned|Overtaken) work/);

    expect(attempt(root, ["task", "show", cancelled]).stdout, "show names the resolution").toMatch(/state\s+cancelled/);
    expect(attempt(root, ["task", "show", obsolete]).stdout).toMatch(/state\s+obsolete/);

    // The stored record is untouched: this rule governs what is shown, never what is written.
    const stored = (run(root, ["task", "show", cancelled]) as { data: { state: string; resolution: string } }).data;
    expect(stored.state, "the lifecycle state is still done").toBe("done");
    expect(stored.resolution).toBe("cancelled");
  }, 60_000);

  test("a batch of retired work does not read as a batch that was built", () => {
    const root = fixture("batch");
    const batch = (run(root, ["batch", "new", "--title", "Abandoned line"]) as { data: { id: string } }).data.id;
    const retired = retire(root, "Member one", "cancelled");
    run(root, ["batch", "add", batch, retired]);

    const report = attempt(root, ["batch", "status", batch]).stdout;
    expect(report, "the report says how its members ended").toContain("retired rather than completed");
    expect(report, "each member is named by its resolution").toMatch(/cancelled\s+\S*/);
    const members = (run(root, ["batch", "status", batch]) as { data: { tasks: Array<{ resolution: string | null }> } }).data.tasks;
    expect(members.map(({ resolution }) => resolution), "the resolution travels in JSON too").toEqual(["cancelled"]);
  }, 60_000);
});
