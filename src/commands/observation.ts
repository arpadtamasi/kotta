import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findRepositoryRoot, regenerateIndex, processPath } from "../filesystem/workspace.js";
import { OBSERVATION_ORIGINS, canonicalEntityId, findTask, listEntities, stateFromEntityFile } from "../filesystem/entities.js";
import { entityFilename, filenameMatchesId, mintId } from "../core/identity.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { newTask } from "./task.js";
import { findSpecNode } from "../spec/registry.js";
import { commitControlState, controlPlaneRoot, withControlPlaneMutation } from "../git/control-plane.js";
import { appendCliApprovalAudit, appendLifecycleEvent } from "../core/events.js";
import { cliApprovalReceipt, receiptErrors, stampReceipt, type ApprovalReceipt } from "../core/approval-receipt.js";

/**
 * The one list of disposition values, shared by the CLI resolve path and the caller-chat approval
 * path so the two enforcement surfaces cannot drift apart, and mirrored by the published
 * `schemas/observation.schema.json` — the drift the schema-to-enum agreement test forbids
 * (F-01m0f4fd8r3eapgd38f5c4wer9, and the earlier attach-existing / attach-to-existing-task slip).
 * `amend-spec` is the primary constructive exit: the noticing changes the agreement, and the tasks
 * follow from the landed spec delta rather than from resolve.
 */
export const OBSERVATION_DISPOSITIONS = [
  "amend-spec",
  "create-task",
  "attach-to-existing-task",
  "investigate",
  "accept-risk",
  "reject",
  "merge-duplicate",
] as const;

function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/**
 * Whose noticing this is. Validated against OBSERVATION_ORIGINS, the pair the published
 * observation schema declares — not the wider ENTITY_ORIGINS, which also carries the origins a
 * task can have. Restating either here would be the drift the schema-to-enum test forbids.
 */
function observationOrigin(requested?: string): string {
  const value = (requested ?? "").trim();
  if (!value) return "agent";
  if (!(OBSERVATION_ORIGINS as readonly string[]).includes(value)) {
    throw new Error(`Unknown origin '${value}'. An observation is recorded as one of: ${OBSERVATION_ORIGINS.join(", ")}.`);
  }
  return value;
}

export function findObservation(root: string, id: string) {
  const directory = processPath(root, "observations");
  if (existsSync(directory)) {
    const filename = readdirSync(directory).find((name) => name.endsWith(".md") && filenameMatchesId(name, id));
    if (filename) {
      const path = join(directory, filename);
      return { state: stateFromEntityFile(path), filename, path };
    }
  }
  throw new Error(`Observation ${id} was not found.`);
}

export function newObservation(options: { title: string; type: string; evidence: string; origin?: string; discoveredDuring?: string }, repositoryRoot?: string) {
  const requestedRoot = repositoryRoot ?? findRepositoryRoot();
  if (options.discoveredDuring) {
    return withControlPlaneMutation(requestedRoot, (root) => {
      findTask(root, options.discoveredDuring!);
      const result = writeObservation(root, options);
      appendLifecycleEvent(root, result.data.id, "new", `Observation captured during ${options.discoveredDuring}.`, options.discoveredDuring!);
      commitControlState(root, `chore(kotta): capture ${result.data.id} during ${options.discoveredDuring}`);
      return result;
    });
  }
  // A standalone observation has no task to attribute a lifecycle event to, but it is still
  // canonical state Kotta owns: written without a commit it leaves the control plane dirty, and the
  // next command that requires a clean one is refused. It takes the same lock and the same commit as
  // the attributed path, and tolerates a dirty tree the way 'observation resolve' and 'task close'
  // do — where a single checkout is also the control plane, it carries the work being observed.
  return withControlPlaneMutation(requestedRoot, (root) => {
    const result = writeObservation(root, options);
    commitControlState(root, `chore(kotta): capture ${result.data.id}`);
    return result;
  }, { requireClean: false });
}

function writeObservation(root: string, options: { title: string; type: string; evidence: string; discoveredDuring?: string; origin?: string }) {
  const id = mintId("F");
  const filename = entityFilename(id, slugify(options.title));
  const directory = processPath(root, "observations");
  mkdirSync(directory, { recursive: true });
  // The most valuable noticings are the ones a person makes in passing
  // (UC-01m0f0wn89jqb5mpcjjt1j5j8p). Whoever noticed it is the one fact here the record cannot
  // derive: the agent runs the command either way, so it says whose noticing it is relaying.
  const origin = observationOrigin(options.origin);
  const data = { id, title: options.title, status: "new", origin, observation_type: options.type, confidence: "high", severity: "medium", discovered_during: options.discoveredDuring ?? null, created_at: new Date().toISOString().slice(0, 10) };
  const content = `# ${id} — ${options.title}\n\n## Observation\n\n${options.title}.\n\n## Evidence\n\n${options.evidence}\n\n## Impact hypothesis\n\nThis may cause incorrect or inconsistent behaviour.\n\n## Confidence\n\nHigh: the evidence is directly observable.\n\n## Suggested disposition\n\nInvestigate and create the smallest appropriate task after human approval.\n`;
  const path = join(directory, filename);
  writeFileSync(path, renderMarkdown(data, content));
  regenerateIndex(root);
  return { ok: true, command: "observation new", data: { id, path } };
}

export function validateObservation(id: string, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const observation = findObservation(root, id);
  const entity = parseMarkdown(readFileSync(observation.path, "utf8"));
  const body = sections(entity.content);
  const required = ["Observation", "Evidence", "Impact hypothesis", "Confidence", "Suggested disposition"];
  const errors = required.filter((heading) => !body.get(heading.toLowerCase())?.trim()).map((heading) => ({ code: "MISSING_SECTION", message: `Missing or empty section: ${heading}.` }));
  errors.push(...receiptErrors(entity.data));
  const title = String(entity.data.title ?? "").trim().toLowerCase();
  const observationId = String(entity.data.id ?? id);
  const duplicates = ([
    ...listEntities(root, "observation").filter((found) => found.id !== observationId),
    ...listEntities(root, "task"),
  ])
    .filter((found) => found.title.trim().toLowerCase() === title)
    .map((found) => found.id);
  return { ok: errors.length === 0, command: "observation validate", data: { id, state: observation.state, duplicates }, errors };
}

export function resolveObservation(id: string, disposition: string, approved: boolean, repositoryRoot?: string, options: { approvalRecorded?: boolean; locked?: boolean; commit?: boolean; spec?: string[]; task?: string; receipt?: ApprovalReceipt } = {}) {
  if (!(OBSERVATION_DISPOSITIONS as readonly string[]).includes(disposition)) throw new Error(`Unknown disposition '${disposition}'.`);
  if (!approved) throw new Error("Human approval is required to resolve a observation.");
  // The amend-spec exit records which specification nodes the amendment touched; every other
  // disposition takes no spec references, so a stray one is refused rather than silently dropped.
  const spec = (options.spec ?? []).map((value) => value.trim()).filter(Boolean);
  if (disposition === "amend-spec") {
    if (!spec.length) throw new Error("Disposition 'amend-spec' requires --spec naming at least one amended specification node; the resolution has to record what the amendment touched.");
  } else if (spec.length) {
    throw new Error(`--spec applies only to the amend-spec disposition, not '${disposition}'.`);
  }
  // A disposition whose meaning is a reference is not recorded without the reference
  // (SM-01m0f0wn892ntx934by9gwednb). Attaching said a noticing was folded into work that already
  // exists and stored no trace of which: 61 resolutions, 61 lost links.
  const attached = (options.task ?? "").trim();
  if (disposition === "attach-to-existing-task") {
    if (!attached) throw new Error("Disposition 'attach-to-existing-task' requires --task naming the task this observation was folded into; attaching without it records nothing.");
  } else if (attached) {
    throw new Error(`--task applies only to the attach-to-existing-task disposition, not '${disposition}'.`);
  }
  const requestedRoot = repositoryRoot ?? findRepositoryRoot();
  const resolveInControlPlane = (root: string) => {
    const observation = findObservation(root, id);
    if (observation.state !== "new") throw new Error(`Observation ${id} is already resolved.`);
    const validation = validateObservation(id, root);
    if (!validation.ok) throw new Error((validation.errors ?? []).map((error) => error.message).join("\n"));
    // A named node that resolves to nothing would make the reference decoration, so an unresolvable
    // one is refused by name — the same promise the task's spec reference holds.
    if (disposition === "amend-spec") {
      const missing = spec.filter((reference) => !findSpecNode(root, reference));
      if (missing.length) throw new Error(`Observation ${id} names specification ${missing.length === 1 ? "node" : "nodes"} that ${missing.length === 1 ? "does" : "do"} not exist: ${missing.join(", ")}.`);
    }
    // The same promise the spec reference holds: a named task that resolves to nothing would make
    // the reference decoration, so it is refused by name before anything is written. The short id
    // the operator may have typed is canonicalised, so the record holds one unambiguous reference.
    let attachedTask: string | undefined;
    if (attached) {
      // Canonicalise first: the short id is what `task list` prints, so it is what an operator
      // types, and only the full one resolves to a stored task.
      attachedTask = canonicalEntityId(root, "task", attached);
      findTask(root, attachedTask);
    }
    const entity = parseMarkdown(readFileSync(observation.path, "utf8"));
    let taskId: string | undefined = attachedTask;
    if (disposition === "create-task") {
      const created = newTask({ title: String(entity.data.title), type: "feature", profiles: [] }, root);
      taskId = created.data.id;
      const task = findTask(root, taskId);
      const taskEntity = parseMarkdown(readFileSync(task.path, "utf8"));
      taskEntity.data.origin = "observation";
      taskEntity.data.source_observation = id;
      writeFileSync(task.path, renderMarkdown(taskEntity.data, taskEntity.content));
    }
    entity.data.status = "resolved";
    entity.data.disposition = disposition;
    entity.data.resolved_at = new Date().toISOString();
    stampReceipt(entity.data, options.receipt ?? cliApprovalReceipt("observation.resolve"));
    if (taskId) entity.data.task = taskId;
    if (disposition === "amend-spec") entity.data.spec = spec;
    writeFileSync(observation.path, renderMarkdown(entity.data, entity.content));
    regenerateIndex(root);
    appendLifecycleEvent(root, id, "resolved", `Observation resolved with disposition ${disposition}.`, typeof entity.data.discovered_during === "string" ? entity.data.discovered_during : null);
    if (!options.approvalRecorded) appendCliApprovalAudit(root, id, "observation.resolve", {
      disposition,
      ...(disposition === "amend-spec" ? { spec } : {}),
    }, typeof entity.data.discovered_during === "string" ? entity.data.discovered_during : null);
    if (options.commit !== false) commitControlState(root, `chore(kotta): resolve ${id}`);
    return { ok: true, command: "observation resolve", data: { id, disposition, taskId, spec: disposition === "amend-spec" ? spec : undefined } };
  };
  return options.locked ? resolveInControlPlane(requestedRoot) : withControlPlaneMutation(requestedRoot, resolveInControlPlane, { requireClean: false });
}
