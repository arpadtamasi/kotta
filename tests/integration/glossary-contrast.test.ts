import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { claimSentences, glossaryContrasts } from "../../src/spec/contrast.js";
import { cli, json, write } from "./planning-fixture.js";

/**
 * The glossary contrast `kotta plan` offers as a conflict candidate, measured on nodes from the Casino
 * end-to-end run (tests/fixtures/casino-contrast, copied from its archived change). There the old,
 * title-based test named eight candidates, every one false: a term naming "a leosztás" as a
 * non-example of "Játszma" is not contradicted by a title that says "A leosztás körmenete". A
 * contrast is a claim that says of a non-example what the term denies.
 */

const FIXTURE = resolve("tests/fixtures/casino-contrast");
const CHANGE = "openspec/changes/casino";
const KINT_VAGYOK = "GT-01m37bpemcx5q1dky049ta3xxx";
const GYOZELEM = "BR-01m37bp5e8ws0mrd2qmhxr4twj";

function casino(label: string, into: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-contrast-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  cpSync(FIXTURE, join(root, into), { recursive: true });
  write(root, `${CHANGE}/proposal.md`, "# Casino\n");
  return root;
}

const contrasts = (conflicts: Array<{ kind: string }>) => conflicts.filter((conflict) => conflict.kind === "glossary-contrast");

describe("glossary contrast", () => {
  test("a word in a title, or a claim that agrees with the non-example, is not a candidate", () => {
    const root = casino("titles", `${CHANGE}/model`);
    const planned = json(root, ["plan", "casino"]);
    expect(planned.body.data.delta.added).toHaveLength(readdirSync(FIXTURE, { recursive: true }).filter((name) => String(name).endsWith(".md")).length);
    expect(contrasts(planned.body.data.conflicts)).toEqual([]);
    const report = readFileSync(join(root, CHANGE, "planning.md"), "utf8");
    expect(report).not.toContain("names as a non-example");
    expect(report).not.toContain("glossary-contrast");
  });

  test("a changed rule that counts undecided majority points toward the Kint vagyok threshold is one", () => {
    const root = casino("real", ".kotta/spec");
    const accepted = readFileSync(join(FIXTURE, "business-rules/gyozelem-11-pontnal-bemondassal-mhxr4twj.md"), "utf8");
    const changed = accepted.replace(/## Rule\n\n[^\n]+\n/, [
      "## Rule",
      "",
      "A rendszer SHALL győztesként lezárni a játszmát, amikor a játékos 11 összpontnál bemondja a „Kint vagyok\"-ot. A „Kint vagyok\" küszöbébe a leosztás közben még el nem dőlt többségi pont is beleszámít.",
      "",
    ].join("\n"));
    expect(changed).not.toBe(accepted);
    write(root, `${CHANGE}/model/business-rules/gyozelem-11-pontnal-bemondassal-mhxr4twj.md`, changed);

    const planned = json(root, ["plan", "casino"]);
    const found = contrasts(planned.body.data.conflicts);
    expect(found).toEqual([expect.objectContaining({
      node: expect.objectContaining({ id: KINT_VAGYOK, title: "Kint vagyok" }),
      because: expect.objectContaining({ id: GYOZELEM }),
      detail: expect.stringContaining("többségi pont is beleszámít"),
      verdict: "awaits-judgement",
    })]);
    expect(found[0].detail).toContain("az nem biztos pont, ezért a küszöbbe sem számít");
  });

  test("the claim must name the term, the subject and a denied word, and must not itself negate", () => {
    const term = readFileSync(join(FIXTURE, "glossary-terms/kint-vagyok-49ta3xxx.md"), "utf8");
    const says = (sentence: string) => glossaryContrasts("Kint vagyok", term, [sentence]).length;
    expect(says("A „Kint vagyok\" küszöbébe a leosztás közben még el nem dőlt többségi pont is beleszámít.")).toBe(1);
    expect(says("A „Kint vagyok\" küszöbébe a leosztás közben még el nem dőlt többségi pont nem számít bele.")).toBe(0);
    expect(says("A küszöbbe a leosztás közben még el nem dőlt többségi pont is beleszámít.")).toBe(0);
    expect(says("A „Kint vagyok\" bemondása 11 biztos pontnál szabályos.")).toBe(0);
  });

  test("claims are read from the stating sections only, sentence by sentence", () => {
    const content = "## Rule\n\nA 11. biztos pont számít. Második mondat.\n\n## Rationale\n\nEz nem állítás.\n\n## Then\n\n- egy\n- kettő\n";
    expect(claimSentences(content)).toEqual(["A 11. biztos pont számít.", "Második mondat.", "egy", "kettő"]);
  });
});
