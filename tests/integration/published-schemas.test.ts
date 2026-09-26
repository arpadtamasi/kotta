import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { NARRATIVE_MODES } from "../../src/core/config.js";
import { WORKSPACE_SCHEMA_VERSION, workspaceConfigTemplate } from "../../src/filesystem/workspace.js";

/**
 * A published schema is enforced or not published (BR-01m0sj2f8mxydc7zxz6y8xn6b1). Kotta 1.0
 * publishes two: the workspace configuration and a node's provenance block (enforced by the registry;
 * tests/unit/provenance.test.ts keeps the two identical). The five process schemas of the 0.x
 * releases left with the process. Every assertion reads the shipped file and compares it with what
 * the code writes or permits, never with a copy kept here (EX-01m0sj2f8m02k71b0d5ph3d9qf).
 */

const schemasDirectory = resolve("schemas");
const schema = (file: string) => JSON.parse(readFileSync(resolve(schemasDirectory, file), "utf8")) as {
  required?: string[];
  properties?: Record<string, { enum?: string[]; const?: unknown; required?: string[]; properties?: Record<string, { required?: string[] }> }>;
};

describe("the published configuration schema (BR-01m0sj2f8mxydc7zxz6y8xn6b1)", () => {
  test("ships beside the provenance schema, and nothing else", () => {
    expect(readdirSync(schemasDirectory).filter((name) => name.endsWith(".json")).sort()).toEqual(["config.schema.json", "provenance.schema.json"]);
  });

  test("publishes the workspace shape version the code implements (EX-01m0sj2f8m02k71b0d5ph3d9qf)", () => {
    expect(schema("config.schema.json").properties?.version?.const, "config.schema.json 'version' differs from WORKSPACE_SCHEMA_VERSION").toBe(WORKSPACE_SCHEMA_VERSION);
  });

  test("requires exactly the sections the code writes, and names no process key (EX-01m0sj2f8m02k71b0d5ph3d9qf)", () => {
    const published = schema("config.schema.json");
    const written = workspaceConfigTemplate("project") as Record<string, Record<string, unknown>>;
    expect([...(published.required ?? [])].sort(), "config.schema.json 'required' differs from the keys init and migrate write").toEqual(Object.keys(written).sort());
    for (const section of ["project", "git", "validation"]) {
      const properties = published.properties?.[section];
      expect(Object.keys(properties?.properties ?? {}).sort(), `config.schema.json '${section}' properties differ from the keys the code writes`).toEqual(Object.keys(written[section]).sort());
      expect([...(properties?.required ?? [])].sort(), `config.schema.json '${section}.required' differs from the keys the code writes`).toEqual(Object.keys(written[section]).sort());
    }
    expect(Object.keys(published.properties ?? {}).sort(), "config.schema.json names a top-level key the code neither writes nor reads").toEqual([...Object.keys(written), "narrative"].sort());
    for (const field of published.required ?? []) {
      expect(Object.keys(published.properties ?? {}), `requires '${field}' but defines no such property`).toContain(field);
    }
  });

  test("permits exactly the narrative settings the code reads (EX-01m0sj2f8m02k71b0d5ph3d9qf)", () => {
    expect(schema("config.schema.json").properties?.narrative?.enum, "config.schema.json 'narrative' enum differs from NARRATIVE_MODES").toEqual([...NARRATIVE_MODES]);
  });
});
