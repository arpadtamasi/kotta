import { cpSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { BOARD_BUNDLE, REGENERATE, bundleDrift, buildBoardBundle, describeDrift } from "../helpers/board-bundle.js";

/**
 * What the board serves is what its source says (IF-01m0f0wn898ggsdxa0kh6t6tnw).
 *
 * The bundle is carried in the repository so a checkout runs the board without a build step, and
 * that is exactly why it can go stale: a correction reaching `ui/src` and not `ui-dist/` has not
 * reached the reader. One build, four seconds, and the difference is named.
 */

const repository = resolve(".");
const committed = join(repository, BOARD_BUNDLE);
let built: { path: string; remove: () => void };

/**
 * A throwaway copy, so a failing case can be produced without touching the tracked bundle. The
 * cases below copy the *built* bundle rather than the committed one, so what they prove — that
 * drift is named — holds while the repository is itself in drift. Copying the committed copy would
 * make one real staleness fail every case in this file at once.
 */
function copyOf(source: string): string {
  const path = join(mkdtempSync(join(tmpdir(), "kotta-bundle-copy-")), BOARD_BUNDLE);
  cpSync(source, path, { recursive: true });
  return path;
}

const anyFileIn = (directory: string): string => {
  const assets = join(directory, "assets");
  return join(assets, readdirSync(assets).sort()[0]);
};

beforeAll(() => {
  built = buildBoardBundle(repository);
}, 180_000);

afterAll(() => built?.remove());

describe("the committed board bundle matches its source", () => {
  test("the bundle in the repository is what a build of ui/ produces", () => {
    expect(describeDrift(bundleDrift(built.path, committed))).toBe("");
  });

  test("the check builds the source itself, and writes nothing into the tracked bundle", () => {
    // Not a pretest step: run `vitest` alone and this still builds. A check that trusted an earlier
    // command would report green for exactly the person who skipped it.
    expect(built.path.startsWith(tmpdir())).toBe(true);
    expect(built.path.startsWith(committed)).toBe(false);
    expect(statSync(join(built.path, "index.html")).isFile()).toBe(true);
    // And the tracked copy is untouched by having run: git is the witness the suite cannot fake.
    expect(bundleDrift(built.path, committed)).toEqual([]);
  });

  test("a stale file is reported by name, with the command that regenerates it", () => {
    const stale = copyOf(built.path);
    const file = anyFileIn(stale);
    writeFileSync(file, "/* the source moved on without me */\n");

    const drift = bundleDrift(built.path, stale);
    expect(drift).toHaveLength(1);
    expect(drift[0].kind).toBe("differs");
    const report = describeDrift(drift);
    expect(report).toContain(drift[0].file);
    expect(report).toContain("different content");
    expect(report).toContain(REGENERATE);
    rmSync(stale, { recursive: true, force: true });
  });

  test("a file the source emits and the bundle lacks is reported as missing", () => {
    const stale = copyOf(built.path);
    const file = anyFileIn(stale);
    unlinkSync(file);

    const drift = bundleDrift(built.path, stale);
    expect(drift.map(({ kind }) => kind)).toEqual(["missing"]);
    expect(describeDrift(drift)).toContain("absent from the bundle");
    rmSync(stale, { recursive: true, force: true });
  });

  test("a file left behind from an older build is reported as extra", () => {
    // The shape a real regeneration produces: content-hashed names, so an edited source leaves the
    // previous file behind unless the whole directory is replaced.
    const stale = copyOf(built.path);
    writeFileSync(join(stale, "assets", "index-OLDHASH0.js"), "/* from two builds ago */\n");

    const drift = bundleDrift(built.path, stale);
    expect(drift.map(({ kind, file }) => `${kind} ${file}`)).toEqual(["extra assets/index-OLDHASH0.js"]);
    expect(describeDrift(drift)).toContain("not built from the source");
    rmSync(stale, { recursive: true, force: true });
  });

  test("the test runner's environment does not reach the build", () => {
    // The failure this cost an hour: vitest sets NODE_ENV=test, which selects a different React
    // build, which changes the content hash — so an inherited environment reports drift on a
    // bundle that is current. The premise is asserted, or the case above passes for the wrong
    // reason the day the runner stops setting it.
    expect(process.env.NODE_ENV, "a test runner sets this, and a production build must not see it").toBe("test");
    expect(bundleDrift(built.path, committed)).toEqual([]);
  });

  test("a report with nothing in it is empty, so a passing check prints nothing", () => {
    expect(describeDrift([])).toBe("");
  });
});
