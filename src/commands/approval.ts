import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { closeBatch } from "./batch.js";
import { findBatch } from "../filesystem/batches.js";
import { cancelContract, closeContract, reopenContract, signContract } from "./contract.js";
import { findObservation, resolveObservation } from "./observation.js";
import { appendEvent, approvalHistory, mintApprovalId, readEvents, type KottaEvent } from "../core/events.js";
import { chatApprovalReceipt, type ApprovalReceipt } from "../core/approval-receipt.js";
import { CONTRACT_ID, OBSERVATION_ID, BATCH_ID } from "../core/identity.js";
import { findContract } from "../filesystem/entities.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { commitControlState, withControlPlaneMutation } from "../git/control-plane.js";

export const APPROVAL_ACTIONS = [
  "contract.sign",
  "observation.resolve",
  "contract.close",
  "contract.cancel",
  "contract.request-changes",
  "batch.close",
] as const;

export type ApprovalAction = typeof APPROVAL_ACTIONS[number];
export type ApprovalDecision = "approved" | "rejected" | "cancelled";

const ACTIONS = new Set<string>(APPROVAL_ACTIONS);
const OBSERVATION_DISPOSITIONS = new Set(["create-contract", "attach-existing", "investigate", "accept-risk", "reject", "merge-duplicate"]);
const CANCEL_RESOLUTIONS = new Set(["duplicate", "obsolete", "cancelled"]);
const SUPERSEDING_RESOLUTIONS = new Set(["duplicate", "obsolete"]);
/** Cancelling is the one gated action whose whole point is the payload: what ends, why, and what replaced it. */
const CANCEL_PAYLOAD_FIELDS = new Set(["resolution", "reason", "supersededBy"]);

function validateEntity(action: ApprovalAction, entity: string): void {
  const pattern = action.startsWith("contract.") ? CONTRACT_ID : action === "observation.resolve" ? OBSERVATION_ID : BATCH_ID;
  if (!pattern.test(entity)) throw new Error(`${action} requires the matching Kotta entity id.`);
}

function validatePayload(action: ApprovalAction, payload: Record<string, unknown>): void {
  if (action === "contract.cancel") {
    const resolution = typeof payload.resolution === "string" ? payload.resolution : "";
    if (!CANCEL_RESOLUTIONS.has(resolution)) throw new Error("contract.cancel requires one explicit valid resolution.");
    if (!(typeof payload.reason === "string" && payload.reason.trim())) throw new Error("contract.cancel requires a stated reason.");
    const supersededBy = typeof payload.supersededBy === "string" ? payload.supersededBy.trim() : "";
    if (SUPERSEDING_RESOLUTIONS.has(resolution) && !supersededBy) throw new Error(`Resolution '${resolution}' requires supersededBy naming the contract or decision that took this work's place.`);
    if (Object.keys(payload).some((key) => !CANCEL_PAYLOAD_FIELDS.has(key))) throw new Error("contract.cancel accepts only the resolution, reason and supersededBy payload.");
    return;
  }
  if (action === "observation.resolve") {
    const disposition = typeof payload.disposition === "string" ? payload.disposition : "";
    if (!OBSERVATION_DISPOSITIONS.has(disposition)) throw new Error("observation.resolve requires one explicit valid disposition.");
    if (Object.keys(payload).some((key) => key !== "disposition")) throw new Error("observation.resolve accepts only the scoped disposition payload.");
    return;
  }
  if (Object.keys(payload).length) throw new Error(`${action} does not accept an approval payload.`);
}

function relatedContract(root: string, entity: string, action: ApprovalAction): string | null {
  if (action.startsWith("contract.")) return entity;
  if (action === "observation.resolve") {
    const observation = findObservation(root, entity);
    const data = matter(readFileSync(observation.path, "utf8")).data;
    return typeof data.discovered_during === "string" && CONTRACT_ID.test(data.discovered_during) ? data.discovered_during : null;
  }
  return null;
}

export function approvalDescription(action: ApprovalAction, entity: string, payload: Record<string, unknown> = {}): string {
  if (action === "observation.resolve") return `${action} ${entity} --disposition ${String(payload.disposition)}`;
  if (action === "contract.cancel") {
    const superseded = typeof payload.supersededBy === "string" && payload.supersededBy.trim() ? ` --superseded-by ${payload.supersededBy.trim()}` : "";
    return `${action} ${entity} --resolution ${String(payload.resolution)}${superseded} --reason "${String(payload.reason)}"`;
  }
  return `${action} ${entity}`;
}

function assertApplicable(root: string, entity: string, action: ApprovalAction): void {
  if (action === "contract.cancel") {
    const state = findContract(root, entity).state;
    // Cancelling is the exception among the contract actions: it reaches the work wherever it
    // got to, and only a contract already at done has nothing left to retire.
    if (state === "done") throw new Error(`contract.cancel requires ${entity} to still be live; it is already done. Reopen it first if it must change.`);
    return;
  }
  if (action.startsWith("contract.")) {
    const state = findContract(root, entity).state;
    const expected = action === "contract.sign" ? "backlog" : "review";
    if (state !== expected) throw new Error(`${action} requires ${entity} to be ${expected}; it is ${state}. Refresh state before preparing another action.`);
    return;
  }
  if (action === "observation.resolve") {
    const state = findObservation(root, entity).state;
    if (state !== "new") throw new Error(`${entity} is already resolved.`);
    return;
  }
  const batch = findBatch(root, entity);
  const data = matter(readFileSync(batch.path, "utf8")).data as { contracts?: unknown[] };
  const open = (data.contracts ?? []).map(String).filter((id) => findContract(root, id).state !== "done");
  if (batch.state === "done" || open.length) throw new Error(`${entity} is not ready to close${open.length ? `; open contracts: ${open.join(", ")}` : ""}.`);
}

function apply(root: string, proposal: KottaEvent, receipt: ApprovalReceipt): unknown {
  const payload = proposal.payload ?? {};
  switch (proposal.action as ApprovalAction) {
    // Signing is not a receipt-carrying gate (the acceptance already landed when the spec did),
    // so it stays untouched; every other gated action stamps the chat receipt on its entity.
    case "contract.sign": return signContract(proposal.entity, true, root, { approvalRecorded: true, locked: true, commit: false });
    case "observation.resolve": return resolveObservation(proposal.entity, String(payload.disposition), true, root, { approvalRecorded: true, locked: true, commit: false, receipt });
    case "contract.close": return closeContract(proposal.entity, true, root, { locked: true, commit: false, approvalRecorded: true, receipt });
    case "contract.cancel": return cancelContract(proposal.entity, String(payload.resolution), String(payload.reason), true, root, {
      supersededBy: typeof payload.supersededBy === "string" ? payload.supersededBy : undefined,
      locked: true,
      commit: false,
      approvalRecorded: true,
      receipt,
    });
    case "contract.request-changes": return reopenContract(proposal.entity, true, root, { locked: true, commit: false, approvalRecorded: true, receipt });
    case "batch.close": return closeBatch(proposal.entity, true, root, { skipClean: true, commit: false, approvalRecorded: true, receipt });
  }
}

export interface ApprovalProposalResult {
  ok: true;
  command: "approval propose";
  data: { event: KottaEvent; created: boolean; description: string };
}

export function proposeApproval(options: {
  entity: string;
  action: string;
  payload?: Record<string, unknown>;
  clientRequestId?: string;
}, repositoryRoot?: string): ApprovalProposalResult {
  if (!ACTIONS.has(options.action)) throw new Error(`Unsupported approval action '${options.action}'.`);
  const action = options.action as ApprovalAction;
  const payload = options.payload ?? {};
  validateEntity(action, options.entity);
  validatePayload(action, payload);
  return withControlPlaneMutation(repositoryRoot ?? findRepositoryRoot(), (root) => {
    const existing = options.clientRequestId
      ? readEvents(root, options.entity).find((event) => event.kind === "approval" && event.client_event_id === options.clientRequestId)
      : undefined;
    if (existing) return { ok: true, command: "approval propose", data: { event: existing, created: false, description: approvalDescription(action, options.entity, payload) } };
    assertApplicable(root, options.entity, action);
    const events = readEvents(root, options.entity);
    const pending = events.find((candidate) => candidate.kind === "approval" && candidate.phase === "proposed"
      && !events.some((later) => later.kind === "approval" && later.approval_id === candidate.approval_id && later.phase !== "proposed"));
    if (pending) throw new Error(`${options.entity} already has a pending approval: ${pending.action}. Resolve it before preparing another action.`);
    const approvalId = mintApprovalId();
    const result = appendEvent(root, {
      id: approvalId,
      entity: options.entity,
      contract: relatedContract(root, options.entity, action),
      kind: "approval",
      approval_id: approvalId,
      phase: "proposed",
      action,
      payload: { ...payload, surface: "caller-chat" },
      source_message: null,
      client_event_id: options.clientRequestId ?? null,
    });
    commitControlState(root, `chore(kotta): propose ${action} for ${options.entity}`);
    return { ok: true, command: "approval propose", data: { event: result.event, created: result.created, description: approvalDescription(action, options.entity, payload) } };
  }, { requireClean: false });
}

export interface ApprovalDecisionResult {
  ok: true;
  command: "approval decide";
  data: { event: KottaEvent; result: unknown | null; alreadyDecided: boolean };
}

export function failApproval(approvalId: string, error: string, repositoryRoot?: string): KottaEvent {
  return withControlPlaneMutation(repositoryRoot ?? findRepositoryRoot(), (root) => {
    const events = readEvents(root);
    const proposal = events.find((event) => event.kind === "approval" && event.phase === "proposed" && event.approval_id === approvalId);
    if (!proposal) throw new Error(`Approval ${approvalId} was not found.`);
    const history = approvalHistory(events, approvalId);
    const terminal = history.find((event) => ["applied", "rejected", "cancelled", "failed"].includes(String(event.phase)));
    if (terminal) return terminal;
    const failed = appendEvent(root, {
      entity: proposal.entity,
      contract: proposal.contract,
      kind: "approval",
      approval_id: approvalId,
      phase: "failed",
      action: proposal.action,
      payload: proposal.payload,
      source_message: null,
      error,
    }).event;
    commitControlState(root, `chore(kotta): record failed ${proposal.action} for ${proposal.entity}`);
    return failed;
  }, { requireClean: false });
}

export function decideApproval(options: {
  approvalId: string;
  decision: ApprovalDecision;
  sourceText: string;
}, repositoryRoot?: string): ApprovalDecisionResult {
  if (!options.sourceText.trim()) throw new Error("A visible human response is required for an approval decision.");
  return withControlPlaneMutation(repositoryRoot ?? findRepositoryRoot(), (root) => {
    const events = readEvents(root);
    const proposal = events.find((event) => event.kind === "approval" && event.phase === "proposed" && event.approval_id === options.approvalId);
    if (!proposal || !ACTIONS.has(String(proposal.action))) throw new Error(`Approval ${options.approvalId} was not found.`);
    const history = approvalHistory(events, options.approvalId);
    const terminal = history.find((event) => ["applied", "rejected", "cancelled", "failed"].includes(String(event.phase)));
    if (terminal) return { ok: true, command: "approval decide", data: { event: terminal, result: null, alreadyDecided: true } };

    const human = appendEvent(root, {
      entity: proposal.entity,
      contract: proposal.contract,
      kind: "message",
      role: "human",
      text: options.sourceText.trim(),
    }).event;
    const decision = appendEvent(root, {
      entity: proposal.entity,
      contract: proposal.contract,
      kind: "approval",
      approval_id: options.approvalId,
      phase: options.decision,
      action: proposal.action,
      payload: proposal.payload,
      source_message: human.id,
    }).event;

    if (options.decision !== "approved") {
      commitControlState(root, `chore(kotta): ${options.decision === "rejected" ? "reject" : "cancel"} ${proposal.action} for ${proposal.entity}`);
      return { ok: true, command: "approval decide", data: { event: decision, result: null, alreadyDecided: false } };
    }

    try {
      const receipt = chatApprovalReceipt(String(proposal.action), human.id);
      const appliedResult = apply(root, proposal, receipt);
      const applied = appendEvent(root, {
        entity: proposal.entity,
        contract: proposal.contract,
        kind: "approval",
        approval_id: options.approvalId,
        phase: "applied",
        action: proposal.action,
        payload: proposal.payload,
        source_message: human.id,
      }).event;
      commitControlState(root, `chore(kotta): approve ${proposal.action} for ${proposal.entity}`);
      return { ok: true, command: "approval decide", data: { event: applied, result: appliedResult, alreadyDecided: false } };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const failed = appendEvent(root, {
        entity: proposal.entity,
        contract: proposal.contract,
        kind: "approval",
        approval_id: options.approvalId,
        phase: "failed",
        action: proposal.action,
        payload: proposal.payload,
        source_message: human.id,
        error: message,
      }).event;
      commitControlState(root, `chore(kotta): record failed ${proposal.action} for ${proposal.entity}`);
      throw Object.assign(new Error(message), { event: failed });
    }
  }, { requireClean: false });
}
