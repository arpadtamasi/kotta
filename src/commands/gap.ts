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

export interface AcceptedImplementationGap {
  id: string;
  title: string;
  path: string;
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
    changedNodes: string[];
    nodes: GapNode[];
    promises: GapNode[];
    acceptedGaps: AcceptedImplementationGap[];
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

function lastSpecLanding(root: string, ref: string, workspace: string): { commit: string | null; changedPaths: Set<string> } {
  const commit = git(root, ["log", "-1", "--format=%H", ref, "--", `${workspace}/spec`]) || null;
  if (!commit) return { commit: null, changedPaths: new Set() };
  const ancestry = git(root, ["rev-list", "--parents", "-n", "1", commit]).split(/\s+/);
  const listed = ancestry.length > 1
    ? git(root, ["diff", "--name-only", ancestry[1], commit, "--", `${workspace}/spec`])
    : git(root, ["ls-tree", "-r", "--name-only", commit, "--", `${workspace}/spec`]);
  return { commit, changedPaths: new Set(listed ? listed.split(/\r?\n/).filter(Boolean) : []) };
}

function acceptedImplementationReason(entries: string[]): string | null {
  for (const entry of entries) {
    const separator = entry.indexOf(":");
    if (separator < 1) continue;
    const key = entry.slice(0, separator).trim().toLowerCase();
    const reason = entry.slice(separator + 1).trim();
    if (["implementation", "implementation-gap", "verification"].includes(key) && reason) return reason;
  }
  return null;
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

export function formatGapReport(data: GapReportResult["data"]): string {
  const lines = [
    "# Implementation gap report",
    "",
    `Base: ${data.baseBranch}@${data.commit}`,
    `Promises without evidence: ${data.promises.length} · Accepted gaps: ${data.acceptedGaps.length} · Unspecified enforcement: ${data.reverse.length}`,
  ];
  const changed = data.nodes.filter((node) => node.changed);
  if (changed.length) {
    lines.push("", "## Latest accepted spec delta");
    for (const node of changed) {
      const accepted = data.acceptedGaps.find((entry) => entry.id === node.id);
      const status = node.evidence.length
        ? `evidence: ${node.evidence.map((entry) => `${entry.kind} ${entry.path}`).join(", ")}`
        : accepted
          ? `accepted gap: ${accepted.reason}`
          : `missing: looked for ${node.evidenceSought}`;
      lines.push(`- ${node.title} · ${node.id} — ${status} (${node.path})`);
    }
  }
  if (data.promises.length) {
    lines.push("", "## Promises without implementing or verifying evidence");
    for (const node of data.promises) lines.push(`- ${node.changed ? "[changed] " : ""}${node.title} · ${node.id} — looked for ${node.evidenceSought} (${node.path})`);
  }
  if (data.acceptedGaps.length) {
    lines.push("", "## Accepted gaps");
    for (const node of data.acceptedGaps) lines.push(`- ${node.changed ? "[changed] " : ""}${node.title} · ${node.id} — ${node.reason} (${node.path})`);
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
  for (const node of described) {
    if (node.evidence.length) continue;
    const source = nodes.find((candidate) => candidate.id === node.id)!;
    const reason = acceptedImplementationReason(source.accepted);
    if (reason) acceptedGaps.push({ id: node.id, title: node.title, path: node.path, reason, changed: node.changed });
    else promises.push(node);
  }
  const reverse = enforcementSites(files, nodes.map((node) => node.id));
  const data: GapReportResult["data"] = {
    baseBranch,
    commit,
    specLanding: landing.commit,
    changedNodes: described.filter((node) => node.changed).map((node) => node.id),
    nodes: described,
    promises,
    acceptedGaps,
    reverse,
    report: "",
  };
  data.report = formatGapReport(data);
  // Every accepted promise is kept or admitted (BR-01m0qtshfqhcrrqtz051zm9svr). A promise with no
  // evidence and no stated reason is the one thing this read refuses over: the count of unaccounted
  // promises could otherwise only grow, because nothing in the workflow ever had to look at it.
  const errors = promises.map((node) => ({
    code: "UNADMITTED_PROMISE",
    message: `${node.title} (${node.form}) has no evidence and admits no implementation gap. Looked for ${node.evidenceSought}. Implement it, or record why it stands unimplemented in its frontmatter: accepted: ["implementation: <reason>"].`,
    path: node.path,
  }));
  return { ok: errors.length === 0, command: "gap report", data, errors };
}
