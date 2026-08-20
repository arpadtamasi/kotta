import { readEnv } from "./env.js";

/**
 * The receipt an approval-carrying mutation stamps on the entity it approved (BR-…gates,
 * D-009 / T-…receipt). The gate stops being ceremony: after the fact the record shows that an
 * approval happened, who gave it, and on what basis — which is what makes a chat-relayed approval
 * auditable. It records the *claimed* basis; it does not authenticate who typed a terminal command.
 */
export interface ApprovalReceipt {
  approved_by: string;
  approved_at: string;
  approval_basis: string;
}

/** The three receipt fields, in the order they are written and validated. */
export const RECEIPT_FIELDS = ["approved_by", "approved_at", "approval_basis"] as const;

/** An explicit claimed approver (`KOTTA_APPROVER`), else the surface's honest default. */
function claimedApprover(fallback: string): string {
  const claimed = readEnv("APPROVER");
  return claimed && claimed.trim() ? claimed.trim() : fallback;
}

/**
 * CLI `--approve` fallback: an explicit terminal action, not an authenticated chat yes. The basis
 * names the surface and the action; the approver is a claim, overridable with `KOTTA_APPROVER`.
 */
export function cliApprovalReceipt(action: string, now: Date = new Date()): ApprovalReceipt {
  return {
    approved_by: claimedApprover("cli"),
    approved_at: now.toISOString(),
    approval_basis: `CLI --approve: ${action}`,
  };
}

/**
 * Caller-chat approval: the basis links back to the recorded visible human message (the "yes"),
 * so the receipt is auditable against the conversation that produced it.
 */
export function chatApprovalReceipt(action: string, sourceMessageId: string, now: Date = new Date()): ApprovalReceipt {
  return {
    approved_by: claimedApprover("caller-chat"),
    approved_at: now.toISOString(),
    approval_basis: `caller-chat yes (${sourceMessageId}): ${action}`,
  };
}

/** Write the receipt onto an entity's frontmatter, in the canonical field order. */
export function stampReceipt(data: Record<string, unknown>, receipt: ApprovalReceipt): void {
  data.approved_by = receipt.approved_by;
  data.approved_at = receipt.approved_at;
  data.approval_basis = receipt.approval_basis;
}

function isSet(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

/**
 * A receipt is all-or-nothing. Entities approved before receipts existed carry none of the three
 * fields and stay legal history (the constraint: absence is not an error); a record that carries
 * some but not all, or a malformed timestamp, is a real inconsistency the gate would never write.
 */
export function receiptErrors(data: Record<string, unknown>): Array<{ code: string; message: string }> {
  const present = RECEIPT_FIELDS.filter((field) => isSet(data[field]));
  if (present.length === 0) return [];
  const errors: Array<{ code: string; message: string }> = [];
  const missing = RECEIPT_FIELDS.filter((field) => !present.includes(field));
  if (missing.length) {
    errors.push({ code: "INCOMPLETE_APPROVAL_RECEIPT", message: `An approval receipt must carry ${RECEIPT_FIELDS.join(", ")}; missing ${missing.join(", ")}.` });
  }
  if (isSet(data.approved_at) && !Number.isFinite(Date.parse(String(data.approved_at)))) {
    errors.push({ code: "INVALID_APPROVAL_RECEIPT", message: "approved_at must be an ISO timestamp." });
  }
  return errors;
}
