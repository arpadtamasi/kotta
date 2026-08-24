import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * The report is the input to defining tasks (UC-01m0fpqfxjvet99wbz0v1ag64q).
 *
 * Kinding the admissions produced a correct report nobody would finish: 333 lines, 122,078
 * characters, one sixty-word paragraph a hundred and eight times, because wording written for a
 * single node was never read back against a hundred. Length is not the defect and must not become
 * the measure — a line per node is what this report is for. Repetition is the defect.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;

const SHARED = "unexamined: assigned in bulk, and nobody has looked at this node yet";

const NODE = (id: string, title: string, admission: string) => [
  "---", `id: ${id}`, "form: business-rule", `title: "${title}"`,
  "accepted:", `  - "${admission}"`, "---", "",
  "## Rule", "", "The fixture states one rule.", "",
  "## Rationale", "", "It exists to be reported.", "", "## Scope", "", "This fixture only.", "",
].join("\n");

function fixture(label: string, count: number) {
  const root = mkdtempSync(join(tmpdir(), `kotta-readable-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "initial"], { cwd: root });
  if (attempt(root, ["init", "--json"]).status !== 0) throw new Error("init failed");
  const rules = join(root, ".kotta", "spec", "business-rules");
  mkdirSync(rules, { recursive: true });
  const add = (index: number) => {
    const id = `BR-01${String(index).padStart(24, "a")}`;
    writeFileSync(join(rules, `shared-${index}.md`), NODE(id, `Shared rule ${index}`, SHARED));
  };
  for (let index = 0; index < count; index += 1) add(index);
  writeFileSync(join(rules, "own.md"), NODE("BR-01zzzzzzzzzzzzzzzzzzzzzzzz", "A rule with its own reason", "unimplemented: the exporter ships next quarter"));
  const commit = () => {
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "spec"], { cwd: root });
  };
  commit();
  return { root, add, commit };
}

const occurrences = (text: string, needle: string) => text.split(needle).length - 1;

describe("the gap report is readable at a hundred admissions", () => {
  test("a shared reason is printed once, however many nodes carry it", () => {
    const { root } = fixture("shared", 12);
    const said = say(attempt(root, ["gap"]));

    expect(occurrences(said, SHARED.slice("unexamined: ".length)), "the shared reason appears once").toBe(1);
    expect(said, "and says how many carry it").toContain("12 nodes, all admitted with the same reason");
    for (let index = 0; index < 12; index += 1) expect(said, `node ${index} is named`).toContain(`Shared rule ${index}`);
    // A reason of its own stays with its node rather than being folded into a group.
    // The kind is the section heading; the line carries the node, its id and its own reason.
    expect(said, "an individual admission keeps its text inline").toMatch(/A rule with its own reason · BR-\S+ — the exporter ships next quarter/);
    expect(said, "under its own kind").toContain("## Admitted as unimplemented");
  }, 60_000);

  test("adding a node to a shared group lengthens the report by one line", () => {
    const { root, add, commit } = fixture("scaling", 5);
    const before = say(attempt(root, ["gap"])).split("\n").length;
    add(5);
    commit();
    const after = say(attempt(root, ["gap"])).split("\n").length;

    // One line for the node, and one more in the delta section that names what changed.
    expect(after - before, "the report grows by the node, not by its reason").toBeLessThanOrEqual(2);
  }, 60_000);

  test("no sentence in this workspace's report repeats more than three times", () => {
    const clone = mkdtempSync(join(tmpdir(), "kotta-readable-self-"));
    execFileSync("git", ["clone", "--quiet", resolve("."), clone]);
    execFileSync("git", ["checkout", "-B", "main", "--quiet"], { cwd: clone });

    const said = say(attempt(clone, ["gap"]));
    const sentences = said.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter((part) => part.length > 40);
    const counts = new Map<string, number>();
    for (const sentence of sentences) counts.set(sentence, (counts.get(sentence) ?? 0) + 1);
    const repeated = [...counts].filter(([, count]) => count > 3).map(([sentence, count]) => `${count}× ${sentence.slice(0, 60)}…`);
    expect(repeated, "sentences a reader would meet again and again").toEqual([]);
  }, 180_000);

  test("--json keeps every admission's own reason and the counts per kind", () => {
    const { root } = fixture("json", 8);
    const report = JSON.parse(say(attempt(root, ["gap", "--json"]))) as {
      data: { acceptedGaps: Array<{ kind: string; reason: string }> };
    };
    const shared = report.data.acceptedGaps.filter((gap) => gap.kind === "unexamined");
    expect(shared, "nothing is grouped away in the machine-readable form").toHaveLength(8);
    for (const gap of shared) expect(gap.reason).toBe(SHARED.slice("unexamined: ".length));
    expect(report.data.acceptedGaps.filter((gap) => gap.kind === "unimplemented")).toHaveLength(1);
  }, 60_000);
});
