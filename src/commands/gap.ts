import { extname } from "node:path";
import { parse as parseYaml } from "yaml";
import { readWorkspaceConfig } from "../core/config.js";
import { parseMarkdown } from "../core/markdown.js";
import { workspaceDirectoryName } from "../filesystem/workspace.js";
import { git } from "../git/git.js";

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
      });
    }
  }
  return nodes.sort((left, right) => left.title.localeCompare(right.title) || left.id.localeCompare(right.id));
}

function evidenceKind(path: string): GapEvidence["kind"] {
  if (/(?:^|\/)(?:test|tests|spec|specs)(?:\/|$)|\.(?:test|spec)\./i.test(path)) return "test";
  if (/(?:^|\/)(?:bin|cli|commands|scripts)(?:\/|$)|(?:^|\/)package\.json$|\.(?:sh|bash|zsh)$/i.test(path)) return "command";
  return "code";
}

function readableRepositoryFiles(root: string, ref: string, workspace: string): Array<{ path: string; text: string }> {
  const excluded = `${workspace}/`;
  return treePaths(root, ref).filter((path) => !path.startsWith(excluded)).flatMap((path) => {
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
 * for: the accepted specification itself, or any file outside the workspace, which is where
 * evidence lives. Deliberately not read — the report's subject is what landed, and claiming an
 * unread file is the evidence would be the overclaim BR-01m0pw5bc7b1rkg5dct5qgdkmb forbids.
 */
function uncommittedEvidencePaths(root: string, workspace: string): string[] {
  const status = git(root, ["status", "--porcelain"]);
  if (!status) return [];
  return status.split(/\r?\n/).filter(Boolean)
    // Porcelain v1: two status columns, a space, then the path; a rename carries `old -> new`.
    .map((line) => line.slice(3).split(" -> ").at(-1)!.replace(/^"|"$/g, ""))
    .filter((path) => path.startsWith(`${workspace}/spec/`) || !path.startsWith(`${workspace}/`))
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
  const lines = [
    "# Implementation gap report",
    "",
    `Base: ${data.baseBranch}@${data.commit}`,
    // Counted apart, because the three ask for opposite work and one total hid that
    // (BR-01m0swjgrreeby1pyfdzf4mf7d). `unimplemented` is the one to read as debt.
    `Promises without evidence: ${data.promises.length} · ${ADMISSION_KINDS.map((kind) => `${kind}: ${data.acceptedGaps.filter((gap) => gap.kind === kind).length}`).join(" · ")}${data.unkinded.length ? ` · admitted without a kind: ${data.unkinded.length}` : ""} · Unspecified enforcement: ${data.reverse.length}`,
  ];
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
    for (const node of data.promises) lines.push(`- ${node.changed ? "[changed] " : ""}${node.title} · ${node.id} — looked for ${node.evidenceSought} (${node.path})`);
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
  if (data.reverse.length) {
    lines.push("", "## Enforced behavior with no specification trace");
    for (const gap of data.reverse) lines.push(`- ${gap.behavior} [${gap.kind}] — ${gap.path}:${gap.line}; looked for ${gap.evidenceSought}`);
  }
  if (!data.promises.length && !data.acceptedGaps.length && !data.reverse.length) lines.push("", "No implementation gaps found.");
  return `${lines.join("\n")}\n`;
}

/** Read only committed bytes from the configured base branch; never refreshes an index or writes. */
export function gapReport(repositoryRoot: string): GapReportResult {
  const config = readWorkspaceConfig(repositoryRoot);
  const baseBranch = config.baseBranch;
  const commit = git(repositoryRoot, ["rev-parse", "--verify", `${baseBranch}^{commit}`]);
  const workspace = workspaceDirectoryName(repositoryRoot);
  const nodes = acceptedNodes(repositoryRoot, commit, workspace);
  const files = readableRepositoryFiles(repositoryRoot, commit, workspace);
  const landing = lastSpecLanding(repositoryRoot, commit, workspace);

  const described = nodes.map((node): GapNode => ({
    ...node,
    changed: landing.changedPaths.has(node.path),
    evidence: files.filter((file) => file.text.includes(node.id)).map((file) => ({ kind: evidenceKind(file.path), path: file.path }))
      .sort((left, right) => left.kind.localeCompare(right.kind) || left.path.localeCompare(right.path)),
    evidenceSought: `the exact node id ${node.id} in code, tests, or command definitions on ${baseBranch}@${commit}`,
  })).sort((left, right) => Number(right.changed) - Number(left.changed) || left.title.localeCompare(right.title) || left.id.localeCompare(right.id));

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
  const reverse = enforcementSites(files, nodes.map((node) => node.id));
  const data: GapReportResult["data"] = {
    baseBranch,
    commit,
    specLanding: landing.commit,
    landingTouched: landing.touched,
    changedNodes: described.filter((node) => node.changed).map((node) => node.id),
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
