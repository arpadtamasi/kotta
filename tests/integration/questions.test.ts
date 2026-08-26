import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { openQuestions } from "../../src/commands/questions.js";
import { parseOpenQuestions } from "../../src/core/questions.js";

/**
 * An open question names the answer it waits for (BR-01m0z873stwx7szg5896gwsbry,
 * EX-01m0z873t1cmhybhakq6vwzxb6, UC-01m0f0wn89m98wpkqq8e5c9p6p).
 *
 * The listing and the refusal come from one parse, so the cases here assert them together: what
 * `questions` shows as open is exactly what defining refuses for.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

const SPEC_ID = "GT-01m0c0000000000000000000qs";

function fixture(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-questions-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", "."); git(root, "commit", "-m", "initial");
  if (attempt(root, ["init", "--json"]).status !== 0) throw new Error("init failed");
  mkdirSync(join(root, ".kotta/spec/glossary-terms"), { recursive: true });
  writeFileSync(join(root, ".kotta/spec/glossary-terms/asked-0000000qs.md"), [
    "---", `id: ${SPEC_ID}`, "form: glossary-term", "title: Asked", "---", "",
    "## Definition", "The question is asked.", "", "## Usage", "Questions fixture.", "", "## Non-examples", "An unasked question.", "",
  ].join("\n"));
  git(root, "add", "."); git(root, "commit", "-m", "workspace");
  return root;
}

/** A backlog task, and the definition source that would define it with the given Open decisions. */
function draft(root: string, title: string, openDecisions: string): { id: string; source: string } {
  const created = JSON.parse(say(attempt(root, ["task", "new", "--title", title, "--type", "feature", "--json"]))) as { data: { id: string; path: string } };
  const body = readFileSync(created.data.path, "utf8").split(/^---$/m).slice(2).join("---").replace(/^\n+/, "")
    .replace("Describe the observable outcome.", "The question is asked.")
    .replace("- Define an observable condition.", "- The question is asked.")
    .replace("- Explain how acceptance will be checked.", "- Run the questions test.")
    .replace("## Open decisions\n\nNone.", `## Open decisions\n\n${openDecisions}`);
  // Outside the repository: a stray file in the root is a dirty tree that later commands refuse.
  const source = join(mkdtempSync(join(tmpdir(), "kotta-questions-def-")), "definition.md");
  writeFileSync(source, `---\nspec:\n  - ${SPEC_ID}\ncoverage:\n  "The question is asked.":\n    - ${SPEC_ID}\n---\n\n${body}`);
  // Store the capture in place: a draft is where a question is written down before it is answered,
  // so the questions live in the task itself and not only in a file beside it.
  if (attempt(root, ["task", "define", created.data.id, "--draft", "--from", source, "--json"]).status !== 0) {
    throw new Error("draft failed");
  }
  return { id: created.data.id, source };
}

function recordDecision(root: string, title: string): string {
  const source = join(mkdtempSync(join(tmpdir(), "kotta-questions-dec-")), "decision.md");
  writeFileSync(source, `---\ntitle: ${title}\n---\n## Decision\n\nUse the first store.\n\n## Context\n\nThe question was put to the operator.\n\n## Consequences\n\nThe second store is not built.\n`);
  const created = JSON.parse(say(attempt(root, ["decision", "create", "--from", source, "--approve", "--json"]))) as { data: { id: string } };
  return created.data.id;
}

describe("an entity's open questions", () => {
  test("defining is refused by position, and the same questions are what the listing shows", () => {
    const root = fixture("refuse");
    const decision = recordDecision(root, "Adopt the first store");
    const { id, source } = draft(root, "Ship the exporter", [
      `- Which store? Settled by ${decision}.`,
      "- Which retention window?",
      "- Who pays for the egress?",
    ].join("\n"));

    const refused = attempt(root, ["task", "define", id, "--from", source]);
    expect(refused.status).not.toBe(0);
    const message = say(refused);
    expect(message).toContain("OPEN_DECISIONS");
    // The answered one is not named; the two still open are, by position and by what they ask.
    expect(message).toContain(`${id}/Q2`);
    expect(message).toContain("Which retention window?");
    expect(message).toContain(`${id}/Q3`);
    expect(message).not.toContain(`${id}/Q1`);

    const listed = openQuestions(id, root).data;
    expect(listed.entities).toHaveLength(1);
    expect(listed.total).toBe(3);
    expect(listed.open).toBe(2);
    const [entity] = listed.entities;
    expect(entity.blocksDefining).toBe(true);
    expect(entity.questions[0].resolved).toBe(true);
    expect(entity.questions[0].decisions).toEqual([decision]);
    // An answered question stays where it stood rather than being removed.
    expect(entity.questions.map((question) => question.position)).toEqual([1, 2, 3]);
    // And it is readable where the task is written.
    const written = readFileSync(join(root, entity.path), "utf8").split("\n");
    expect(written[entity.questions[1].line - 1]).toContain("Which retention window?");
  });

  test("answering the rest defines the task, and the answered questions stay in its text", () => {
    const root = fixture("answer");
    const first = recordDecision(root, "Adopt the first store");
    const second = recordDecision(root, "Keep a seven day window");
    const { id, source } = draft(root, "Ship the exporter", [
      `- Which store? Settled by ${first}.`,
      `- Which retention window? Settled by ${second}.`,
    ].join("\n"));

    expect(attempt(root, ["task", "define", id, "--from", source]).status).toBe(0);
    const listed = openQuestions(id, root).data;
    expect(listed.open).toBe(0);
    expect(listed.total).toBe(2);
    expect(listed.entities[0].blocksDefining).toBe(false);
    expect(listed.entities[0].questions.every((question) => question.resolved)).toBe(true);
  });

  test("a question naming a decision the workspace does not hold is not answered", () => {
    const root = fixture("phantom");
    const { id, source } = draft(root, "Ship the exporter", "- Which store? Settled by D-01m0c000000000000000000000.");
    const refused = attempt(root, ["task", "define", id, "--from", source]);
    expect(refused.status).not.toBe(0);
    expect(say(refused)).toContain("OPEN_DECISIONS");
  });

  test("the workspace-wide listing groups by entity and puts what blocks defining first", () => {
    const root = fixture("workspace");
    const decision = recordDecision(root, "Adopt the first store");
    const blocking = draft(root, "Ship the exporter", "- Which retention window?");
    const settled = draft(root, "Ship the importer", `- Which store? Settled by ${decision}.`);
    expect(attempt(root, ["task", "define", settled.id, "--from", settled.source]).status).toBe(0);

    const listed = openQuestions(undefined, root).data;
    expect(listed.entity).toBeNull();
    expect(listed.entities.map((entity) => entity.id)).toEqual([blocking.id, settled.id]);
    expect(listed.entities[0].blocksDefining).toBe(true);
    expect(listed.entities[1].blocksDefining).toBe(false);
    expect(listed.open).toBe(1);
    expect(listed.total).toBe(2);
  });

  test("every entity kind whose text carries the section is gathered, not tasks alone", () => {
    const root = fixture("kinds");
    const created = JSON.parse(say(attempt(root, ["observation", "new", "--title", "The exporter drops rows", "--type", "defect", "--evidence", "Row 42 is absent.", "--json"]))) as { data: { id: string; path: string } };
    writeFileSync(created.data.path, `${readFileSync(created.data.path, "utf8")}\n## Open decisions\n\n- Is dropping rows ever correct?\n`);

    const listed = openQuestions(undefined, root).data;
    expect(listed.entities.map((entity) => [entity.kind, entity.id])).toEqual([["observation", created.data.id]]);
    // An observation has no defining gate to block; the question is still surfaced.
    expect(listed.entities[0].blocksDefining).toBe(false);
    expect(listed.entities[0].questions[0].text).toBe("Is dropping rows ever correct?");
  });

  test("both surfaces read one parse: the CLI prints what the service returns", () => {
    const root = fixture("surface");
    const { id } = draft(root, "Ship the exporter", "- Which retention window?");
    const printed = attempt(root, ["questions", id]);
    expect(printed.status).toBe(0);
    expect(say(printed)).toContain("Q1");
    expect(say(printed)).toContain("Which retention window?");
    expect(say(printed)).toContain("blocks defining");

    const structured = JSON.parse(say(attempt(root, ["questions", id, "--json"]))) as { ok: boolean; command: string; data: { open: number } };
    expect(structured).toMatchObject({ ok: true, command: "questions" });
    expect(structured.data.open).toBe(1);

    // Reads write nothing.
    expect(git(root, "status", "--porcelain")).toBe("");
  });

  test("an entity that asks nothing says so rather than failing", () => {
    const root = fixture("silent");
    const { id } = draft(root, "Ship the exporter", "None.");
    expect(say(attempt(root, ["questions", id]))).toContain("asks no open question");
    expect(say(attempt(root, ["questions"]))).toContain("No entity asks an open question");
  });

  test("Kotta's own entities keep validating: none of them gains a question it did not write", () => {
    const root = resolve(".");
    // The property, not a snapshot of who asks what today: the parse invents nothing. An entity is
    // listed as asking exactly when its own section says something other than a denial, which is
    // the same text the literal check refused before this existed - so no entity in this
    // repository changed meaning when the gate started reading the enumeration.
    const denial = /^(?:none|n\/a|no open decisions)\.?$/i;
    const directory = join(root, ".kotta/process/tasks");
    for (const name of readdirSync(directory).filter((file) => file.endsWith(".md"))) {
      const content = readFileSync(join(directory, name), "utf8");
      const id = /^id:\s*(\S+)/m.exec(content)?.[1] ?? name;
      // Read the section independently of the parse under test: split on headings and take the body.
      const written = content.split(/^## /m).find((part) => /^Open decisions\s*$/m.test(part.split("\n")[0]))
        ?.split("\n").slice(1).join("\n").trim() ?? "";
      const asks = parseOpenQuestions(id, content).length > 0;
      expect(asks, `${name} asks ${asks ? "a question" : "nothing"} for: ${JSON.stringify(written.slice(0, 80))}`)
        .toBe(written !== "" && !denial.test(written));
    }
    expect(spawnSync("node", [cli, "validate"], { cwd: root, encoding: "utf8" }).status).toBe(0);
  });
});
