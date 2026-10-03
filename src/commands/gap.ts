import { execFileSync } from "node:child_process";
import { extname } from "node:path";
import { parse as parseYaml } from "yaml";
import { receiptErrors } from "../core/approval-receipt.js";
import { readWorkspaceConfig } from "../core/config.js";
import { parseMarkdown } from "../core/markdown.js";
import { workspaceDirectoryName } from "../filesystem/workspace.js";
import { git } from "../git/git.js";
import { type EvidenceLevel } from "../core/evidence.js";
import { APPROVAL_FILE, ARCHIVE_DIRECTORY, CHANGES_DIRECTORY, MODEL_DIRECTORY, REMOVED_FILE, approvesDelta, listChanges } from "../spec/change.js";
import { ROOT_MODULE, discoverModules, excludedLine, excludedMentions, excludedSummary, isEvidencePath, listedFiles, moduleOf, placeNode, type ExcludedClass, type ExcludedSummary } from "../core/modules.js";

export interface GapEvidence {
  kind: "code" | "test" | "command";
  path: string;
}

export interface GapNode {
  id: string;
  form: string;
  title: string;
  path: string;
  changed: boolean;
  evidence: GapEvidence[];
  evidenceSought: string;
  /** none: nothing names the id; cited: a committed file does; bound: a test's own name does. */
  level: EvidenceLevel;
  /** The node's module: where its evidence is, or an interface's `module:`. Null when unplaced or straddling. */
  module: string | null;
  /** Every module holding evidence for the node. */
  modules: string[];
  /** Evidence in more than one module, on a node that is not an interface. */
  straddler: boolean;
  /**
   * On a node at level `none`, the excluded sources that name it — why it reads `none` although
   * its id is in the repository (BR-01m3cqmtfyrpdzcppvy0565652). Empty on every other node.
   */
  excluded: ExcludedClass[];
}

/** One module's promises by evidence level. A straddling node is counted in each of its modules. */
export interface GapModuleSummary {
  module: string;
  promises: number;
  cited: number;
  bound: number;
  none: number;
}

/**
 * Which of three situations an admission records (BR-01m0swjgrreeby1pyfdzf4mf7d). One word covering
 * all three made the count unreadable: "nobody looked" moved the same number as "many sites realise
 * this and none can name it", and the two ask for opposite work.
 */
export const ADMISSION_KINDS = ["structural", "unexamined", "unimplemented"] as const;
export type AdmissionKind = typeof ADMISSION_KINDS[number];

export interface AcceptedImplementationGap {
  id: string;
  title: string;
  path: string;
  kind: AdmissionKind;
  reason: string;
  changed: boolean;
}

export interface ReverseGap {
  behavior: string;
  kind: "validation-rule" | "gate";
  path: string;
  line: number;
  evidenceSought: string;
}

/** One node of an approved change that is still open, measured on the checked-out commit. */
export interface ChangeGapNode {
  id: string;
  form: string;
  title: string;
  path: string;
  /** added: the accepted model holds no node with this id; changed: the delta replaces one. */
  delta: "added" | "changed";
  evidence: GapEvidence[];
  level: EvidenceLevel;
  admission: { kind: AdmissionKind; reason: string } | null;
}

/**
 * An approved change that is still open, as the code keeps it so far (UC-01m0fpqfxjvet99wbz0v1ag64q,
 * EX-01m3w9ajt2zqpc5gc0katqef96). Counted apart from the accepted model, and never refused over:
 * in an open change an unbuilt promise is the work that remains (BR-01m0qtshfqhcrrqtz051zm9svr).
 */
export interface ChangeGap {
  change: string;
  approvedBy: string;
  approvedAt: string;
  /** Where the change and its evidence were read: the checked-out branch and commit. */
  branch: string;
  commit: string;
  nodes: ChangeGapNode[];
  /** Neither evidenced nor admitted: what is left to build. */
  remaining: ChangeGapNode[];
}

/** An open change the report did not measure, with why: what it promises is not, or no longer, agreed. */
export interface UnmeasuredChange {
  change: string;
  reason: string;
}

export interface GapReportResult {
  ok: boolean;
  command: "gap report";
  data: {
    baseBranch: string;
    commit: string;
    specLanding: string | null;
    /** Nodes the landing commit touched, against the nodes whose agreement it actually moved. */
    landingTouched: number;
    changedNodes: string[];
    /** Only the nodes of this module are reported, when the report was asked for one. */
    module: string | null;
    /** Only this open change is reported, when the report was asked for one. */
    change: string | null;
    /** Every approved change that is still open, each measured on the checked-out commit. */
    changes: ChangeGap[];
    unmeasuredChanges: UnmeasuredChange[];
    /** Per module: promises, and how many are cited, bound, or without evidence. */
    modules: GapModuleSummary[];
    /** Nodes with no evidence, so no module: counted apart from every module. */
    unplaced: number;
    /** What the report did not count as evidence, said once: files per excluded class, and the nodes without evidence each names. */
    excluded: ExcludedSummary[];
    straddlers: string[];
    nodes: GapNode[];
    promises: GapNode[];
    acceptedGaps: AcceptedImplementationGap[];
    /** Admissions that name no kind: neither kept, nor filed under any of the three. */
    unkinded: GapNode[];
    reverse: ReverseGap[];
    report: string;
  };
  /** One per promise that is neither evidenced nor admitted; empty when the workspace passes. */
  errors: Array<{ code: string; message: string; path: string }>;
}

interface AcceptedNode {
  id: string;
  form: string;
  title: string;
  path: string;
  accepted: string[];
  /** Read only on an interface node, where it names the module whose surface the node is. */
  module: unknown;
}

const SOURCE_EXTENSIONS = new Set([".c", ".cc", ".cpp", ".cs", ".go", ".java", ".js", ".jsx", ".kt", ".mjs", ".php", ".py", ".rb", ".rs", ".sh", ".ts", ".tsx"]);
const GATE_WORDS = /\b(?:approval|cannot|forbidden|invalid|must|only|required|requires|refus(?:e|ed|es)|not allowed)\b/i;

function treePaths(root: string, ref: string, prefix?: string): string[] {
  const args = ["ls-tree", "-r", "--name-only", ref];
  if (prefix) args.push("--", prefix);
  const listed = git(root, args);
  return listed ? listed.split(/\r?\n/).filter(Boolean).sort() : [];
}

function atRef(root: string, ref: string, path: string): string {
  return git(root, ["show", `${ref}:${path}`]);
}

/** The form registry decides which directories contain nodes; no form name is compiled here. */
function acceptedNodes(root: string, ref: string, workspace: string): AcceptedNode[] {
  const formPaths = treePaths(root, ref, `${workspace}/spec/forms`).filter((path) => path.endsWith(".yaml"));
  const directories = new Set<string>();
  for (const path of formPaths) {
    const data = parseYaml(atRef(root, ref, path)) as Record<string, unknown> | null;
    const directory = typeof data?.directory === "string" ? data.directory.trim() : "";
    if (directory) directories.add(directory);
  }

  const nodes: AcceptedNode[] = [];
  for (const directory of [...directories].sort()) {
    for (const path of treePaths(root, ref, `${workspace}/spec/${directory}`).filter((entry) => entry.endsWith(".md"))) {
      const entity = parseMarkdown(atRef(root, ref, path));
      const id = String(entity.data.id ?? "").trim();
      if (!id) continue;
      nodes.push({
        id,
        form: String(entity.data.form ?? "").trim(),
        title: String(entity.data.title ?? id).trim(),
        path,
        accepted: Array.isArray(entity.data.accepted) ? entity.data.accepted.map(String) : [],
        module: entity.data.module,
      });
    }
  }
  return nodes.sort((left, right) => left.title.localeCompare(right.title) || left.id.localeCompare(right.id));
}

/**
 * Every committed file no excluded source holds: not the workspace, not the root `openspec/` tree,
 * not a published `kotta-spec/`, not `node_modules/`. Each is a copy of the specification or somebody
 * else's code, and a copy of a promise is not evidence that it is kept (BR-01m3cqmt9yrasdj92kky1kcx0n).
 */
function readableRepositoryFiles(root: string, paths: string[], ref: string, workspace: string): Array<{ path: string; text: string }> {
  return paths.filter((path) => isEvidencePath(path, workspace)).flatMap((path) => {
    try {
      const text = atRef(root, ref, path);
      return text.includes("\0") || text.length > 1_000_000 ? [] : [{ path, text }];
    } catch {
      return [];
    }
  });
}

/**
 * Paths the working tree holds uncommitted that could carry the evidence this report went looking
 * for: only the paths the evidence filter admits. An uncommitted copy of the specification — a
 * change's planning report, its spec, the workspace — cannot carry evidence either, so it is never
 * offered as the reason (EX-01m3f1eaacp45n4b5r5h170c3n, UC-01m0fpqfxjvet99wbz0v1ag64q). Deliberately
 * not read — the report's subject is what landed, and claiming an unread file is the evidence would
 * be the overclaim BR-01m0pw5bc7b1rkg5dct5qgdkmb forbids.
 */
function uncommittedEvidencePaths(root: string, workspace: string): string[] {
  const status = git(root, ["status", "--porcelain"]);
  if (!status) return [];
  return status.split(/\r?\n/).filter(Boolean)
    // Porcelain v1: two status columns, a space, then the path; a rename carries `old -> new`.
    .map((line) => line.slice(3).split(" -> ").at(-1)!.replace(/^"|"$/g, ""))
    // Porcelain names an untracked directory by itself (`dir/`); the filter reads it like any path.
    .filter((path) => isEvidencePath(path, workspace))
    .sort();
}

/**
 * Did this landing move what the node promises, or only the bookkeeping about its evidence? An
 * admission records which kind of gap a node has and why (BR-01m0swjgrreeby1pyfdzf4mf7d) - a
 * statement about the instrument, not about the agreement. Kinding a hundred and seven admissions
 * in one pass touched every node and changed no promise, and a delta that is the whole
 * specification names nothing (UC-01m0fpqfxjvet99wbz0v1ag64q).
 *
 * A path added or removed by the landing is always a delta: there is no earlier agreement to
 * compare, or no later one.
 */
function agreementChanged(root: string, before: string, after: string, path: string): boolean {
  const read = (ref: string): string | null => {
    try { return atRef(root, ref, path); }
    catch { return null; }
  };
  const earlier = read(before);
  const later = read(after);
  if (earlier === null || later === null) return true;
  const promise = (source: string): string => {
    const entity = parseMarkdown(source);
    const { accepted: _admission, ...rest } = entity.data as Record<string, unknown>;
    return JSON.stringify([rest, entity.content]);
  };
  try { return promise(earlier) !== promise(later); }
  // An unparseable node on either side is a change worth leading with, not one to swallow.
  catch { return true; }
}

function lastSpecLanding(root: string, ref: string, workspace: string): { commit: string | null; touched: number; changedPaths: Set<string> } {
  const commit = git(root, ["log", "-1", "--format=%H", ref, "--", `${workspace}/spec`]) || null;
  if (!commit) return { commit: null, touched: 0, changedPaths: new Set() };
  const ancestry = git(root, ["rev-list", "--parents", "-n", "1", commit]).split(/\s+/);
  const parent = ancestry.length > 1 ? ancestry[1] : null;
  const listed = parent
    ? git(root, ["diff", "--name-only", parent, commit, "--", `${workspace}/spec`])
    : git(root, ["ls-tree", "-r", "--name-only", commit, "--", `${workspace}/spec`]);
  const touchedPaths = listed ? listed.split(/\r?\n/).filter(Boolean) : [];
  // A root landing has no earlier tree to compare against: every node in it is the first agreement.
  const moved = parent ? touchedPaths.filter((path) => agreementChanged(root, parent, commit, path)) : touchedPaths;
  return { commit, touched: touchedPaths.length, changedPaths: new Set(moved) };
}

/** The checked-out commit and its branch; null where nothing is committed yet. */
function checkedOut(root: string): { branch: string; commit: string } | null {
  try {
    const commit = git(root, ["rev-parse", "--verify", "HEAD^{commit}"]);
    const branch = git(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
    return { commit, branch: branch === "HEAD" ? "detached HEAD" : branch };
  } catch {
    return null;
  }
}

/** A committed file's bytes, untrimmed: what a delta's fingerprint is taken over. */
function blob(root: string, ref: string, path: string): Buffer {
  return execFileSync("git", ["show", `${ref}:${path}`], { cwd: root, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
}

/**
 * The open changes at the checked-out commit: the approved ones measured, the others named with the
 * reason they were not. A change lives on a working branch with the code that keeps it until both
 * are merged, so it is read where the work is, never from the base branch
 * (UC-01m0fpqfxjvet99wbz0v1ag64q). Its own `model/` is inside the workspace and so is no evidence.
 */
function openChanges(root: string, workspace: string, head: { branch: string; commit: string }, accepted: AcceptedNode[], files: Array<{ path: string; text: string }>, modules: ReturnType<typeof discoverModules>["modules"]): { measured: ChangeGap[]; unmeasured: UnmeasuredChange[] } {
  const prefix = `${workspace}/${CHANGES_DIRECTORY}/`;
  const paths = treePaths(root, head.commit, `${workspace}/${CHANGES_DIRECTORY}`);
  const names = [...new Set(paths.map((path) => path.slice(prefix.length).split("/")).filter((parts) => parts.length > 1).map((parts) => parts[0]))]
    .filter((name) => name !== ARCHIVE_DIRECTORY).sort();
  const acceptedIds = new Set(accepted.map((node) => node.id));
  const measured: ChangeGap[] = [];
  const unmeasured: UnmeasuredChange[] = [];
  for (const name of names) {
    const mine = paths.filter((path) => path.startsWith(`${prefix}${name}/`));
    const approvalPath = `${prefix}${name}/${APPROVAL_FILE}`;
    if (!mine.includes(approvalPath)) { unmeasured.push({ change: name, reason: "never approved" }); continue; }
    let receipt: Record<string, unknown> = {};
    try { receipt = (parseYaml(atRef(root, head.commit, approvalPath)) ?? {}) as Record<string, unknown>; }
    catch { /* an unreadable receipt is an incomplete one */ }
    if (!receipt.approved_by || !receipt.approval_basis || receiptErrors(receipt).length) { unmeasured.push({ change: name, reason: `its ${APPROVAL_FILE} is incomplete` }); continue; }
    const modelPrefix = `${prefix}${name}/${MODEL_DIRECTORY}/`;
    const modelFiles = mine.filter((path) => path.startsWith(modelPrefix)).map((path) => path.slice(modelPrefix.length));
    if (!approvesDelta(receipt.approval_basis, modelFiles, (file) => blob(root, head.commit, `${modelPrefix}${file}`))) {
      unmeasured.push({ change: name, reason: "its delta changed after the approval" });
      continue;
    }
    const nodes = modelFiles.filter((file) => file.endsWith(".md") && file !== REMOVED_FILE).flatMap((file): ChangeGapNode[] => {
      const path = `${modelPrefix}${file}`;
      const entity = parseMarkdown(atRef(root, head.commit, path));
      const id = String(entity.data.id ?? "").trim();
      if (!id) return [];
      const form = String(entity.data.form ?? "").trim();
      const title = String(entity.data.title ?? id).trim();
      const placement = placeNode({ id, form, title, path, data: { module: entity.data.module } }, files, modules);
      const admission = acceptedAdmission(Array.isArray(entity.data.accepted) ? entity.data.accepted.map(String) : []);
      return [{
        id, form, title, path,
        delta: acceptedIds.has(id) ? "changed" : "added",
        evidence: placement.evidence.map(({ kind, path: at }) => ({ kind, path: at })),
        level: placement.level,
        admission: admission?.kind ? { kind: admission.kind, reason: admission.reason } : null,
      }];
    }).sort((left, right) => left.title.localeCompare(right.title) || left.id.localeCompare(right.id));
    measured.push({
      change: name,
      approvedBy: String(receipt.approved_by),
      approvedAt: String(receipt.approved_at),
      branch: head.branch,
      commit: head.commit,
      nodes,
      remaining: nodes.filter((node) => !node.evidence.length && !node.admission),
    });
  }
  // An open change on disk that the checked-out commit does not hold yet cannot be read where the
  // evidence is read; it is named, so its absence from the report is not mistaken for "nothing left".
  for (const name of listChanges(root)) {
    if (!names.includes(name)) unmeasured.push({ change: name, reason: `not committed on ${head.branch}` });
  }
  return { measured, unmeasured: unmeasured.sort((left, right) => left.change.localeCompare(right.change)) };
}

/**
 * The nodes of a delta that are neither kept nor admitted, sought the way the report seeks an open
 * change's evidence: in what the checked-out commit holds. `kotta archive` refuses over them
 * (BR-01m3w9ajdxbf04ph4y97dmry35), so no unaccounted promise reaches the accepted model.
 */
export function unaccountedPromises<Node extends { id: string; data: Record<string, unknown> }>(root: string, nodes: Node[]): { where: string; nodes: Node[]; uncommitted: string[] } {
  const workspace = workspaceDirectoryName(root);
  const head = checkedOut(root);
  const files = head ? readableRepositoryFiles(root, treePaths(root, head.commit), head.commit, workspace) : [];
  const missing = nodes.filter((node) => {
    if (files.some((file) => file.text.includes(node.id))) return false;
    return !acceptedAdmission(Array.isArray(node.data.accepted) ? node.data.accepted.map(String) : [])?.kind;
  });
  return {
    where: head ? `${head.branch}@${head.commit.slice(0, 7)}` : "this repository, where nothing is committed yet",
    nodes: missing,
    uncommitted: missing.length && head ? uncommittedEvidencePaths(root, workspace) : [],
  };
}

function changeSection(entry: ChangeGap): string[] {
  const evidenced = entry.nodes.filter((node) => node.evidence.length);
  const admitted = entry.nodes.filter((node) => !node.evidence.length && node.admission);
  const lines = [
    "",
    `## Open change: ${entry.change}`,
    `Approved by ${entry.approvedBy} on ${entry.approvedAt.slice(0, 10)}. Read: ${entry.branch}@${entry.commit}`,
    `Promises: ${entry.nodes.length} · evidenced ${evidenced.length} · admitted ${admitted.length} · without evidence ${entry.remaining.length}`,
  ];
  if (entry.remaining.length) {
    lines.push("", "### The work that remains");
    for (const node of entry.remaining) lines.push(`- ${node.title} · ${node.id} — ${node.delta}; nothing on ${entry.branch}@${entry.commit.slice(0, 7)} names it in code, tests, or command definitions (${node.path})`);
  }
  if (admitted.length) {
    lines.push("", "### Admitted");
    for (const node of admitted) lines.push(`- ${node.title} · ${node.id} — ${node.delta}; ${node.admission!.kind}: ${node.admission!.reason} (${node.path})`);
  }
  if (evidenced.length) {
    lines.push("", "### Evidenced");
    for (const node of evidenced) lines.push(`- ${node.title} · ${node.id} — ${node.delta}; ${node.evidence.map((item) => `${item.kind} ${item.path}`).join(", ")}`);
  }
  if (!entry.nodes.length) lines.push("", "The change adds and changes no node.");
  return lines;
}

/** The legacy spellings, kept reading so an existing workspace is not broken by the kinds. */
const UNKINDED_KEYS = ["implementation", "implementation-gap", "verification"];

/**
 * The admission on a node, with the kind it declares. A legacy unkinded entry is returned with a
 * null kind so the caller can refuse it by name rather than guessing which of the three it meant.
 */
function acceptedAdmission(entries: string[]): { kind: AdmissionKind | null; reason: string } | null {
  let unkinded: { kind: null; reason: string } | null = null;
  for (const entry of entries) {
    const separator = entry.indexOf(":");
    if (separator < 1) continue;
    const key = entry.slice(0, separator).trim().toLowerCase();
    const reason = entry.slice(separator + 1).trim();
    if (!reason) continue;
    const kind = ADMISSION_KINDS.find((candidate) => candidate === key);
    if (kind) return { kind, reason };
    if (UNKINDED_KEYS.includes(key) && !unkinded) unkinded = { kind: null, reason };
  }
  return unkinded;
}

function enforcementSites(files: Array<{ path: string; text: string }>, nodeIds: string[]): ReverseGap[] {
  const gaps = new Map<string, ReverseGap>();
  for (const file of files.filter(({ path }) => SOURCE_EXTENSIONS.has(extname(path).toLowerCase()) && !/(?:^|\/)(?:test|tests|spec|specs)(?:\/|$)|\.(?:test|spec)\./i.test(path))) {
    const lines = file.text.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const nearby = lines.slice(Math.max(0, index - 4), index + 1).join("\n");
      if (nodeIds.some((id) => nearby.includes(id))) continue;
      const code = /\bcode\s*:\s*["']([A-Z][A-Z0-9_]{2,})["']/.exec(line)?.[1];
      const thrown = /throw new Error\(\s*["'`]([^"'`\n]+)["'`]\s*\)/.exec(line)?.[1];
      const kind = code ? "validation-rule" as const : thrown && GATE_WORDS.test(thrown) ? "gate" as const : null;
      const behavior = code ?? (kind ? thrown : undefined);
      if (!kind || !behavior) continue;
      const key = `${kind}:${behavior}`;
      if (!gaps.has(key)) gaps.set(key, {
        behavior,
        kind,
        path: file.path,
        line: index + 1,
        evidenceSought: "a nearby accepted specification node id at the enforcement site",
      });
    }
  }
  return [...gaps.values()].sort((left, right) => left.behavior.localeCompare(right.behavior) || left.path.localeCompare(right.path) || left.line - right.line);
}

/** Admissions that share a reason word for word: one decision, however many nodes carry it. */
function groupByReason(gaps: AcceptedImplementationGap[]): Map<string, AcceptedImplementationGap[]> {
  const groups = new Map<string, AcceptedImplementationGap[]>();
  // Grouped by the exact text, never by kind: the reason is what a reader came for, and two nodes
  // admitted separately stay separate even when their kind matches.
  for (const gap of gaps) groups.set(gap.reason, [...(groups.get(gap.reason) ?? []), gap]);
  return groups;
}

export function formatGapReport(data: GapReportResult["data"]): string {
  // Asked for one change, the report is that change and nothing of the accepted model.
  if (data.change) return `${["# Implementation gap report", "", `Change: ${data.change}`, ...data.changes.flatMap(changeSection)].join("\n")}\n`;
  const lines = [
    "# Implementation gap report",
    "",
    `Base: ${data.baseBranch}@${data.commit}`,
    // Counted apart, because the three ask for opposite work and one total hid that
    // (BR-01m0swjgrreeby1pyfdzf4mf7d). `unimplemented` is the one to read as debt.
    `Promises without evidence: ${data.promises.length} · ${ADMISSION_KINDS.map((kind) => `${kind}: ${data.acceptedGaps.filter((gap) => gap.kind === kind).length}`).join(" · ")}${data.unkinded.length ? ` · admitted without a kind: ${data.unkinded.length}` : ""} · Unspecified enforcement: ${data.reverse.length}`,
    `Evidence levels: bound ${data.nodes.filter((node) => node.level === "bound").length} · cited ${data.nodes.filter((node) => node.level === "cited").length} · none ${data.nodes.filter((node) => node.level === "none").length}${data.module ? ` · module ${data.module}` : ""}`,
  ];
  // What was not counted, said once in the head (BR-01m3cqmtfyrpdzcppvy0565652).
  const excluded = excludedLine(data.excluded);
  if (excluded) lines.push(excluded);
  if (data.changes.length || data.unmeasuredChanges.length) {
    const measured = data.changes.map((entry) => `${entry.change} (${entry.remaining.length} of ${entry.nodes.length} without evidence)`);
    const skipped = data.unmeasuredChanges.map((entry) => `${entry.change} (${entry.reason})`);
    lines.push(`Open changes: ${measured.length ? measured.join(", ") : "none approved"}${skipped.length ? ` · not measured: ${skipped.join(", ")}` : ""}`);
  }
  // By module only once a manifest declares one: a single-module repository has nothing to split.
  if (data.modules.some((row) => row.module !== ROOT_MODULE) || data.straddlers.length) {
    lines.push("", "## Evidence by module");
    for (const row of data.modules) lines.push(`- ${row.module}: ${row.promises} promise${row.promises === 1 ? "" : "s"} · bound ${row.bound} · cited ${row.cited} · none ${row.none}`);
    if (data.unplaced) lines.push(`- no module (no evidence): ${data.unplaced}`);
    const straddling = data.nodes.filter((node) => node.straddler);
    if (straddling.length) {
      lines.push("", "## Straddling promises: evidenced in more than one module");
      for (const node of straddling) lines.push(`- ${node.title} · ${node.id} — ${node.modules.join(", ")}; move the shared part into an interface (${node.path})`);
    }
  }
  const changed = data.nodes.filter((node) => node.changed);
  if (changed.length) {
    lines.push("", "## Latest accepted spec delta");
    // A landing that touched more nodes than it moved agreements in says both numbers: without
    // them the shorter list reads as the whole landing (UC-01m0fpqfxjvet99wbz0v1ag64q).
    if (data.landingTouched > changed.length) {
      lines.push(`The landing touched ${data.landingTouched} nodes and changed what ${changed.length} of them promise; the rest moved only their own admission bookkeeping.`);
    }
    for (const node of changed) {
      const accepted = data.acceptedGaps.find((entry) => entry.id === node.id);
      const status = node.evidence.length
        ? `evidence: ${node.evidence.map((entry) => `${entry.kind} ${entry.path}`).join(", ")}`
        : accepted
          ? `admitted as ${accepted.kind}`
          : `missing: looked for ${node.evidenceSought}`;
      lines.push(`- ${node.title} · ${node.id} — ${status} (${node.path})`);
    }
  }
  if (data.unkinded.length) {
    lines.push("", "## Admitted without saying which kind");
    for (const node of data.unkinded) lines.push(`- ${node.changed ? "[changed] " : ""}${node.title} · ${node.id} (${node.path})`);
  }
  if (data.promises.length) {
    lines.push("", "## Promises without implementing or verifying evidence");
    for (const node of data.promises) lines.push(`- ${node.changed ? "[changed] " : ""}${node.title} · ${node.id} — looked for ${node.evidenceSought}${node.excluded.length ? `; named only in ${node.excluded.join(", ")}, which are not evidence` : ""} (${node.path})`);
  }
  for (const kind of ADMISSION_KINDS) {
    const group = data.acceptedGaps.filter((gap) => gap.kind === kind);
    if (!group.length) continue;
    lines.push("", `## Admitted as ${kind}`);
    // A bulk admission is one decision, and printing its reason once per node made this report 333
    // lines with a paragraph repeated a hundred and eight times — read once, then skipped, which is
    // how a measure stops being consulted. Identical text is one heading; the nodes sit under it.
    for (const [reason, nodes] of groupByReason(group)) {
      if (nodes.length > 1) {
        lines.push("", `${nodes.length} nodes, all admitted with the same reason:`, `> ${reason}`, "");
        for (const node of nodes) lines.push(`- ${node.changed ? "[changed] " : ""}${node.title} · ${node.id} (${node.path})`);
      } else {
        const [node] = nodes;
        lines.push(`- ${node.changed ? "[changed] " : ""}${node.title} · ${node.id} — ${reason} (${node.path})`);
      }
    }
  }
  for (const entry of data.changes) lines.push(...changeSection(entry));
  if (data.reverse.length) {
    lines.push("", "## Enforced behavior with no specification trace");
    for (const gap of data.reverse) lines.push(`- ${gap.behavior} [${gap.kind}] — ${gap.path}:${gap.line}; looked for ${gap.evidenceSought}`);
  }
  if (!data.promises.length && !data.acceptedGaps.length && !data.reverse.length) lines.push("", "No implementation gaps found.");
  return `${lines.join("\n")}\n`;
}

function summarize(nodes: GapNode[], moduleNames: string[]): GapModuleSummary[] {
  return moduleNames.map((module) => {
    const mine = nodes.filter((node) => node.modules.includes(module) || (node.module === module && !node.modules.length));
    return {
      module,
      promises: mine.length,
      cited: mine.filter((node) => node.level === "cited").length,
      bound: mine.filter((node) => node.level === "bound").length,
      none: mine.filter((node) => node.level === "none").length,
    };
  }).filter((row) => row.promises > 0 || row.module !== ROOT_MODULE);
}

export interface GapOptions {
  /** Report only this module's nodes: the ones evidenced in it, and the interfaces that name it. */
  module?: string;
  /** Report only this approved, still open change. */
  change?: string;
}

/**
 * Read only committed bytes, and never refresh an index or write: the accepted model and its
 * evidence from the configured base branch, an approved open change and its evidence from the
 * checked-out commit.
 */
export function gapReport(repositoryRoot: string, options: GapOptions = {}): GapReportResult {
  const config = readWorkspaceConfig(repositoryRoot);
  const baseBranch = config.baseBranch;
  const commit = git(repositoryRoot, ["rev-parse", "--verify", `${baseBranch}^{commit}`]);
  const workspace = workspaceDirectoryName(repositoryRoot);
  const nodes = acceptedNodes(repositoryRoot, commit, workspace);
  const paths = treePaths(repositoryRoot, commit);
  const files = readableRepositoryFiles(repositoryRoot, paths, commit, workspace);
  const landing = lastSpecLanding(repositoryRoot, commit, workspace);
  // The modules as the manifests at the same commit declare them: the report reads one commit, whole.
  const { modules } = discoverModules(listedFiles(repositoryRoot, files));
  const moduleNames = modules.map((module) => module.name);
  if (options.module !== undefined && !moduleNames.includes(options.module)) {
    throw new Error(`No module named '${options.module}' at ${baseBranch}@${commit.slice(0, 7)}. Modules: ${moduleNames.join(", ")}.`);
  }

  const every = nodes.map((node): GapNode => {
    const placement = placeNode({ id: node.id, form: node.form, title: node.title, path: node.path, data: { module: node.module } }, files, modules);
    const { module: _declared, ...rest } = node;
    return {
      ...rest,
      changed: landing.changedPaths.has(node.path),
      evidence: placement.evidence.map(({ kind, path }) => ({ kind, path })),
      evidenceSought: `the exact node id ${node.id} in code, tests, or command definitions on ${baseBranch}@${commit}`,
      level: placement.level,
      module: placement.module,
      modules: placement.modules,
      straddler: placement.straddler,
      excluded: [],
    };
  }).sort((left, right) => Number(right.changed) - Number(left.changed) || left.title.localeCompare(right.title) || left.id.localeCompare(right.id));
  // A node without evidence says which excluded sources name it, so "why is this none?" has its
  // answer in the report (BR-01m3cqmtfyrpdzcppvy0565652, EX-01m3cqmvs23cfzrxwfjpvk80dx). The search
  // is the one evidence already ran, over the excluded paths; only the hit is sorted differently.
  const unevidenced = every.filter((node) => node.level === "none");
  const mentions = excludedMentions(repositoryRoot, workspace, unevidenced, commit);
  for (const node of unevidenced) node.excluded = mentions.get(node.id) ?? [];
  const described = options.module === undefined ? every : every.filter((node) => node.modules.includes(options.module!) || node.module === options.module);

  const promises: GapNode[] = [];
  const acceptedGaps: AcceptedImplementationGap[] = [];
  const unkinded: GapNode[] = [];
  for (const node of described) {
    if (node.evidence.length) continue;
    const source = nodes.find((candidate) => candidate.id === node.id)!;
    const admission = acceptedAdmission(source.accepted);
    if (!admission) promises.push(node);
    // An admission that names no kind is refused rather than filed under a guess: naming three
    // situations with one word is the defect this rule removes (BR-01m0swjgrreeby1pyfdzf4mf7d).
    else if (!admission.kind) unkinded.push(node);
    else acceptedGaps.push({ id: node.id, title: node.title, path: node.path, kind: admission.kind, reason: admission.reason, changed: node.changed });
  }
  const head = checkedOut(repositoryRoot);
  const headFiles = !head || head.commit === commit ? files : readableRepositoryFiles(repositoryRoot, treePaths(repositoryRoot, head.commit), head.commit, workspace);
  const open = head
    ? openChanges(repositoryRoot, workspace, head, nodes, headFiles, head.commit === commit ? modules : discoverModules(listedFiles(repositoryRoot, headFiles)).modules)
    : { measured: [], unmeasured: [] };
  if (options.change !== undefined && !open.measured.some((entry) => entry.change === options.change)) {
    const skipped = open.unmeasured.find((entry) => entry.change === options.change);
    throw new Error(skipped
      ? `The change '${options.change}' is not measured: ${skipped.reason}. Only an approved change, committed where its code is, has promises to measure.`
      : `No open change named '${options.change}'${head ? ` at ${head.branch}@${head.commit.slice(0, 7)}` : ""}. Approved open changes: ${open.measured.map((entry) => entry.change).join(", ") || "none"}.`);
  }
  const changes = options.change === undefined ? open.measured : open.measured.filter((entry) => entry.change === options.change);
  const moduleFiles = options.module === undefined ? files : files.filter((file) => moduleOf(file.path, modules) === options.module);
  // A site that names a node of an approved open change is specified by it: not yet accepted, already agreed.
  const reverse = enforcementSites(moduleFiles, [...nodes.map((node) => node.id), ...open.measured.flatMap((entry) => entry.nodes.map((node) => node.id))]);
  const data: GapReportResult["data"] = {
    baseBranch,
    commit,
    specLanding: landing.commit,
    landingTouched: landing.touched,
    changedNodes: described.filter((node) => node.changed).map((node) => node.id),
    module: options.module ?? null,
    change: options.change ?? null,
    changes,
    unmeasuredChanges: options.change === undefined ? open.unmeasured : [],
    modules: summarize(described, options.module === undefined ? moduleNames : [options.module]),
    unplaced: described.filter((node) => node.module === null && !node.straddler).length,
    excluded: excludedSummary(paths, workspace, described.filter((node) => node.level === "none")),
    straddlers: described.filter((node) => node.straddler).map((node) => node.id),
    nodes: described,
    promises,
    acceptedGaps,
    unkinded,
    reverse,
    report: "",
  };
  data.report = formatGapReport(data);
  // Every accepted promise is kept or admitted (BR-01m0qtshfqhcrrqtz051zm9svr). A promise with no
  // evidence and no stated reason is the one thing this read refuses over: the count of unaccounted
  // promises could otherwise only grow, because nothing in the workflow ever had to look at it.
  // The read is of the base branch by design, so evidence that is written but not committed is
  // invisible to it and the refusal reads as a real defect. Naming that cost a diagnosis four
  // times in three days (F-01m0sm78y2b1vpg1msj98cvwxz); a refusal names its corrective action
  // (IF-01m0f0wn8994dzf9z1sdygxa04, UC-01m0fpqfxjvet99wbz0v1ag64q), and here the action is a
  // commit, not a fix.
  if (options.change !== undefined) return { ok: true, command: "gap report", data, errors: [] };
  const uncommitted = promises.length ? uncommittedEvidencePaths(repositoryRoot, workspace) : [];
  const pending = uncommitted.length
    ? ` This report reads ${baseBranch}@${commit.slice(0, 7)}, and ${uncommitted.length} path${uncommitted.length === 1 ? " is" : "s are"} uncommitted in the working tree (${uncommitted.slice(0, 3).join(", ")}${uncommitted.length > 3 ? ", …" : ""}). If the evidence is among them, commit it and read again.`
    : "";
  const errors = [
    ...promises.map((node) => ({
      code: "UNADMITTED_PROMISE",
      message: `${node.title} (${node.form}) has no evidence and admits no gap. Looked for ${node.evidenceSought}. Name that id where the promise is kept - a promise kept without naming it is still unaccounted for (D-01m14bh1g2pk1fdwm9wpsmx9zg) - or admit the gap in its frontmatter: accepted: ["<kind>: <reason>"], where <kind> is one of ${ADMISSION_KINDS.join(", ")}.${pending}`,
      path: node.path,
    })),
    ...unkinded.map((node) => ({
      code: "UNKINDED_ADMISSION",
      message: `${node.title} (${node.form}) admits a gap without saying which kind it is. Rewrite the accepted entry as one of ${ADMISSION_KINDS.join(", ")}: 'structural' when many sites realise the promise and none names it, 'unexamined' when nobody has looked yet, 'unimplemented' when someone looked and it is not built.`,
      path: node.path,
    })),
  ];
  return { ok: errors.length === 0, command: "gap report", data, errors };
}
