import { describe, expect, test } from "vitest";
import { bindsInTestName, evidenceLevel } from "../../src/core/evidence.js";
import { ROOT_MODULE, discoverModules, listedFiles, moduleOf, placeNode, similarity } from "../../src/core/modules.js";
import { parseToml } from "../../src/core/toml.js";

const ID = "BR-01m1b00000000000000000000a";

function repository(files: Record<string, string>) {
  return listedFiles("/repo", Object.entries(files).map(([path, text]) => ({ path, text })));
}

describe("reading manifests", () => {
  test("TOML: tables, dotted keys, arrays across lines, inline tables", () => {
    const parsed = parseToml([
      "# comment",
      "[project]",
      'name = "corpus"  # trailing',
      'dependencies = [',
      '  "httpx>=0.27",',
      '  "core-lib",',
      ']',
      "[tool.uv.sources]",
      'core-lib = { path = "../core", editable = true }',
      "[[bin]]",
      'name = "one"',
      "[[bin]]",
      'name = "two"',
      "[workspace]",
      "members = ['crates/*']",
    ].join("\n"));
    expect(parsed).toMatchObject({
      project: { name: "corpus", dependencies: ["httpx>=0.27", "core-lib"] },
      tool: { uv: { sources: { "core-lib": { path: "../core", editable: true } } } },
      bin: [{ name: "one" }, { name: "two" }],
      workspace: { members: ["crates/*"] },
    });
  });

  test("a repository without a manifest is one module, the root", () => {
    const { modules } = discoverModules(repository({ "src/main.c": "int main() {}" }));
    expect(modules.map((module) => module.name)).toEqual([ROOT_MODULE]);
    expect(moduleOf("src/main.c", modules)).toBe(ROOT_MODULE);
  });

  test("npm workspaces: members are modules, the workspace root is not, and a new package needs no registration", () => {
    const files = {
      "package.json": JSON.stringify({ name: "monorepo", private: true, workspaces: ["packages/*", "!packages/ignored"] }),
      "packages/a/package.json": JSON.stringify({ name: "@x/a", version: "1.0.0", exports: "./index.js", dependencies: { "@x/b": "workspace:*", left: "^1.0.0" } }),
      "packages/b/package.json": JSON.stringify({ name: "@x/b" }),
      "packages/ignored/package.json": JSON.stringify({ name: "@x/ignored" }),
      "scripts/tool.js": "",
    };
    const first = discoverModules(repository(files)).modules;
    expect(first.map((module) => module.name)).toEqual(["@x/a", "@x/b", ROOT_MODULE]);
    expect(first[0]).toMatchObject({ kind: "node", path: "packages/a", version: "1.0.0", surface: ['package.json "exports"'] });
    // A version-range dependency on an unrelated package is not a module relationship.
    expect(first[0].dependencies).toEqual([{ name: "@x/b", external: false, spec: "workspace:*" }]);
    expect(moduleOf("scripts/tool.js", first)).toBe(ROOT_MODULE);

    const grown = discoverModules(repository({ ...files, "packages/c/package.json": JSON.stringify({ name: "@x/c" }) })).modules;
    expect(grown.map((module) => module.name)).toContain("@x/c");
  });

  test("Python, Dart, Rust and Go manifests each declare modules", () => {
    const { modules } = discoverModules(repository({
      "pyproject.toml": "[tool.uv.workspace]\nmembers = [\"py/*\"]\n",
      "py/search/pyproject.toml": "[project]\nname = \"corpus-search\"\nversion = \"0.3.0\"\ndependencies = [\"corpus_core\"]\n",
      "py/search/src/corpus_search/__init__.py": "",
      "py/core/pyproject.toml": "[project]\nname = \"corpus-core\"\n",
      "app/pubspec.yaml": "name: mobile\nversion: 1.2.0\ndependencies:\n  flutter:\n    sdk: flutter\n  shared:\n    path: ../../shared\n",
      "app/lib/main.dart": "void main() {}",
      "Cargo.toml": "[workspace]\nmembers = [\"crates/*\"]\n",
      "crates/engine/Cargo.toml": "[package]\nname = \"engine\"\nversion = \"0.1.0\"\n[dependencies]\nserde = \"1\"\nremote = { git = \"https://example.com/remote.git\", rev = \"abc1234\" }\n",
      "crates/engine/src/lib.rs": "pub fn run() {}",
      "svc/go.mod": "module example.com/svc\n\nrequire (\n\texample.com/lib v1.2.3\n)\n\nreplace example.com/lib => ../lib\n",
      "svc/handler.go": "package svc\n",
    }));
    const byName = new Map(modules.map((module) => [module.name, module]));
    expect(byName.get("corpus-search")).toMatchObject({ kind: "python", version: "0.3.0", surface: ["src/corpus_search/__init__.py"] });
    expect(byName.get("corpus-search")?.dependencies).toEqual([{ name: "corpus-core", external: false, spec: "corpus_core" }]);
    expect(byName.get("mobile")).toMatchObject({ kind: "dart", surface: ["lib/"] });
    expect(byName.get("mobile")?.dependencies).toEqual([{ name: "shared", external: true, spec: "path: ../../shared", resolve: "file", path: "/shared" }]);
    expect(byName.get("engine")).toMatchObject({ kind: "rust", surface: ["src/lib.rs"] });
    expect(byName.get("engine")?.dependencies).toEqual([{ name: "remote", external: true, spec: 'git = "https://example.com/remote.git"', resolve: "git", url: "https://example.com/remote.git", ref: "abc1234" }]);
    expect(byName.get("example.com/svc")).toMatchObject({ kind: "go", surface: ["package svc (handler.go)"] });
    expect(byName.get("example.com/svc")?.dependencies).toEqual([{ name: "example.com/lib", external: true, spec: "v1.2.3 => ../lib", resolve: "file", path: "/repo/lib" }]);
  });
});

describe("placing a node by its evidence", () => {
  const { modules } = discoverModules(repository({
    "pnpm-workspace.yaml": "packages:\n  - packages/*\n",
    "packages/a/package.json": JSON.stringify({ name: "a" }),
    "packages/b/package.json": JSON.stringify({ name: "b" }),
  }));
  const node = (form = "business-rule", data: Record<string, unknown> = {}) => ({ id: ID, form, title: "Rule", path: ".kotta/spec/x.md", data });

  test("one module is the node's module; two make it a straddler; none leaves it unplaced", () => {
    expect(placeNode(node(), [{ path: "packages/a/x.ts", text: ID }], modules)).toMatchObject({ module: "a", straddler: false, modules: ["a"] });
    expect(placeNode(node(), [{ path: "packages/a/x.ts", text: ID }, { path: "functions/y.ts", text: ID }], modules)).toMatchObject({ module: null, straddler: true, modules: [ROOT_MODULE, "a"] });
    expect(placeNode(node(), [], modules)).toMatchObject({ module: null, straddler: false, level: "none" });
  });

  test("'module:' is read on an interface only, and an interface never straddles", () => {
    const both = [{ path: "packages/a/x.ts", text: ID }, { path: "packages/b/y.ts", text: ID }];
    expect(placeNode(node("business-rule", { module: "b" }), [{ path: "packages/a/x.ts", text: ID }], modules)).toMatchObject({ module: "a", declaredModule: null });
    expect(placeNode(node("interface", { module: "b" }), both, modules)).toMatchObject({ module: "b", declaredModule: "b", straddler: false });
  });
});

describe("evidence levels", () => {
  test("the id in a test's name binds; in its body it only cites; a skipped test binds nothing", () => {
    expect(bindsInTestName(`it("${ID} refuses an empty export", () => {})`, ID)).toBe(true);
    expect(bindsInTestName(`describe('${ID}', () => {})`, ID)).toBe(true);
    expect(bindsInTestName(`test('export (${ID})', () {});`, ID)).toBe(true);
    expect(bindsInTestName(`it("refuses", () => { expect(check("${ID}")).toBe(true) })`, ID)).toBe(false);
    expect(bindsInTestName(`it.skip("${ID} refuses", () => {})`, ID)).toBe(false);
    expect(bindsInTestName(`xit("${ID} refuses", () => {})`, ID)).toBe(false);
    expect(bindsInTestName("#[test]\nfn br_01m1b00000000000000000000a_refuses() {}", ID)).toBe(true);
    expect(bindsInTestName("#[test]\n#[ignore]\nfn br_01m1b00000000000000000000a_refuses() {}", ID)).toBe(false);
    expect(bindsInTestName("def test_br_01m1b00000000000000000000a_refuses():\n    pass", ID)).toBe(true);
    expect(evidenceLevel([], ID)).toBe("none");
    expect(evidenceLevel([{ text: `// ${ID}` }], ID)).toBe("cited");
  });
});

describe("text similarity", () => {
  test("one changed word in forty is still a copy; unrelated text is not", () => {
    const original = Array.from({ length: 40 }, (_, index) => `word${index}`).join(" ");
    expect(similarity(original, original.replace("word7", "other"))).toBeGreaterThan(0.95);
    expect(similarity(original, "a completely different promise about something else")).toBeLessThan(0.2);
  });
});
