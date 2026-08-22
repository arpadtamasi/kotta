import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ANY_ENTITY_ID_SOURCE, TASK_ID, mintEventId } from "./identity.js";
import { processPath } from "../filesystem/workspace.js";

export type EventKind = "message" | "turn-failed" | "lifecycle" | "approval";
export type ApprovalPhase = "proposed" | "approved" | "rejected" | "cancelled" | "applied" | "failed";

export interface KottaEvent {
  id: string;
  entity: string;
  task: string | null;
  kind: EventKind;
  created_at: string;
  role?: "human" | "assistant";
  text?: string;
  client_event_id?: string | null;
  thread_id?: string | null;
  attempt_of?: string | null;
  state?: string;
  summary?: string;
  approval_id?: string;
  phase?: ApprovalPhase;
  action?: string;
  payload?: Record<string, unknown>;
  source_message?: string | null;
  error?: string | null;
}

const EVENT_ID = /^E-[0-9a-hjkmnp-tv-z]{26}$/;
const ENTITY_ID = new RegExp(`^${ANY_ENTITY_ID_SOURCE}$`);
const APPROVAL_PHASES = new Set<ApprovalPhase>(["proposed", "approved", "rejected", "cancelled", "applied", "failed"]);

export function validateEvent(event: KottaEvent): string[] {
  const errors: string[] = [];
  if (!EVENT_ID.test(event.id)) errors.push("event id must be E- plus a 26-character sortable id");
  if (!ENTITY_ID.test(event.entity)) errors.push("event entity must be a valid Kotta entity id");
  if (event.task !== null && !TASK_ID.test(event.task)) errors.push("event task must be null or a valid task id");
  if (!Number.isFinite(Date.parse(event.created_at))) errors.push("created_at must be an ISO timestamp");
  if (event.kind === "message") {
    if (!event.role || !["human", "assistant"].includes(event.role)) errors.push("message role must be human or assistant");
    if (!event.text?.trim()) errors.push("message text is required");
  }
  if (event.kind === "turn-failed" && !event.error?.trim()) errors.push("failed turns require an error");
  if (event.kind === "lifecycle" && (!event.state?.trim() || !event.summary?.trim())) errors.push("lifecycle events require state and summary");
  if (event.kind === "approval") {
    if (!event.approval_id || !EVENT_ID.test(event.approval_id)) errors.push("approval events require a valid approval_id");
    if (!event.phase || !APPROVAL_PHASES.has(event.phase)) errors.push("approval events require a valid phase");
    if (!event.action?.trim()) errors.push("approval events require an action");
    if (["approved", "rejected", "cancelled"].includes(String(event.phase)) && !event.source_message) errors.push("approval decisions require a source human message");
  }
  return errors;
}

export type NewEvent = Omit<KottaEvent, "id" | "created_at"> & { id?: string; created_at?: string };

function eventDirectory(root: string, entity: string): string {
  return processPath(root, "events", entity);
}

export function readEvents(root: string, entity?: string): KottaEvent[] {
  const base = processPath(root, "events");
  if (!existsSync(base)) return [];
  const entities = entity ? [entity] : readdirSync(base).filter((name) => ENTITY_ID.test(name));
  return entities.flatMap((id) => {
    const directory = eventDirectory(root, id);
    if (!existsSync(directory)) return [];
    return readdirSync(directory).filter((name) => name.endsWith(".json")).sort().map((name) => JSON.parse(readFileSync(join(directory, name), "utf8")) as KottaEvent);
  }).sort((left, right) => left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id));
}

/** Immutable, idempotent event publication. The caller owns the control-plane lock and commit. */
export function appendEvent(root: string, input: NewEvent): { event: KottaEvent; created: boolean; path: string } {
  if (input.client_event_id) {
    const existing = readEvents(root, input.entity).find((event) => event.client_event_id === input.client_event_id);
    if (existing) return { event: existing, created: false, path: join(eventDirectory(root, input.entity), `${existing.id}.json`) };
  }
  const event: KottaEvent = { ...input, id: input.id ?? mintEventId(), created_at: input.created_at ?? new Date().toISOString() };
  const errors = validateEvent(event);
  if (errors.length) throw new Error(`Invalid Kotta event: ${errors.join(", ")}.`);
  const directory = eventDirectory(root, event.entity);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, `${event.id}.json`);
  if (existsSync(path)) {
    const existing = JSON.parse(readFileSync(path, "utf8")) as KottaEvent;
    if (JSON.stringify(existing) === JSON.stringify(event)) return { event: existing, created: false, path };
    throw new Error(`Event ${event.id} already exists with different content.`);
  }
  const candidate = `${path}.${process.pid}.tmp`;
  writeFileSync(candidate, `${JSON.stringify(event, null, 2)}\n`);
  try { renameSync(candidate, path); }
  catch (error) { if (existsSync(candidate)) unlinkSync(candidate); throw error; }
  return { event, created: true, path };
}

export function approvalHistory(events: KottaEvent[], approvalId: string): KottaEvent[] {
  return events.filter((event) => event.kind === "approval" && event.approval_id === approvalId);
}

export function mintApprovalId(): string {
  return mintEventId();
}

export function appendLifecycleEvent(root: string, entity: string, state: string, summary: string, task: string | null = TASK_ID.test(entity) ? entity : null) {
  return appendEvent(root, { entity, task, kind: "lifecycle", state, summary });
}

/** CLI fallback audit: the explicit --approve interaction is visible but does not pretend to be chat identity. */
export function appendCliApprovalAudit(root: string, entity: string, action: string, payload: Record<string, unknown> = {}, task: string | null = TASK_ID.test(entity) ? entity : null) {
  const approvalId = mintEventId();
  const scopedPayload = { ...payload, surface: "cli" };
  appendEvent(root, { id: approvalId, entity, task, kind: "approval", approval_id: approvalId, phase: "proposed", action, payload: scopedPayload, source_message: null });
  const human = appendEvent(root, { entity, task, kind: "message", role: "human", text: `Approved in CLI: ${action}` }).event;
  appendEvent(root, { entity, task, kind: "approval", approval_id: approvalId, phase: "approved", action, payload: scopedPayload, source_message: human.id });
  return appendEvent(root, { entity, task, kind: "approval", approval_id: approvalId, phase: "applied", action, payload: scopedPayload, source_message: human.id }).event;
}
