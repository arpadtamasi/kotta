import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * Evidence is what keeps or checks a promise, never what states or copies it
 * (BR-01m0qtshfqhcrrqtz051zm9svr). Since 1.0 a repository holds the specification a second time —
 * an archived change's `model/` and `approval.yaml`, the generated narrative with a binding under
 * every requirement — and on a project of 184 nodes every one of them read as cited while the code
 * named none. Read through the built binary, as an operator would.
 */

const cli = resolve("dist/cli/index.js");
const kotta = (cwd: string, ...args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

const ids = {
  archived: "BR-01m3a000000000000000000a01",
  generated: "BR-01m3a000000000000000000a02",
  both: "BR-01m3a000000000000000000a03",
  packageTree: "BR-01m3a000000000000000000a04",
  ownSpecs: "BR-01m3a000000000000000000a05",
  published: "BR-01m3a000000000000000000a06",
  planned: "BR-01m3a000000000000000000a07",
};

const NODE = (id: string, title: string) => [
  "---", `id: ${id}`, "form: business-rule", `title: "${title}"`, "---", "",
  "## Rule", "", "The fixture SHALL state one rule so the node is well formed.", "",
  "## Rationale", "", "It exists to be read by the gap report.", "",
  "## Scope", "", "This fixture only.", "",
].join("\n");

function write(root: string, path: string, content: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

/** A repository whose accepted nodes are each named in exactly one kind of place, committed. */
function fixture(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-exclusion-${label}-`));
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  write(root, "README.md", "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-q", "-m", "initial");
  const init = kotta(root, "init", "--json");
  if (init.status !== 0) throw new Error(`${init.stdout}${init.stderr}`);

  const titles: Record<keyof typeof ids, string> = {
    archived: "Named only in an archived change",
    generated: "Named only in a generated narrative",
    both: "Named in the archive and the narrative",
    packageTree: "Named in a package's own openspec tree",
    ownSpecs: "Named in the project's own specs directory",
    published: "Named only in a published package spec",
    planned: "Named only in an uncommitted change",
  };
  for (const [key, id] of Object.entries(ids)) write(root, `.kotta/spec/business-rules/${key}-${id.slice(-8)}.md`, NODE(id, titles[key as keyof typeof ids]));

  const archive = "openspec/changes/archive/2026-09-26-landed";
  write(root, `${archive}/model/business-rules/archived-${ids.archived.slice(-8)}.md`, NODE(ids.archived, titles.archived));
  write(root, `${archive}/model/business-rules/both-${ids.both.slice(-8)}.md`, NODE(ids.both, titles.both));
  write(root, `${archive}/approval.yaml`, `change: landed\napproved:\n  added:\n    - id: ${ids.archived}\n    - id: ${ids.both}\n`);
  write(root, "openspec/specs/ledger/spec.md", [
    "# ledger Specification", "", "## Requirements", "",
    `### Requirement: ${titles.generated}`, `<!-- kotta: ${ids.generated} -->`, "The fixture SHALL state one rule.", "",
    `### Requirement: ${titles.both}`, `<!-- kotta: ${ids.both} -->`, "The fixture SHALL state one rule.", "",
  ].join("\n"));
  write(root, "packages/billing/openspec/specs/invoices/spec.md", `The billing package keeps ${ids.packageTree} in its own tree.\n`);
  write(root, "specs/checkout.js", `// checks ${ids.ownSpecs}\n`);
  write(root, "lib/kotta-spec/business-rules/published.md", `${ids.published}\n`);
  git(root, "add", ".");
  git(root, "commit", "-q", "-m", "spec and its copies");
  return root;
}

type GapJson = { ok: boolean; data: { nodes: Array<{ id: string; level: string; module: string | null; evidence: Array<{ kind: string; path: string }>; excluded: string[] }>; excluded: Array<{ class: string; files: number; nodes: number }> }; errors: Array<{ message: string }> };

const gapJson = (root: string): GapJson => JSON.parse(kotta(root, "gap", "--json").stdout) as GapJson;
const nodeOf = (report: GapJson, id: string) => report.data.nodes.find((node) => node.id === id)!;

describe("a copy of the specification is not evidence (BR-01m3cqmt9yrasdj92kky1kcx0n)", () => {
  test("an archived change cites nothing: no node is cited, bound or placed in a module by its model or approval (EX-01m3cqmv1hf7skvkcp1jcf80np)", () => {
    const root = fixture("archived");
    const gap = nodeOf(gapJson(root), ids.archived);
    expect(gap).toMatchObject({ level: "none", evidence: [], module: null });

    const check = JSON.parse(kotta(root, "modules", "check", "--json").stdout) as { data: { unplaced: string[]; none: Array<{ id: string }> } };
    expect(check.data.unplaced).toContain(ids.archived);
    expect(check.data.none.map((node) => node.id)).toContain(ids.archived);
  }, 60_000);

  test("a generated binding is neither cited nor a test, although its path runs through specs/ (EX-01m3cqmv7e9rjkte4g40kqm294)", () => {
    const root = fixture("generated");
    const report = gapJson(root);
    expect(nodeOf(report, ids.generated)).toMatchObject({ level: "none", evidence: [] });
    const everyEvidence = report.data.nodes.flatMap((node) => node.evidence.map((entry) => entry.path));
    expect(everyEvidence.filter((path) => path.startsWith("openspec/"))).toEqual([]);
  }, 60_000);

  test("a node named only in the specification belongs to no module, not to (root) (EX-01m3cqmvk8vfym9tmj34zfdx6p)", () => {
    const root = fixture("module");
    const check = JSON.parse(kotta(root, "modules", "check", "--json").stdout) as { data: { unplaced: string[]; modules: Array<{ name: string; nodes: number }> } };
    for (const id of [ids.archived, ids.generated, ids.both, ids.published]) expect(check.data.unplaced).toContain(id);
    // Only the two nodes the project itself names are placed; the copies place nothing.
    expect(check.data.modules.find((module) => module.name === "(root)")?.nodes ?? 0).toBe(2);
    expect(nodeOf(gapJson(root), ids.both).module).toBeNull();
  }, 60_000);

  test("a package's own openspec tree below the root is not excluded (EX-01m3f1eampk091v0e0p4y88nga)", () => {
    const root = fixture("package");
    expect(nodeOf(gapJson(root), ids.packageTree)).toMatchObject({ level: "cited", evidence: [expect.objectContaining({ path: "packages/billing/openspec/specs/invoices/spec.md" })] });
  }, 60_000);

  test("a project's own specs directory still holds tests (EX-01m3cqmvdeqkvkbdzwnbfdzwzz)", () => {
    const root = fixture("own-specs");
    expect(nodeOf(gapJson(root), ids.ownSpecs)).toMatchObject({ level: "cited", evidence: [{ kind: "test", path: "specs/checkout.js" }] });
  }, 60_000);

  test("an uncommitted planning report and change spec are not offered as evidence (EX-01m3f1eaacp45n4b5r5h170c3n)", () => {
    const root = fixture("uncommitted");
    write(root, "openspec/changes/next/planning.md", `# Planning\n\n- ${ids.planned}\n`);
    write(root, "openspec/changes/next/specs/ledger/spec.md", `<!-- kotta: ${ids.planned} -->\n`);
    const result = kotta(root, "gap");
    const said = `${result.stdout}${result.stderr}`;
    expect(result.status, "the unaccounted promise is still refused").not.toBe(0);
    expect(said).toContain(ids.planned);
    expect(said).not.toContain("uncommitted in the working tree");
    expect(said).not.toContain("planning.md");

    // A path the filter admits is still named, as before.
    write(root, "specs/ledger.js", `// ${ids.planned}\n`);
    expect(`${kotta(root, "gap").stdout}`).toContain("specs/ledger.js");
  }, 60_000);
});

describe("the report names what it did not count (BR-01m3cqmtfyrpdzcppvy0565652)", () => {
  test("a node named only in an excluded source says which, and the head summarizes the exclusions once (EX-01m3cqmvs23cfzrxwfjpvk80dx)", () => {
    const root = fixture("named");
    const report = gapJson(root);
    expect(nodeOf(report, ids.both)).toMatchObject({ level: "none", excluded: ["openspec-archive", "openspec-spec"] });
    expect(nodeOf(report, ids.archived).excluded).toEqual(["openspec-archive"]);
    expect(nodeOf(report, ids.generated).excluded).toEqual(["openspec-spec"]);
    expect(nodeOf(report, ids.published).excluded).toEqual(["published-spec"]);
    // Cited nodes carry no exclusion: the field answers "why none", and they are not.
    expect(nodeOf(report, ids.ownSpecs).excluded).toEqual([]);

    const head = Object.fromEntries(report.data.excluded.map((row) => [row.class, row]));
    expect(Object.keys(head)).toEqual(["workspace", "openspec-archive", "openspec-spec", "published-spec"]);
    expect(head["openspec-archive"]).toMatchObject({ files: 3, nodes: 2 });
    expect(head["openspec-spec"]).toMatchObject({ files: 1, nodes: 2 });
    expect(head["published-spec"]).toMatchObject({ files: 1, nodes: 1 });

    const human = kotta(root, "gap").stdout;
    expect(human.match(/^Not counted as evidence/gm), "one summary line").toHaveLength(1);
    expect(human).toMatch(/Named in the archive and the narrative · BR-01m3a000000000000000000a03 — .*named only in openspec-archive, openspec-spec/);

    const check = JSON.parse(kotta(root, "modules", "check", "--json").stdout) as { data: { excluded: Array<{ class: string }>; none: Array<{ id: string; excluded: string[] }> } };
    expect(check.data.none.find((node) => node.id === ids.both)?.excluded).toEqual(["openspec-archive", "openspec-spec"]);
    expect(check.data.excluded.map((row) => row.class)).toContain("openspec-archive");
    expect(kotta(root, "modules", "check").stdout.match(/^Not counted as evidence/gm)).toHaveLength(1);
  }, 60_000);
});
