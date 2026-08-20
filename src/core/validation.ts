import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { PROFILE_REQUIREMENTS } from "./profiles.js";
import { TASK_ID, filenameMatchesId } from "./identity.js";
import { parseMarkdown, sections, subsections } from "./markdown.js";
import { receiptErrors } from "./approval-receipt.js";

export interface ValidationIssue { code: string; message: string; path?: string }
export interface ValidationReport { valid: boolean; errors: ValidationIssue[] }

const COMMON_SECTIONS = ["Outcome", "Scope", "Non-goals", "Acceptance", "Verification", "Constraints", "Open decisions", "Execution notes"];

// F-019: the structured Deviations field stays "None."/"Not declared." while the narrative names deviations.
const UNDECLARED_DEVIATIONS = /^(?:none|not declared)\.?$/i;
const DEVIATION_MARKER = /devi[áa]ci|deviation/i;
// A narrative that denies deviations agrees with the field; drop those phrases before looking for a mention.
const DENIED_DEVIATION = /\b(?:no|zero|without(?: any)?)\s+deviations?\b|(?:nincs(?:enek)?|nem\s+volt(?:ak)?)\s+(?:\S+\s+){0,2}devi[áa]ci\w*|devi[áa]ci\w*\s+(?:nincs(?:enek)?|nem\s+volt(?:ak)?)/gi;

function values(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
}

function validateTask(path: string, expectedState?: string, requireDefinition = false): ValidationReport {
  const errors: ValidationIssue[] = [];
  if (!existsSync(path)) return { valid: false, errors: [{ code: "NOT_FOUND", message: `Task not found: ${path}`, path }] };
  let entity;
  try { entity = parseMarkdown(readFileSync(path, "utf8")); }
  catch (error) { return { valid: false, errors: [{ code: "INVALID_FRONTMATTER", message: String(error), path }] }; }
  const id = String(entity.data.id ?? "");
  if (!TASK_ID.test(id)) errors.push({ code: "INVALID_ID", message: "Task id must be a minted id such as T-01k1n0h5q7zv3m8b4d6xr2ptcw, a sequential T-001, or an imported O-1 identifier.", path });
  if (!filenameMatchesId(basename(path), id)) errors.push({ code: "FILENAME_ID_MISMATCH", message: "Filename must start with the task id, or end with its short id suffix.", path });
  for (const issue of receiptErrors(entity.data)) errors.push({ ...issue, path });
  const directoryState = basename(dirname(path));
  const state = String(entity.data.status ?? "");
  if (state !== directoryState) errors.push({ code: "STATE_MISMATCH", message: `status '${state}' does not match directory '${directoryState}'.`, path });
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
  const openDecisions = bodySections.get("open decisions")?.trim() ?? "";
  if (state === "defined" && !/^(?:none|n\/a|no open decisions)\.?$/i.test(openDecisions)) {
    errors.push({ code: "OPEN_DECISIONS", message: "A defined task must say that no decisions remain open (for example 'None.').", path });
  }
  const cancelled = state === "done" && ["cancelled", "duplicate", "obsolete"].includes(String(entity.data.resolution));
  if (["review", "done"].includes(state) && !cancelled && !bodySections.get("review evidence")?.trim()) errors.push({ code: "MISSING_REVIEW_EVIDENCE", message: `${state} task requires review evidence.`, path });
  if (state === "done" && !["completed", "cancelled", "duplicate", "obsolete"].includes(String(entity.data.resolution))) errors.push({ code: "MISSING_RESOLUTION", message: "Done task requires a final resolution.", path });
  if (state === "done" && !cancelled) {
    const declarations = subsections(bodySections.get("review evidence") ?? "");
    if (UNDECLARED_DEVIATIONS.test((declarations.get("deviations") ?? "").trim())) {
      const quoted = (declarations.get("verification performed") ?? "").split(/\r?\n/).find((line) => DEVIATION_MARKER.test(line.replace(DENIED_DEVIATION, "")));
      if (quoted) errors.push({ code: "DEVIATION_MISMATCH", message: `${id} declares no deviations while the verification narrative names one: "${quoted.trim().slice(0, 120)}".`, path });
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateTaskFile(path: string, expectedState?: string): ValidationReport {
  return validateTask(path, expectedState);
}

export function validateTaskDefinitionFile(path: string): ValidationReport {
  return validateTask(path, "backlog", true);
}

export function assertValid(report: ValidationReport): void {
  if (!report.valid) throw new Error(report.errors.map((error) => `${error.code}: ${error.message}`).join("\n"));
}
