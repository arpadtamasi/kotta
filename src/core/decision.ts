import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { DECISION_ID } from "./identity.js";
import { parseMarkdown, renderMarkdown, sections } from "./markdown.js";
import { RECEIPT_FIELDS, receiptErrors, type ApprovalReceipt } from "./approval-receipt.js";

export interface DecisionDraft {
  id: string;
  title: string;
  date: string;
  decision: string;
  context: string;
  consequences: string;
  /** The approval receipt stamped by `decision create`; absent on records that predate receipts. */
  receipt?: ApprovalReceipt;
}

export interface DecisionValidationIssue {
  code: string;
  message: string;
  path?: string;
}

const DECISION_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Fields a human may author in a decision source: the receipt is stamped by the command, never here. */
const DECISION_FIELDS = new Set(["id", "title", "date"]);
/** Fields a stored decision record may carry: the source fields plus the approval receipt. */
const DECISION_STORED_FIELDS = new Set([...DECISION_FIELDS, ...RECEIPT_FIELDS]);
const DECISION_SECTIONS = ["Decision", "Context", "Consequences"] as const;

function isValidDate(value: string): boolean {
  if (!DECISION_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function sourceDate(value: unknown, fallback: string): string {
  if (value === undefined) return fallback;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  return String(value);
}

export function decisionDraftFromSource(source: string, id: string, date: string): DecisionDraft {
  const entity = parseMarkdown(source);
  const unknown = Object.keys(entity.data).filter((field) => !DECISION_FIELDS.has(field));
  if (unknown.length) throw new Error(`Unsupported decision fields: ${unknown.join(", ")}.`);
  if (entity.data.id !== undefined && String(entity.data.id) !== id) {
    throw new Error(`Decision source id '${String(entity.data.id)}' does not match ${id}.`);
  }
  const body = sections(entity.content);
  return {
    id,
    title: String(entity.data.title ?? "").trim(),
    date: sourceDate(entity.data.date, date),
    decision: body.get("decision")?.trim() ?? "",
    context: body.get("context")?.trim() ?? "",
    consequences: body.get("consequences")?.trim() ?? "",
  };
}

export function validateDecision(draft: DecisionDraft, path?: string): DecisionValidationIssue[] {
  const errors: DecisionValidationIssue[] = [];
  if (!DECISION_ID.test(draft.id)) errors.push({ code: "INVALID_DECISION_ID", message: "Decision id must be a minted id such as D-01k1n0h5q7zv3m8b4d6xr2ptcw, or a sequential D-001.", path });
  if (!draft.title) errors.push({ code: "MISSING_DECISION_TITLE", message: "Decision title is required.", path });
  if (!isValidDate(draft.date)) {
    errors.push({ code: "INVALID_DECISION_DATE", message: "Decision date must be a valid YYYY-MM-DD date.", path });
  }
  for (const section of DECISION_SECTIONS) {
    const value = draft[section.toLowerCase() as "decision" | "context" | "consequences"];
    if (!value) errors.push({ code: "MISSING_DECISION_SECTION", message: `Missing or empty section: ${section}.`, path });
  }
  return errors;
}

export function renderDecision(draft: DecisionDraft): string {
  const data: Record<string, unknown> = { id: draft.id, title: draft.title, date: draft.date };
  if (draft.receipt) {
    data.approved_by = draft.receipt.approved_by;
    data.approved_at = draft.receipt.approved_at;
    data.approval_basis = draft.receipt.approval_basis;
  }
  return renderMarkdown(
    data,
    `# ${draft.id} — ${draft.title}\n\n## Decision\n\n${draft.decision}\n\n## Context\n\n${draft.context}\n\n## Consequences\n\n${draft.consequences}\n`,
  );
}

export function validateDecisionFile(path: string): DecisionValidationIssue[] {
  try {
    const entity = parseMarkdown(readFileSync(path, "utf8"));
    const body = sections(entity.content);
    const draft: DecisionDraft = {
      id: String(entity.data.id ?? ""),
      title: String(entity.data.title ?? "").trim(),
      date: sourceDate(entity.data.date, ""),
      decision: body.get("decision")?.trim() ?? "",
      context: body.get("context")?.trim() ?? "",
      consequences: body.get("consequences")?.trim() ?? "",
    };
    const errors = validateDecision(draft, path);
    const unknown = Object.keys(entity.data).filter((field) => !DECISION_STORED_FIELDS.has(field));
    if (unknown.length) errors.push({ code: "UNKNOWN_DECISION_FIELD", message: `Unsupported decision fields: ${unknown.join(", ")}.`, path });
    errors.push(...receiptErrors(entity.data).map((issue) => ({ ...issue, path })));
    if (basename(path) !== `${draft.id}.md`) {
      errors.push({ code: "DECISION_FILENAME_MISMATCH", message: `Decision filename must be ${draft.id}.md.`, path });
    }
    return errors;
  } catch (error) {
    return [{ code: "MALFORMED_DECISION", message: `Malformed decision record: ${error instanceof Error ? error.message : String(error)}`, path }];
  }
}
