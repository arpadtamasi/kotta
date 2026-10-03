import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { findRepositoryRoot, workspaceDirectoryName, workspacePath } from "../filesystem/workspace.js";

/**
 * Kotta's rules ship with the package and are written into the workspace directory it owns, with
 * the install line — the one fact an agent without the CLI needs — rendered from the package that
 * is actually running.
 *
 * The project's own `AGENTS.md` stays the project's: Kotta creates it when there is none, and never
 * writes an existing one (BR-01m0f1djtb5dkb76tjzq4x3ffh).
 */

export const WORKSPACE_AGENTS_FILE = "AGENTS.md";
export const PROJECT_AGENTS_FILE = "AGENTS.md";

export type WorkspaceAgentsState = "created" | "updated" | "unchanged" | "drifted" | "replaced";
export type ProjectAgentsState = "created" | "already-linked" | "unlinked";

function packageRoot(): string {
  return fileURLToPath(new URL("../..", import.meta.url));
}

/** The published identity, read from the running package rather than typed into the template. */
function publishedPackage(): { name: string; version: string } {
  const manifest = JSON.parse(readFileSync(join(packageRoot(), "package.json"), "utf8")) as { name?: unknown; version?: unknown };
  const name = typeof manifest.name === "string" ? manifest.name : "";
  const version = typeof manifest.version === "string" ? manifest.version : "";
  if (!name || !version) throw new Error("The Kotta package has no readable name and version; the rules file would name no install command.");
  return { name, version };
}

export function shippedAgentsTemplate(): string {
  return join(packageRoot(), "templates", WORKSPACE_AGENTS_FILE);
}

/**
 * The rules as this installation would write them. The install command is rendered from the
 * package's own name and version, so it cannot name a package that is not the one running.
 */
export function renderAgentsFile(root: string): string {
  const { name, version } = publishedPackage();
  return readFileSync(shippedAgentsTemplate(), "utf8")
    .replaceAll("{{package}}", name)
    .replaceAll("{{version}}", version)
    .replaceAll("{{workspace}}", workspaceDirectoryName(root));
}

/**
 * What Kotta last wrote, by content hash. The skills installer answers the same question with an
 * ownership manifest; here the file lives in the operator's repository rather than in a home-
 * directory cache, so an edited copy is reported and left alone instead of being replaced.
 */
function generatedManifestPath(root: string): string {
  return workspacePath(root, ".kotta-generated.json");
}

function digest(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function readGenerated(root: string): Record<string, string> {
  const path = generatedManifestPath(root);
  if (!existsSync(path)) return {};
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { files?: unknown };
    return parsed.files && typeof parsed.files === "object" ? { ...(parsed.files as Record<string, string>) } : {};
  } catch {
    return {}; // an unreadable manifest claims nothing: better to report drift than to clobber
  }
}

function writeGenerated(root: string, files: Record<string, string>): void {
  writeFileSync(generatedManifestPath(root), `${JSON.stringify({ files }, null, 2)}\n`);
}

export interface WorkspaceAgentsResult {
  path: string;
  state: WorkspaceAgentsState;
  /** On `replaced`, how many lines of the discarded copy there were, so the report can say. */
  discardedLines?: number;
}

/**
 * The one sentence a drifted file is missing: how to stop being drifted. Drift is a state to leave;
 * this names the one command that leaves it.
 */
export const REPLACE_RULES_REMEDY = "To discard those edits and take Kotta's copy, run 'kotta sync --replace-rules'; to keep them, move them into the project's own AGENTS.md, which Kotta never writes.";

export interface SyncAgentsOptions {
  /**
   * Take Kotta's copy, discarding whatever the file holds. Deliberate by construction: the same
   * rule that promises an edited file survives is the one this overrides, so nothing sets it
   * implicitly.
   */
  replace?: boolean;
}

/** Write or refresh the workspace rules file, never replacing one that was edited by hand. */
export function syncWorkspaceAgents(repositoryRoot?: string, options: SyncAgentsOptions = {}): WorkspaceAgentsResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const path = workspacePath(root, WORKSPACE_AGENTS_FILE);
  const rendered = renderAgentsFile(root);
  const generated = readGenerated(root);

  if (existsSync(path)) {
    const current = readFileSync(path, "utf8");
    if (current === rendered) {
      // Adopt an identical copy: it is ours by content, whatever wrote it.
      writeGenerated(root, { ...generated, [WORKSPACE_AGENTS_FILE]: digest(rendered) });
      return { path, state: "unchanged" };
    }
    if (generated[WORKSPACE_AGENTS_FILE] !== digest(current)) {
      if (!options.replace) return { path, state: "drifted" };
      writeFileSync(path, rendered);
      writeGenerated(root, { ...generated, [WORKSPACE_AGENTS_FILE]: digest(rendered) });
      return { path, state: "replaced", discardedLines: current.split(/\r?\n/).length };
    }
    writeFileSync(path, rendered);
    writeGenerated(root, { ...generated, [WORKSPACE_AGENTS_FILE]: digest(rendered) });
    return { path, state: "updated" };
  }

  writeFileSync(path, rendered);
  writeGenerated(root, { ...generated, [WORKSPACE_AGENTS_FILE]: digest(rendered) });
  return { path, state: "created" };
}

/** Is the installed rules file missing, or no longer what this Kotta would write? */
export function agentsDrift(repositoryRoot?: string): { present: boolean; drifted: boolean; path: string } {
  const root = repositoryRoot ?? findRepositoryRoot();
  const path = workspacePath(root, WORKSPACE_AGENTS_FILE);
  if (!existsSync(path)) return { present: false, drifted: false, path };
  return { present: true, drifted: readFileSync(path, "utf8") !== renderAgentsFile(root), path };
}

/** The one line Kotta ever adds to a project's own AGENTS.md. */
export function pointerLine(repositoryRoot?: string): string {
  const root = repositoryRoot ?? findRepositoryRoot();
  return `@${workspaceDirectoryName(root)}/${WORKSPACE_AGENTS_FILE}`;
}

/**
 * What Kotta writes into a project's own file. Never a bare pointer: a reader who meets
 * `@.kotta/AGENTS.md` alone after the last line of someone's conventions has been told nothing.
 * An agent that has read the document places this better; this is the deterministic path, for
 * environments that have none.
 */
function pointerBlock(line: string): string {
  return [
    "## Kotta",
    "",
    "This repository keeps its technical specification with Kotta. The rules its",
    "agents follow are kept with the workspace and included here:",
    "",
    line,
  ].join("\n");
}

export interface ProjectAgentsResult {
  path: string;
  state: ProjectAgentsState;
  line: string;
}

/**
 * The project's own `AGENTS.md`, as far as Kotta goes (BR-01m0f1djtb5dkb76tjzq4x3ffh): created with
 * the reference when there is none — nothing to protect — and otherwise never written. An existing
 * file that does not point at the rules is reported with the exact line, for an agent that has read
 * it to place on the human's yes (EX-01m0f1djtcvdqkvr4r4dd2qamd). A pre-1.0 Kotta prelude in it is
 * ordinary project content.
 */
export function linkProjectAgents(repositoryRoot?: string): ProjectAgentsResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const path = join(root, PROJECT_AGENTS_FILE);
  const line = pointerLine(root);
  const target = `${workspaceDirectoryName(root)}/${WORKSPACE_AGENTS_FILE}`;

  if (!existsSync(path)) {
    // Nothing to protect, and rules nobody reads are not installed: this path asks no one.
    writeFileSync(path, `${pointerBlock(line)}\n`);
    return { path, state: "created", line };
  }
  return { path, state: readFileSync(path, "utf8").includes(target) ? "already-linked" : "unlinked", line };
}

/**
 * Claude Code reads `CLAUDE.md`, not `AGENTS.md`. On that host a project whose `AGENTS.md` points
 * at the rules still installs rules nobody reads, so the same policy reaches one file further
 * (BR-01m0f1djtb5dkb76tjzq4x3ffh): where there is no `CLAUDE.md`, Kotta creates it with the one
 * include line, unasked — there is nothing to protect; where there is one without the line, it is
 * reported and left alone, for an agent to place the line on the human's yes.
 *
 * The file includes the project's `AGENTS.md`, never Kotta's rules directly: the project's own
 * instructions live there too, and a Claude Code agent should read the same thing any other does.
 */
export const PROJECT_CLAUDE_FILE = "CLAUDE.md";
export const CLAUDE_POINTER_LINE = `@${PROJECT_AGENTS_FILE}`;

export type ProjectClaudeState = "created" | "already-linked" | "unlinked";

export interface ProjectClaudeResult {
  path: string;
  state: ProjectClaudeState;
  line: string;
}

function claudePointerBlock(): string {
  return [
    "Claude Code reads this file rather than AGENTS.md. The project's agent instructions, Kotta's",
    "rules among them, live there and are included here:",
    "",
    CLAUDE_POINTER_LINE,
  ].join("\n");
}

/** A line that includes the project's AGENTS.md, or Kotta's rules directly, already reaches them. */
function claudeFileReachesRules(content: string, root: string): boolean {
  if (/^[ \t]*@(?:\.\/)?AGENTS\.md[ \t]*\r?$/m.test(content)) return true;
  return content.includes(`@${workspaceDirectoryName(root)}/${WORKSPACE_AGENTS_FILE}`);
}

/**
 * Make sure a Claude Code agent reaches the rules. Returns null when the project has no
 * `AGENTS.md` to include: a pointer at a file that does not exist reaches nothing.
 */
export function syncProjectClaude(repositoryRoot?: string): ProjectClaudeResult | null {
  const root = repositoryRoot ?? findRepositoryRoot();
  if (!existsSync(join(root, PROJECT_AGENTS_FILE))) return null;
  const path = join(root, PROJECT_CLAUDE_FILE);
  const line = CLAUDE_POINTER_LINE;

  if (!existsSync(path)) {
    writeFileSync(path, `${claudePointerBlock()}\n`);
    return { path, state: "created", line };
  }
  const current = readFileSync(path, "utf8");
  if (claudeFileReachesRules(current, root)) return { path, state: "already-linked", line };
  return { path, state: "unlinked", line };
}
