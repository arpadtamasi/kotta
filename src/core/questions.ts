/**
 * An open question names the answer it waits for (BR-01m0z873stwx7szg5896gwsbry).
 *
 * One reader for the undecided points an entity carries, shared by the defining gate, both
 * command surfaces and the board, so the four can never disagree about what an entity is asking.
 * A question is an item under the entity's `Open decisions` heading; it is answered by naming the
 * decision record that settled it, and an answered question stays where it stood.
 */
import { MINTED_BODY_LENGTH } from "./identity.js";

/** The literal denials a form's `Open decisions` section may carry: the empty enumeration. */
const DENIAL = /^(?:none|n\/a|no open decisions)\.?$/i;
/** A list item at the top level of the section. Deeper indentation continues the item above it. */
const ITEM = /^ {0,3}(?:[-*+]|\d+[.)])\s+(.*)$/;
/** Decision references, in the minted and the sequential form alike (D-010 keeps both valid). */
const DECISION_REFERENCE = new RegExp(`\\bD-(?:\\d{3,}|[0-9a-hjkmnp-tv-z]{${MINTED_BODY_LENGTH}})\\b`, "g");

export interface OpenQuestion {
  /** 1-based position in the entity's list, in document order. */
  position: number;
  /** How a human addresses it: the entity's id and the position, `T-024/Q2`. */
  reference: string;
  /** The question as written, list marker and continuation lines folded into one line. */
  text: string;
  /** 1-based line in the entity file where the question starts. */
  line: number;
  /** Decision records the question names; a non-empty list is what makes it answered. */
  decisions: string[];
  /** Answered: it names at least one decision, and every decision it names exists. */
  resolved: boolean;
}

/** Locates one `## ` section and reports where its body starts, which `sections()` does not. */
function locateSection(content: string, heading: string): { body: string[]; start: number } | undefined {
  const lines = content.split(/\r?\n/);
  const wanted = heading.toLowerCase();
  let fenced = false;
  let start: number | undefined;
  const body: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s*```/.test(line)) fenced = !fenced;
    const match = fenced ? null : /^##\s+(.+?)\s*$/.exec(line);
    if (match) {
      if (start !== undefined) break;
      if (match[1].trim().toLowerCase() === wanted) start = index + 1;
      continue;
    }
    if (start !== undefined) body.push(line);
  }
  return start === undefined ? undefined : { body, start };
}

function fold(lines: string[]): string {
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

function decisionsIn(text: string): string[] {
  return [...new Set(text.match(DECISION_REFERENCE) ?? [])];
}

/**
 * The questions an entity asks, in document order.
 *
 * A section that denies open questions is the empty enumeration, and so is an absent or blank
 * section. A section of list items is one question per top-level item. A section of prose that
 * denies nothing is one question — the whole block — because that is what it is: a point still
 * open, written the way entities wrote them before there was a list to write them in.
 */
export function parseOpenQuestions(entityId: string, content: string, decisionExists: (id: string) => boolean = () => true): OpenQuestion[] {
  const located = locateSection(content, "open decisions");
  if (!located) return [];
  const trimmed = fold(located.body);
  if (trimmed === "" || DENIAL.test(trimmed)) return [];

  const raw: Array<{ lines: string[]; line: number }> = [];
  for (let index = 0; index < located.body.length; index += 1) {
    const line = located.body[index];
    const item = ITEM.exec(line);
    if (item) {
      raw.push({ lines: [item[1]], line: located.start + index + 1 });
    } else if (raw.length && line.trim() !== "") {
      raw[raw.length - 1].lines.push(line.trim());
    } else if (!raw.length && line.trim() !== "") {
      raw.push({ lines: [line.trim()], line: located.start + index + 1 });
    }
  }

  return raw.map((entry, index) => {
    const text = fold(entry.lines);
    const decisions = decisionsIn(text);
    return {
      position: index + 1,
      reference: `${entityId}/Q${index + 1}`,
      text,
      line: entry.line,
      decisions,
      resolved: decisions.length > 0 && decisions.every(decisionExists),
    };
  });
}

/** The questions that still block: everything the gate refuses a definition for. */
export function unresolvedQuestions(questions: readonly OpenQuestion[]): OpenQuestion[] {
  return questions.filter((question) => !question.resolved);
}
