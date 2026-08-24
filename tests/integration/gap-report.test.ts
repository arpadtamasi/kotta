import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const IMPLEMENTED = "GT-01m0c0000000000000000000ga";
const OLD_GAP = "GT-01m0c0000000000000000000gb";
const CHANGED_GAP = "GT-01m0c0000000000000000000gc";
const ACCEPTED_GAP = "GT-01m0c0000000000000000000gd";

function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

/**
 * These fixtures hold unadmitted promises on purpose — that is what the report is being read for —
 * so `gap` refuses them (BR-01m0qtshfqhcrrqtz051zm9svr) and a non-zero exit is the expected outcome,
 * not a failure to surface. The refusal is asserted to match the report rather than ignored.
 */
function run(root: string): { stdout: string; json: { ok: boolean; data: Record<string, unknown> } } {
  const result = spawnSync("node", [cli, "gap", "--json"], { cwd: root, encoding: "utf8" });
  if (!result.stdout.trim()) throw new Error(`${result.stdout}\n${result.stderr}`);
  const json = JSON.parse(result.stdout) as { ok: boolean; data: { promises: unknown[] } };
  const unadmitted = json.data.promises.length > 0;
  if (json.ok === unadmitted) throw new Error(`gap reported ok: ${json.ok} with ${json.data.promises.length} unadmitted promises.`);
  if ((result.status !== 0) !== unadmitted) throw new Error(`gap exited ${result.status} with ${json.data.promises.length} unadmitted promises.`);
  return { stdout: result.stdout, json };
}

function node(root: string, id: string, title: string, accepted?: string): void {
  writeFileSync(join(root, `.kotta/spec/glossary-terms/${title.toLowerCase().replaceAll(" ", "-")}-${id.slice(-8)}.md`), [
    "---", `id: ${id}`, "form: glossary-term", `title: ${title}`,
    ...(accepted ? ["accepted:", `  - \"unimplemented: ${accepted}\"`] : []),
    "---", "", "## Definition", `${title} is observable.`, "", "## Usage", "The running system applies it.", "", "## Non-examples", "Unrelated behavior.", "",
  ].join("\n"));
}

function snapshot(root: string, directory = root): Array<[string, string]> {
  return readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name)).flatMap((entry) => {
    if (entry.name === ".git") return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? snapshot(root, path) : [[relative(root, path), readFileSync(path, "utf8")]];
  });
}

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-gap-"));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  node(root, IMPLEMENTED, "Implemented promise");
  node(root, OLD_GAP, "Old missing promise");
  writeFileSync(join(root, "implemented.ts"), `// ${IMPLEMENTED}\nexport const implemented = true;\n`);
  writeFileSync(join(root, "gate.ts"), 'export function gate(value: boolean) { if (!value) throw new Error("Export requires approval."); }\n');
  git(root, "add", ".");
  git(root, "commit", "-m", "accept initial specification and implementation");

  node(root, CHANGED_GAP, "Changed missing promise");
  node(root, ACCEPTED_GAP, "Deliberately deferred promise", "waiting for the external API sandbox");
  git(root, "add", ".kotta/spec");
  git(root, "commit", "-m", "accept next specification delta");
  return root;
}

describe("implementation gap report", () => {
  test("reports both directions, accepted gaps, and puts the latest spec delta first", () => {
    const root = fixture();
    const report = run(root).json.data as {
      changedNodes: string[];
      promises: Array<{ id: string; title: string; changed: boolean; evidenceSought: string }>;
      acceptedGaps: Array<{ id: string; reason: string }>;
      reverse: Array<{ behavior: string; path: string }>;
      nodes: Array<{ id: string; evidence: Array<{ kind: string; path: string }> }>;
      report: string;
    };

    expect(report.changedNodes).toEqual([CHANGED_GAP, ACCEPTED_GAP]);
    expect(report.promises.map((entry) => entry.id)).toEqual([CHANGED_GAP, OLD_GAP]);
    expect(report.promises[0]).toMatchObject({ title: "Changed missing promise", changed: true });
    expect(report.promises[0].evidenceSought).toContain(CHANGED_GAP);
    expect(report.acceptedGaps).toEqual([expect.objectContaining({ id: ACCEPTED_GAP, reason: "waiting for the external API sandbox" })]);
    expect(report.nodes.find((entry) => entry.id === IMPLEMENTED)?.evidence).toEqual([{ kind: "code", path: "implemented.ts" }]);
    expect(report.reverse).toEqual(expect.arrayContaining([expect.objectContaining({ behavior: "Export requires approval.", path: "gate.ts" })]));
    expect(report.report).toContain("## Latest accepted spec delta");
    expect(report.report.indexOf("## Latest accepted spec delta")).toBeLessThan(report.report.indexOf("## Promises without implementing"));
    expect(report.report.indexOf("Changed missing promise")).toBeLessThan(report.report.indexOf("Old missing promise"));
  });

  test("repeated reads return identical bytes and write nothing", () => {
    const root = fixture();
    const before = snapshot(root);
    const first = run(root).stdout;
    const between = snapshot(root);
    const second = run(root).stdout;

    expect(second).toBe(first);
    expect(between).toEqual(before);
    expect(snapshot(root)).toEqual(before);
    expect(git(root, "status", "--porcelain")).toBe("");
  });
});
