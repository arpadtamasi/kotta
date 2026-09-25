import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { MINTED_BODY } from "../core/identity.js";
import { readNodesUnder, type SpecForm, type SpecNode, type ValidationIssue } from "./registry.js";

/**
 * The shape of a change on disk, shared by `spec new --into`, `plan`, `approve` and `archive`:
 *
 *   openspec/changes/<name>/
 *     proposal.md, specs/**        the narrative (OpenSpec's)
 *     conversation.md              the distilled conversation, optional
 *     model/<form-directory>/<slug>-<id8>.md   the model delta: a new node, or an accepted one with the same id
 *     model/REMOVED.md             accepted nodes the change removes, one list item naming each id
 *     planning.md                  `kotta plan`'s report
 *     approval.yaml                the gate's receipt, written by `kotta approve`
 */

export const OPENSPEC_DIRECTORY = "openspec";
export const CHANGES_DIRECTORY = "changes";
export const ARCHIVE_DIRECTORY = "archive";
export const MODEL_DIRECTORY = "model";
export const REMOVED_FILE = "REMOVED.md";
export const PLANNING_FILE = "planning.md";
export const APPROVAL_FILE = "approval.yaml";

const NAME = /^[a-z0-9][a-z0-9._-]*$/;
const NODE_ID = new RegExp(`\\b[A-Za-z]{1,4}-${MINTED_BODY}\\b`, "g");

export function changesPath(root: string, ...segments: string[]): string {
  return join(root, OPENSPEC_DIRECTORY, CHANGES_DIRECTORY, ...segments);
}

/** The change directory for `name`, refused unless it exists and is not the archive. */
export function resolveChange(root: string, name: string): string {
  const trimmed = name.trim();
  if (!NAME.test(trimmed) || trimmed === ARCHIVE_DIRECTORY) {
    throw new Error(`'${name}' is not a change name; a change is a directory under ${OPENSPEC_DIRECTORY}/${CHANGES_DIRECTORY}/ named in lowercase letters, digits, '.', '_' and '-', and not '${ARCHIVE_DIRECTORY}'.`);
  }
  const directory = changesPath(root, trimmed);
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    throw new Error(`No change '${trimmed}' exists at ${relative(root, directory)}/. Create the change (its proposal) first; Kotta adds the model beside it.`);
  }
  return directory;
}

/** Open changes: every directory under `openspec/changes/` except the archive. */
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
 * The delta's fingerprint: every file under `model/`, by relative path and content. The gate's
 * receipt records it, and `archive` refuses a delta that no longer hashes to what was approved.
 */
export function deltaHash(model: Pick<ChangeModel, "modelDirectory" | "files">): string {
  const hash = createHash("sha256");
  for (const file of model.files) {
    hash.update(file);
    hash.update("\0");
    hash.update(readFileSync(join(model.modelDirectory, file)));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}
