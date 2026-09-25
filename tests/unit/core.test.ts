import { describe, expect, test } from "vitest";
import { displayId, isMintedId, mintSpecId, shortId, specFilename } from "../../src/core/identity.js";
import { named, namedWithId, slugify } from "../../src/core/naming.js";

describe("coordination-free node identity", () => {
  test("mints identifiers without reading the workspace, so two branches cannot collide", () => {
    const minted = new Set(Array.from({ length: 2000 }, () => mintSpecId("UC")));
    expect(minted.size).toBe(2000);
    for (const id of minted) expect(isMintedId(id)).toBe(true);
    // Time-sortable: an id minted later sorts after one minted earlier, lexicographically.
    expect(mintSpecId("UC", 1_700_000_000_000) < mintSpecId("UC", 1_700_000_000_001)).toBe(true);
    expect(isMintedId("UC-034")).toBe(false);
  });

  test("the prefix is the form's to declare, so any short prefix is recognised by shape", () => {
    for (const prefix of ["G", "BR", "UC", "QA"]) {
      const id = mintSpecId(prefix);
      expect(id.startsWith(`${prefix}-`)).toBe(true);
      expect(displayId(id)).toBe(`${prefix}-${shortId(id)}`);
      expect(specFilename(id, "export-a-report")).toBe(`export-a-report-${shortId(id)}.md`);
    }
    expect(specFilename(mintSpecId("G"), "")).toMatch(/^untitled-[0-9a-hjkmnp-tv-z]{8}\.md$/);
    expect(displayId("not-an-id")).toBe("not-an-id");
    expect(shortId("not-an-id")).toBeNull();
  });
});

describe("naming a node to a human", () => {
  test("the title leads and the id rides along", () => {
    const id = mintSpecId("UC");
    expect(named("Export a report", id)).toBe("Export a report");
    expect(named("   ", id)).toBe(id);
    expect(namedWithId("Export a report", id)).toBe(`Export a report (${displayId(id)})`);
    expect(namedWithId(undefined, id)).toBe(id);
  });

  test("a slug is filename-safe ASCII", () => {
    expect(slugify("Faster export: P95 ≤ 2s")).toBe("faster-export-p95-2s");
    expect(slugify("Árvíztűrő tükörfúrógép")).toBe("arvizturo-tukorfurogep");
    expect(slugify("x".repeat(80))).toHaveLength(60);
  });
});
