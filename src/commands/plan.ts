import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { parseMarkdown, sections } from "../core/markdown.js";
import { displayId } from "../core/identity.js";
import { parseOpenQuestions, unresolvedQuestions } from "../core/questions.js";
import { findRepositoryRoot, specPath } from "../filesystem/workspace.js";
import { OPENSPEC_DIRECTORY, PLANNING_FILE, deltaHash, readChangeModel, type ChangeModel } from "../spec/change.js";
import { markdownFiles, narrativeDrift, type NarrativeDrift } from "../spec/narrative.js";
import { PROVENANCE_DECIDERS, PROVENANCE_LEVELS, readProvenance } from "../spec/provenance.js";
import { formIssues, readFormRegistry, readSpecNodes, referencesIn, validateNodeSet, type SpecForm, type SpecNode, type ValidationIssue } from "../spec/registry.js";

/**
 * `kotta plan <change>` — the mechanical half of the planning phase.
 *
 * An agent translates a change's narrative into model nodes under `model/` (the `plan-change` skill);
 * this command measures what it produced against the accepted model and writes `planning.md`, the
 * report the one human gate is decided on: (a) the delta's structure, (b) the merged view as a whole,
 * (c) conflict candidates awaiting judgement, (d) silences — questions nobody has answered, (e) drift
 * between the narrative and the model, (f) where every node's content came from. It never decides a
 * conflict, answers a question or edits a narrative; it names them.
 */

/** Conflict candidates beyond this many are counted, not listed: a report nobody reads decides nothing. */
export const CONFLICT_LIMIT = 10;

export interface NodeRef { id: string; title: string; form: string; path: string }

export type ConflictKind = "transition-removed" | "transition-reversed" | "references-changed" | "references-removed" | "glossary-contrast" | "referenced-by-changed" | "shares-edge";

/** How much a candidate is likely to matter; the report lists the highest first. */
const CONFLICT_WEIGHT: Record<ConflictKind, number> = {
  "transition-removed": 5,
  "transition-reversed": 5,
  "references-changed": 4,
  "references-removed": 4,
  "glossary-contrast": 3,
  "referenced-by-changed": 2,
  "shares-edge": 1,
};

export interface ConflictCandidate {
  rank: number;
  kind: ConflictKind;
  /** The accepted node that may no longer hold. */
  node: NodeRef;
  /** The delta node, or removed node, that puts it in question. */
  because: NodeRef;
  detail: string;
  /** A candidate is a question for a human, never a verdict of the machine. */
  verdict: "awaits-judgement";
}

export interface OpenDecision { reference: string; node: NodeRef; text: string; line: number }

export interface ProvenanceSummary {
  nodes: number;
  unmarked: string[];
  levels: Record<string, number>;
  decidedBy: Record<string, number>;
  /** Every node whose content the agent decided alone: the list a human reviews at the gate. */
  machineDecisions: Array<NodeRef & { inferred: string }>;
}

export interface ConversationCitations {
  /** Repository-relative `openspec/changes/<name>/conversation.md`, or null when the change has none. */
  path: string | null;
  /** How many delta-node sources cite a conversation. */
  cited: number;
  /** Citations the board could not open at the cited part: a wrong path, or a part no heading names. */
  unresolved: Array<{ node: NodeRef; source: string; reason: string }>;
}

export interface ChangeAnalysis {
  change: string;
  deltaHash: string;
  delta: { added: NodeRef[]; modified: NodeRef[]; removed: NodeRef[] };
  /** (a) The delta measured on its own terms: sections, required edges, ids, provenance. */
  structure: ValidationIssue[];
  /** (b) The accepted model with the delta applied, measured as a whole. */
  merged: ValidationIssue[];
  /** (c) */
  conflicts: ConflictCandidate[];
  conflictsTotal: number;
  /** (d) */
  silences: { openDecisions: OpenDecision[]; formQuestions: ValidationIssue[] };
  /** (e) */
  drift: NarrativeDrift[];
  /** (f) */
  provenance: ProvenanceSummary;
  /** The change's distilled conversation, and the provenance citations of it that do not resolve. */
  conversation: ConversationCitations;
}

export interface Analysis extends ChangeAnalysis {
  forms: SpecForm[];
  model: ChangeModel;
  accepted: SpecNode[];
  mergedNodes: SpecNode[];
}

function title(node: SpecNode): string {
  return typeof node.data.title === "string" && node.data.title.trim() ? node.data.title.trim() : node.id;
}

function reference(root: string, node: SpecNode): NodeRef {
  return { id: node.id, title: title(node), form: node.form, path: relative(root, node.path) };
}

/** Every string value a node's frontmatter holds, per field: the references it can make. */
function fieldReferences(node: SpecNode): Array<{ field: string; value: string }> {
  return Object.entries(node.data)
    .filter(([field]) => !["id", "form", "title", "provenance", "capability"].includes(field))
    .flatMap(([field, value]) => referencesIn(value).map((item) => ({ field, value: item })));
}

/** `from → to` pairs in a node's `Transitions` section, lowercased. Prose around them is ignored. */
export function transitions(node: SpecNode): Array<[string, string]> {
  const text = sections(parseMarkdown(readFileSync(node.path, "utf8")).content).get("transitions");
  if (!text) return [];
  const pairs: Array<[string, string]> = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "").replace(/[`*_"]/g, "");
    const match = /^(.+?)\s*(?:-->|->|→|=>|⇒)\s*(.+)$/.exec(line.trim());
    if (!match) continue;
    const from = match[1].trim().toLowerCase();
    const to = match[2].split(/\s*(?:[:(,;—–]|\s-\s|\bon\b|\bwhen\b|\bif\b)/)[0].trim().toLowerCase();
    if (from && to) pairs.push([from, to]);
  }
  return pairs;
}

function nonExamples(node: SpecNode): string[] {
  const text = sections(parseMarkdown(readFileSync(node.path, "utf8")).content).get("non-examples") ?? "";
  return text.split(/\r?\n/)
    .map((line) => /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/.exec(line)?.[1] ?? "")
    .map((item) => item.replace(/[`*_"]/g, "").split(/\s+[—–-]\s+|:\s/)[0].trim().toLowerCase())
    .filter((item) => item.length >= 3);
}

function conflictCandidates(root: string, accepted: SpecNode[], delta: SpecNode[], removed: SpecNode[]): ConflictCandidate[] {
  const acceptedById = new Map(accepted.map((node) => [node.id, node]));
  const deltaIds = new Set(delta.map((node) => node.id));
  const removedIds = new Set(removed.map((node) => node.id));
  const modified = delta.filter((node) => acceptedById.has(node.id));
  // The accepted nodes that stay as they are: the ones a change can falsify without touching.
  const standing = accepted.filter((node) => !deltaIds.has(node.id) && !removedIds.has(node.id));
  const found = new Map<string, Omit<ConflictCandidate, "rank">>();
  const add = (kind: ConflictKind, node: SpecNode, because: SpecNode, detail: string) => {
    const key = `${node.id}\0${because.id}\0${kind}\0${detail}`;
    if (!found.has(key)) found.set(key, { kind, node: reference(root, node), because: reference(root, because), detail, verdict: "awaits-judgement" });
  };

  for (const change of modified) {
    const before = acceptedById.get(change.id)!;
    const after = new Set(transitions(change).map(([from, to]) => `${from}\0${to}`));
    const earlier = new Set(transitions(before).map(([from, to]) => `${from}\0${to}`));
    for (const [from, to] of transitions(before)) {
      if (after.has(`${from}\0${to}`)) continue;
      // Reversed only when the way back is new: a pair the model already had both ways lost one of them.
      if (after.has(`${to}\0${from}`) && !earlier.has(`${to}\0${from}`)) add("transition-reversed", before, change, `the accepted transition ${from} → ${to} now runs ${to} → ${from}`);
      else add("transition-removed", before, change, `the accepted transition ${from} → ${to} is gone`);
    }
    const outgoing = new Set(fieldReferences(change).map(({ value }) => value));
    for (const node of standing) {
      const pointing = fieldReferences(node).filter(({ value }) => value === change.id);
      for (const { field } of pointing) add("references-changed", node, change, `names the changed node in '${field}'`);
      if (outgoing.has(node.id)) add("referenced-by-changed", node, change, "is named by the changed node");
      const shared = fieldReferences(node).filter(({ field, value }) => value !== change.id && fieldReferences(change).some((other) => other.field === field && other.value === value));
      for (const { field, value } of shared) add("shares-edge", node, change, `both name ${acceptedById.get(value) ? title(acceptedById.get(value)!) : value} in '${field}'`);
    }
  }
  for (const gone of removed) {
    for (const [from, to] of transitions(gone)) add("transition-removed", gone, gone, `the accepted transition ${from} → ${to} goes with the removed node`);
    for (const node of standing) {
      for (const { field } of fieldReferences(node).filter(({ value }) => value === gone.id)) add("references-removed", node, gone, `names the removed node in '${field}'`);
    }
  }
  const glossary = [...standing, ...delta].filter((node) => node.form === "glossary-term");
  for (const change of delta) {
    const name = title(change).toLowerCase();
    for (const term of glossary) {
      if (term.id === change.id) continue;
      for (const contrast of nonExamples(term)) {
        const words = new RegExp(`\\b${contrast.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
        if (words.test(name)) add("glossary-contrast", term, change, `the title '${title(change)}' uses '${contrast}', which ${title(term)} names as a non-example`);
      }
    }
  }
  return [...found.values()]
    .sort((a, b) => CONFLICT_WEIGHT[b.kind] - CONFLICT_WEIGHT[a.kind] || a.node.id.localeCompare(b.node.id) || a.because.id.localeCompare(b.because.id))
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

function provenanceSummary(root: string, delta: SpecNode[]): ProvenanceSummary {
  const levels: Record<string, number> = Object.fromEntries(PROVENANCE_LEVELS.map((level) => [level, 0]));
  const decidedBy: Record<string, number> = Object.fromEntries(PROVENANCE_DECIDERS.map((decider) => [decider, 0]));
  const unmarked: string[] = [];
  const machineDecisions: ProvenanceSummary["machineDecisions"] = [];
  for (const node of delta) {
    const provenance = readProvenance(node.data.provenance);
    if (!provenance) { unmarked.push(node.id); continue; }
    levels[provenance.level] += 1;
    decidedBy[provenance.decided_by] += 1;
    if (provenance.decided_by === "agent-decided") machineDecisions.push({ ...reference(root, node), inferred: String(provenance.inferred ?? "").trim() });
  }
  return { nodes: delta.length, unmarked, levels, decidedBy, machineDecisions };
}

/** A source's file and cited part: `<file> · <part>`, or `<file>#<part>`. */
export function splitSource(source: string): { file: string; part: string | null } {
  const [file, ...rest] = source.split(/\s+·\s+/);
  const anchor = /^([^#\s]+\.md)#(.+)$/i.exec(file.trim());
  if (anchor && !rest.length) return { file: anchor[1], part: anchor[2].trim() || null };
  return { file: file.trim(), part: rest.join(" · ").trim() || null };
}

/** Whether a Markdown heading names the cited part — the same test the board uses to show it. */
function headingNames(content: string, part: string): boolean {
  const wanted = part.toLowerCase();
  let fenced = false;
  for (const line of content.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const heading = !fenced && /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading && heading[1].toLowerCase().includes(wanted)) return true;
  }
  return false;
}

/**
 * Every delta-node source citing a conversation, checked against the change's `conversation.md`: the
 * path must be the repository-relative one the board serves, and the cited part a heading in it.
 * Reported, not blocking — the provenance itself is measured in (a).
 */
function conversationCitations(root: string, model: ChangeModel): ConversationCitations {
  const file = join(model.directory, "conversation.md");
  const path = relative(root, file).split(sep).join("/");
  const content = existsSync(file) ? readFileSync(file, "utf8") : null;
  const unresolved: ConversationCitations["unresolved"] = [];
  let cited = 0;
  for (const node of model.nodes) {
    const provenance = node.data.provenance as { sources?: unknown } | undefined;
    const sources = Array.isArray(provenance?.sources) ? provenance.sources.filter((source): source is string => typeof source === "string") : [];
    for (const source of sources) {
      const { file: named, part } = splitSource(source);
      if (!/(?:^|\/)conversation\.md$/i.test(named)) continue;
      cited += 1;
      const ref = reference(root, node);
      if (named !== path) unresolved.push({ node: ref, source, reason: `name the conversation as ${path}, the repository-relative path the board opens` });
      else if (content === null) unresolved.push({ node: ref, source, reason: `the change has no ${path}; distil it with 'kotta narrative'` });
      else if (!part) unresolved.push({ node: ref, source, reason: "name the part it cites: an item id such as J1, or its time" });
      else if (!headingNames(parseMarkdown(content).content, part)) unresolved.push({ node: ref, source, reason: `no heading in ${path} names '${part}'` });
    }
  }
  return { path: content === null ? null : path, cited, unresolved };
}

/** Everything the planning phase knows about a change, computed from disk; nothing is written. */
export function analyzeChange(root: string, name: string): Analysis {
  const { forms, issues: registryIssues } = readFormRegistry(root);
  if (!forms.length) throw new Error(`No form registry is installed at ${specPath(root, "forms")}. Run 'kotta init' or 'kotta migrate' first.`);
  const { nodes: accepted, issues: acceptedIssues } = readSpecNodes(root, forms);
  const model = readChangeModel(root, name, forms);
  const acceptedById = new Map(accepted.map((node) => [node.id, node]));
  const deltaIds = new Set(model.nodes.map((node) => node.id));
  const removedIds = new Set(model.removed);
  const mergedNodes = [...accepted.filter((node) => !deltaIds.has(node.id) && !removedIds.has(node.id)), ...model.nodes];
  const inDelta = (node: SpecNode) => model.nodes.includes(node);

  const structure: ValidationIssue[] = [...model.issues];
  if (!model.nodes.length && !model.removed.length) {
    structure.push({ code: "CHANGE_MODEL_EMPTY", message: `The change '${model.name}' proposes no model delta: model/ holds no node and no ${"REMOVED.md"} entry. Translate the narrative into nodes first (the plan-change skill).`, path: model.modelDirectory });
  }
  structure.push(...validateNodeSet(forms, mergedNodes, { subject: inDelta, requireProvenance: inDelta }));
  for (const id of model.removed) {
    if (!acceptedById.has(id)) structure.push({ code: "CHANGE_REMOVED_UNKNOWN", message: `model/REMOVED.md removes ${id}, which is not an accepted node.`, path: join(model.modelDirectory, "REMOVED.md") });
    if (deltaIds.has(id)) structure.push({ code: "CHANGE_REMOVED_AND_CHANGED", message: `model/REMOVED.md removes ${id}, and model/ also carries a new version of it. A node is either changed or removed.`, path: join(model.modelDirectory, "REMOVED.md") });
  }
  for (const node of model.nodes) {
    const before = acceptedById.get(node.id);
    if (before && before.form !== node.form) structure.push({ code: "CHANGE_FORM_CHANGED", message: `${relative(root, node.path)} changes ${title(before)} from a ${before.form} to a ${node.form}; a node keeps its form. Remove it and add a new node instead.`, path: node.path });
  }

  const merged = [...registryIssues, ...formIssues(forms), ...acceptedIssues, ...validateNodeSet(forms, mergedNodes, { subject: (node) => !inDelta(node) })];

  const removedNodes = model.removed.map((id) => acceptedById.get(id)).filter((node): node is SpecNode => Boolean(node));
  const allConflicts = conflictCandidates(root, accepted, model.nodes, removedNodes);

  const openDecisions: OpenDecision[] = model.nodes.flatMap((node) =>
    unresolvedQuestions(parseOpenQuestions(node.id, readFileSync(node.path, "utf8"))).map((question) => ({ reference: question.reference, node: reference(root, node), text: question.text, line: question.line })));
  const formQuestions = structure.filter((issue) => issue.code === "SPEC_NODE_MISSING_EDGE" || issue.code === "SPEC_NODE_MISSING_FIELD" || issue.code === "SPEC_NODE_MISSING_SECTION");

  // The change's narrative describes the model after the change; the accepted narrative, the model before it.
  const mergedById = new Map(mergedNodes.map((node) => [node.id, node]));
  const drift = [
    ...markdownFiles(join(model.directory, "specs")).flatMap((file) => narrativeDrift(root, file, readFileSync(file, "utf8"), mergedById, forms)),
    ...markdownFiles(join(root, OPENSPEC_DIRECTORY, "specs")).flatMap((file) => narrativeDrift(root, file, readFileSync(file, "utf8"), acceptedById, forms)),
  ];

  return {
    change: model.name,
    deltaHash: deltaHash(model),
    delta: {
      added: model.nodes.filter((node) => !acceptedById.has(node.id)).map((node) => reference(root, node)),
      modified: model.nodes.filter((node) => acceptedById.has(node.id)).map((node) => reference(root, node)),
      removed: removedNodes.map((node) => reference(root, node)),
    },
    structure,
    merged,
    conflicts: allConflicts.slice(0, CONFLICT_LIMIT),
    conflictsTotal: allConflicts.length,
    silences: { openDecisions, formQuestions },
    drift,
    provenance: provenanceSummary(root, model.nodes),
    conversation: conversationCitations(root, model),
    forms,
    model,
    accepted,
    mergedNodes,
  };
}

/** The public part of an analysis: what `--json` prints and `planning.md` renders. */
export function publicAnalysis(analysis: Analysis): ChangeAnalysis {
  const { forms: _forms, model: _model, accepted: _accepted, mergedNodes: _merged, ...rest } = analysis;
  return rest;
}

/** The blocking problems of an analysis: what makes `plan` fail and `approve` refuse. */
export function blockingIssues(analysis: ChangeAnalysis): ValidationIssue[] {
  return [
    ...analysis.structure,
    ...analysis.merged,
    ...analysis.silences.openDecisions.map((question) => ({ code: "OPEN_DECISION", message: `${question.node.title} (${displayId(question.node.id)}) asks ${question.reference.replace(question.node.id, displayId(question.node.id))}: ${question.text}`, path: `${question.node.path}:${question.line}` })),
  ];
}

const named = (node: NodeRef) => `${node.title} (${displayId(node.id)})`;

function issueLines(issues: ValidationIssue[], root: string): string[] {
  return issues.map((issue) => `- \`${issue.code}\` ${issue.message}${issue.path ? ` — ${relative(root, issue.path) || issue.path}` : ""}`);
}

export function renderPlanning(analysis: ChangeAnalysis, root: string, generatedAt: string): string {
  const ok = blockingIssues(analysis).length === 0;
  const lines = [
    "---",
    `change: ${analysis.change}`,
    `generated_at: ${generatedAt}`,
    `delta_hash: ${analysis.deltaHash}`,
    `ready_for_approval: ${ok}`,
    "---",
    "",
    `# Planning: ${analysis.change}`,
    "",
    "Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.",
    "",
    "## Delta",
    "",
  ];
  const list = (label: string, nodes: NodeRef[]) => {
    lines.push(`${label}:${nodes.length ? "" : " none"}`);
    for (const node of nodes) lines.push(`- ${named(node)} — ${node.form}, ${node.path}`);
    lines.push("");
  };
  list("Added", analysis.delta.added);
  list("Changed", analysis.delta.modified);
  list("Removed", analysis.delta.removed);

  lines.push("## (a) Structure of the delta", "");
  lines.push(...(analysis.structure.length ? issueLines(analysis.structure, root) : ["Every delta node satisfies its form: sections, required edges, id and provenance."]), "");
  lines.push("## (b) The merged view", "");
  lines.push(...(analysis.merged.length ? issueLines(analysis.merged, root) : ["The accepted model with this delta applied validates as a whole."]), "");

  lines.push("## (c) Conflict candidates", "");
  if (!analysis.conflicts.length) lines.push("No accepted node shares an edge with, is named by, or contrasts with the delta.");
  for (const conflict of analysis.conflicts) {
    lines.push(`${conflict.rank}. **${named(conflict.node)}** — ${conflict.detail} (${conflict.kind}; because of ${named(conflict.because)}). Awaits judgement.`);
  }
  if (analysis.conflictsTotal > analysis.conflicts.length) lines.push("", `${analysis.conflictsTotal - analysis.conflicts.length} lower-ranked candidates are not listed; the ${analysis.conflicts.length} above rank highest.`);
  lines.push("");

  lines.push("## (d) Silences", "");
  if (!analysis.silences.openDecisions.length && !analysis.silences.formQuestions.length) lines.push("No open decision, and no question a form asks is left unanswered.");
  for (const question of analysis.silences.openDecisions) lines.push(`- Open: ${named(question.node)} ${question.reference.replace(question.node.id, displayId(question.node.id))} — ${question.text} (${question.node.path}:${question.line})`);
  for (const issue of analysis.silences.formQuestions) lines.push(`- Unanswered: ${issue.message}`);
  lines.push("");

  lines.push("## (e) Narrative drift", "");
  if (!analysis.drift.length) lines.push("No narrative requirement bound to a node says something else than the node.");
  for (const drift of analysis.drift) {
    if (drift.kind === "missing-node") lines.push(`- ${drift.file}:${drift.line} — requirement '${drift.requirement}' is bound to ${drift.id}, which is not a node of the model.`);
    else lines.push(`- ${drift.file}:${drift.line} — requirement '${drift.requirement}' says “${drift.narrative}”; ${drift.node} (${displayId(drift.id)}, ${drift.nodePath}) says “${drift.model}”.`);
  }
  if (analysis.drift.length) lines.push("", "Reported, not repaired: the model is the accepted truth, and which side moves is a human's call.");
  lines.push("");

  const summary = analysis.provenance;
  lines.push("## (f) Provenance", "");
  lines.push(`${summary.nodes} delta node${summary.nodes === 1 ? "" : "s"}: ${PROVENANCE_LEVELS.map((level) => `${summary.levels[level]} ${level}`).join(", ")}${summary.unmarked.length ? `, ${summary.unmarked.length} unmarked` : ""}.`);
  lines.push(`Decided by: ${PROVENANCE_DECIDERS.map((decider) => `${summary.decidedBy[decider]} ${decider}`).join(", ")}.`, "");
  lines.push("What the machine decided alone:", "");
  if (!summary.machineDecisions.length) lines.push("- nothing");
  for (const decision of summary.machineDecisions) lines.push(`- ${named(decision)} — ${decision.inferred || "(no account of what was supplied)"}`);
  lines.push("");
  const conversation = analysis.conversation;
  lines.push(conversation.path
    ? `Conversation: ${conversation.path}, cited ${conversation.cited} time${conversation.cited === 1 ? "" : "s"}. Read it for the why before calling anything inferred.`
    : "Conversation: none distilled for this change (`kotta narrative`).");
  for (const citation of conversation.unresolved) lines.push(`- Unresolved: ${named(citation.node)} cites “${citation.source}” — ${citation.reason}.`);
  lines.push("");
  return `${lines.join("\n")}`;
}

export interface PlanResult {
  ok: boolean;
  command: "plan";
  data: ChangeAnalysis & { planning: string };
  errors: ValidationIssue[];
}

export function planChange(name: string, repositoryRoot?: string, now: Date = new Date()): PlanResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const analysis = analyzeChange(root, name);
  const path = join(analysis.model.directory, PLANNING_FILE);
  writeFileSync(path, renderPlanning(publicAnalysis(analysis), root, now.toISOString()));
  const errors = blockingIssues(analysis);
  return { ok: errors.length === 0, command: "plan", data: { ...publicAnalysis(analysis), planning: relative(root, path) }, errors };
}

export function formatPlan(result: PlanResult): string {
  const data = result.data;
  const lines = [
    `Planned ${data.change}: ${data.delta.added.length} added, ${data.delta.modified.length} changed, ${data.delta.removed.length} removed. Report: ${data.planning}.`,
    `Conflict candidates awaiting judgement: ${data.conflictsTotal}${data.conflictsTotal > data.conflicts.length ? ` (top ${data.conflicts.length} listed)` : ""}. Open decisions: ${data.silences.openDecisions.length}. Narrative drift: ${data.drift.length}. Decided by the machine alone: ${data.provenance.machineDecisions.length}.`,
  ];
  if (result.ok) lines.push("Ready for the gate: put the delta, the candidates and the machine's decisions to the human, then record their yes with 'kotta approve'.");
  return lines.join("\n");
}

/** When `planning.md` was written and which delta it describes; `undefined` when there is none. */
export function readPlanning(directory: string): { mtime: number; deltaHash: string | undefined } | undefined {
  const path = join(directory, PLANNING_FILE);
  if (!existsSync(path)) return undefined;
  const data = parseMarkdown(readFileSync(path, "utf8")).data;
  return { mtime: statSync(path).mtimeMs, deltaHash: typeof data.delta_hash === "string" ? data.delta_hash : undefined };
}
