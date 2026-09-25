import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { parse } from "yaml";
import { receiptErrors } from "../core/approval-receipt.js";
import { readNarrativeSetting, type NarrativeMode } from "../core/config.js";
import { displayId } from "../core/identity.js";
import { findRepositoryRoot, specPath } from "../filesystem/workspace.js";
import { APPROVAL_FILE, ARCHIVE_DIRECTORY, OPENSPEC_DIRECTORY, changesPath } from "../spec/change.js";
import { SCENARIO_FORM, generateCapabilitySpec, markdownFiles, narrativeDrift, narrativeShapeWarnings, type NarrativeDrift } from "../spec/narrative.js";
import { referencesIn, type SpecNode, type ValidationIssue } from "../spec/registry.js";
import { analyzeChange, type NodeRef } from "./plan.js";

/**
 * `kotta archive <change>` — land an approved delta. No human is asked again: the receipt is the yes.
 *
 * It refuses without a receipt whose basis is the delta's current hash. Otherwise it merges `model/`
 * into the accepted specification (a new node added, a same-id node replaced, a REMOVED node deleted
 * unless an accepted node still names it), regenerates the narrative of every capability the delta
 * touches from the merged model, checks that every bound narrative requirement agrees with its node,
 * and moves the change under `openspec/changes/archive/<date>-<name>/`. Every check runs before the
 * first write, so a refusal leaves the repository as it was.
 */

export interface ArchiveResult {
  ok: boolean;
  command: "archive";
  data: {
    change: string;
    archivedTo: string | null;
    added: NodeRef[];
    replaced: NodeRef[];
    removed: NodeRef[];
    /** Who writes `openspec/specs`: regenerated from the model, or written by people and only compared. */
    narrative: NarrativeMode;
    /** Narrative specs regenerated, relative to the repository root. */
    narratives: string[];
    drift: NarrativeDrift[];
  };
  errors: ValidationIssue[];
  /** What does not stop the landing: an authored narrative's drift, a narrative OpenSpec will call incomplete. */
  warnings: ValidationIssue[];
}

function capabilityOf(node: SpecNode | undefined): string | undefined {
  const value = node?.data.capability;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function archiveChange(name: string, repositoryRoot?: string, now: Date = new Date()): ArchiveResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const analysis = analyzeChange(root, name);
  const { model, forms, accepted, mergedNodes } = analysis;
  const errors: ValidationIssue[] = [];
  const setting = readNarrativeSetting(root);
  const empty = { change: analysis.change, archivedTo: null, added: analysis.delta.added, replaced: analysis.delta.modified, removed: analysis.delta.removed, narrative: setting.mode, narratives: [], drift: [] };
  if (setting.error) errors.push({ code: "CONFIG_INVALID", message: setting.error, ...(setting.source ? { path: setting.source } : {}) });

  const approvalPath = join(model.directory, APPROVAL_FILE);
  if (!existsSync(approvalPath)) {
    errors.push({ code: "APPROVAL_MISSING", message: `The change has no ${APPROVAL_FILE}: it was never approved. The one human gate is 'kotta approve ${analysis.change} --by <who>', after the human said yes.`, path: approvalPath });
  } else {
    let receipt: Record<string, unknown> = {};
    try { receipt = (parse(readFileSync(approvalPath, "utf8")) ?? {}) as Record<string, unknown>; }
    catch (error) { errors.push({ code: "APPROVAL_UNREADABLE", message: `${APPROVAL_FILE} is not valid YAML: ${String(error)}`, path: approvalPath }); }
    const incomplete = receiptErrors(receipt);
    if (!receipt.approved_by) incomplete.push({ code: "INCOMPLETE_APPROVAL_RECEIPT", message: "The receipt names no approver." });
    for (const problem of incomplete) errors.push({ ...problem, path: approvalPath });
    if (!incomplete.length && receipt.approval_basis !== analysis.deltaHash) {
      errors.push({ code: "APPROVAL_STALE", message: `${APPROVAL_FILE} approved the delta ${String(receipt.approval_basis)}, but model/ now hashes to ${analysis.deltaHash}: it changed after the yes. Plan it again and ask again.`, path: approvalPath });
    }
  }

  const blocking = [...analysis.structure, ...analysis.merged];
  errors.push(...blocking);

  // A removed node nobody may still name — not through an edge, not through any other field.
  const removedIds = new Set(model.removed);
  for (const node of mergedNodes) {
    for (const [field, value] of Object.entries(node.data)) {
      if (field === "id") continue;
      for (const reference of referencesIn(value)) {
        if (!removedIds.has(reference)) continue;
        const gone = accepted.find((candidate) => candidate.id === reference);
        errors.push({ code: "REMOVED_STILL_REFERENCED", message: `${relative(root, node.path)} names ${gone ? `${String(gone.data.title ?? reference)} (${displayId(reference)})` : reference} in '${field}', which the change removes. Change or remove that reference in the delta first.`, path: node.path });
      }
    }
  }

  const stamp = now.toISOString().slice(0, 10);
  const destination = changesPath(root, ARCHIVE_DIRECTORY, `${stamp}-${analysis.change}`);
  if (existsSync(destination)) errors.push({ code: "ARCHIVE_EXISTS", message: `${relative(root, destination)} already exists; nothing was moved over it.`, path: destination });
  if (errors.length) return { ok: false, command: "archive", data: empty, errors, warnings: [] };

  // The capabilities this delta touches: its own nodes', the ones they replaced or removed, and the
  // capabilities of whatever a changed example proves.
  const acceptedById = new Map(accepted.map((node) => [node.id, node]));
  const mergedById = new Map(mergedNodes.map((node) => [node.id, node]));
  const touched = new Set<string>();
  const touchedBy = (node: SpecNode | undefined) => {
    const capability = capabilityOf(node);
    if (capability) touched.add(capability);
    if (node?.form === SCENARIO_FORM) for (const subject of referencesIn(node.data.subjects)) {
      const proven = capabilityOf(mergedById.get(subject)) ?? capabilityOf(acceptedById.get(subject));
      if (proven) touched.add(proven);
    }
  };
  for (const node of model.nodes) { touchedBy(node); touchedBy(acceptedById.get(node.id)); }
  for (const id of model.removed) touchedBy(acceptedById.get(id));

  const specsRoot = join(root, OPENSPEC_DIRECTORY, "specs");
  const generated = new Map<string, string>();
  // An authored narrative is the people's prose: nothing is generated into it, and its drift is told, not enforced.
  if (setting.mode === "generated") for (const capability of [...touched].sort()) {
    const path = join(specsRoot, capability, "spec.md");
    const existing = existsSync(path) ? readFileSync(path, "utf8") : undefined;
    generated.set(path, generateCapabilitySpec(capability, mergedNodes, forms, existing));
  }

  // The generated prose is checked against the model it came from, with every other narrative, before anything is written.
  const files = new Set([...markdownFiles(specsRoot), ...generated.keys()]);
  const drift = [...files].sort().flatMap((file) => narrativeDrift(root, file, generated.get(file) ?? readFileSync(file, "utf8"), mergedById, forms));
  const driftMessage = (item: NarrativeDrift) => item.kind === "missing-node" ? `${item.file}:${item.line} requirement '${item.requirement}' is bound to ${item.id}, which the merged model does not hold.` : `${item.file}:${item.line} requirement '${item.requirement}' disagrees with ${item.node} (${displayId(item.id)}): the narrative says “${item.narrative}”, the model says “${item.model}”.`;
  const warnings: ValidationIssue[] = setting.mode === "authored"
    ? drift.map((item) => ({ code: "NARRATIVE_DRIFT", message: driftMessage(item), path: join(root, item.file) }))
    : [...generated].flatMap(([path, content]) => narrativeShapeWarnings(relative(root, path), content)).map((warning) => ({ ...warning, path: join(root, warning.path) }));
  if (drift.length && setting.mode === "generated") {
    return {
      ok: false,
      command: "archive",
      data: { ...empty, drift },
      errors: drift.map((item) => ({ code: "NARRATIVE_DRIFT", message: driftMessage(item), path: join(root, item.file) })),
      warnings: [],
    };
  }

  const formById = new Map(forms.map((form) => [form.id, form]));
  for (const node of model.nodes) {
    const form = formById.get(node.form)!;
    const target = specPath(root, form.directory, basename(node.path));
    const previous = acceptedById.get(node.id);
    if (previous && previous.path !== target) rmSync(previous.path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(node.path, target);
  }
  for (const id of model.removed) {
    const gone = acceptedById.get(id);
    if (gone) rmSync(gone.path);
  }
  for (const [path, content] of generated) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  mkdirSync(dirname(destination), { recursive: true });
  renameSync(model.directory, destination);

  return {
    ok: true,
    command: "archive",
    data: { ...empty, archivedTo: relative(root, destination), narratives: [...generated.keys()].map((path) => relative(root, path)), drift: setting.mode === "authored" ? drift : [] },
    errors: [],
    warnings,
  };
}

export function formatArchive(result: ArchiveResult): string {
  const { data } = result;
  if (!data.archivedTo) return `The change ${data.change} was not archived.`;
  const lines = [`Landed ${data.change}: ${data.added.length} added, ${data.replaced.length} replaced, ${data.removed.length} removed in the accepted specification.`];
  for (const node of data.added) lines.push(`  added    ${node.title} (${displayId(node.id)})`);
  for (const node of data.replaced) lines.push(`  replaced ${node.title} (${displayId(node.id)})`);
  for (const node of data.removed) lines.push(`  removed  ${node.title} (${displayId(node.id)})`);
  if (data.narrative === "authored") {
    lines.push(`The narrative is authored, so openspec/specs was not written; ${data.drift.length ? `${data.drift.length} requirement${data.drift.length === 1 ? "" : "s"} there disagree${data.drift.length === 1 ? "s" : ""} with the model, reported below, not repaired.` : "every bound requirement there agrees with the model."}`);
  } else {
    lines.push(data.narratives.length ? `Regenerated from the model, and checked against it: ${data.narratives.join(", ")}.` : "No node names a capability, so no narrative was regenerated.");
  }
  lines.push(`Moved the change to ${data.archivedTo}. Nothing was committed.`);
  for (const warning of result.warnings) lines.push(`Warning: ${warning.code}: ${warning.message}`);
  return lines.join("\n");
}
