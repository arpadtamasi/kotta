import { describe, expect, test } from "vitest";
import { assertDistinctReviewEvidence, prepareReviewEvidence } from "../../src/core/review-evidence.js";

describe("review evidence fitness", () => {
  test("refuses pairwise duplicates and names both checks plus the rule", () => {
    const entries = prepareReviewEvidence(["Visual result", "Accessibility"], {
      "Visual result": "screenshots/flow.png inspected",
      Accessibility: "screenshots/flow.png inspected",
    }).entries;

    expect(() => assertDistinctReviewEvidence(entries)).toThrow(/Visual result.*Accessibility.*Evidence answers its own check/);
  });

  test("normalizes whitespace before comparing evidence", () => {
    expect(() => assertDistinctReviewEvidence([
      { check: "Visual result", evidence: "the rendered   page\nwas inspected" },
      { check: "Accessibility", evidence: "  the rendered page was inspected  " },
    ])).toThrow(/identical after whitespace normalization/);
  });

  test("preserves distinct evidence in check order", () => {
    const prepared = prepareReviewEvidence(["Visual result", "Accessibility"], {
      Accessibility: "axe found no violations",
      "Visual result": "screenshots/flow.png inspected",
    });

    expect(prepared.entries).toEqual([
      { check: "Visual result", evidence: "screenshots/flow.png inspected" },
      { check: "Accessibility", evidence: "axe found no violations" },
    ]);
    expect(() => assertDistinctReviewEvidence(prepared.entries)).not.toThrow();
  });

  test("legacy evidence remains valid for one check", () => {
    expect(prepareReviewEvidence(["One check"], ["one focused answer"])).toEqual({
      entries: [{ check: "One check", evidence: "one focused answer" }],
      verification: "one focused answer",
    });
  });
});
