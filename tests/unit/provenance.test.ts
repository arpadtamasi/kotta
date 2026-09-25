import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { PROVENANCE_DECIDERS, PROVENANCE_KEYS, PROVENANCE_LEVELS, QUOTE_WORD_LIMIT, provenanceProblems } from "../../src/spec/provenance.js";

/**
 * "Every node SHALL mark whether its content is stated, inferred, or the machine's decision, and the
 * mark SHALL travel with the node." The block is optional on an accepted node and required on a node
 * a change proposes; a present block is measured in full either way.
 */

const complete = { level: "stated", decided_by: "human", sources: ["proposal.md · Why"], quote: "a paused game should just quit — operator, 10:02" };

describe("a node's provenance", () => {
  test("a complete block passes, stated or inferred", () => {
    expect(provenanceProblems(complete, true)).toEqual([]);
    expect(provenanceProblems({ level: "inferred", decided_by: "agent-decided", sources: [], inferred: "the goal, from the capability's name" }, true)).toEqual([]);
    expect(provenanceProblems({ level: "partly-inferred", decided_by: "agent-proposed-human-approved", sources: ["conversation.md · 10:04"], inferred: "the threshold" }, true)).toEqual([]);
  });

  test("absent is allowed on an accepted node and refused where it is required", () => {
    expect(provenanceProblems(undefined, false)).toEqual([]);
    expect(provenanceProblems(undefined, true).join(" ")).toContain("has no provenance");
  });

  test("an inferred level must say what was supplied", () => {
    expect(provenanceProblems({ ...complete, level: "partly-inferred" }, false).join(" ")).toContain("leaves provenance.inferred empty");
  });

  test("unknown values, unknown keys, a missing source and a long quote are each named", () => {
    const said = provenanceProblems({ level: "guessed", decided_by: "robot", sources: [], quote: Array.from({ length: QUOTE_WORD_LIMIT + 1 }, () => "word").join(" "), extra: 1 }, false).join("\n");
    expect(said).toContain("provenance.level 'guessed'");
    expect(said).toContain("provenance.decided_by 'robot'");
    expect(said).toContain("unknown provenance key 'extra'");
    expect(said).toContain("names no provenance.sources");
    expect(said).toContain(`keep it to ${QUOTE_WORD_LIMIT} or fewer`);
  });

  test("a scaffold's unanswered block does not pass", () => {
    const said = provenanceProblems({ level: null, decided_by: null, sources: [], quote: null, inferred: null }, false).join("\n");
    expect(said).toContain("provenance.level unanswered");
    expect(said).toContain("provenance.decided_by unanswered");
  });

  test("the published schema says exactly what the validator enforces", () => {
    const schema = JSON.parse(readFileSync(resolve("schemas/provenance.schema.json"), "utf8")) as {
      required: string[]; properties: Record<string, { enum?: string[] }>; additionalProperties: boolean;
    };
    expect(schema.properties.level.enum).toEqual([...PROVENANCE_LEVELS]);
    expect(schema.properties.decided_by.enum).toEqual([...PROVENANCE_DECIDERS]);
    expect(Object.keys(schema.properties)).toEqual([...PROVENANCE_KEYS]);
    expect(schema.required).toEqual(["level", "decided_by"]);
    expect(schema.additionalProperties).toBe(false);
  });
});
