import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { parseMarkdown, renderMarkdown } from "../core/markdown.js";
import { readWorkspaceConfig } from "../core/config.js";
import {
  LEGACY_DIRECTORY, LEGACY_WORKSPACE_DIRECTORY, PROCESS_DIRECTORY, SPEC_DIRECTORY, WORKSPACE_DIRECTORIES, WORKSPACE_DIRECTORY, WORKSPACE_SCHEMA_VERSION,
  assertNotNewerWorkspace, bundledFormsDirectory, findRepositoryRoot, registeredSpecDirectories, validateSpecDirectory, workspaceConfigTemplate,
  workspaceDirectoryName, workspaceReadmeTemplate, workspaceSchemaVersion,
} from "../filesystem/workspace.js";
import { REPLACE_RULES_REMEDY, WORKSPACE_AGENTS_FILE, syncWorkspaceAgents } from "./agents.js";
import { validateWorkspace } from "./validate.js";

/**
 * `kotta migrate` — one command that carries a workspace from any pre-1.0 shape to version 6.
 *
 * Kotta 1.0 owns the technical specification and keeps no process layer. The migration therefore
 * does two things and nothing else: it carries the pre-1.0 process state — whatever shape it is in,
 * v1 to v5 — into a read-only `legacy/process/` archive in the last pre-1.0 shape, and it rewrites
 * the workspace's own files (config, README, rules) to the version-6 shape. The specification is
 * left byte-identical, and the command proves that, the way it proves no identifier was lost.
 *
 * It is the only reader in the CLI that understands the old shapes; every other command refuses
 * them and names this command. Three rules hold it together:
 *
 * - **Identifiers are never touched.** No id, no filename and no reference *value* moves; only
 *   directory names, field names and stored state values do, and only in the archive.
 * - **Idempotent and fail-before-write.** The complete plan and every conflict is resolved before
 *   mutation. A finished workspace reports "already current"; an unsafe workspace is left byte-identical.
 * - **Dry run first.** `--dry-run` computes the identical plan and writes nothing.
 */

export type MigrationChange =
  | { kind: "move"; from: string; to: string }
  | { kind: "create"; path: string }
  | { kind: "remove"; path: string }
  | { kind: "rewrite"; path: string; fields: string[] };

/** What became of the generated rules file the migration carried along. */
export interface MigrateRules {
  path: string;
  state: "created" | "updated" | "unchanged" | "drifted" | "replaced";
}

/** Whether the workspace the migration produced satisfies the rules of the shape it moved to. */
export interface MigrateValidation {
  ok: boolean;
  errors: Array<{ code: string; message: string; path?: string }>;
}

export interface MigrateData {
  root: string;
  workspace: string;
  dryRun: boolean;
  current: boolean;
  /** The shape version the workspace recorded before the migration; null when it recorded none. */
  fromVersion: number | null;
  changes: MigrationChange[];
  ids: string[];
  notes: string[];
  /** Null when nothing was written: a dry run plans the refresh, it does not perform it. */
  rules: MigrateRules | null;
  /** Null when nothing was written: there is no produced workspace to judge. */
  validation: MigrateValidation | null;
}

export interface MigrateResult {
  ok: true;
  command: "migrate";
  data: MigrateData;
}

/** The pre-1.0 lifecycle vocabulary, kept here and nowhere else: the archive is written in it. */
const TASK_STATES = ["backlog", "defined", "active", "review", "done"] as const;
const PROCESS_DIRECTORIES = ["tasks", "observations", "batches", "profiles", "claims", "decisions", "events"] as const;

const TASK_KEYS: Record<string, string> = { package: "batch", source_finding: "source_observation" };
const BATCH_KEYS: Record<string, string> = { tickets: "tasks", contracts: "tasks" };
const BATCH_AUTHORITY_KEYS: Record<string, string> = {
  create_findings: "create_observations",
  create_subtickets: "create_subtasks",
  reorder_independent_tickets: "reorder_independent_tasks",
  create_subcontracts: "create_subtasks",
  reorder_independent_contracts: "reorder_independent_tasks",
};
const OBSERVATION_KEYS: Record<string, string> = {
  finding_type: "observation_type",
  related_ticket: "related_task",
  ticket: "task",
  related_contract: "related_task",
  contract: "task",
};
const OBSERVATION_DISPOSITIONS: Record<string, string> = {
  "create-ticket": "create-task",
  "attach-to-existing-ticket": "attach-to-existing-task",
  "create-contract": "create-task",
  "attach-to-existing-contract": "attach-to-existing-task",
};
const CLAIM_KEYS: Record<string, string> = { ticket: "task", contract: "task" };

/** The config keys version 6 keeps. Everything else configured a process that no longer exists. */
const KEPT_TOP_LEVEL_KEYS = ["version", "project", "git", "validation"];
const KEPT_GIT_KEYS = ["base_branch", "protected_branches"];
const KEPT_VALIDATION_KEYS = ["strict"];

/**
 * A planned rewrite. `write` takes the target path because the file may move first: the plan is
 * computed on the layout that is on disk now, and applied to the one the moves produce.
 */
interface Rewrite { fields: string[]; write: (target: string) => void }

/** Renames keys in place, preserving the original field order — a migration should not reshuffle a file. */
function renameKeys(data: Record<string, unknown>, map: Record<string, string>): string[] {
  const entries = Object.entries(data);
  if (!entries.some(([key]) => map[key] !== undefined)) return [];
  const renamed: string[] = [];
  for (const key of Object.keys(data)) delete data[key];
  for (const [key, value] of entries) {
    const target = map[key] ?? key;
    if (target !== key) renamed.push(`${key} → ${target}`);
    data[target] = value;
  }
  return renamed;
}

/**
 * A frontmatter date written without quotes parses as a YAML timestamp, and re-serializing one turns
 * `2026-07-21` into `2026-07-21T00:00:00.000Z`. Kotta's writers always stored dates as text, so a
 * legacy timestamp is normalised to the same text before a file that is being rewritten anyway is
 * written back.
 */
function normalizeDates(data: Record<string, unknown>): boolean {
  let normalized = false;
  for (const [key, value] of Object.entries(data)) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) continue;
    data[key] = value.toISOString().slice(0, 10);
    normalized = true;
  }
  return normalized;
}

function markdownFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith(".md")).sort().map((name) => join(directory, name));
}

function planEntity(path: string, entity: "task" | "batch" | "observation", directoryState?: string): Rewrite {
  const parsed = parseMarkdown(readFileSync(path, "utf8"));
  const data = parsed.data;
  const fields: string[] = [];

  if (entity === "task") {
    fields.push(...renameKeys(data, TASK_KEYS));
    if (data.status === "ready") { data.status = "defined"; fields.push("status: ready → defined"); }
    if (data.origin === "finding") { data.origin = "observation"; fields.push("origin: finding → observation"); }
  }
  if (entity === "batch") {
    fields.push(...renameKeys(data, BATCH_KEYS));
    if (data.kind !== undefined) { delete data.kind; fields.push("kind removed"); }
    if (data.status === "ready") { data.status = "defined"; fields.push("status: ready → defined"); }
    if (data.authority && typeof data.authority === "object") {
      fields.push(...renameKeys(data.authority as Record<string, unknown>, BATCH_AUTHORITY_KEYS).map((change) => `authority.${change}`));
    }
  }
  if (entity === "observation") {
    fields.push(...renameKeys(data, OBSERVATION_KEYS));
    const disposition = typeof data.disposition === "string" ? OBSERVATION_DISPOSITIONS[data.disposition] : undefined;
    if (disposition) { fields.push(`disposition: ${String(data.disposition)} → ${disposition}`); data.disposition = disposition; }
  }

  // In the pre-flat shapes the directory a file sat in was the state authority, so its verdict is
  // transcribed into the frontmatter before the directory disappears under it.
  if (directoryState && String(data.status ?? "") !== directoryState) {
    fields.push(`status: ${String(data.status ?? "(none)")} → ${directoryState} (the state directory was the authority)`);
    data.status = directoryState;
  }

  if (fields.length && normalizeDates(data)) fields.push("dates normalised to YYYY-MM-DD text");

  return { fields, write: (target) => writeFileSync(target, renderMarkdown(data, parsed.content)) };
}

function planClaim(path: string): Rewrite {
  const data = (parseYaml(readFileSync(path, "utf8")) ?? {}) as Record<string, unknown>;
  const fields = renameKeys(data, CLAIM_KEYS);
  return { fields, write: (target) => writeFileSync(target, stringifyYaml(data)) };
}

function planEvent(path: string): Rewrite {
  const data = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  const fields = renameKeys(data, { contract: "task" });
  if (typeof data.action === "string" && data.action.startsWith("contract.")) {
    data.action = `task.${data.action.slice("contract.".length)}`;
    fields.push("action: contract.* → task.*");
  }
  return { fields, write: (target) => writeFileSync(target, `${JSON.stringify(data, null, 2)}\n`) };
}

/**
 * The version-6 configuration: what the old file said about the project and its Git branches,
 * nothing about a process. Every dropped key is named, so the dry run says exactly what is lost.
 */
function planConfig(path: string, projectName: string): Rewrite {
  const data = (parseYaml(readFileSync(path, "utf8")) ?? {}) as Record<string, unknown>;
  const fields: string[] = [];
  const project = (data.project ?? {}) as Record<string, unknown>;
  const git = (data.git ?? {}) as Record<string, unknown>;
  const validation = (data.validation ?? {}) as Record<string, unknown>;
  if (data.version !== WORKSPACE_SCHEMA_VERSION) fields.push(`version: ${data.version === undefined ? "(none)" : String(data.version)} → ${WORKSPACE_SCHEMA_VERSION}`);
  for (const key of Object.keys(data)) if (!KEPT_TOP_LEVEL_KEYS.includes(key)) fields.push(`${key} removed`);
  for (const key of Object.keys(git)) if (!KEPT_GIT_KEYS.includes(key)) fields.push(`git.${key} removed`);
  for (const key of Object.keys(validation)) if (!KEPT_VALIDATION_KEYS.includes(key)) fields.push(`validation.${key} removed`);
  const next = workspaceConfigTemplate(typeof project.name === "string" && project.name.trim() ? project.name : projectName, {
    baseBranch: typeof git.base_branch === "string" && git.base_branch.trim() ? git.base_branch : undefined,
    protectedBranches: Array.isArray(git.protected_branches) ? git.protected_branches.map(String) : undefined,
    strict: typeof validation.strict === "boolean" ? validation.strict : undefined,
  });
  const rendered = stringifyYaml(next);
  if (!fields.length && readFileSync(path, "utf8") !== rendered) fields.push("rendered in the version-6 key order");
  return { fields, write: (target) => writeFileSync(target, rendered) };
}

function isRealDirectory(path: string): boolean {
  try { return statSync(path).isDirectory() && !lstatSync(path).isSymbolicLink(); }
  catch { return false; }
}

/** Whether Git tracks anything at `path`, so the move can be recorded as a rename in the index. */
function gitTracks(root: string, path: string): boolean {
  try {
    return execFileSync("git", ["ls-files", "--", path], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Moves one preflighted source onto an absent destination — through `git mv` when Git tracks the
 * source, so the archive is a recorded rename and `git log --follow` reaches back through it, and
 * as a plain rename otherwise. Conflict handling belongs entirely to planning: reaching this
 * function means every target was proven absent before the first write.
 */
function moveEntry(root: string, from: string, to: string): void {
  if (!existsSync(from)) return;
  if (existsSync(to)) throw new Error(`Migration destination already exists: ${to}. Nothing was moved.`);
  mkdirSync(dirname(to), { recursive: true });
  if (gitTracks(root, from)) {
    try {
      execFileSync("git", ["mv", "-k", from, to], { cwd: root, stdio: "ignore" });
      if (existsSync(to) && !existsSync(from)) return;
    } catch {
      // Git declined — an untracked parent, a bare checkout — and the plain rename below is the same move.
    }
  }
  renameSync(from, to);
}

/** Every entity directory an id can live in, under any historical shape. Used for the id-stability proof. */
const ID_DIRECTORIES = [
  "tasks", "observations", "batches",
  ...TASK_STATES.map(String), "ready",
  "observations/new", "observations/resolved", "findings/new", "findings/resolved",
  ...["backlog", "ready", "defined", "active", "done"].flatMap((state) => [`batches/${state}`, `packages/${state}`]),
  "decisions",
];

/** Every id in the workspace, read from the frontmatter: the set that must be identical afterwards. */
export function workspaceIds(workspace: string): string[] {
  const ids = new Set<string>();
  const directories = [
    ...ID_DIRECTORIES,
    ...ID_DIRECTORIES.map((directory) => `${PROCESS_DIRECTORY}/${directory}`),
    ...ID_DIRECTORIES.map((directory) => `${LEGACY_DIRECTORY}/${PROCESS_DIRECTORY}/${directory}`),
  ];
  for (const directory of directories) {
    for (const path of markdownFiles(join(workspace, directory))) {
      const id = String(parseMarkdown(readFileSync(path, "utf8")).data.id ?? "").trim();
      if (id) ids.add(id);
    }
  }
  return [...ids].sort();
}

/** Content hash of every file under `directory`, keyed by relative path: the byte-identity proof for `spec/`. */
function contentSnapshot(directory: string): Map<string, string> | null {
  if (!existsSync(directory)) return null;
  const files = new Map<string, string>();
  const walk = (current: string) => {
    for (const name of readdirSync(current).sort()) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) walk(path);
      else files.set(relative(directory, path), createHash("sha256").update(readFileSync(path)).digest("hex"));
    }
  };
  walk(directory);
  return files;
}

function sameSnapshot(before: Map<string, string>, after: Map<string, string> | null): boolean {
  if (!after || before.size !== after.size) return false;
  for (const [path, digest] of before) if (after.get(path) !== digest) return false;
  return true;
}

/** Applies a list of directory moves to one workspace-relative path. */
function remap(path: string, moves: Array<{ from: string; to: string }>): string {
  let result = path;
  for (const move of moves) {
    if (result === move.from) result = move.to;
    else if (result.startsWith(`${move.from}/`)) result = `${move.to}${result.slice(move.from.length)}`;
  }
  return result;
}

function packageVersion(): string {
  const manifest = JSON.parse(readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8")) as { version?: unknown };
  return typeof manifest.version === "string" ? manifest.version : "unknown";
}

/** The archive's own explanation, written once beside it. */
export function legacyReadme(fromVersion: number | null, movesWorkspace: boolean): string {
  const shape = fromVersion === null ? "a workspace that recorded no shape version" : `workspace shape version ${fromVersion}`;
  return [
    "# Legacy process archive",
    "",
    "This directory is a **read-only archive of the pre-1.0 Kotta process state**: the tasks,",
    "observations, batches, claims, events, decisions, profiles and the generated index that the",
    "process engine of the 0.x releases kept under `process/`.",
    "",
    `\`kotta migrate\` (Kotta ${packageVersion()}) moved it here from ${shape}${movesWorkspace ? `, under the pre-rename \`${LEGACY_WORKSPACE_DIRECTORY}/\` directory` : ""}.`,
    `The records are stored in the last pre-1.0 shape (version 5): one file per entity, lifecycle state`,
    "in the frontmatter `status` field. Older vocabulary was carried to that shape on the way in;",
    "no identifier, filename or reference value was changed, and the specification beside it was",
    "left byte-identical.",
    "",
    "Kotta 1.0 owns the technical specification and has no task, claim, batch, observation or",
    "decision. Nothing in it reads or writes this directory. To work with these records as they",
    "were, install the last pre-1.0 release: `npx -y -p @arpadtamasi/kotta@0.11.1 kotta --help`.",
    "",
  ].join("\n");
}

export function migrateWorkspace(options: { dryRun?: boolean } = {}, repositoryRoot?: string): MigrateResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const dryRun = Boolean(options.dryRun);
  const changes: MigrationChange[] = [];

  // 1. Resolve the physical workspace name. Two real roots are never merged: neither one has
  // authority over the other, and discovering that only after writes would be data loss.
  const legacyWorkspace = join(root, LEGACY_WORKSPACE_DIRECTORY);
  const targetWorkspace = join(root, WORKSPACE_DIRECTORY);
  if (isRealDirectory(legacyWorkspace) && isRealDirectory(targetWorkspace)) {
    throw new Error(`Migration cannot choose between ${legacyWorkspace} and ${targetWorkspace}: both are real directories. Nothing was written.`);
  }
  const movesWorkspace = isRealDirectory(legacyWorkspace) && !isRealDirectory(targetWorkspace);
  const workspace = movesWorkspace ? legacyWorkspace : join(root, workspaceDirectoryName(root));
  if (!existsSync(workspace)) throw new Error(`No Kotta workspace exists at ${root}. Run 'kotta init' first.`);
  // Migration only ever carries a workspace forward. The CLI exempts this command from the shape
  // check so it can read old workspaces at all, so the newer direction is refused here instead.
  assertNotNewerWorkspace(root);
  const label = basename(workspace);
  const fromVersion = workspaceSchemaVersion(root);
  const idsBefore = workspaceIds(workspace);
  const specBefore = contentSnapshot(join(workspace, SPEC_DIRECTORY));

  // 2. Already there? Version 6 with nothing pre-1.0 left at the top of the workspace.
  const preEntries = readdirSync(workspace).filter((name) => ([PROCESS_DIRECTORY, ...PROCESS_DIRECTORIES, ...TASK_STATES, "ready", "findings", "packages", "forms", "index.md"] as string[]).includes(name));
  if (!movesWorkspace && fromVersion === WORKSPACE_SCHEMA_VERSION && !preEntries.length) {
    return {
      ok: true,
      command: "migrate",
      data: { root, workspace, dryRun, current: true, fromVersion, changes: [], ids: idsBefore, notes: [], rules: null, validation: null },
    };
  }
  if (movesWorkspace) changes.push({ kind: "move", from: LEGACY_WORKSPACE_DIRECTORY, to: WORKSPACE_DIRECTORY });
  const archive = join(workspace, LEGACY_DIRECTORY);
  if (existsSync(archive)) {
    throw new Error(`Migration destination already exists: ${archive}. A workspace carries one archive; move or remove this one before migrating again. Nothing was written.`);
  }

  // 3. Read and validate the data-driven spec registry before classifying any project directory.
  const flatForms = join(workspace, "forms");
  const nestedForms = join(workspace, SPEC_DIRECTORY, "forms");
  if (existsSync(flatForms) && existsSync(nestedForms)) {
    throw new Error(`Migration destination conflict: both ${flatForms} and ${nestedForms} exist. Nothing was written.`);
  }
  if (existsSync(flatForms) && !isRealDirectory(flatForms)) {
    throw new Error(`Migration cannot safely move the form registry at ${flatForms}: it must be a real directory inside the workspace. Nothing was written.`);
  }
  const formDirectory = existsSync(flatForms) ? flatForms : existsSync(nestedForms) ? nestedForms : bundledFormsDirectory();
  let specDirectories: string[] = [];
  try {
    specDirectories = registeredSpecDirectories(root, formDirectory);
  } catch (error) {
    throw new Error(`Migration cannot classify specification nodes: ${error instanceof Error ? error.message : String(error)} Nothing was written.`);
  }
  const reservedRoots = new Set([
    ...PROCESS_DIRECTORIES.map((directory) => directory.split("/")[0]),
    ...TASK_STATES.map(String),
    ...["ready", "findings", "packages", SPEC_DIRECTORY, PROCESS_DIRECTORY, LEGACY_DIRECTORY, "forms"],
  ]);
  for (const directory of specDirectories) {
    validateSpecDirectory(directory, formDirectory);
    if (reservedRoots.has(directory.split("/")[0])) {
      throw new Error(`Migration cannot safely classify registered spec directory '${directory}': its root is reserved for workspace or process data. Nothing was written.`);
    }
  }

  const registeredRoots = new Set(specDirectories.map((directory) => directory.split("/")[0]));
  const unsafeSpecPaths: string[] = [];
  for (const top of registeredRoots) {
    const source = join(workspace, top);
    if (!existsSync(source)) continue;
    if (!isRealDirectory(source)) {
      unsafeSpecPaths.push(source);
      continue;
    }
    const walk = (current: string, relativePath: string) => {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const childRelative = `${relativePath}/${entry.name}`;
        const insideDeclared = specDirectories.some((directory) => childRelative === directory || childRelative.startsWith(`${directory}/`));
        const ancestorOfDeclared = specDirectories.some((directory) => directory.startsWith(`${childRelative}/`));
        if (!insideDeclared && !ancestorOfDeclared) {
          unsafeSpecPaths.push(join(workspace, childRelative));
          continue;
        }
        if (entry.isDirectory() && !insideDeclared) walk(join(current, entry.name), childRelative);
      }
    };
    walk(source, top);
  }
  if (unsafeSpecPaths.length) {
    throw new Error(`Migration cannot safely classify registered specification director${unsafeSpecPaths.length === 1 ? "y" : "ies"}: ${unsafeSpecPaths.join(", ")}. Nothing was written.`);
  }
  const knownRoots = new Set([...reservedRoots, ...registeredRoots]);
  const unknownRoots = readdirSync(workspace, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !knownRoots.has(entry.name))
    .map((entry) => join(workspace, entry.name));
  if (unknownRoots.length) {
    throw new Error(`Migration cannot classify workspace data director${unknownRoots.length === 1 ? "y" : "ies"}: ${unknownRoots.join(", ")}. Declare each spec node directory in a form or move unrelated data out of the workspace. Nothing was written.`);
  }

  // A nested namespace plus any flat data is a destination conflict even when the exact child is
  // absent: proceeding would bless a half-migrated workspace and make later recovery ambiguous.
  const flatRoots = [...reservedRoots, ...registeredRoots]
    .filter((name) => ![SPEC_DIRECTORY, PROCESS_DIRECTORY, LEGACY_DIRECTORY].includes(name) && existsSync(join(workspace, name)));
  if ((existsSync(join(workspace, SPEC_DIRECTORY)) || existsSync(join(workspace, PROCESS_DIRECTORY))) && flatRoots.length) {
    throw new Error(`Migration found mixed legacy and nested workspace data: ${flatRoots.map((name) => join(workspace, name)).join(", ")}. Nothing was written.`);
  }

  // 4. Plan every path move. Every destination is checked now, before the first mutation. The
  // pre-flat shapes are first brought to the v5 shape under process/, then the whole namespace
  // moves to the archive in one rename.
  const moves: Array<{ from: string; to: string }> = [];
  const move = (from: string, to: string, report = true) => {
    if (!existsSync(join(workspace, from))) return;
    const duplicate = moves.find((entry) => entry.to === to);
    if (duplicate) {
      throw new Error(`Migration has multiple sources for ${join(workspace, to)}: ${join(workspace, duplicate.from)} and ${join(workspace, from)}. One entity, one file — reconcile the copies first. Nothing was written.`);
    }
    if (existsSync(join(workspace, to))) {
      throw new Error(`Migration destination already exists: ${join(workspace, to)}. Nothing was written.`);
    }
    moves.push({ from, to });
    if (report) changes.push({ kind: "move", from: `${label}/${from}`, to: `${WORKSPACE_DIRECTORY}/${remap(to, [{ from: PROCESS_DIRECTORY, to: `${LEGACY_DIRECTORY}/${PROCESS_DIRECTORY}` }])}` });
  };

  const removals: string[] = [];
  const flattened: Array<{ source: string; state: string; entity: "task" | "batch" | "observation" }> = [];
  const flatten = (source: string, target: string, state: string, entity: "task" | "batch" | "observation") => {
    const directory = join(workspace, source);
    if (!existsSync(directory)) return;
    const entries = readdirSync(directory);
    const stray = entries.filter((name) => !name.endsWith(".md"));
    if (stray.length) {
      throw new Error(`Migration cannot flatten ${directory}: unexpected entr${stray.length === 1 ? "y" : "ies"} ${stray.join(", ")}. Nothing was written.`);
    }
    for (const name of entries.filter((entry) => entry.endsWith(".md")).sort()) move(`${source}/${name}`, `${target}/${name}`);
    removals.push(source);
    changes.push({ kind: "remove", path: `${label}/${source}` });
    flattened.push({ source, state, entity });
  };
  const removeEmptiedContainer = (container: string, knownStates: string[]) => {
    if (!existsSync(join(workspace, container))) return;
    const leftover = readdirSync(join(workspace, container)).filter((name) => !knownStates.includes(name));
    if (leftover.length) {
      throw new Error(`Migration cannot flatten ${join(workspace, container)}: unexpected entr${leftover.length === 1 ? "y" : "ies"} ${leftover.join(", ")}. Nothing was written.`);
    }
    removals.push(container);
    changes.push({ kind: "remove", path: `${label}/${container}` });
  };

  const TASK_STATE_SOURCES = [...TASK_STATES.map(String), "ready"];
  const BATCH_STATE_SOURCES = ["backlog", "ready", "defined", "active", "done"];
  const canonical = (state: string) => (state === "ready" ? "defined" : state);
  for (const prefix of ["", PROCESS_DIRECTORY]) {
    for (const state of TASK_STATE_SOURCES) {
      flatten(prefix ? `${prefix}/${state}` : state, `${PROCESS_DIRECTORY}/tasks`, canonical(state), "task");
    }
    for (const container of ["batches", "packages"]) {
      const containerPath = prefix ? `${prefix}/${container}` : container;
      for (const state of BATCH_STATE_SOURCES) flatten(`${containerPath}/${state}`, `${PROCESS_DIRECTORY}/batches`, canonical(state), "batch");
      if (containerPath !== `${PROCESS_DIRECTORY}/batches`) removeEmptiedContainer(containerPath, BATCH_STATE_SOURCES);
    }
    for (const container of ["observations", "findings"]) {
      const containerPath = prefix ? `${prefix}/${container}` : container;
      for (const state of ["new", "resolved"]) flatten(`${containerPath}/${state}`, `${PROCESS_DIRECTORY}/observations`, state, "observation");
      if (containerPath !== `${PROCESS_DIRECTORY}/observations`) removeEmptiedContainer(containerPath, ["new", "resolved"]);
    }
  }
  for (const directory of ["profiles", "claims", "events", "decisions"]) move(directory, `${PROCESS_DIRECTORY}/${directory}`);
  move("forms", `${SPEC_DIRECTORY}/forms`);
  for (const top of registeredRoots) move(top, `${SPEC_DIRECTORY}/${top}`);
  if (existsSync(join(workspace, "index.md"))) move("index.md", `${PROCESS_DIRECTORY}/index.md`);

  // The archive: the whole process namespace, whether it was there already or the moves above
  // assemble it, leaves in one rename. Reported once, as the move it is.
  const archives = existsSync(join(workspace, PROCESS_DIRECTORY)) || moves.some((entry) => entry.to === PROCESS_DIRECTORY || entry.to.startsWith(`${PROCESS_DIRECTORY}/`));
  if (archives) {
    moves.push({ from: PROCESS_DIRECTORY, to: `${LEGACY_DIRECTORY}/${PROCESS_DIRECTORY}` });
    changes.push({ kind: "move", from: `${label}/${PROCESS_DIRECTORY}`, to: `${WORKSPACE_DIRECTORY}/${LEGACY_DIRECTORY}/${PROCESS_DIRECTORY}` });
    changes.push({ kind: "create", path: `${WORKSPACE_DIRECTORY}/${LEGACY_DIRECTORY}/README.md` });
  }

  // 5. Frontmatter, claims, events and config: planned on today's paths, applied to tomorrow's.
  const rewrites: Array<{ relativePath: string; rewrite: Rewrite }> = [];
  const plan = (path: string, planner: (path: string) => Rewrite) => {
    const rewrite = planner(path);
    if (!rewrite.fields.length) return;
    const relativePath = relative(workspace, path);
    rewrites.push({ relativePath, rewrite });
    changes.push({ kind: "rewrite", path: `${WORKSPACE_DIRECTORY}/${remap(relativePath, moves)}`, fields: rewrite.fields });
  };

  for (const { source, state, entity } of flattened) {
    for (const path of markdownFiles(join(workspace, source))) plan(path, (file) => planEntity(file, entity, state));
  }
  for (const [directory, entity] of [["tasks", "task"], ["batches", "batch"], ["observations", "observation"]] as const) {
    for (const path of markdownFiles(join(workspace, PROCESS_DIRECTORY, directory))) plan(path, (file) => planEntity(file, entity));
  }
  for (const claims of [join(workspace, "claims"), join(workspace, PROCESS_DIRECTORY, "claims")]) {
    if (existsSync(claims)) {
      for (const name of readdirSync(claims).filter((entry) => entry.endsWith(".yaml")).sort()) plan(join(claims, name), planClaim);
    }
  }
  for (const events of [join(workspace, "events"), join(workspace, PROCESS_DIRECTORY, "events")]) {
    if (!existsSync(events)) continue;
    for (const entity of readdirSync(events, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort()) {
      for (const name of readdirSync(join(events, entity)).filter((entry) => entry.endsWith(".json")).sort()) {
        plan(join(events, entity, name), planEvent);
      }
    }
  }
  const config = join(workspace, "config.yaml");
  if (existsSync(config)) plan(config, (path) => planConfig(path, basename(root)));
  else changes.push({ kind: "create", path: `${WORKSPACE_DIRECTORY}/config.yaml` });

  // The workspace's own README describes the shape it is in; a migrated workspace gets this Kotta's.
  const readme = join(workspace, "README.md");
  const readmeCurrent = existsSync(readme) && readFileSync(readme, "utf8") === workspaceReadmeTemplate();
  if (!readmeCurrent) changes.push(existsSync(readme) ? { kind: "rewrite", path: `${WORKSPACE_DIRECTORY}/README.md`, fields: ["workspace README → this Kotta's copy"] } : { kind: "create", path: `${WORKSPACE_DIRECTORY}/README.md` });

  // A workspace with no form registry at all gets the bundled one, as init would give it; a
  // workspace that has one is left exactly as it is, because the specification is the project's.
  const installsForms = !existsSync(flatForms) && !existsSync(nestedForms);
  if (installsForms) changes.push({ kind: "create", path: `${WORKSPACE_DIRECTORY}/${SPEC_DIRECTORY}/forms (the bundled form registry)` });

  // The generated index is gone with the process, and so is the merge driver it needed.
  const attributesPath = join(root, ".gitattributes");
  const attributes = existsSync(attributesPath) ? readFileSync(attributesPath, "utf8") : "";
  const staleAttributes = new Set(WORKSPACE_DIRECTORIES.flatMap((directory) => [`${directory}/index.md merge=union`, `${directory}/${PROCESS_DIRECTORY}/index.md merge=union`]));
  const attributeLines = attributes.split(/\r?\n/);
  const keptAttributeLines = attributeLines.filter((line) => !staleAttributes.has(line.trim()));
  const attributesChange = keptAttributeLines.length !== attributeLines.length;
  const attributesRendered = keptAttributeLines.join("\n");
  const attributesEmpty = attributesRendered.trim() === "";
  if (attributesChange) changes.push(attributesEmpty ? { kind: "remove", path: ".gitattributes" } : { kind: "rewrite", path: ".gitattributes", fields: ["index merge attribute removed"] });

  // The one document every agent in this project reads moves with the records.
  changes.push({ kind: "rewrite", path: `${WORKSPACE_DIRECTORY}/${WORKSPACE_AGENTS_FILE}`, fields: ["rules file → this Kotta's copy"] });

  let rules: MigrateRules | null = null;
  let validation: MigrateValidation | null = null;

  if (!dryRun) {
    if (movesWorkspace) moveEntry(root, legacyWorkspace, targetWorkspace);
    const applied = movesWorkspace ? targetWorkspace : workspace;
    for (const entry of moves) moveEntry(root, join(applied, entry.from), join(applied, entry.to));
    for (const entry of rewrites) entry.rewrite.write(join(applied, remap(entry.relativePath, moves)));
    if (!existsSync(join(applied, "config.yaml"))) writeFileSync(join(applied, "config.yaml"), stringifyYaml(workspaceConfigTemplate(basename(root))));
    // Deepest first, so an emptied state directory leaves before its emptied container — at the
    // path the moves left it, which for a state directory under process/ is inside the archive.
    for (const path of [...removals].sort((left, right) => right.length - left.length)) {
      const target = join(applied, remap(path, moves));
      if (existsSync(target)) rmdirSync(target);
    }
    if (archives) writeFileSync(join(applied, LEGACY_DIRECTORY, "README.md"), legacyReadme(fromVersion, movesWorkspace));
    if (!readmeCurrent) writeFileSync(join(applied, "README.md"), workspaceReadmeTemplate());
    if (installsForms) {
      mkdirSync(join(applied, SPEC_DIRECTORY, "forms"), { recursive: true });
      for (const filename of readdirSync(bundledFormsDirectory()).filter((name) => name.endsWith(".yaml")).sort()) {
        writeFileSync(join(applied, SPEC_DIRECTORY, "forms", filename), readFileSync(join(bundledFormsDirectory(), filename)));
      }
    }
    if (attributesChange) {
      if (attributesEmpty) rmSync(attributesPath, { force: true });
      else writeFileSync(attributesPath, `${attributesRendered.replace(/\n+$/, "")}\n`);
    }
    // The same writer `sync` uses, so drift is decided in one place: a hand-edited file is
    // reported, never replaced.
    rules = syncWorkspaceAgents(root);
  }

  const finalWorkspace = dryRun ? workspace : join(root, workspaceDirectoryName(root));
  const idsAfter = workspaceIds(finalWorkspace);
  const lost = idsBefore.filter((id) => !idsAfter.includes(id));
  if (lost.length) throw new Error(`Migration lost identifiers: ${lost.join(", ")}. Inspect ${finalWorkspace} before running anything else.`);
  if (!dryRun && specBefore && !sameSnapshot(specBefore, contentSnapshot(join(finalWorkspace, SPEC_DIRECTORY)))) {
    throw new Error(`Migration changed a byte under ${join(finalWorkspace, SPEC_DIRECTORY)}, which it promised not to. Inspect the working tree with 'git status' before running anything else.`);
  }

  // A report of success over a workspace its own validator would refuse claims more than the result
  // carries. The migration says so; it does not repair it, and an invalid result is still a
  // migrated result — the operator is told, not blocked.
  if (!dryRun) {
    const report = validateWorkspace(root);
    validation = { ok: report.ok, errors: report.errors };
  }

  return {
    ok: true,
    command: "migrate",
    data: { root, workspace: finalWorkspace, dryRun, current: false, fromVersion, changes, ids: idsAfter, notes: baseRefNotes(root, dryRun), rules, validation },
  };
}

/**
 * The board does not read the working tree — it reads the configured base ref through git plumbing.
 * Between a migration landing in a working tree and that commit reaching the base ref, `kotta ui`
 * shows the specification the ref holds, under the old paths. The migration says so out loud.
 */
export function baseRefNotes(root: string, dryRun: boolean): string[] {
  const base = readWorkspaceConfig(root).baseBranch;
  return [
    `The board reads the workspace from the '${base}' ref, not from the working tree, so it ${dryRun ? "would keep showing" : "keeps showing"} the pre-migration specification until this migration is committed and reaches '${base}'.`,
    `Review the moves with 'git status', commit the migration, then merge it into '${base}'. The archive under ${workspaceDirectoryName(root)}/${LEGACY_DIRECTORY}/ is read-only from here on: nothing in Kotta 1.0 writes into it.`,
  ];
}

export function formatMigration(result: MigrateResult): string {
  const { data } = result;
  if (data.current) return `${data.workspace} is already on the current shape (version ${WORKSPACE_SCHEMA_VERSION}); nothing to migrate.`;
  const from = data.fromVersion === null ? "an unversioned workspace" : `shape version ${data.fromVersion}`;
  const lines = [
    data.dryRun
      ? `kotta migrate --dry-run — ${data.changes.length} change${data.changes.length === 1 ? "" : "s"} planned for ${data.workspace}, from ${from} to version ${WORKSPACE_SCHEMA_VERSION}. Nothing was written.`
      : `kotta migrate — ${data.changes.length} change${data.changes.length === 1 ? "" : "s"} applied to ${data.workspace}, from ${from} to version ${WORKSPACE_SCHEMA_VERSION}.`,
  ];
  for (const change of data.changes) {
    if (change.kind === "move") lines.push(`  move       ${change.from} → ${change.to}`);
    else if (change.kind === "create") lines.push(`  create     ${change.path}`);
    else if (change.kind === "remove") lines.push(`  remove     ${change.path}${change.path === ".gitattributes" ? " (held only the index merge attribute)" : " (emptied state directory)"}`);
    else lines.push(`  rewrite    ${change.path}: ${change.fields.join(", ")}`);
  }
  lines.push(`  ${data.ids.length} identifiers, all unchanged; the specification under ${SPEC_DIRECTORY}/ is ${data.dryRun ? "left" : "verified"} byte-identical.`);
  for (const line of rulesLines(data.rules)) lines.push(line);
  for (const line of validationLines(data.validation)) lines.push(line);
  for (const note of data.notes) lines.push(`\n${note}`);
  return lines.join("\n");
}

/** What the migration did with the rules file it carried along, in one line the operator can act on. */
export function rulesLines(rules: MigrateRules | null): string[] {
  if (!rules) return [];
  if (rules.state === "drifted") {
    return [
      `\nThe rules file at ${rules.path} was edited by hand, so the migration left it alone — it still describes the shape this workspace came from.`,
      REPLACE_RULES_REMEDY,
    ];
  }
  if (rules.state === "unchanged") return [`  rules      ${rules.path} was already this Kotta's copy.`];
  return [`  rules      ${rules.path} ${rules.state === "created" ? "written" : "brought to this Kotta's copy"}.`];
}

/**
 * The migration says whether what it produced satisfies the rules of the shape it moved to. It
 * reports; it never repairs, and it never turns a completed migration into a failure.
 */
export function validationLines(validation: MigrateValidation | null): string[] {
  if (!validation) return [];
  if (validation.ok) return ["\nThe migrated workspace validates: 'kotta validate' finds nothing to report."];
  const lines = [
    `\nThe migration finished, but the specification it carried does not validate: ${validation.errors.length} problem${validation.errors.length === 1 ? "" : "s"}. The records moved; these are what is left to fix.`,
  ];
  for (const error of validation.errors.slice(0, 10)) lines.push(`  ${error.code}  ${error.message}`);
  if (validation.errors.length > 10) lines.push(`  ... and ${validation.errors.length - 10} more; run 'kotta validate' for the full report.`);
  return lines;
}
