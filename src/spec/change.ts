import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { MINTED_BODY } from "../core/identity.js";
import { workspaceDirectoryName, workspacePath } from "../filesystem/workspace.js";
import { readNodesUnder, type SpecForm, type SpecNode, type ValidationIssue } from "./registry.js";

/**
 * The shape of a change on disk, shared by `change new`, `spec new --into`, `plan`, `approve` and
 * `archive`. A change is Kotta's own, inside the workspace, whether or not the project uses OpenSpec:
 *
 *   .kotta/changes/<name>/
 *     proposal.md                  why and what, in prose, with the questions still open
 *     conversation.md              the distilled conversation, optional
 *     model/<form-directory>/<slug>-<id8>.md   the model delta: a new node, or an accepted one with the same id
 *     model/REMOVED.md             accepted nodes the change removes, one list item naming each id
 *     planning.md                  `kotta plan`'s report
 *     approval.yaml                the gate's receipt, written by `kotta approve`
 */

export const CHANGES_DIRECTORY = "changes";
/** OpenSpec's tree, read only when the project uses OpenSpec: its narrative, and changes to import. */
export const OPENSPEC_DIRECTORY = "openspec";
export const PROPOSAL_FILE = "proposal.md";
export const ARCHIVE_DIRECTORY = "archive";
export const MODEL_DIRECTORY = "model";
export const REMOVED_FILE = "REMOVED.md";
export const PLANNING_FILE = "planning.md";
export const APPROVAL_FILE = "approval.yaml";
/** Form definitions a change carries, landed in the registry by archive (BR-01m4ee245pe1wb8x8n7wxyvxwh). */
export const FORMS_DIRECTORY = "forms";

const NAME = /^[a-z0-9][a-z0-9._-]*$/;
const NODE_ID = new RegExp(`\\b[A-Za-z]{1,4}-${MINTED_BODY}\\b`, "g");

/** Inside the workspace: `.kotta/changes/<segments>`. */
export function changesPath(root: string, ...segments: string[]): string {
  return workspacePath(root, CHANGES_DIRECTORY, ...segments);
}

/** The repository-relative changes folder, `.kotta/changes`, as a path is written in a source or a message. */
export function changesFolder(root: string): string {
  return `${workspaceDirectoryName(root)}/${CHANGES_DIRECTORY}`;
}

/** OpenSpec's own changes folder, `openspec/changes/<segments>`. Kotta writes nothing there. */
export function openSpecChangesPath(root: string, ...segments: string[]): string {
  return join(root, OPENSPEC_DIRECTORY, CHANGES_DIRECTORY, ...segments);
}

export function assertChangeName(name: string): string {
  const trimmed = name.trim();
  if (!NAME.test(trimmed) || trimmed === ARCHIVE_DIRECTORY) {
    throw new Error(`'${name}' is not a change name; name it in lowercase letters, digits, '.', '_' and '-', and not '${ARCHIVE_DIRECTORY}'.`);
  }
  return trimmed;
}

/** The change directory for `name`, refused unless it exists and is not the archive. */
export function resolveChange(root: string, name: string): string {
  const trimmed = assertChangeName(name);
  const directory = changesPath(root, trimmed);
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    const stranded = openSpecChangesPath(root, trimmed);
    if (existsSync(stranded) && statSync(stranded).isDirectory()) {
      throw new Error(`The change '${trimmed}' is at ${relative(root, stranded)}/, OpenSpec's folder; a Kotta change lives at ${relative(root, directory)}/. Move it there: git mv ${relative(root, stranded)} ${relative(root, directory)}`);
    }
    throw new Error(`No change '${trimmed}' exists at ${relative(root, directory)}/. Open it with 'kotta change new ${trimmed}'.`);
  }
  return directory;
}

/**
 * Open changes under `openspec/changes/`: where an earlier release kept them, and where no command
 * reads them any more. `kotta migrate` moves them into the workspace.
 */
export function strandedChanges(root: string): string[] {
  const directory = openSpecChangesPath(root);
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== ARCHIVE_DIRECTORY)
    .map((entry) => entry.name)
    .sort();
}

/** Open changes: every directory under `.kotta/changes/` except the archive. */
export function listChanges(root: string): string[] {
  const directory = changesPath(root);
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== ARCHIVE_DIRECTORY)
    .map((entry) => entry.name)
    .sort();
}

export interface ChangeModel {
  name: string;
  directory: string;
  modelDirectory: string;
  nodes: SpecNode[];
  /** Ids `model/REMOVED.md` names, in document order. */
  removed: string[];
  issues: ValidationIssue[];
  /** Every file under `model/`, relative to it, sorted: what the delta hash covers. */
  files: string[];
}

function filesUnder(directory: string, prefix = ""): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    return entry.isDirectory() ? filesUnder(join(directory, entry.name), path) : [path];
  }).sort();
}

/** The ids a REMOVED.md names: every minted id in a top-level list item. */
export function parseRemoved(content: string): string[] {
  const ids: string[] = [];
  for (const line of content.split(/\r?\n/)) {
    if (!/^ {0,3}(?:[-*+]|\d+[.)])\s+/.test(line)) continue;
    for (const match of line.match(NODE_ID) ?? []) if (!ids.includes(match)) ids.push(match);
  }
  return ids;
}

/** Read a change's model delta. Nothing here measures it; `plan` does. */
export function readChangeModel(root: string, name: string, forms: SpecForm[]): ChangeModel {
  const directory = resolveChange(root, name);
  const modelDirectory = join(directory, MODEL_DIRECTORY);
  const { nodes, issues } = readNodesUnder(modelDirectory, forms);
  const files = filesUnder(modelDirectory);
  const known = new Set(forms.map((form) => form.directory));
  for (const file of files) {
    if (file === REMOVED_FILE) continue;
    if (file.startsWith(`${FORMS_DIRECTORY}/`) && file.endsWith(".yaml") && !file.slice(FORMS_DIRECTORY.length + 1).includes("/")) continue;
    const inForm = [...known].some((formDirectory) => file.startsWith(`${formDirectory}/`) && !file.slice(formDirectory.length + 1).includes("/"));
    if (!inForm || !file.endsWith(".md")) {
      issues.push({ code: "CHANGE_MODEL_STRAY_FILE", message: `model/${file} is not a node in a registered form directory, nor ${REMOVED_FILE}. Move it under model/<form directory>/ or out of model/.`, path: join(modelDirectory, file) });
    }
  }
  const removedPath = join(modelDirectory, REMOVED_FILE);
  const removed = existsSync(removedPath) ? parseRemoved(readFileSync(removedPath, "utf8")) : [];
  return { name: name.trim(), directory, modelDirectory, nodes, removed, issues, files };
}

/**
 * One accepted node's fingerprint, as `kotta approve` records it for every node the delta replaces
 * and `kotta archive` checks it, so a node changed after the yes is never overwritten with an older
 * copy (BR-01m4at3x2fffqepx85tmvf3hxw).
 */
export function nodeFingerprint(path: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
}

/**
 * The delta's fingerprint: every file under `model/`, by relative path and content. The gate's
 * receipt records it, and `archive` refuses a delta that no longer hashes to what was approved.
 */
export function deltaHash(model: Pick<ChangeModel, "modelDirectory" | "files">): string {
  return hashDelta(model.files, (file) => readFileSync(join(model.modelDirectory, file)));
}

/** The same fingerprint over any reader of `model/`: the disk for the gate, a commit for `kotta gap`. */
export function hashDelta(files: string[], read: (file: string) => Buffer, raw = false): string {
  const hash = createHash("sha256");
  for (const file of [...files].sort()) {
    hash.update(file);
    hash.update("\0");
    hash.update(raw ? read(file) : withoutAdmission(read(file)));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

/**
 * Does a receipt's basis name this delta? Either by the fingerprint above, or by the one earlier
 * releases wrote, over every byte: a yes recorded before admissions stopped counting still holds
 * for a delta nobody touched since.
 */
export function approvesDelta(basis: unknown, files: string[], read: (file: string) => Buffer): boolean {
  return basis === hashDelta(files, read) || basis === hashDelta(files, read, true);
}

/**
 * A node's bytes without its `accepted:` entry. An admission says whether a promise is kept yet,
 * never what it promises, so writing one after the yes - the way an unbuilt node passes `archive`
 * (BR-01m3w9ajdxbf04ph4y97dmry35, EX-01m3wa6fbrg18wtsvfrdab0wn9) - leaves the approval standing. A
 * file that carries no admission is returned byte for byte.
 */
function withoutAdmission(content: Buffer): Buffer {
  const text = content.toString("utf8");
  const opening = /^---\r?\n/.exec(text);
  if (!opening) return content;
  const closing = text.slice(opening[0].length).search(/^---\s*$/m);
  if (closing < 0) return content;
  const end = opening[0].length + closing;
  const lines = text.slice(opening[0].length, end).split(/(?<=\n)/);
  const start = lines.findIndex((line) => /^accepted\s*:/.test(line));
  if (start < 0) return content;
  let stop = start + 1;
  // The entry runs to the next top-level key: its list items and folded lines are indented or dashed.
  while (stop < lines.length && /^(?:\s|-|$)/.test(lines[stop])) stop += 1;
  return Buffer.from(text.slice(0, opening[0].length) + [...lines.slice(0, start), ...lines.slice(stop)].join("") + text.slice(end), "utf8");
}
