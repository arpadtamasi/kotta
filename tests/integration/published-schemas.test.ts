import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { APPROVAL_PHASE_VALUES, EVENT_KINDS, EVENT_ROLES } from "../../src/core/events.js";
import {
  BATCH_STATES, CLAIM_ORIGINS, CONFIDENCE_LEVELS, ENTITY_ORIGINS, EXECUTION_MODES,
  OBSERVATION_ORIGINS, OBSERVATION_STATES, OBSERVATION_TYPES, PRIORITY_LEVELS, RISK_LEVELS,
  SEVERITY_LEVELS, TASK_STATES,
} from "../../src/filesystem/entities.js";
import { OBSERVATION_DISPOSITIONS } from "../../src/commands/observation.js";
import { TASK_RESOLUTIONS } from "../../src/commands/task.js";
import { WORKSPACE_SCHEMA_VERSION } from "../../src/filesystem/workspace.js";

/**
 * A published schema is enforced or not published (BR-01m0sj2f8mxydc7zxz6y8xn6b1,
 * EX-01m0sj2f8m02k71b0d5ph3d9qf).
 *
 * Six schemas declared forty-four required fields and fourteen sets of permitted values, and four of
 * those sets had anything in the code to compare against — the rest were types, which vanish before
 * a comparison could happen. This suite reads the shipped files, never a copy, so passing is
 * evidence about what Kotta publishes.
 */

const schemasDirectory = resolve("schemas");
const schema = (file: string) => JSON.parse(readFileSync(resolve(schemasDirectory, file), "utf8")) as {
  required?: string[];
  properties?: Record<string, { enum?: string[]; const?: unknown }>;
};

/** Each published set of permitted values, beside the constant the code enforces. */
const PAIRINGS: Array<{ file: string; field: string; code: readonly string[] }> = [
  { file: "task.schema.json", field: "status", code: TASK_STATES },
  { file: "task.schema.json", field: "resolution", code: TASK_RESOLUTIONS },
  { file: "task.schema.json", field: "origin", code: ENTITY_ORIGINS },
  { file: "task.schema.json", field: "execution_mode", code: EXECUTION_MODES },
  { file: "task.schema.json", field: "priority", code: PRIORITY_LEVELS },
  { file: "task.schema.json", field: "risk", code: RISK_LEVELS },
  { file: "observation.schema.json", field: "status", code: OBSERVATION_STATES },
  { file: "observation.schema.json", field: "disposition", code: OBSERVATION_DISPOSITIONS },
  { file: "observation.schema.json", field: "origin", code: OBSERVATION_ORIGINS },
  { file: "observation.schema.json", field: "observation_type", code: OBSERVATION_TYPES },
  { file: "observation.schema.json", field: "confidence", code: CONFIDENCE_LEVELS },
  { file: "observation.schema.json", field: "severity", code: SEVERITY_LEVELS },
  { file: "batch.schema.json", field: "status", code: BATCH_STATES },
  { file: "claim.schema.json", field: "execution_mode", code: EXECUTION_MODES },
  { file: "claim.schema.json", field: "origin", code: CLAIM_ORIGINS },
  { file: "event.schema.json", field: "kind", code: EVENT_KINDS },
  { file: "event.schema.json", field: "role", code: EVENT_ROLES },
  { file: "event.schema.json", field: "phase", code: APPROVAL_PHASE_VALUES },
];

describe("a published schema is enforced or not published", () => {
  test.each(PAIRINGS)("$file · $field permits exactly what the code permits", ({ file, field, code }) => {
    const published = schema(file).properties?.[field]?.enum;
    expect(published, `${file} declares no enum for '${field}'; the pairing table is stale`).toBeDefined();
    // Sorted set comparison: the order a schema lists values in is not a promise, the set is.
    expect([...(published ?? [])].sort(), `${file} · ${field}`).toEqual([...code].sort());
  });

  test("every published enum has a pairing, so a new one cannot arrive unchecked", () => {
    const paired = new Set(PAIRINGS.map(({ file, field }) => `${file}#${field}`));
    const unpaired: string[] = [];
    for (const file of readdirSync(schemasDirectory).filter((name) => name.endsWith(".json"))) {
      for (const [field, definition] of Object.entries(schema(file).properties ?? {})) {
        if (definition.enum && !paired.has(`${file}#${field}`)) unpaired.push(`${file}#${field}`);
      }
    }
    // A check that quietly covered five of six schemas is the defect this task exists to remove;
    // covering fifteen of sixteen fields would be the same defect one level down.
    expect(unpaired, "published sets of permitted values that nothing in the code enforces").toEqual([]);
  });

  test("the workspace shape version is published as the one the code implements", () => {
    expect(schema("config.schema.json").properties?.version?.const).toBe(WORKSPACE_SCHEMA_VERSION);
  });

  test("a schema requires no field the code does not name", () => {
    // The required lists are the other half of the contract. Rather than restate them here — which
    // would prove only that the restatement is self-consistent — each is checked to be non-empty and
    // to name fields the schema itself defines, so a required field cannot be a typo nobody reads.
    for (const file of readdirSync(schemasDirectory).filter((name) => name.endsWith(".json"))) {
      const { required = [], properties = {} } = schema(file);
      expect(required.length, `${file} requires nothing`).toBeGreaterThan(0);
      for (const field of required) {
        expect(Object.keys(properties), `${file} requires '${field}' but defines no such property`).toContain(field);
      }
    }
  });
});
