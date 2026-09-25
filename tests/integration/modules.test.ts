import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * Module boundaries on a pnpm workspace: three packages, code outside them in `functions/`, and a
 * sibling repository — the shared core — reached through a `file:` dependency, with its own
 * `.kotta/spec`. Everything is read through the built binary, as an operator would.
 */

const cli = resolve("dist/cli/index.js");

const ids = {
  core: "GT-01m1b0000000000000000000c0",
  web: "GT-01m1b0000000000000000000w0",
  straddle: "GT-01m1b0000000000000000000s0",
  unplaced: "GT-01m1b0000000000000000000n0",
  cross: "GT-01m1b0000000000000000000x0",
  viaInterface: "GT-01m1b0000000000000000000v0",
  coreInterface: "IF-01m1b0000000000000000000c1",
  ghost: "IF-01m1b0000000000000000000g1",
  copy: "IF-01m1b0000000000000000000k1",
  pinnedCommit: "IF-01m1b0000000000000000000p1",
  pinnedVersion: "IF-01m1b0000000000000000000p2",
  pinnedOld: "IF-01m1b0000000000000000000p3",
  pinnedGit: "IF-01m1b0000000000000000000p4",
  pinnedPackage: "IF-01m1b0000000000000000000p5",
  corpus: "IF-01m1b0000000000000000000r1",
  corpusRule: "BR-01m1b0000000000000000000r2",
  corpusExample: "EX-01m1b0000000000000000000r3",
};

const CORPUS_TEXT = [
  "## Purpose", "Search the shared corpus for passages that answer a question, ranked by relevance.", "",
  "## Preconditions", "The caller names a corpus it may read and passes a non-empty question.", "",
  "## Postconditions", "At most the requested number of passages come back, best first, each with its source.", "",
  "## Invariants", "A passage never leaves the corpus it was indexed under.", "",
  "## Failures", "An unknown corpus is refused by name; an empty question is refused before any search.", "",
].join("\n");

function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function kotta(root: string, ...args: string[]) {
  const result = spawnSync("node", [cli, ...args], { cwd: root, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, json: () => JSON.parse(result.stdout) };
}

function write(root: string, path: string, content: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), content);
}

function repository(prefix: string): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  git(root, "init", "-q", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  if (kotta(root, "init", "--json").status !== 0) throw new Error("init failed");
  return root;
}

function commit(root: string, message: string): string {
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", message);
  return git(root, "rev-parse", "HEAD");
}

function term(root: string, id: string, title: string, extra: string[] = []): void {
  write(root, `.kotta/spec/glossary-terms/${id.slice(-8)}.md`, ["---", `id: ${id}`, "form: glossary-term", `title: ${title}`, ...extra, "---", "", "## Definition", title, "", "## Usage", "Used.", "", "## Non-examples", "None.", ""].join("\n"));
}

function contract(root: string, id: string, title: string, extra: string[], body = CORPUS_TEXT): void {
  write(root, `.kotta/spec/interfaces/${id.slice(-8)}.md`, ["---", `id: ${id}`, "form: interface", `title: ${title}`, ...extra, "---", "", body].join("\n"));
}

/** The shared core: one module, one interface, changed once after the commit a consumer pins. */
function core(): { root: string; pinned: string } {
  const root = repository("kotta-core-");
  write(root, "package.json", JSON.stringify({ name: "shared-core", private: true, workspaces: ["packages/*"] }));
  write(root, "packages/corpus/package.json", JSON.stringify({ name: "@shared/corpus", version: "2.0.0", main: "index.ts" }));
  write(root, "packages/corpus/index.ts", `// ${ids.corpus}\nexport function search() { return []; }\n`);
  contract(root, ids.corpus, "Corpus search", ["module: \"@shared/corpus\""]);
  write(root, `.kotta/spec/business-rules/${ids.corpusRule.slice(-8)}.md`, ["---", `id: ${ids.corpusRule}`, "form: business-rule", "title: A passage stays in its corpus", `interfaces: [${ids.corpus}]`, "---", "", "## Rule", "Stays.", ""].join("\n"));
  write(root, `.kotta/spec/examples/${ids.corpusExample.slice(-8)}.md`, ["---", `id: ${ids.corpusExample}`, "form: example", "title: Searching one corpus", `subjects: [${ids.corpusRule}]`, "---", "", "## Given", "A corpus.", ""].join("\n"));
  const pinned = commit(root, "core: corpus search");
  contract(root, ids.corpus, "Corpus search", ["module: \"@shared/corpus\""], CORPUS_TEXT.replace("best first", "best first, never more than fifty"));
  commit(root, "core: cap the result size");
  return { root, pinned };
}

function consumer(shared: { root: string; pinned: string }): string {
  const root = repository("kotta-app-");
  write(root, "package.json", JSON.stringify({ name: "app", private: true }));
  write(root, "pnpm-workspace.yaml", "packages:\n  - packages/*\n");
  write(root, "packages/core/package.json", JSON.stringify({ name: "@acme/core", version: "1.0.0", exports: "./index.ts" }));
  write(root, "packages/core/index.ts", `// ${ids.core}\n// ${ids.cross}\nexport const core = true;\n`);
  write(root, "packages/core/core.test.ts", `it("${ids.core} keeps the core honest", () => {});\n`);
  write(root, "packages/web/package.json", JSON.stringify({
    name: "@acme/web",
    main: "index.ts",
    dependencies: { "@acme/core": "workspace:*", "@shared/corpus": `file:${join(shared.root, "packages/corpus")}`, "left-pad": "^1.3.0" },
  }));
  write(root, "packages/web/index.ts", `// ${ids.web}\n// ${ids.straddle}\n// ${ids.viaInterface}\nexport const web = true;\n`);
  write(root, "packages/tools/package.json", JSON.stringify({ name: "@acme/tools" }));
  write(root, "packages/tools/run.ts", "export {};\n");
  write(root, "functions/handler.ts", `// ${ids.straddle}\nexport const handler = () => null;\n`);

  term(root, ids.core, "Core promise");
  term(root, ids.web, "Web promise");
  term(root, ids.straddle, "Straddling promise");
  term(root, ids.unplaced, "Promise nobody keeps");
  term(root, ids.cross, "Core leaning on web", [`related: ${ids.web}`]);
  term(root, ids.viaInterface, "Web leaning on the core interface", [`related: ${ids.coreInterface}`]);
  contract(root, ids.coreInterface, "Core surface", ["module: \"@acme/core\""], "## Purpose\nThe core's exported surface.\n");
  contract(root, ids.ghost, "Surface of a module that is not there", ["module: \"@acme/ghost\""], "## Purpose\nNothing.\n");
  contract(root, ids.copy, "Our corpus search", [], CORPUS_TEXT.replace("ranked by relevance", "ranked by score"));
  contract(root, ids.pinnedCommit, "Corpus search, pinned by commit", ["reference:", "  module: \"@shared/corpus\"", `  version: ${shared.pinned}`, "  resolve: file"], "## Purpose\nSee the core.\n");
  contract(root, ids.pinnedVersion, "Corpus search, pinned by version", ["reference:", "  module: \"@shared/corpus\"", "  version: 2.0.0", `  id: ${ids.corpus}`], "## Purpose\nSee the core.\n");
  contract(root, ids.pinnedOld, "Corpus search, pinned to an old version", ["reference:", "  module: \"@shared/corpus\"", "  version: 1.4.0", "  resolve: file", `  id: ${ids.corpus}`], "## Purpose\nSee the core.\n");
  commit(root, "app");
  return root;
}

describe("kotta modules", () => {
  const shared = core();
  const app = consumer(shared);

  test("lists what the manifests declare, and the code outside them as (root)", () => {
    const result = kotta(app, "modules", "--json");
    expect(result.status).toBe(0);
    const { modules } = result.json().data as { modules: Array<{ name: string; path: string; kind: string; surface: string[]; dependencies: Array<{ name: string; external: boolean; resolve?: string; path?: string }> }> };
    expect(modules.map((module) => [module.name, module.path, module.kind])).toEqual([
      ["@acme/core", "packages/core", "node"],
      ["@acme/tools", "packages/tools", "node"],
      ["@acme/web", "packages/web", "node"],
      ["(root)", ".", "root"],
    ]);
    const web = modules.find((module) => module.name === "@acme/web")!;
    expect(web.surface).toEqual(['package.json "main"']);
    // The pinned core is external and resolved by path; the unrelated range is not listed.
    expect(web.dependencies).toEqual([
      { name: "@acme/core", external: false, spec: "workspace:*" },
      { name: "@shared/corpus", external: true, spec: `file:${join(shared.root, "packages/corpus")}`, resolve: "file", path: join(shared.root, "packages/corpus") },
    ]);
    const human = kotta(app, "modules").stdout;
    expect(human).toContain("3 modules declared by manifests, and (root) for the code outside them");
    expect(human).toContain("@shared/corpus");
  });

  test("a repository without manifests is one module", () => {
    const bare = repository("kotta-bare-");
    write(bare, "main.c", "int main(void) { return 0; }\n");
    const { modules } = kotta(bare, "modules", "--json").json().data as { modules: Array<{ name: string }> };
    expect(modules.map((module) => module.name)).toEqual(["(root)"]);
    expect(kotta(bare, "modules").stdout).toContain("the repository is one module, (root)");
  });

  test("check: the four boundary checks, and the references to the core", () => {
    const result = kotta(app, "modules", "check", "--json");
    const report = result.json() as {
      ok: boolean;
      data: { straddlers: string[]; unplaced: string[]; warnings: Array<{ code: string; node?: string; module?: string; modules?: string[]; message: string }>; references: Array<{ node: string; stale: boolean | null; resolve: string | null }> };
      errors: Array<{ code: string; node?: string; message: string }>;
    };
    // (d) is the only refusal: an interface naming a module no manifest declares.
    expect(report.ok).toBe(false);
    expect(result.status).toBe(1);
    expect(report.errors.map((error) => [error.code, error.node])).toEqual([["MODULE_UNKNOWN", ids.ghost]]);

    const codes = (code: string) => report.data.warnings.filter((warning) => warning.code === code);
    // (a) web exports a surface and nothing states it; core has its interface; tools exports nothing.
    expect(codes("MODULE_INTERFACE_MISSING").map((warning) => warning.module)).toEqual(["@acme/web"]);
    // (b) evidenced in a package and in functions/, outside every package.
    expect(report.data.straddlers).toEqual([ids.straddle]);
    expect(codes("MODULE_STRADDLER")[0]).toMatchObject({ node: ids.straddle, modules: ["(root)", "@acme/web"] });
    expect(codes("MODULE_STRADDLER")[0].message).toContain("interface");
    // (c) a core node naming a web node; the web node naming the core's interface is allowed.
    expect(codes("MODULE_CROSS_REFERENCE").map((warning) => [warning.node, warning.modules])).toEqual([[ids.cross, ["@acme/core", "@acme/web"]]]);
    expect(report.data.unplaced).toContain(ids.unplaced);

    // The core changed after the pinned commit, and 2.0.0 is not 1.4.0.
    const stale = codes("MODULE_REFERENCE_STALE").map((warning) => warning.node).sort();
    expect(stale).toEqual([ids.pinnedCommit, ids.pinnedOld].sort());
    expect(codes("MODULE_REFERENCE_STALE")[0].message).toContain("The core changed since the pinned version");
    expect(report.data.references.find((reference) => reference.node === ids.pinnedVersion)).toMatchObject({ stale: false, resolve: "file" });
    // A near copy of the core's interface is named, with the reference to use instead.
    expect(codes("MODULE_INTERFACE_COPY")).toHaveLength(1);
    expect(codes("MODULE_INTERFACE_COPY")[0]).toMatchObject({ node: ids.copy, module: "@shared/corpus" });
    expect(codes("MODULE_INTERFACE_COPY")[0].message).toMatch(/reference: \{ module: @shared\/corpus/);

    const human = kotta(app, "modules", "check").stdout;
    for (const heading of ["## Missing interface", "## Straddling nodes", "## References across a module boundary", "## Interfaces naming no module", "## The core changed since the pinned version", "## Drifted copies: switch to a reference"]) {
      expect(human).toContain(heading);
    }
  });

  test("validate carries the boundary checks: warnings, and the unknown module as an error", () => {
    const report = kotta(app, "validate", "--json").json() as { errors: Array<{ code: string }>; warnings: Array<{ code: string }> };
    expect(report.errors.map((error) => error.code)).toContain("MODULE_UNKNOWN");
    expect(new Set(report.warnings.map((warning) => warning.code))).toEqual(new Set(["MODULE_INTERFACE_MISSING", "MODULE_STRADDLER", "MODULE_CROSS_REFERENCE"]));
  });

  test("a reference resolves through git: url and commit", () => {
    const pinned = repository("kotta-git-ref-");
    contract(pinned, ids.pinnedGit, "Corpus search, pinned in git", ["reference:", "  module: \"@shared/corpus\"", `  version: ${shared.pinned}`, "  resolve: git", `  url: file://${shared.root}`], "## Purpose\nSee the core.\n");
    commit(pinned, "pin");
    const report = kotta(pinned, "modules", "check", "--json").json() as { data: { warnings: Array<{ code: string; node?: string }>; references: Array<{ node: string; resolve: string | null; stale: boolean | null }> } };
    expect(report.data.references).toEqual([expect.objectContaining({ node: ids.pinnedGit, resolve: "git", stale: true })]);
    expect(report.data.warnings.map((warning) => warning.code)).toContain("MODULE_REFERENCE_STALE");
  });

  test("publish-spec ships a module's interfaces with their rules and examples, and an installed package resolves", () => {
    const published = kotta(shared.root, "modules", "publish-spec", "@shared/corpus", "--json");
    expect(published.status).toBe(0);
    const data = published.json().data as { directory: string; version: string; commit: string; nodes: Array<{ id: string }>; files: string[] };
    expect(data.directory).toBe("packages/corpus/kotta-spec");
    expect(data.version).toBe("2.0.0");
    expect(data.nodes.map((node) => node.id)).toEqual([ids.corpus, ids.corpusRule, ids.corpusExample]);
    expect(data.files).toContain("packages/corpus/kotta-spec/manifest.json");
    expect(data.files).toContain("packages/corpus/kotta-spec/forms/interface.yaml");
    const manifest = JSON.parse(readFileSync(join(shared.root, "packages/corpus/kotta-spec/manifest.json"), "utf8")) as { module: string; commit: string };
    expect(manifest).toMatchObject({ module: "@shared/corpus", commit: git(shared.root, "rev-parse", "HEAD") });

    // A copy of a promise is not evidence of keeping it.
    commit(shared.root, "publish the corpus promises");
    const gap = kotta(shared.root, "gap", "--json").json() as { data: { nodes: Array<{ id: string; evidence: Array<{ path: string }> }> } };
    const rule = gap.data.nodes.find((node) => node.id === ids.corpusRule)!;
    expect(rule.evidence).toEqual([]);

    // Installed: the package carries its promises the way it carries its types.
    const installed = repository("kotta-installed-");
    write(installed, "package.json", JSON.stringify({ name: "consumer", dependencies: { "@shared/corpus": "^2.0.0" } }));
    write(installed, ".gitignore", "node_modules/\n");
    cpSync(join(shared.root, "packages/corpus"), join(installed, "node_modules/@shared/corpus"), { recursive: true });
    contract(installed, ids.pinnedPackage, "Corpus search, from the package", ["reference:", "  module: \"@shared/corpus\"", "  version: 2.0.0", "  resolve: package"], "## Purpose\nSee the package.\n");
    commit(installed, "consume");
    const check = kotta(installed, "modules", "check", "--json").json() as { data: { references: Array<{ node: string; resolve: string | null; stale: boolean | null; resolved: { target: string } | null }> } };
    expect(check.data.references).toEqual([expect.objectContaining({ node: ids.pinnedPackage, resolve: "package", stale: false, resolved: expect.objectContaining({ target: ids.corpus }) })]);
    const listed = kotta(installed, "modules", "--json").json() as { data: { modules: Array<{ dependencies: Array<{ name: string; resolve?: string }> }> } };
    expect(listed.data.modules[0].dependencies).toEqual([expect.objectContaining({ name: "@shared/corpus", resolve: "package" })]);

    const refused = kotta(shared.root, "modules", "publish-spec", "@shared/nothing", "--json");
    expect(refused.status).toBe(1);
    expect(refused.json().errors[0].code).toBe("MODULE_UNKNOWN");
    expect(existsSync(join(shared.root, "packages/corpus/kotta-spec"))).toBe(true);
  });

  test("gap: every node's evidence level, module and straddling, and a summary per module", () => {
    const result = kotta(app, "gap", "--json");
    const data = result.json().data as {
      nodes: Array<{ id: string; level: string; module: string | null; modules: string[]; straddler: boolean }>;
      modules: Array<{ module: string; promises: number; cited: number; bound: number; none: number }>;
      straddlers: string[];
      unplaced: number;
      report: string;
    };
    const node = (id: string) => data.nodes.find((entry) => entry.id === id)!;
    expect(node(ids.core)).toMatchObject({ level: "bound", module: "@acme/core", straddler: false });
    expect(node(ids.web)).toMatchObject({ level: "cited", module: "@acme/web" });
    expect(node(ids.straddle)).toMatchObject({ level: "cited", module: null, modules: ["(root)", "@acme/web"], straddler: true });
    expect(node(ids.unplaced)).toMatchObject({ level: "none", module: null, modules: [], straddler: false });
    expect(node(ids.coreInterface)).toMatchObject({ level: "none", module: "@acme/core" });
    expect(data.straddlers).toEqual([ids.straddle]);
    expect(data.modules.find((row) => row.module === "@acme/core")).toEqual({ module: "@acme/core", promises: 3, cited: 1, bound: 1, none: 1 });
    expect(data.modules.find((row) => row.module === "@acme/tools")).toEqual({ module: "@acme/tools", promises: 0, cited: 0, bound: 0, none: 0 });
    expect(data.report).toContain("## Evidence by module");
    expect(data.report).toContain("## Straddling promises");
    expect(data.report).toMatch(/Evidence levels: bound 1 · cited \d+ · none \d+/);

    const scoped = kotta(app, "gap", "--module", "@acme/core", "--json").json().data as { module: string; nodes: Array<{ id: string }> };
    expect(scoped.module).toBe("@acme/core");
    expect(scoped.nodes.map((entry) => entry.id).sort()).toEqual([ids.core, ids.cross, ids.coreInterface].sort());
    const unknown = kotta(app, "gap", "--module", "@acme/nothing", "--json");
    expect(unknown.status).toBe(1);
    expect(unknown.stdout).toContain("No module named '@acme/nothing'");
  });
});
