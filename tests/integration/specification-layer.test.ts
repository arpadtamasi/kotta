import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import { beforeEach, describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const bundledForms = resolve("templates/workspace/spec/forms");
const shippedWorkshopSkills: Record<string, string[]> = {
  "impact-mapping": ["goal", "actor"],
  "story-mapping": ["user-story"],
  "use-case-modeling": ["use-case"],
  "example-mapping": ["business-rule", "example"],
  "event-storming": ["entity", "state-machine"],
  "ubiquitous-language": ["glossary-term"],
  "quality-scenarios": ["quality-attribute"],
  "design-by-task": ["interface"],
};

let repository: string;
let skillsHome: string;

function run(args: string[]): unknown {
  return JSON.parse(execFileSync("node", [cli, ...args, "--json"], {
    cwd: repository,
    encoding: "utf8",
    env: { ...process.env, KOTTA_SKILLS_HOME: skillsHome },
  }));
}

beforeEach(() => {
  repository = mkdtempSync(join(tmpdir(), "kotta-specification-layer-"));
  skillsHome = mkdtempSync(join(tmpdir(), "kotta-specification-skills-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: repository });
});

describe("the specification layer", () => {
  test("init installs eleven complete data-driven form definitions and all nine skills", () => {
    run(["init"]);

    const expectedForms = readdirSync(bundledForms).filter((name) => name.endsWith(".yaml")).sort();
    expect(expectedForms).toHaveLength(11);
    expect(readdirSync(join(repository, ".kotta/spec/forms")).filter((name) => name.endsWith(".yaml")).sort()).toEqual(expectedForms);

    for (const filename of expectedForms) {
      const definition = parse(readFileSync(join(repository, ".kotta/spec/forms", filename), "utf8")) as Record<string, unknown>;
      expect(definition).toMatchObject({ version: 1 });
      expect(typeof definition.id).toBe("string");
      expect(typeof definition.directory).toBe("string");
      expect(existsSync(join(repository, ".kotta/spec", String(definition.directory)))).toBe(true);
      expect(typeof definition.canonical_source).toBe("string");
      expect(definition.identity).toMatchObject({ prefix: expect.any(String), format: expect.any(String), filename: expect.any(String) });
      expect(definition.required_fields).toMatchObject({ frontmatter: expect.any(Array), body_headings: expect.any(Array) });
      expect(Array.isArray(definition.required_edges)).toBe(true);
      expect(definition.recognition_signals).toEqual(expect.arrayContaining([expect.any(String)]));

      for (const edge of definition.required_edges as Array<Record<string, unknown>>) {
        expect(edge).toMatchObject({
          name: expect.any(String),
          direction: expect.stringMatching(/^(incoming|outgoing)$/),
          fields: expect.arrayContaining([expect.any(String)]),
          source_forms: expect.arrayContaining([expect.any(String)]),
          target_forms: expect.arrayContaining([expect.any(String)]),
          minimum: expect.any(Number),
          question: expect.any(String),
        });
      }
    }

    const expectedSkills = [...Object.keys(shippedWorkshopSkills), "requirements-traceability"];
    for (const skill of expectedSkills) {
      expect(existsSync(join(skillsHome, skill, "SKILL.md"))).toBe(true);
    }
  });

  test("sync adds missing bundled forms without overwriting project-owned definitions", () => {
    run(["init"]);
    const forms = join(repository, ".kotta/spec/forms");
    const goal = join(forms, "goal.yaml");
    const actor = join(forms, "actor.yaml");
    const risk = join(forms, "risk.yaml");
    const customizedActor = `${readFileSync(actor, "utf8")}project_note: keep this\n`;
    const customRisk = "id: risk\nversion: 1\ndirectory: risks\n";
    writeFileSync(actor, customizedActor);
    writeFileSync(risk, customRisk);
    const customNode = join(repository, ".kotta/spec/actors/custom-node.md");
    writeFileSync(customNode, "project-owned\n");
    rmSync(goal);

    run(["sync"]);

    expect(existsSync(goal)).toBe(true);
    expect(readFileSync(actor, "utf8")).toBe(customizedActor);
    expect(readFileSync(risk, "utf8")).toBe(customRisk);
    expect(existsSync(join(repository, ".kotta/spec/risks"))).toBe(true);
    expect(readFileSync(customNode, "utf8")).toBe("project-owned\n");
  });

  test("every workshop skill includes its guardrail and a worked node for each owned form", () => {
    for (const [skill, forms] of Object.entries(shippedWorkshopSkills)) {
      const content = readFileSync(resolve("skills", skill, "SKILL.md"), "utf8");
      expect(content).toContain("## When not to use");
      expect(content).toMatch(/## Worked example/);
      for (const form of forms) expect(content).toContain(`form: ${form}`);
    }
  });
});
