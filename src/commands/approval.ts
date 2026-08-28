import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { closeBatch } from "./batch.js";
import { findDecision, recordDecision } from "./decision.js";
import { findBatch } from "../filesystem/batches.js";
import { cancelTask, closeTask, reopenTask } from "./task.js";
import { OBSERVATION_DISPOSITIONS as DISPOSITION_VALUES, findObservation, resolveObservation } from "./observation.js";
import { appendEvent, approvalHistory, mintApprovalId, readEvents, type KottaEvent } from "../core/events.js";
import { chatApprovalReceipt, type ApprovalReceipt } from "../core/approval-receipt.js";
import { TASK_ID, OBSERVATION_ID, BATCH_ID, DECISION_ID, mintId } from "../core/identity.js";
import { entityTitleById, findTask } from "../filesystem/entities.js";
import { named } from "../core/naming.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { commitControlState, withControlPlaneMutation } from "../git/control-plane.js";

export const APPROVAL_ACTIONS = [
  "observation.resolve",
  "task.close",
  "task.cancel",
  "task.request-changes",
  "batch.close",
  "decision.create",
] as const;

export type ApprovalAction = typeof APPROVAL_ACTIONS[number];
export type ApprovalDecision = "approved" | "rejected" | "cancelled";

const ACTIONS = new Set<string>(APPROVAL_ACTIONS);
const OBSERVATION_DISPOSITIONS = new Set<string>(DISPOSITION_VALUES);
const CANCEL_RESOLUTIONS = new Set(["duplicate", "obsolete", "cancelled"]);
const SUPERSEDING_RESOLUTIONS = new Set(["duplicate", "obsolete"]);
/** Cancelling is the one gated action whose whole point is the payload: what ends, why, and what replaced it. */
const CANCEL_PAYLOAD_FIELDS = new Set(["resolution", "reason", "supersededBy"]);
/** Recording a decision is the other: the human is answering about text that does not exist yet. */
const DECISION_PAYLOAD_FIELDS = new Set(["source"]);

function validateEntity(action: ApprovalAction, entity: string): void {
  const pattern = action.startsWith("task.") ? TASK_ID
    : action === "observation.resolve" ? OBSERVATION_ID
      : action === "decision.create" ? DECISION_ID
        : BATCH_ID;
  if (!pattern.test(entity)) throw new Error(`${action} requires the matching Kotta entity id.`);
}

/**
 * Every other gated action names an entity that already exists; a decision does not exist until
 * its approval applies. The id is minted here, the way task_create mints a task id, so the
 * proposal, the elicitation and the record all name the same decision.
 */
export function approvalEntity(action: string, entity?: string): string {
  if (entity?.trim()) return entity.trim();
  if (action === "decision.create") return mintId("D");
  throw new Error(`${action} requires the matching Kotta entity id.`);
}

/**
 * An approval carries only the payload its action needs
 * (BR-01m0vqr9k6r571egp3z8qwnpkj, EX-01m0vqr9k6781kw70g9h722qk7): each action declares its exact
 * fields, and anything else is refused before the human is asked.
 */
function validatePayload(action: ApprovalAction, payload: Record<string, unknown>): void {
  if (action === "task.cancel") {
    const resolution = typeof payload.resolution === "string" ? payload.resolution : "";
    if (!CANCEL_RESOLUTIONS.has(resolution)) throw new Error("task.cancel requires one explicit valid resolution.");
    if (!(typeof payload.reason === "string" && payload.reason.trim())) throw new Error("task.cancel requires a stated reason.");
    const supersededBy = typeof payload.supersededBy === "string" ? payload.supersededBy.trim() : "";
    if (SUPERSEDING_RESOLUTIONS.has(resolution) && !supersededBy) throw new Error(`Resolution '${resolution}' requires supersededBy naming the task or decision that took this work's place.`);
    if (Object.keys(payload).some((key) => !CANCEL_PAYLOAD_FIELDS.has(key))) throw new Error("task.cancel accepts only the resolution, reason and supersededBy payload.");
    return;
  }
  if (action === "decision.create") {
    if (!(typeof payload.source === "string" && payload.source.trim())) throw new Error("decision.create requires source carrying the decision's Markdown.");
    if (Object.keys(payload).some((key) => !DECISION_PAYLOAD_FIELDS.has(key))) throw new Error("decision.create accepts only the decision's source.");
    return;
  }
  if (action === "observation.resolve") {
    const disposition = typeof payload.disposition === "string" ? payload.disposition : "";
    if (!OBSERVATION_DISPOSITIONS.has(disposition)) throw new Error("observation.resolve requires one explicit valid disposition.");
    if (Object.keys(payload).some((key) => !["disposition", "spec", "task", "title"].includes(key))) throw new Error("observation.resolve accepts only the scoped disposition, spec, task and title payload.");
    // amend-spec is the one disposition that carries references: it must name at least one amended
    // specification node, and no other disposition may.
    if (disposition === "amend-spec") {
      if (!Array.isArray(payload.spec) || !payload.spec.length || payload.spec.some((entry) => typeof entry !== "string" || !entry.trim())) {
        throw new Error("observation.resolve with disposition amend-spec requires spec naming at least one amended specification node.");
      }
    } else if (payload.spec !== undefined) {
      throw new Error("observation.resolve accepts spec only with the amend-spec disposition.");
    }
    // Attaching is the mirror of amending: its whole meaning is the reference it carries.
    if (disposition === "attach-to-existing-task") {
      if (!(typeof payload.task === "string" && payload.task.trim())) {
        throw new Error("observation.resolve with disposition attach-to-existing-task requires task naming the task this observation was folded into.");
      }
    } else if (payload.task !== undefined) {
      throw new Error("observation.resolve accepts task only with the attach-to-existing-task disposition.");
    }
    // The third reference scoped to one disposition: the name the minted work will carry, which
    // only create-task has anything to name (BR-01m0f0wn898xd4tr7j7t9bsjy7).
    if (payload.title !== undefined) {
      if (disposition !== "create-task") throw new Error("observation.resolve accepts title only with the create-task disposition.");
      if (!(typeof payload.title === "string" && payload.title.trim())) throw new Error("observation.resolve with a title requires it to name the work.");
    }
    return;
  }
  if (Object.keys(payload).length) throw new Error(`${action} does not accept an approval payload.`);
}

function relatedTask(root: string, entity: string, action: ApprovalAction): string | null {
  if (action === "decision.create") return null;
  if (action.startsWith("task.")) return entity;
  if (action === "observation.resolve") {
    const observation = findObservation(root, entity);
    const data = matter(readFileSync(observation.path, "utf8")).data;
    return typeof data.discovered_during === "string" && TASK_ID.test(data.discovered_during) ? data.discovered_during : null;
  }
  return null;
}

/**
 * The one line the human answers, in their language (QA-01m0fp2hdkq55yrx9qr5t8pweh,
 * UC-01m0f0wn89p42025mt5vg5012n, BR-01m0f0wn89c50fe1mz5yn1nw85): what will happen, to what, named
 * by title. Never an identifier — it is the machine's, and a permanent one is unreadable by
 * construction. `title` is what the workspace holds for the entity; without one, its id is all
 * there is to name it by, and saying that is better than saying nothing.
 */
/**
 * A gate description names every entity it mentions, not only its subject: "attached to Ship the
 * exporter" rather than "attached to T-01m0…". The workspace is read here, where it is already
 * open, so the pure renderer below stays a renderer.
 */
function withReferencedTitles(root: string, payload: Record<string, unknown>): Record<string, unknown> {
  const named: Record<string, unknown> = { ...payload };
  for (const [field, titleField] of [["task", "taskTitle"], ["supersededBy", "supersededByTitle"]] as const) {
    const reference = typeof payload[field] === "string" ? String(payload[field]).trim() : "";
    if (reference && !named[titleField]) named[titleField] = entityTitleById(root, reference);
  }
  return named;
}

export function approvalDescription(action: ApprovalAction, entity: string, payload: Record<string, unknown> = {}, title?: string): string {
  const subject = named(title, entity);
  if (action === "observation.resolve") {
    const spec = Array.isArray(payload.spec) && payload.spec.length ? `, amending ${payload.spec.map(String).join(", ")}` : "";
    const task = typeof payload.task === "string" && payload.task.trim() ? `, attached to ${named(payload.taskTitle, payload.task.trim())}` : "";
    return `Resolve "${subject}" as ${String(payload.disposition)}${spec}${task}`;
  }
  if (action === "task.cancel") {
    const superseded = typeof payload.supersededBy === "string" && payload.supersededBy.trim() ? `, superseded by ${named(payload.supersededByTitle, payload.supersededBy.trim())}` : "";
    return `Cancel "${subject}" as ${String(payload.resolution)}${superseded} — ${String(payload.reason)}`;
  }
  // What the human is answering about is the decision's own words, so the description carries its
  // title rather than a command they could not read the consequence from.
  if (action === "decision.create") return `Record the decision "${decisionTitle(String(payload.source ?? ""))}"`;
  if (action === "task.close") return `Close "${subject}" as completed`;
  if (action === "task.request-changes") return `Request changes on "${subject}"`;
  if (action === "batch.close") return `Close the batch "${subject}"`;
  return `${action} ${subject}`;
}

/**
 * What the human must read before answering, beyond the one-line description. A decision is the
 * one gated action whose whole substance is text that does not exist yet, so the elicitation
 * carries that text verbatim: what is shown is what gets recorded.
 */
export function approvalDetail(action: ApprovalAction, payload: Record<string, unknown> = {}): string | null {
  if (action !== "decision.create") return null;
  const source = String(payload.source ?? "").trim();
  return source ? source : null;
}

/** The title line of a decision draft, for the question the human is shown. */
function decisionTitle(source: string): string {
  const front = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const titled = front?.[1].match(/^title:\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g, "");
  if (titled) return titled;
  return source.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "untitled decision";
}

function assertApplicable(root: string, entity: string, action: ApprovalAction): void {
  if (action === "decision.create") {
    // A duplicate id is refused before the question is asked, not after the yes is spent.
    if (findDecision(root, entity)) throw new Error(`Decision ${entity} already exists. Choose a different id or inspect the existing record.`);
    return;
  }
  if (action === "task.cancel") {
    const state = findTask(root, entity).state;
    // Cancelling is the exception among the task actions: it reaches the work wherever it
    // got to, and only a task already at done has nothing left to retire.
    if (state === "done") throw new Error(`task.cancel requires ${entity} to still be live; it is already done. Reopen it first if it must change.`);
    return;
  }
  if (action.startsWith("task.")) {
    const state = findTask(root, entity).state;
    const expected = "review";
    if (state !== expected) throw new Error(`${action} requires ${entity} to be ${expected}; it is ${state}. Refresh state before preparing another action.`);
    return;
  }
  if (action === "observation.resolve") {
    const state = findObservation(root, entity).state;
    if (state !== "new") throw new Error(`${entity} is already resolved.`);
    return;
  }
  const batch = findBatch(root, entity);
  const data = matter(readFileSync(batch.path, "utf8")).data as { tasks?: unknown[] };
  const open = (data.tasks ?? []).map(String).filter((id) => findTask(root, id).state !== "done");
  if (batch.state === "done" || open.length) throw new Error(`${entity} is not ready to close${open.length ? `; open tasks: ${open.join(", ")}` : ""}.`);
}

function apply(root: string, proposal: KottaEvent, receipt: ApprovalReceipt): unknown {
  const payload = proposal.payload ?? {};
  switch (proposal.action as ApprovalAction) {
    case "observation.resolve": return resolveObservation(proposal.entity, String(payload.disposition), true, root, {
      approvalRecorded: true,
      locked: true,
      commit: false,
      spec: Array.isArray(payload.spec) ? payload.spec.map(String) : undefined,
      task: typeof payload.task === "string" ? payload.task : undefined,
      title: typeof payload.title === "string" ? payload.title : undefined,
      receipt,
    });
    case "task.close": return closeTask(proposal.entity, true, root, { locked: true, commit: false, approvalRecorded: true, receipt });
    case "task.cancel": return cancelTask(proposal.entity, String(payload.resolution), String(payload.reason), true, root, {
      supersededBy: typeof payload.supersededBy === "string" ? payload.supersededBy : undefined,
      locked: true,
      commit: false,
      approvalRecorded: true,
      receipt,
    });
    case "task.request-changes": return reopenTask(proposal.entity, true, root, { locked: true, commit: false, approvalRecorded: true, receipt });
    case "batch.close": return closeBatch(proposal.entity, true, root, { skipClean: true, commit: false, approvalRecorded: true, receipt });
    case "decision.create": return recordDecision({ source: String(payload.source), id: proposal.entity, approved: true, receipt }, root);
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
    if (existing) return { ok: true, command: "approval propose", data: { event: existing, created: false, description: approvalDescription(action, options.entity, withReferencedTitles(root, payload), entityTitleById(root, options.entity)) } };
    assertApplicable(root, options.entity, action);
    const events = readEvents(root, options.entity);
    // One entity carries one undecided approval (BR-01m0vqr9k5ypcztw4v0ns2qa6a,
    // EX-01m0vqr9k6c4d77g48rw7akt6c): two open questions would make the human's yes ambiguous.
    const pending = events.find((candidate) => candidate.kind === "approval" && candidate.phase === "proposed"
      && !events.some((later) => later.kind === "approval" && later.approval_id === candidate.approval_id && later.phase !== "proposed"));
    if (pending) throw new Error(`${options.entity} already has a pending approval: ${pending.action}. Resolve it before preparing another action.`);
    const approvalId = mintApprovalId();
    const result = appendEvent(root, {
      id: approvalId,
      entity: options.entity,
      task: relatedTask(root, options.entity, action),
      kind: "approval",
      approval_id: approvalId,
      phase: "proposed",
      action,
      payload: { ...payload, surface: "caller-chat" },
      source_message: null,
      client_event_id: options.clientRequestId ?? null,
    });
    commitControlState(root, `chore(kotta): propose ${action} for ${options.entity}`);
    return { ok: true, command: "approval propose", data: { event: result.event, created: result.created, description: approvalDescription(action, options.entity, withReferencedTitles(root, payload), entityTitleById(root, options.entity)) } };
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
      task: proposal.task,
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
    // An approval is decided once, and its outcome is durable (BR-01m0vqr9k64ht9h70fpjy6rky9,
    // EX-01m0vqr9k6w5923nksb536e3j2): a replayed yes returns the phase it ended in, applying nothing.
    const history = approvalHistory(events, options.approvalId);
    const terminal = history.find((event) => ["applied", "rejected", "cancelled", "failed"].includes(String(event.phase)));
    if (terminal) return { ok: true, command: "approval decide", data: { event: terminal, result: null, alreadyDecided: true } };

    const human = appendEvent(root, {
      entity: proposal.entity,
      task: proposal.task,
      kind: "message",
      role: "human",
      text: options.sourceText.trim(),
    }).event;
    const decision = appendEvent(root, {
      entity: proposal.entity,
      task: proposal.task,
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
        task: proposal.task,
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
        task: proposal.task,
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
