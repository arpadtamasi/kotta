import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { validateTaskFile } from "../../src/core/validation.js";

const SECTIONS = `## Outcome\n\nThe flow is documented.\n\n## Scope\n\nWrite the document.\n\n## Non-goals\n\nNo diagrams.\n\n## Acceptance\n\n- Documentation describes the flow.\n\n## Verification\n\n- Read the rendered documentation.\n\n## Constraints\n\nNone.\n\n## Open decisions\n\nNone.\n\n## Execution notes\n\nNone.\n`;

interface TaskOptions {
  state?: string;
  resolution?: string;
  deviations: string;
  verification: string;
  /** What the task promises. A task whose subject is deviations says the word here. */
  acceptance?: string;
}

const task = ({ state = "done", resolution = "completed", deviations, verification, acceptance = "Documentation describes the flow." }: TaskOptions) => {
  const root = mkdtempSync(join(tmpdir(), "kotta-deviation-"));
  const directory = join(root, state);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "T-001-document-flow.md");
  const frontmatter = `---\nid: T-001\ntitle: Document flow\nstatus: ${state}\ntypes:\n  - documentation\nprofiles: []\n${state === "done" ? `resolution: ${resolution}\n` : ""}---\n`;
  const evidence = `\n## Review evidence\n\n| Acceptance condition | Evidence |\n|---|---|\n| Documentation describes the flow | flow.md inspected |\n\n### Verification performed\n\n${verification}\n\n### Deviations\n\n${deviations}\n\n### Observations created\n\nNot declared.\n\n### Known concerns\n\nNot declared.\n`;
  writeFileSync(path, `${frontmatter}\n# T-001 — Document flow\n\n${SECTIONS.replace("- Documentation describes the flow.", `- ${acceptance}`)}${evidence}`);
  return path;
};

const codes = (path: string) => validateTaskFile(path).errors.map((error) => error.code);

describe("deviation reconciliation (F-019)", () => {
  test("'None.' plus a deviation in the narrative fails validation", () => {
    const path = task({ deviations: "None.", verification: "flow.md inspected.\nDEVIACIOK: a HTTP endpoint nem keszult el." });
    expect(codes(path)).toContain("DEVIATION_MISMATCH");
    expect(validateTaskFile(path).errors.find((error) => error.code === "DEVIATION_MISMATCH")?.message).toContain("DEVIACIOK");
  });

  test("'Not declared.' plus a deviation in the narrative fails validation", () => {
    const path = task({ deviations: "Not declared.", verification: "flow.md inspected.\nOne deviation: the diagram was skipped." });
    expect(codes(path)).toContain("DEVIATION_MISMATCH");
  });

  test("a task whose own subject is deviations validates when it declares none", () => {
    // Review evidence is stored as `<acceptance condition>: <evidence>`, so the condition text
    // lands in the section this check scans. Reading it whole made a task about deviations
    // impossible to validate (F-01m14h0t8ehy2yc37y8tn71ete).
    const condition = "A task that declared a deviation and has no observation naming it is still reported.";
    const path = task({
      acceptance: condition,
      deviations: "None.",
      verification: `${condition}: run: npx vitest run tests/integration/sweep.test.ts`,
    });

    expect(codes(path)).not.toContain("DEVIATION_MISMATCH");
  });

  test("and the admission is still caught when it sits beside that very condition", () => {
    const condition = "A task that declared a deviation and has no observation naming it is still reported.";
    const path = task({
      acceptance: condition,
      deviations: "None.",
      verification: `${condition}: run: npx vitest run x\nOne deviation: the diagram was skipped.`,
    });

    expect(codes(path), "the case F-019 exists for is untouched").toContain("DEVIATION_MISMATCH");
    expect(validateTaskFile(path).errors.find((error) => error.code === "DEVIATION_MISMATCH")?.message)
      .toContain("the diagram was skipped");
  });

  test("a declared command is evidence, not narrative, however it names its test", () => {
    // run: values are executed and receipted at submission (BR-01m0m33yxt2vqxb3jvqc186ssy). A test
    // file named for deviations is a filename, not a confession (F-01m14kfk04mj4dbwzy2ba65js0).
    const condition = "A task whose subject is deviations still validates.";
    const path = task({
      acceptance: condition,
      deviations: "None.",
      verification: `${condition}: run: npx vitest run tests/integration/deviation-reconciliation.test.ts -t "own subject is deviations" — verified: exit 0 at abc1234`,
    });

    expect(codes(path)).not.toContain("DEVIATION_MISMATCH");
  });

  test("prose beside a declared command is still read", () => {
    const condition = "A task whose subject is deviations still validates.";
    const path = task({
      acceptance: condition,
      deviations: "None.",
      verification: `One deviation: the diagram was skipped.\n${condition}: run: npx vitest run x — verified: exit 0 at abc1234`,
    });

    expect(codes(path)).toContain("DEVIATION_MISMATCH");
    expect(validateTaskFile(path).errors.find((error) => error.code === "DEVIATION_MISMATCH")?.message)
      .toContain("the diagram was skipped");
  });

  test("a declared deviation list passes however often the word appears", () => {
    const path = task({
      deviations: "The diagram was skipped; the task allowed text only.",
      verification: "flow.md inspected.\nDEVIACIOK: a diagram kimaradt.\nA deviation is recorded above.",
    });
    expect(codes(path)).not.toContain("DEVIATION_MISMATCH");
  });

  test("'None.' with no deviation marker in the narrative passes", () => {
    const path = task({ deviations: "None.", verification: "flow.md inspected; every acceptance condition met." });
    expect(codes(path)).not.toContain("DEVIATION_MISMATCH");
  });

  test("a narrative that denies deviations agrees with the field and passes", () => {
    const path = task({ deviations: "None.", verification: "flow.md inspected. No deviations, observations, or known concerns.\nErdemi deviacio nincs." });
    expect(codes(path)).not.toContain("DEVIATION_MISMATCH");
  });

  test("the rule does not run before done", () => {
    const path = task({ state: "review", deviations: "None.", verification: "flow.md inspected.\nDEVIACIOK: a HTTP endpoint nem keszult el." });
    expect(codes(path)).not.toContain("DEVIATION_MISMATCH");
  });
});
