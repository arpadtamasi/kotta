import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { WORKSPACE_SCHEMA_VERSION } from "../../src/filesystem/workspace.js";

/**
 * A published schema is enforced or not published. Kotta 1.0 publishes two: the workspace
 * configuration and a node's provenance block (enforced by the registry; tests/unit/provenance.test.ts
 * keeps the two identical). The five process schemas of the 0.x releases left with the process.
 */

const schemasDirectory = resolve("schemas");
const schema = (file: string) => JSON.parse(readFileSync(resolve(schemasDirectory, file), "utf8")) as {
  required?: string[];
  properties?: Record<string, { enum?: string[]; const?: unknown; required?: string[]; properties?: Record<string, unknown> }>;
};

describe("the published configuration schema", () => {
  test("ships beside the provenance schema, and nothing else", () => {
    expect(readdirSync(schemasDirectory).filter((name) => name.endsWith(".json")).sort()).toEqual(["config.schema.json", "provenance.schema.json"]);
  });

  test("publishes the workspace shape version the code implements", () => {
    expect(schema("config.schema.json").properties?.version?.const).toBe(WORKSPACE_SCHEMA_VERSION);
  });

  test("requires exactly the sections a version-6 workspace carries, and names no process key", () => {
    const published = schema("config.schema.json");
    expect(published.required).toEqual(["version", "project", "git", "validation"]);
    expect(Object.keys(published.properties ?? {}).sort()).toEqual(["git", "project", "validation", "version"]);
    expect(Object.keys(published.properties?.git?.properties ?? {}).sort()).toEqual(["base_branch", "protected_branches"]);
    expect(Object.keys(published.properties?.validation?.properties ?? {})).toEqual(["strict"]);
    for (const field of published.required ?? []) {
      expect(Object.keys(published.properties ?? {}), `requires '${field}' but defines no such property`).toContain(field);
    }
  });
});
