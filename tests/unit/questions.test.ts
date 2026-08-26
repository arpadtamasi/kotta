import { describe, expect, test } from "vitest";
import { parseOpenQuestions, unresolvedQuestions } from "../../src/core/questions.js";

/**
 * An open question names the answer it waits for (BR-01m0z873stwx7szg5896gwsbry).
 *
 * One parse serves the defining gate, both surfaces and the board, so everything the gate refuses
 * for and everything a listing shows is decided here.
 */

const body = (openDecisions: string) => `# T-001 — A task\n\n## Outcome\n\nSomething.\n\n## Open decisions\n\n${openDecisions}\n\n## Execution notes\n\nNone.\n`;
const exists = (id: string) => id === "D-01m0c000000000000000000000";

describe("parseOpenQuestions", () => {
  test("a denial is the empty enumeration, in every spelling the form accepts", () => {
    for (const denial of ["None.", "none", "N/A", "n/a.", "No open decisions", "No open decisions."]) {
      expect(parseOpenQuestions("T-001", body(denial))).toEqual([]);
    }
  });

  test("a blank or absent section asks nothing", () => {
    expect(parseOpenQuestions("T-001", body(""))).toEqual([]);
    expect(parseOpenQuestions("T-001", "# T-001 — A task\n\n## Outcome\n\nSomething.\n")).toEqual([]);
  });

  test("each top-level item is one question, addressed by its position", () => {
    const questions = parseOpenQuestions("T-001", body("- Which store?\n- Which retention?\n- Who pays?"));
    expect(questions.map((question) => [question.reference, question.text])).toEqual([
      ["T-001/Q1", "Which store?"],
      ["T-001/Q2", "Which retention?"],
      ["T-001/Q3", "Who pays?"],
    ]);
    expect(questions.every((question) => !question.resolved)).toBe(true);
  });

  test("ordered and starred lists count the same, and continuation lines fold into their item", () => {
    const questions = parseOpenQuestions("T-001", body("1. Which store?\n   Postgres or the filesystem.\n2) Which retention?\n* Who pays?"));
    expect(questions).toHaveLength(3);
    expect(questions[0].text).toBe("Which store? Postgres or the filesystem.");
  });

  test("a question naming a recorded decision is answered; naming an unrecorded one is not", () => {
    const content = body("- Which store? Settled by D-01m0c000000000000000000000.\n- Which retention?");
    const questions = parseOpenQuestions("T-001", content, exists);
    expect(questions[0].resolved).toBe(true);
    expect(questions[0].decisions).toEqual(["D-01m0c000000000000000000000"]);
    expect(questions[1].resolved).toBe(false);
    expect(unresolvedQuestions(questions).map((question) => question.reference)).toEqual(["T-001/Q2"]);

    const unrecorded = parseOpenQuestions("T-001", body("- Which store? Settled by D-01m0c000000000000000000010."), exists);
    expect(unrecorded[0].resolved).toBe(false);
  });

  test("the sequential decision form stays a reference forever", () => {
    const questions = parseOpenQuestions("T-001", body("- Which store? See D-010."), (id) => id === "D-010");
    expect(questions[0].decisions).toEqual(["D-010"]);
    expect(questions[0].resolved).toBe(true);
  });

  test("prose that denies nothing is one question, because that is what it is", () => {
    const questions = parseOpenQuestions("T-001", body("We still do not know which store to use.\nBoth are defensible."));
    expect(questions).toHaveLength(1);
    expect(questions[0].text).toBe("We still do not know which store to use. Both are defensible.");
  });

  test("a question carries the line it is written on, so a reader can open it", () => {
    const questions = parseOpenQuestions("T-001", body("- Which store?\n- Which retention?"));
    const lines = body("- Which store?\n- Which retention?").split("\n");
    expect(lines[questions[0].line - 1]).toBe("- Which store?");
    expect(lines[questions[1].line - 1]).toBe("- Which retention?");
  });

  test("a heading inside a fenced block does not open a section", () => {
    const content = "# T-001\n\n## Outcome\n\n```\n## Open decisions\n\n- Not a question.\n```\n\n## Open decisions\n\nNone.\n";
    expect(parseOpenQuestions("T-001", content)).toEqual([]);
  });

  test("answering a question moves no other question's position", () => {
    const before = parseOpenQuestions("T-001", body("- Which store?\n- Which retention?"), exists);
    const after = parseOpenQuestions("T-001", body("- Which store? Settled by D-01m0c000000000000000000000.\n- Which retention?"), exists);
    expect(after[1].reference).toBe(before[1].reference);
    expect(after[1].text).toBe(before[1].text);
  });
});
