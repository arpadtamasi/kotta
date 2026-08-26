import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * The brief carries the way to reach Kotta (BR-01m0r52vex4j22266nepm5yq8s,
 * EX-01m0r52vexxy9azs452pb05pmr).
 *
 * The brief declares itself the complete execution context, and every rule inside it routes state
 * changes through Kotta — while forty-nine bare `kotta` calls wait in the shipped skills and a
 * non-interactive shell resolves none of them. The decisive test spawns exactly what the brief
 * names, with an empty environment, and reads a real command's result back.
 */

const cli = resolve("dist/cli/index.js");
// process.execPath, not "node": a test that hands over a restricted PATH must not depend on that
// PATH finding the interpreter — which is the very confusion this feature exists to remove.
const attempt = (cwd: string, args: string[], env?: NodeJS.ProcessEnv) =>
  spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8", ...(env ? { env } : {}) });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;

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
  const root = mkdtempSync(join(tmpdir(), `kotta-reach-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "initial"], { cwd: root });
  if (attempt(root, ["init", "--json"]).status !== 0) throw new Error("init failed");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "workspace"], { cwd: root });

  const created = JSON.parse(say(attempt(root, ["task", "new", "--title", "Reachable", "--type", "feature", "--json"]))) as { data: { id: string } };
  const draft = join(mkdtempSync(join(tmpdir(), "kotta-reach-draft-")), "body.md");
  writeFileSync(draft, BODY);
  attempt(root, ["task", "define", created.data.id, "--from", draft, "--draft", "--json"]);
  return { root, id: created.data.id };
}

/** The `- kotta: <command> <entry>` line the brief header states. */
function statedInvocation(brief: string): { command: string; args: string[] } {
  const line = /^- kotta: (\S+) (\S+)$/m.exec(brief);
  if (!line) throw new Error(`The brief states no invocation:\n${brief}`);
  return { command: line[1], args: [line[2]] };
}

describe("the brief carries the way to reach Kotta", () => {
  test("every brief states the invocation, by absolute paths", () => {
    const { root, id } = fixture("states");
    const brief = say(attempt(root, ["task", "brief", id]));
    const { command, args } = statedInvocation(brief);

    expect(command, "the interpreter is absolute").toMatch(/^\//);
    expect(existsSync(command), `${command} exists`).toBe(true);
    expect(args[0], "and so is the entry point").toMatch(/^\/.*index\.js$/);
    expect(existsSync(args[0])).toBe(true);
    expect(command, "the bare name is not what is stated").not.toBe("kotta");
  }, 60_000);

  test("what the brief names runs a Kotta command with no PATH at all", () => {
    const { root, id } = fixture("empty-env");
    const { command, args } = statedInvocation(say(attempt(root, ["task", "brief", id])));

    // env: {} — no PATH, no HOME, nothing a version manager could have set.
    const run = spawnSync(command, [...args, "status", "--json"], { cwd: root, encoding: "utf8", env: {} });
    expect(run.error, "the agent's shell can spawn it").toBeUndefined();
    expect(run.status, say(run)).toBe(0);
    expect(JSON.parse(run.stdout) as { ok: boolean }, "and it answers as Kotta").toMatchObject({ ok: true });
  }, 60_000);

  test("the boundary rule names the call it depends on, and the call runs", () => {
    const { root, id } = fixture("boundary");
    const brief = say(attempt(root, ["task", "brief", id]));

    // The header already told the agent that out-of-scope work is recorded, and never what to
    // call. A rule stated without its means is a rule the agent cannot keep
    // (BR-01m0r52vex4j22266nepm5yq8s, BR-01m0fp2hdkqz08arp5ebt122r9).
    expect(brief, "the rule").toContain("Anything you notice outside this task's scope is recorded");
    expect(brief, "and the means").toContain("observation new --title");

    // Named in the same proved invocation as everything else the brief tells the agent to run, not
    // as the bare name a non-interactive shell resolves to nothing.
    const { command, args } = statedInvocation(brief);
    const line = brief.split(/\r?\n/).find((candidate) => candidate.includes("observation new --title"))!;
    expect(line.startsWith(`${command} ${args[0]}`), line).toBe(true);

    // And it is a real command, not a plausible-looking string: spawned exactly as written, it
    // records an observation. The environment keeps its PATH because writing canonical state takes
    // the control-plane lock and commits, so this call needs git — that the interpreter and entry
    // resolve without any PATH is the neighbouring test's claim, and it is what makes this one
    // spawnable at all.
    const recorded = spawnSync(command, [...args, "observation", "new", "--title", "Noticed outside the scope", "--type", "bug", "--evidence", "Seen while executing.", "--json"], {
      cwd: root, encoding: "utf8",
    });
    expect(recorded.status, say(recorded)).toBe(0);
    expect(say(attempt(root, ["observation", "list"]))).toContain("Noticed outside the scope");
  });

  test("the fixed header is not what the size warning tells you to split", () => {
    const { root, id } = fixture("largest");
    const report = JSON.parse(say(attempt(root, ["task", "brief", id, "--json"]))) as {
      data: { largestSection: string; sections: Array<{ name: string; characters: number }> };
    };

    // The header's size stays visible...
    const header = report.data.sections.find((section) => section.name === "header");
    expect(header?.characters, "the header is measured and reported").toBeGreaterThan(0);
    // ...but the warning's advice is "split it or sharpen it", which is advice about task content.
    // The header is fixed text the CLI owns; it grows with Kotta, and a reader cannot act on it.
    expect(report.data.largestSection).not.toBe("header");
  });

  test("doctor answers the reachability question in both directions", () => {
    const { root } = fixture("doctor");

    // A PATH that resolves the name, built rather than assumed: this very session has no `kotta`
    // on its PATH, which is the phenomenon under test and would make an inherited PATH prove nothing.
    const bin = mkdtempSync(join(tmpdir(), "kotta-reach-bin-"));
    writeFileSync(join(bin, "kotta"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    const withPath = attempt(root, ["doctor"], { PATH: bin });
    expect(withPath.status, say(withPath)).toBe(0);
    expect(say(withPath)).toContain("Kotta runs as:");
    expect(say(withPath), "and where the name leads").toContain(join(bin, "kotta"));

    const withoutPath = attempt(root, ["doctor"], {});
    expect(withoutPath.status, "a PATH that does not is").not.toBe(0);
    expect(say(withoutPath), "and the reason is named").toContain("resolves to nothing on this PATH");
    expect(say(withoutPath), "with the invocation that works").toContain(process.execPath);
  }, 60_000);

  test("the shipped skills still read as prose a person can type", () => {
    // The rule excludes them by name; turning documentation into absolute paths would be permanent
    // noise bought against one failure.
    const skill = execFileSync("cat", [resolve("skills/close-task/SKILL.md")], { encoding: "utf8" });
    expect(skill, "the readable form survives").toContain("kotta task close");
    expect(skill, "and no absolute path crept in").not.toContain(process.execPath);
  });
});
