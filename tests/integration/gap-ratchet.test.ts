import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * Every accepted promise is kept or admitted (BR-01m0qtshfqhcrrqtz051zm9svr,
 * EX-01m0qtshfq4gx91qt7zhfg56b2).
 *
 * Coverage binds the front of the lifecycle — no task becomes defined until every acceptance
 * condition cites a landed node — and nothing bound the other end, so the number of accepted
 * promises with no evidence could only ever grow. It stood at 108 of 119 the day this was written.
 * The remedy is not a smaller number: an id written into a comment would satisfy any count. It is
 * that a promise sits in one of two columns and reaches the admitted one only by someone saying why.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;

const NODE = (id: string, title: string, admission?: string) => [
  "---",
  `id: ${id}`,
  "form: business-rule",
  `title: "${title}"`,
  ...(admission ? ["accepted:", `  - "unimplemented: ${admission}"`] : []),
  "---",
  "",
  "## Rule",
  "",
  "The fixture states one rule so the node is well formed.",
  "",
  "## Rationale",
  "",
  "It exists to be classified by the gap report.",
  "",
  "## Scope",
  "",
  "This fixture only.",
  "",
].join("\n");

/** A workspace carrying the three nodes, committed — gapReport reads the base ref, not the tree. */
function fixture(label: string) {
  const root = mkdtempSync(join(tmpdir(), `kotta-ratchet-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "initial"], { cwd: root });
  const init = attempt(root, ["init", "--json"]);
  if (init.status !== 0) throw new Error(say(init));

  const rules = join(root, ".kotta", "spec", "business-rules");
  mkdirSync(rules, { recursive: true });
  writeFileSync(join(rules, "evidenced-aaaaaaaa.md"), NODE("BR-01aaaaaaaaaaaaaaaaaaaaaaaa", "An evidenced rule"));
  writeFileSync(join(rules, "admitted-bbbbbbbb.md"), NODE("BR-01bbbbbbbbbbbbbbbbbbbbbbbb", "An admitted rule", "Not built yet; the fixture says so on purpose."));
  writeFileSync(join(rules, "unadmitted-cccccccc.md"), NODE("BR-01cccccccccccccccccccccccc", "An unadmitted rule"));
  // Evidence for the first, and only the first: a test naming the node by its id.
  mkdirSync(join(root, "tests"), { recursive: true });
  writeFileSync(join(root, "tests", "rule.test.js"), "// proves BR-01aaaaaaaaaaaaaaaaaaaaaaaa\n");

  const commit = () => {
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "spec"], { cwd: root });
  };
  commit();
  return { root, rules, commit };
}

describe("every accepted promise is kept or admitted", () => {
  test("gap refuses the node that is neither evidenced nor admitted, and names it", () => {
    const { root } = fixture("refuses");
    const result = attempt(root, ["gap"]);
    const said = say(result);

    expect(result.status, "the read refuses").not.toBe(0);
    expect(said, "the unadmitted node is named").toContain("An unadmitted rule");
    expect(said, "and the reader is told where evidence was sought").toContain("BR-01cccccccccccccccccccccccc");
    expect(said, "and what would settle it").toContain("accepted:");
    expect(said, "naming the kinds it may choose from").toContain("unimplemented");
    // The report is why the command is run at all, so refusing must not swallow it.
    expect(said, "the report is still printed").toContain("Implementation gap report");
    expect(said, "and the failure is named beside it").toMatch(/failed with 1 error/);
  }, 60_000);

  test("a refusal that uncommitted evidence would explain says so, and a clean one does not", () => {
    const { root } = fixture("uncommitted");

    // The fixture commits its nodes; the missing case is evidence that is written and not yet
    // committed, which is what a wave landing a node and the code naming it always looks like.
    const clean = say(attempt(root, ["gap"]));
    expect(clean, "nothing uncommitted, nothing to explain").not.toContain("uncommitted in the working tree");
    expect(clean, "and the refusal itself is unchanged").toContain("BR-01cccccccccccccccccccccccc");

    writeFileSync(join(root, "tests", "unadmitted.test.js"), "// proves BR-01cccccccccccccccccccccccc\n");
    const pending = say(attempt(root, ["gap"]));

    expect(pending, "the read names the ref it read").toMatch(/reads main@[0-9a-f]{7},/);
    expect(pending, "and says what is uncommitted").toContain("uncommitted in the working tree");
    expect(pending, "naming the path").toContain("tests/unadmitted.test.js");
    expect(pending, "and the step that settles it").toContain("commit it and read again");
    // It says the evidence *may* be among them: the report never read those files.
    expect(pending, "without claiming the file is the evidence").toContain("If the evidence is among them");
    // The verdict is unchanged: an uncommitted file does not let a promise through.
    expect(attempt(root, ["gap"]).status, "still a refusal").not.toBe(0);

    // Committing the very same file settles it, which is the whole point of saying so.
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "evidence"], { cwd: root });
    expect(attempt(root, ["gap"]).status, "committed, the promise is evidenced").toBe(0);
  }, 60_000);

  test("an evidenced node and an admitted node both pass, and are not confused", () => {
    const { root, rules, commit } = fixture("passes");
    // The only change: the third node admits its gap. Nothing else moves.
    writeFileSync(join(rules, "unadmitted-cccccccc.md"), NODE("BR-01cccccccccccccccccccccccc", "An unadmitted rule", "Deliberately unbuilt while the shape settles."));
    commit();

    const result = attempt(root, ["gap"]);
    const said = say(result);
    expect(result.status, "the admission is enough").toBe(0);
    expect(said, "the admitted nodes are reported under their kind").toContain("## Admitted as unimplemented");
    expect(said, "with their stated reason").toContain("Deliberately unbuilt while the shape settles.");
    expect(said, "and nothing is reported as a promise without evidence").not.toContain("Promises without implementing or verifying evidence");

    const json = JSON.parse(say(attempt(root, ["gap", "--json"]))) as { ok: boolean; data: { promises: unknown[]; acceptedGaps: unknown[] } };
    expect(json.ok).toBe(true);
    expect(json.data.promises, "the evidenced node is not counted as admitted").toHaveLength(0);
    expect(json.data.acceptedGaps, "and only the two unbuilt ones are").toHaveLength(2);
  }, 60_000);

  test("this workspace passes its own rule", () => {
    // `gap` reports on the accepted specification, which lives on the base branch, so asking the
    // checkout directly would judge whatever main happens to hold rather than what is being
    // submitted. A local clone whose main is this commit puts the question the right way round:
    // does the spec as it stands here leave a promise unaccounted for?
    const clone = mkdtempSync(join(tmpdir(), "kotta-ratchet-self-"));
    execFileSync("git", ["clone", "--local", "--no-hardlinks", "--quiet", resolve("."), clone]);
    execFileSync("git", ["checkout", "-B", "main", "--quiet"], { cwd: clone });

    const result = attempt(clone, ["gap"]);
    expect(result.status, say(result).split("\n").slice(-8).join("\n")).toBe(0);
    expect(say(result), "and says so by keeping the kinds apart").toMatch(/## Admitted as (structural|unexamined)/);
  }, 180_000);
});
