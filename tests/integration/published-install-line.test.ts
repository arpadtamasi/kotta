import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * A published install line names a version that exists (BR-01m0zx29x1nvccpr4xwyhjr153,
 * EX-01m0zx29x1pnyjsa5dyg4dc6n5).
 *
 * The install line is the one instruction a reader cannot work around by understanding the tool
 * better, and every hand-maintained copy of a version is a decaying one. This reads the package as
 * the single source and names any surface that has drifted from it.
 */

const declared = (JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { name: string; version: string });

/** Every surface that tells a reader how to obtain Kotta. The changelog is deliberately absent. */
const SURFACES = [
  { path: "README.md", what: "the repository README" },
  { path: "site/index.html", what: "the site's install block" },
  { path: ".kotta/AGENTS.md", what: "the generated rules file Kotta writes into every project" },
] as const;

/** `@scope/name@1.2.3` wherever it appears as an instruction to install. */
const INSTALL_LINE = new RegExp(`${declared.name.replace(/[/\\-]/g, "\\$&")}@(\\d+\\.\\d+\\.\\d+)`, "g");

describe("every published install line names the declared version", () => {
  for (const surface of SURFACES) {
    test(`${surface.what} is in step with the package`, () => {
      const text = readFileSync(resolve(surface.path), "utf8");
      const named = [...new Set([...text.matchAll(INSTALL_LINE)].map((match) => match[1]))];
      expect(named.length, `${surface.path} names no install version at all`).toBeGreaterThan(0);
      expect(named, `${surface.path} advertises a version the package does not declare`).toEqual([declared.version]);
    });
  }

  test("no surface names a version the package does not declare", () => {
    const drifted = SURFACES
      .map((surface) => ({ surface, named: [...new Set([...readFileSync(resolve(surface.path), "utf8").matchAll(INSTALL_LINE)].map((match) => match[1]))] }))
      .filter(({ named }) => named.some((version) => version !== declared.version));
    // The failure names which surface and what it said, because "a version is wrong somewhere" is
    // the report that made this defect survive three releases.
    expect(drifted.map(({ surface, named }) => `${surface.path}: ${named.join(", ")}`)).toEqual([]);
  });

  test("no published surface tells a reader to run what one Kotta command already does", () => {
    // `kotta init` installs the shipped skills and writes the rules file every agent reads. A page
    // that sends a first visitor through a pinned third-party installer instead shows them a path
    // that does less, under the words "verified setup" (BR-01m0zx29x1nvccpr4xwyhjr153).
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
