import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { findRepositoryRoot, workspaceDirectoryName, workspacePath } from "../filesystem/workspace.js";

/**
 * Kotta's rules used to reach a project only by a human copying this repository's `AGENTS.md` by
 * hand, which is why the install line — the one fact an agent without the CLI needs — never
 * travelled with them (F-01kztn8rzehzvdfqq1snwc55jk). The rules now ship, and Kotta writes them
 * into the workspace directory it already owns outright.
 *
 * The project's own `AGENTS.md` stays the project's. Kotta links it only when asked. The one
 * exception to append-only linking is a legacy Kotta prelude: its explicit `## This repository`
 * boundary lets Kotta replace its old copied rules while preserving the project's section byte for
 * byte. Unrecognised content is never removed.
 */

export const WORKSPACE_AGENTS_FILE = "AGENTS.md";
export const PROJECT_AGENTS_FILE = "AGENTS.md";

export type WorkspaceAgentsState = "created" | "updated" | "unchanged" | "drifted" | "replaced";
export type ProjectAgentsState = "created" | "linked" | "migrated" | "already-linked";

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
 * The one sentence a drifted file is missing: how to stop being drifted. A verdict with no remedy
 * is what left this repository's own rules file behind its template for two days
 * (F-01m0tnv8vmjjjack09xt7w25zf, IF-01m0f0wn8994dzf9z1sdygxa04).
 */
export const REPLACE_RULES_REMEDY = "To discard those edits and take Kotta's copy, run 'kotta sync --replace-rules'; to keep them, move them into the project's own AGENTS.md, which Kotta never writes.";

export interface SyncAgentsOptions {
  /**
   * Take Kotta's copy, discarding whatever the file holds. Deliberate by construction: the same
   * rule that promises an edited file survives (BR-01m0f1djtb5dkb76tjzq4x3ffh) is the one this
   * overrides, so nothing sets it implicitly.
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

export interface ProjectAgentsResult {
  path: string;
  state: ProjectAgentsState;
  line: string;
}

const LEGACY_KOTTA_OPENING = "# AGENTS.md\n\nThis repository runs on **Kotta**.";
const LEGACY_KOTTA_SECTIONS = [
  "## The rule everything else follows from",
  "## Orient yourself first",
  "## The lifecycle",
  "## Rules for agents",
  "## Skills",
];

/**
 * Return the project-owned suffix of a copied, pre-shipped Kotta rules file. The detector is
 * deliberately structural rather than tied to one historical version: downstream copies changed
 * as Kotta evolved, but every shipped-era ancestor used the same opening, section set and explicit
 * ownership boundary. Requiring all of them prevents a casual Kotta mention from authorising a
 * deletion.
 */
function legacyProjectSection(current: string): string | null {
  const boundary = /^## This repository\r?$/m.exec(current);
  if (!boundary || boundary.index === undefined) return null;

  const prelude = current.slice(0, boundary.index).replaceAll("\r\n", "\n");
  if (!prelude.startsWith(LEGACY_KOTTA_OPENING)) return null;
  if (!LEGACY_KOTTA_SECTIONS.every((section) => prelude.includes(`\n${section}\n`))) return null;
  if (!prelude.includes("A defect in Kotta itself is not a task here:")) return null;
  return current.slice(boundary.index);
}

/**
 * Link the project's own `AGENTS.md` to the workspace rules, creating the file when there is none.
 * Ordinary project content is append-only. A recognised legacy Kotta prelude is replaced by the
 * pointer while its explicitly delimited project section is preserved byte-for-byte. A file that
 * already points at the workspace rules is left exactly as it is.
 */
export function linkProjectAgents(repositoryRoot?: string): ProjectAgentsResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const path = join(root, PROJECT_AGENTS_FILE);
  const line = pointerLine(root);
  const target = `${workspaceDirectoryName(root)}/${WORKSPACE_AGENTS_FILE}`;

  if (!existsSync(path)) {
    writeFileSync(path, `${line}\n`);
    return { path, state: "created", line };
  }

  const current = readFileSync(path, "utf8");
  const projectSection = legacyProjectSection(current);
  if (projectSection !== null) {
    // Some workspaces already had the pointer appended beneath their project section. In that case
    // removing only the legacy prelude is enough; otherwise put the pointer before the untouched
    // project-owned suffix.
    const migrated = projectSection.includes(target) ? projectSection : `${line}\n\n${projectSection}`;
    writeFileSync(path, migrated);
    return { path, state: "migrated", line };
  }
  if (current.includes(target)) return { path, state: "already-linked", line };
  const separator = current.endsWith("\n\n") ? "" : current.endsWith("\n") ? "\n" : "\n\n";
  writeFileSync(path, `${current}${separator}${line}\n`);
  return { path, state: "linked", line };
}
