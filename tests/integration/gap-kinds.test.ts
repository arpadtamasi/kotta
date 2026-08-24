import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { ADMISSION_KINDS } from "../../src/commands/gap.js";

/**
 * An admission says which kind it is (BR-01m0swjgrreeby1pyfdzf4mf7d,
 * EX-01m0swjgrrnzqgx83v95t855xe).
 *
 * One hundred and six admissions carried one sentence between them, and the triage found three
 * situations underneath: fifty-two forms no code site names, and fifty-four questions nobody had
 * asked. A count that moves for three reasons cannot be read, so the kinds are counted apart and an
 * admission that names none of them is refused rather than filed under a guess.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;

const NODE = (id: string, title: string, admission?: string) => [
  "---", `id: ${id}`, "form: business-rule", `title: "${title}"`,
  ...(admission ? ["accepted:", `  - "${admission}"`] : []),
  "---", "", "## Rule", "", "The fixture states one rule so the node is well formed.", "",
  "## Rationale", "", "It exists to be classified.", "", "## Scope", "", "This fixture only.", "",
].join("\n");

function fixture(label: string) {
  const root = mkdtempSync(join(tmpdir(), `kotta-kinds-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "initial"], { cwd: root });
  if (attempt(root, ["init", "--json"]).status !== 0) throw new Error("init failed");
  const rules = join(root, ".kotta", "spec", "business-rules");
  mkdirSync(rules, { recursive: true });
  const commit = () => {
    execFileSync("git", ["add", "."], { cwd: root });
    execFileSync("git", ["commit", "-m", "spec"], { cwd: root });
  };
  return { root, rules, commit };
}

describe("an admission says which kind it is", () => {
  test("the three kinds are counted apart and listed under their own headings", () => {
    const { root, rules, commit } = fixture("counts");
    writeFileSync(join(rules, "one-aaaaaaaa.md"), NODE("BR-01aaaaaaaaaaaaaaaaaaaaaaaa", "A structural rule", "structural: many sites realise it and none names it"));
    writeFileSync(join(rules, "two-bbbbbbbb.md"), NODE("BR-01bbbbbbbbbbbbbbbbbbbbbbbb", "An unexamined rule", "unexamined: nobody has looked yet"));
    writeFileSync(join(rules, "three-cccccccc.md"), NODE("BR-01cccccccccccccccccccccccc", "An unbuilt rule", "unimplemented: the exporter ships next quarter"));
    commit();

    const result = attempt(root, ["gap"]);
    const said = say(result);
    expect(result.status, "three admissions and no bare promise passes").toBe(0);
    expect(said, "the summary counts them apart").toContain("structural: 1 · unexamined: 1 · unimplemented: 1");
    for (const kind of ADMISSION_KINDS) expect(said, `${kind} has its own heading`).toContain(`## Admitted as ${kind}`);
    expect(said, "and each carries its reason").toContain("the exporter ships next quarter");

    const json = JSON.parse(say(attempt(root, ["gap", "--json"]))) as { data: { acceptedGaps: Array<{ kind: string }> } };
    expect(json.data.acceptedGaps.map(({ kind }) => kind).sort()).toEqual(["structural", "unexamined", "unimplemented"]);
  }, 60_000);

  test("an admission that names no kind is refused, and told which kinds exist", () => {
    const { root, rules, commit } = fixture("unkinded");
    writeFileSync(join(rules, "legacy-dddddddd.md"), NODE("BR-01dddddddddddddddddddddddd", "A rule admitted the old way", "implementation: written before the kinds existed"));
    commit();

    const result = attempt(root, ["gap"]);
    const said = say(result);
    expect(result.status, "an unkinded admission fails the command").not.toBe(0);
    expect(said).toContain("UNKINDED_ADMISSION");
    expect(said, "the node is named").toContain("A rule admitted the old way");
    for (const kind of ADMISSION_KINDS) expect(said, `${kind} is offered`).toContain(kind);
    expect(said, "and it is counted, not lost between the columns").toContain("admitted without a kind: 1");
  }, 60_000);

  test("the ratchet keeps its force: no evidence and no admission still fails", () => {
    const { root, rules, commit } = fixture("ratchet");
    writeFileSync(join(rules, "bare-eeeeeeee.md"), NODE("BR-01eeeeeeeeeeeeeeeeeeeeeeee", "A rule with nothing at all"));
    commit();

    const result = attempt(root, ["gap"]);
    expect(result.status).not.toBe(0);
    expect(say(result)).toContain("UNADMITTED_PROMISE");
  }, 60_000);

  test("this workspace's inherited admissions all carry a kind, and none claims to be examined", () => {
    // `gap` reads the configured base branch, so judging this checkout means giving a clone a main
    // that is this commit — the same reason the ratchet's self-check clones.
    const clone = mkdtempSync(join(tmpdir(), "kotta-kinds-self-"));
    execFileSync("git", ["clone", "--quiet", resolve("."), clone]);
    execFileSync("git", ["checkout", "-B", "main", "--quiet"], { cwd: clone });

    const result = attempt(clone, ["gap", "--json"]);
    const report = JSON.parse(say(result)) as {
      data: { unkinded: unknown[]; promises: unknown[]; acceptedGaps: Array<{ kind: string; reason: string }> };
    };
    expect(report.data.unkinded, "every inherited admission was given a kind").toEqual([]);
    expect(report.data.promises, "and nothing was left unadmitted").toEqual([]);

    const kinds = report.data.acceptedGaps.map(({ kind }) => kind);
    expect(kinds).toContain("structural");
    expect(kinds).toContain("unexamined");
    // Nobody examined these nodes, so none of them may claim the kind that means someone did.
    expect(kinds.filter((kind) => kind === "unimplemented"), "no bulk assignment claims a judgement").toEqual([]);
    for (const gap of report.data.acceptedGaps.filter(({ kind }) => kind === "structural")) {
      expect(gap.reason, "the structural wording says the kind came from the form").toContain("from the form of this node");
    }
  }, 180_000);
});
