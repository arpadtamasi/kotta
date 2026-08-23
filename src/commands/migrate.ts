import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { parseMarkdown, renderMarkdown } from "../core/markdown.js";
import { readWorkspaceConfig } from "../core/config.js";
import { LEGACY_WORKSPACE_DIRECTORY, PROCESS_DIRECTORIES, PROCESS_DIRECTORY, SPEC_DIRECTORY, WORKSPACE_DIRECTORIES, WORKSPACE_DIRECTORY, WORKSPACE_SCHEMA_VERSION, assertNotNewerWorkspace, bundledFormsDirectory, ensureIndexMergeAttribute, findRepositoryRoot, indexMergeAttribute, regenerateIndex, registeredSpecDirectories, syncWorkspaceForms, validateSpecDirectory, workspaceDirectoryName } from "../filesystem/workspace.js";
import { TASK_STATES } from "../filesystem/entities.js";

/**
 * `kotta migrate` — one command that carries a workspace from any older shape to the current one.
 *
 * It is the only reader in the CLI that understands the old shape; every other command refuses it and
 * names this command (D-01kz240dn155hb97h6px6n2p85). Three rules hold it together:
 *
 * - **Identifiers are never touched** (D-010). No id, no filename and no reference *value* moves; only
 *   directory names, field names and stored state values do. This is vocabulary, not identity — and
 *   the command proves it, by comparing the id set before and after and refusing to lose one.
 * - **Idempotent and fail-before-write.** The complete move/rewrite/create plan and every conflict is
 *   resolved before mutation. A finished workspace reports "already current"; an unsafe mixed or
 *   conflicting workspace is left byte-identical.
 * - **Dry run first.** `--dry-run` computes the identical plan and writes nothing.
 */

export type MigrationChange =
  | { kind: "move"; from: string; to: string }
  | { kind: "create"; path: string }
  | { kind: "remove"; path: string }
  | { kind: "rewrite"; path: string; fields: string[] }
  | { kind: "regenerate"; path: string };

export interface MigrateData {
  root: string;
  workspace: string;
  dryRun: boolean;
  current: boolean;
  changes: MigrationChange[];
  ids: string[];
  notes: string[];
}

export interface MigrateResult {
  ok: true;
  command: "migrate";
  data: MigrateData;
}

const TASK_KEYS: Record<string, string> = { package: "batch", source_finding: "source_observation" };
// Compatibility: v3 and earlier workspaces called the work unit `contract`. Migration is the
// one writer that understands those stored names and rewrites them into the v4 task vocabulary.
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
const CONFIG_WORKFLOW_KEYS: Record<string, string> = {
  require_human_ready_approval: "require_human_sign_approval",
  allow_agent_findings: "allow_agent_observations",
  allow_agent_ready_tickets: "allow_agent_defined_tasks",
  allow_agent_defined_contracts: "allow_agent_defined_tasks",
};
const CONFIG_VALIDATION_KEYS: Record<string, string> = { require_verification_for_ready: "require_verification_for_defined" };
const CONFIG_VERSION = WORKSPACE_SCHEMA_VERSION;

/**
 * A planned rewrite. `write` takes the target path because the file may move first: the plan is
 * computed on the layout that is on disk now, and applied to the one the directory moves produce.
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
 * `2026-07-21` into `2026-07-21T00:00:00.000Z` — churn the vocabulary migration never asked for, and a
 * value the schema's `YYYY-MM-DD` pattern rejects. Kotta's own writers always store dates as text, so
 * a legacy timestamp is normalised to the same text before the file is written back.
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

  // Only a file that is being rewritten anyway gets its dates normalised; nothing is touched for it alone.
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

function planConfig(path: string): Rewrite {
  const data = (parseYaml(readFileSync(path, "utf8")) ?? {}) as Record<string, unknown>;
  const fields = renameKeys(data, { packages: "batches" });
  if (data.workflow && typeof data.workflow === "object") {
    fields.push(...renameKeys(data.workflow as Record<string, unknown>, CONFIG_WORKFLOW_KEYS).map((change) => `workflow.${change}`));
  }
  if (data.validation && typeof data.validation === "object") {
    fields.push(...renameKeys(data.validation as Record<string, unknown>, CONFIG_VALIDATION_KEYS).map((change) => `validation.${change}`));
  }
  if (data.version !== CONFIG_VERSION) { fields.push(`version: ${String(data.version)} → ${CONFIG_VERSION}`); data.version = CONFIG_VERSION; }
  return { fields, write: (target) => writeFileSync(target, stringifyYaml(data)) };
}

function isRealDirectory(path: string): boolean {
  try { return statSync(path).isDirectory() && !lstatSync(path).isSymbolicLink(); }
  catch { return false; }
}

/**
 * Moves one preflighted source onto an absent destination. Conflict handling belongs entirely to
 * planning: reaching this function means every target was proven absent before the first write.
 */
function moveDirectory(from: string, to: string): void {
  if (!existsSync(from)) return;
  if (existsSync(to)) throw new Error(`Migration destination already exists: ${to}. Nothing was moved.`);
  mkdirSync(dirname(to), { recursive: true });
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

/** Every id in the workspace, read from the frontmatter: the set that must be identical afterwards (D-010). */
export function workspaceIds(workspace: string): string[] {
  const ids = new Set<string>();
  const directories = [...ID_DIRECTORIES, ...ID_DIRECTORIES.map((directory) => `${PROCESS_DIRECTORY}/${directory}`)];
  for (const directory of directories) {
    for (const path of markdownFiles(join(workspace, directory))) {
      const id = String(parseMarkdown(readFileSync(path, "utf8")).data.id ?? "").trim();
      if (id) ids.add(id);
    }
  }
  return [...ids].sort();
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
  // Migration only ever carries a workspace forward (BR-01m0q89b16xcfasfj1z8mc2hgg). The CLI exempts
  // this command from the shape check so it can read old workspaces at all, so the newer direction is
  // refused here instead — before any change is planned, which is what --dry-run would have printed.
  assertNotNewerWorkspace(root);
  if (movesWorkspace) changes.push({ kind: "move", from: LEGACY_WORKSPACE_DIRECTORY, to: WORKSPACE_DIRECTORY });
  const idsBefore = workspaceIds(workspace);

  // 2. Read and validate the data-driven spec registry before classifying any project directory.
  // A form controls where its nodes move, so an unsafe or ambiguous declaration is a hard preflight
  // failure, not something migration tries to repair.
  const label = basename(workspace);
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
    ...["ready", "findings", "packages", SPEC_DIRECTORY, PROCESS_DIRECTORY, "forms"],
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
    .filter((name) => ![SPEC_DIRECTORY, PROCESS_DIRECTORY].includes(name) && existsSync(join(workspace, name)));
  if ((existsSync(join(workspace, SPEC_DIRECTORY)) || existsSync(join(workspace, PROCESS_DIRECTORY))) && flatRoots.length) {
    throw new Error(`Migration found mixed legacy and nested workspace data: ${flatRoots.map((name) => join(workspace, name)).join(", ")}. Nothing was written.`);
  }

  // 3. Plan every path move. Every destination is checked now, before the first mutation.
  const moves: Array<{ from: string; to: string }> = [];
  const move = (from: string, to: string) => {
    if (!existsSync(join(workspace, from))) return;
    const duplicate = moves.find((entry) => entry.to === to);
    if (duplicate) {
      throw new Error(`Migration has multiple sources for ${join(workspace, to)}: ${join(workspace, duplicate.from)} and ${join(workspace, from)}. One entity, one file — reconcile the copies first. Nothing was written.`);
    }
    if (existsSync(join(workspace, to))) {
      throw new Error(`Migration destination already exists: ${join(workspace, to)}. Nothing was written.`);
    }
    moves.push({ from, to });
    changes.push({ kind: "move", from: `${label}/${from}`, to: `${WORKSPACE_DIRECTORY}/${to}` });
  };

  // 3a. Lifecycle state directories flatten per file: one entity, one stable file, state in the
  // frontmatter alone. Two states holding the same filename is the duplicated-state damage the old
  // shape allowed — refused by `move`, never resolved by overwriting. The emptied directory is
  // removed afterwards; its state is transcribed into each file's frontmatter below (3b plans it),
  // because in the old shapes the directory, not the frontmatter, was the authority.
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

  // 4. Frontmatter, claims and config: planned on today's paths, applied to tomorrow's.
  const rewrites: Array<{ relativePath: string; rewrite: Rewrite }> = [];
  const plan = (path: string, planner: (path: string) => Rewrite) => {
    const rewrite = planner(path);
    if (!rewrite.fields.length) return;
    const relativePath = relative(workspace, path);
    rewrites.push({ relativePath, rewrite });
    changes.push({ kind: "rewrite", path: relativePath, fields: rewrite.fields });
  };

  // Files being flattened get the directory's state verdict transcribed; files already flat get
  // the vocabulary pass alone, so a re-run on a current workspace rewrites nothing.
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
  if (existsSync(config)) plan(config, planConfig);

  // Required empty directories are material workspace structure even though Git cannot preserve
  // them. Creating them is explicit in the dry-run and idempotent on the next run.
  const required = [
    ...PROCESS_DIRECTORIES.map((directory) => `${PROCESS_DIRECTORY}/${directory}`),
    `${SPEC_DIRECTORY}/forms`,
    ...specDirectories.map((directory) => `${SPEC_DIRECTORY}/${directory}`),
  ];
  const futurePathExists = (path: string): boolean => {
    if (existsSync(join(workspace, path))) return true;
    return moves.some((entry) => {
      // A move landing at or inside `path` materialises the directory on its way in.
      if (path === entry.to || entry.to.startsWith(`${path}/`)) return true;
      if (!path.startsWith(`${entry.to}/`)) return false;
      const suffix = path.slice(entry.to.length + 1);
      return existsSync(join(workspace, entry.from, suffix));
    });
  };
  const creates = [...new Set(required)].filter((path) => !futurePathExists(path));
  for (const path of creates) changes.push({ kind: "create", path: `${WORKSPACE_DIRECTORY}/${path}` });

  const attribute = indexMergeAttribute(WORKSPACE_DIRECTORY);
  const attributesPath = join(root, ".gitattributes");
  const attributes = existsSync(attributesPath) ? readFileSync(attributesPath, "utf8") : "";
  const staleAttributes = WORKSPACE_DIRECTORIES.flatMap((directory) => [
    `${directory}/index.md merge=union`,
    indexMergeAttribute(directory),
  ]).filter((candidate) => candidate !== attribute);
  const attributeLines = attributes.split(/\r?\n/);
  const attributeCurrent = attributeLines.filter((line) => line === attribute).length === 1 && !staleAttributes.some((line) => attributeLines.includes(line));
  if (!attributeCurrent) changes.push({ kind: "rewrite", path: ".gitattributes", fields: [`workspace index merge attribute → ${attribute}`] });

  const current = changes.length === 0;
  if (!current) changes.push({ kind: "regenerate", path: `${WORKSPACE_DIRECTORY}/${PROCESS_DIRECTORY}/index.md` });

  if (!dryRun && !current) {
    if (movesWorkspace) {
      moveDirectory(legacyWorkspace, targetWorkspace);
    }
    const applied = movesWorkspace ? targetWorkspace : workspace;
    for (const entry of moves) moveDirectory(join(applied, entry.from), join(applied, entry.to));
    for (const entry of rewrites) entry.rewrite.write(join(applied, remap(entry.relativePath, moves)));
    for (const path of creates) mkdirSync(join(applied, path), { recursive: true });
    // Deepest first, so an emptied state directory leaves before its emptied container.
    for (const path of [...removals].sort((left, right) => right.length - left.length)) {
      const target = join(applied, path);
      if (existsSync(target)) rmdirSync(target);
    }
    syncWorkspaceForms(root);
    ensureIndexMergeAttribute(root);
    regenerateIndex(root);
  }

  const finalWorkspace = dryRun ? workspace : join(root, workspaceDirectoryName(root));
  const idsAfter = workspaceIds(finalWorkspace);
  const lost = idsBefore.filter((id) => !idsAfter.includes(id));
  if (lost.length) throw new Error(`Migration lost identifiers: ${lost.join(", ")}. Inspect ${finalWorkspace} before running anything else.`);

  return {
    ok: true,
    command: "migrate",
    data: { root, workspace: finalWorkspace, dryRun, current, changes, ids: idsAfter, notes: baseRefNotes(root, current, dryRun) },
  };
}

/**
 * F-01kz25qf318bmn1t860n2rjcpt: the board does not read the working tree — it reads the configured
 * base ref through git plumbing. Between a migration landing in a working tree and that commit
 * reaching the base ref, `kotta ui` shows the header path of the new workspace and none of its
 * content. The migration says so out loud rather than let an operator meet a silently empty board.
 */
export function baseRefNotes(root: string, current: boolean, dryRun: boolean): string[] {
  if (current) return [];
  const base = readWorkspaceConfig(root).baseBranch;
  return [
    `The board reads the workspace from the '${base}' ref, not from the working tree, so it ${dryRun ? "would show" : "shows"} an empty board until this migration is committed and reaches '${base}'. The board says the same thing itself while the gap lasts.`,
    `Commit the migration, then merge it into '${base}' before reading the board.`,
  ];
}

export function formatMigration(result: MigrateResult): string {
  const { data } = result;
  if (data.current) return `${data.workspace} is already on the current shape; nothing to migrate.`;
  const lines = [
    data.dryRun
      ? `kotta migrate --dry-run — ${data.changes.length} change${data.changes.length === 1 ? "" : "s"} planned for ${data.workspace}. Nothing was written.`
      : `kotta migrate — ${data.changes.length} change${data.changes.length === 1 ? "" : "s"} applied to ${data.workspace}.`,
  ];
  for (const change of data.changes) {
    if (change.kind === "move") lines.push(`  move       ${change.from} → ${change.to}`);
    else if (change.kind === "create") lines.push(`  create     ${change.path}`);
    else if (change.kind === "remove") lines.push(`  remove     ${change.path} (emptied state directory)`);
    else if (change.kind === "rewrite") lines.push(`  rewrite    ${change.path}: ${change.fields.join(", ")}`);
    else lines.push(`  regenerate ${change.path}`);
  }
  lines.push(`  ${data.ids.length} identifiers, all unchanged (D-010: this is vocabulary, not identity).`);
  for (const note of data.notes) lines.push(`\n${note}`);
  return lines.join("\n");
}
