import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * A published install line names a version that exists. The install line is the one instruction a
 * reader cannot work around by understanding the tool better, and every hand-maintained copy of a
 * version is a decaying one. This reads the package as the single source and names any surface
 * that has drifted from it.
 *
 * The rules file this repository's own workspace carries (`.kotta/AGENTS.md`) is deliberately not a
 * surface here: that workspace is still on the pre-1.0 shape until it is migrated, and the file
 * describes the shape it is in. The template it is generated from is checked through `kotta init`
 * in the sync suite instead.
 */

const declared = (JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { name: string; version: string });

/** Every surface that tells a reader how to obtain Kotta. The changelog is deliberately absent. */
const SURFACES = [
  { path: "README.md", what: "the repository README" },
  { path: "site/index.html", what: "the site's install block" },
] as const;

/** `@scope/name@1.2.3` or a prerelease of it, wherever it appears as an instruction to install. */
const INSTALL_LINE = new RegExp(`${declared.name.replace(/[/\\-]/g, "\\$&")}@(\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.]+)?)`, "g");

describe("every published install line names the declared version (BR-01m0zx29x1nvccpr4xwyhjr153)", () => {
  for (const surface of SURFACES) {
    test(`${surface.what} is in step with the package (EX-01m0zx29x1pnyjsa5dyg4dc6n5)`, () => {
      const text = readFileSync(resolve(surface.path), "utf8");
      const named = [...new Set([...text.matchAll(INSTALL_LINE)].map((match) => match[1]))];
      expect(named.length, `${surface.path} names no install version at all`).toBeGreaterThan(0);
      expect(named, `${surface.path} advertises a version the package does not declare`).toEqual([declared.version]);
    });
  }

  test("no surface names a version the package does not declare (EX-01m0zx29x1pnyjsa5dyg4dc6n5)", () => {
    const drifted = SURFACES
      .map((surface) => ({ surface, named: [...new Set([...readFileSync(resolve(surface.path), "utf8").matchAll(INSTALL_LINE)].map((match) => match[1]))] }))
      .filter(({ named }) => named.some((version) => version !== declared.version));
    expect(drifted.map(({ surface, named }) => `${surface.path}: ${named.join(", ")}`)).toEqual([]);
  });

  test("no published surface tells a reader to run what one Kotta command already does", () => {
    const site = readFileSync(resolve("site/index.html"), "utf8");
    expect(site, "the site's way in is Kotta's own command").toContain("kotta init");
    expect(site, "and not a pinned installer that leaves the rules file out").not.toMatch(/npx\s+skills@/);
  });

  test("the site's own test compares against the package rather than a second copy of the number", () => {
    const spec = readFileSync(resolve("site/tests/site.spec.ts"), "utf8");
    expect(spec).toContain("declaredVersion()");
    expect(spec, "a literal version in the test drifts exactly like the page it checks")
      .not.toMatch(new RegExp(`${declared.name.replace(/[/\\-]/g, "\\$&")}@\\d`));
  });
});
