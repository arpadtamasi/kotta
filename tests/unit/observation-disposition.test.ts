import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { OBSERVATION_DISPOSITIONS } from "../../src/commands/observation.js";

/**
 * The published schema is documentation; the runtime enum is enforcement. F-01m0f4fd8r3eapgd38f5c4wer9
 * (and the earlier attach-existing / attach-to-existing-task slip) is what happens when the two
 * drift unwatched: this test fails the moment they disagree, so the drift cannot recur silently.
 */
const schema = JSON.parse(readFileSync(resolve("schemas/observation.schema.json"), "utf8")) as {
  properties: { disposition: { enum: string[] }; spec?: { type: string; items?: { pattern?: string } } };
  allOf: Array<{ if: { properties: Record<string, { const?: string }> }; then: { required: string[] } }>;
};

describe("observation disposition enum", () => {
  test("the published schema enum matches the runtime enum, exactly and in order", () => {
    expect(schema.properties.disposition.enum).toEqual([...OBSERVATION_DISPOSITIONS]);
  });

  test("amend-spec is a first-class disposition on both surfaces", () => {
    expect(OBSERVATION_DISPOSITIONS).toContain("amend-spec");
    expect(schema.properties.disposition.enum).toContain("amend-spec");
  });

  test("the schema declares a spec field and requires it for amend-spec", () => {
    expect(schema.properties.spec?.type).toBe("array");
    const rule = schema.allOf.find((clause) => clause.if.properties.disposition?.const === "amend-spec");
    expect(rule?.then.required).toContain("spec");
  });
});
