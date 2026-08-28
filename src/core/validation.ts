import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import { PROFILE_REQUIREMENTS } from "./profiles.js";
import { TASK_ID, filenameMatchesId } from "./identity.js";
import { TASK_STATES } from "../filesystem/entities.js";
import { parseMarkdown, sections, subsections } from "./markdown.js";
import { receiptErrors } from "./approval-receipt.js";
import { acceptanceConditions } from "./coverage.js";
import { parseOpenQuestions, unresolvedQuestions } from "./questions.js";

export interface ValidationIssue { code: string; message: string; path?: string }
export interface ValidationReport { valid: boolean; errors: ValidationIssue[] }

const COMMON_SECTIONS = ["Outcome", "Scope", "Non-goals", "Acceptance", "Verification", "Constraints", "Open decisions", "Execution notes"];

// Lifecycle state lives in the frontmatter status field alone, so a value outside the lifecycle
// means the task is in no state at all. One list, imported: "kept in lockstep" was the arrangement
// this rule exists to end (BR-01m0sj2f8mxydc7zxz6y8xn6b1).
const TASK_STATE_VALUES: readonly string[] = TASK_STATES;

// F-019: the structured Deviations field stays "None."/"Not declared." while the narrative names deviations.
const UNDECLARED_DEVIATIONS = /^(?:none|not declared)\.?$/i;
const DEVIATION_MARKER = /devi[áa]ci|deviation/i;
// A narrative that denies deviations agrees with the field; drop those phrases before looking for a mention.
const DENIED_DEVIATION = /\b(?:no|zero|without(?: any)?)\s+deviations?\b|(?:nincs(?:enek)?|nem\s+volt(?:ak)?)\s+(?:\S+\s+){0,2}devi[áa]ci\w*|devi[áa]ci\w*\s+(?:nincs(?:enek)?|nem\s+volt(?:ak)?)/gi;

function values(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
}

function validateTask(path: string, expectedState?: string, requireDefinition = false, decisionExists?: (id: string) => boolean): ValidationReport {
  const errors: ValidationIssue[] = [];
  if (!existsSync(path)) return { valid: false, errors: [{ code: "NOT_FOUND", message: `Task not found: ${path}`, path }] };
  let entity;
  try { entity = parseMarkdown(readFileSync(path, "utf8")); }
  catch (error) { return { valid: false, errors: [{ code: "INVALID_FRONTMATTER", message: String(error), path }] }; }
  const id = String(entity.data.id ?? "");
  if (!TASK_ID.test(id)) errors.push({ code: "INVALID_ID", message: "Task id must be a minted id such as T-01k1n0h5q7zv3m8b4d6xr2ptcw, a sequential T-001, or an imported O-1 identifier.", path });
  if (!filenameMatchesId(basename(path), id)) errors.push({ code: "FILENAME_ID_MISMATCH", message: "Filename must start with the task id, or end with its short id suffix.", path });
  for (const issue of receiptErrors(entity.data)) errors.push({ ...issue, path });
  const state = String(entity.data.status ?? "");
  if (!TASK_STATE_VALUES.includes(state)) errors.push({ code: "INVALID_STATE", message: `status '${state}' is not a task state (${TASK_STATE_VALUES.join(", ")}).`, path });
  if (expectedState && state !== expectedState) errors.push({ code: "WRONG_STATE", message: `Expected task state '${expectedState}', found '${state}'.`, path });
  const bodySections = sections(entity.content);
  if (state !== "backlog" || requireDefinition) for (const heading of COMMON_SECTIONS) {
      const body = bodySections.get(heading.toLowerCase());
      if (body === undefined || body.trim() === "") errors.push({ code: "MISSING_SECTION", message: `Missing or empty section: ${heading}.`, path });
    }
  for (const profile of values(entity.data.profiles)) {
    const required = PROFILE_REQUIREMENTS[profile];
    if (!required) {
      errors.push({ code: "UNKNOWN_PROFILE", message: `Unknown profile: ${profile}.`, path });
      continue;
    }
    if (state === "backlog" && !requireDefinition) continue;
    for (const heading of required) {
      const body = bodySections.get(heading.toLowerCase());
      if (body === undefined || body.trim() === "") errors.push({ code: "MISSING_PROFILE_SECTION", message: `Profile '${profile}' requires section: ${heading}.`, path });
    }
  }
  // The gate reads the enumeration and nothing else (BR-01m0z873stwx7szg5896gwsbry): no questions
  // passes, every question naming an existing decision passes, and anything still open is refused
  // by the position that addresses it rather than as an undifferentiated section.
  if (state === "defined") {
    const open = unresolvedQuestions(parseOpenQuestions(id, entity.content, decisionExists));
    if (open.length) {
      const named = open.map((question) => `${question.reference}: ${question.text}`).join("; ");
      errors.push({
        code: "OPEN_DECISIONS",
        message: `A defined task carries no unresolved question. Still open — ${named}. Answer each in conversation and name the decision that settled it, or say 'None.' if none remain.`,
        path,
      });
    }
  }
  const cancelled = state === "done" && ["cancelled", "duplicate", "obsolete"].includes(String(entity.data.resolution));
  if (["review", "done"].includes(state) && !cancelled && !bodySections.get("review evidence")?.trim()) errors.push({ code: "MISSING_REVIEW_EVIDENCE", message: `${state} task requires review evidence.`, path });
  if (state === "done" && !["completed", "cancelled", "duplicate", "obsolete"].includes(String(entity.data.resolution))) errors.push({ code: "MISSING_RESOLUTION", message: "Done task requires a final resolution.", path });
  if (state === "done" && !cancelled) {
    const declarations = subsections(bodySections.get("review evidence") ?? "");
    if (UNDECLARED_DEVIATIONS.test((declarations.get("deviations") ?? "").trim())) {
      // Review evidence is stored as `<acceptance condition>: <evidence>`, so every condition text
      // lands inside the section this scans. Reading it whole made a task about deviations
      // impossible to validate — its own subject read as its confession
      // (F-01m14h0t8ehy2yc37y8tn71ete). The conditions are stripped first, by the same list
      // coverage parses, so what is left is what the agent wrote about the run.
      const conditions = acceptanceConditions(entity.content);
      // A declared command is machine evidence — executed at submission and receipted with its exit
      // status (BR-01m0m33yxt2vqxb3jvqc186ssy) — not the agent's account of the run, which is what
      // this check reads. Scanning it read a test filename as a confession
      // (F-01m14kfk04mj4dbwzy2ba65js0).
      const written = (line: string) => conditions
        .reduce((rest, condition) => rest.split(condition).join(" "), line)
        .replace(/\brun:\s.*$/, " ");
      const quoted = (declarations.get("verification performed") ?? "").split(/\r?\n/)
        .find((line) => DEVIATION_MARKER.test(written(line).replace(DENIED_DEVIATION, "")));
      if (quoted) errors.push({ code: "DEVIATION_MISMATCH", message: `${id} declares no deviations while the verification narrative names one: "${quoted.trim().slice(0, 120)}".`, path });
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * `decisionExists` answers whether a decision a question names is actually recorded. Callers that
 * hold a workspace root pass it; without one a well-formed reference is taken at face value, and
 * every call site inside Kotta holds one.
 */
export function validateTaskFile(path: string, expectedState?: string, decisionExists?: (id: string) => boolean): ValidationReport {
  return validateTask(path, expectedState, false, decisionExists);
}

export function validateTaskDefinitionFile(path: string, decisionExists?: (id: string) => boolean): ValidationReport {
  return validateTask(path, "backlog", true, decisionExists);
}

export function assertValid(report: ValidationReport): void {
  if (!report.valid) throw new Error(report.errors.map((error) => `${error.code}: ${error.message}`).join("\n"));
}
