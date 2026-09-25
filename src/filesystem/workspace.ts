import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";

/**
 * The version-6 workspace: `spec/` and nothing that executes. The pre-1.0 shapes kept a `process/`
 * namespace beside it — tasks, observations, batches, claims, events, decisions, profiles and a
 * generated index. Kotta 1.0 keeps none of that; `kotta migrate` carries the whole namespace into a
 * read-only `legacy/` archive and no other command reads or writes either of them.
 */
export const WORKSPACE_SCHEMA_VERSION = 6;
export const SPEC_DIRECTORY = "spec";
/** Where a migrated workspace keeps its pre-1.0 process state, read-only. */
export const LEGACY_DIRECTORY = "legacy";
/** The pre-1.0 namespace. Only `kotta migrate` knows it; everywhere else its presence is a refusal. */
export const PROCESS_DIRECTORY = "process";

/** The primary workspace directory name: what `init` creates and what discovery looks for first. */
export const WORKSPACE_DIRECTORY = ".kotta";

/** The pre-rename name. Still read, never created; `kotta migrate` moves a real one onto the new name. */
export const LEGACY_WORKSPACE_DIRECTORY = ".a-team";

/** Discovery order: the new name wins, the legacy name keeps an unmigrated workspace findable. */
export const WORKSPACE_DIRECTORIES = [WORKSPACE_DIRECTORY, LEGACY_WORKSPACE_DIRECTORY] as const;

/**
 * Every pre-1.0 directory a workspace could carry, in any shape from v1 to v5. Their presence is
 * what makes a workspace pre-1.0 whatever its config says; migration is the only reader.
 */
export const PRE_V6_ENTRIES = [
  PROCESS_DIRECTORY,
  "tasks", "observations", "batches", "profiles", "claims", "decisions", "events", "index.md",
  "backlog", "ready", "defined", "active", "review", "done",
  "findings", "packages", "forms",
] as const;

function isWorkspaceDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function isSymbolicLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Both names as real directories is an ambiguity only the operator can resolve. `.kotta/` wins, and
 * the caller says so out loud. A symlink between the names is the supported bridge, never ambiguous.
 */
export function duplicateWorkspaceWarning(root: string): string | undefined {
  const real = WORKSPACE_DIRECTORIES.filter((name) => {
    const path = join(root, name);
    return isWorkspaceDirectory(path) && !isSymbolicLink(path);
  });
  if (real.length < 2) return undefined;
  return `Warning: ${root} contains both ${WORKSPACE_DIRECTORY}/ and ${LEGACY_WORKSPACE_DIRECTORY}/ as real directories. Kotta uses ${WORKSPACE_DIRECTORY}/ and ignores ${LEGACY_WORKSPACE_DIRECTORY}/. Merge them, then replace the leftover with a symlink: ln -s ${WORKSPACE_DIRECTORY} ${LEGACY_WORKSPACE_DIRECTORY}`;
}

const warnedRoots = new Set<string>();

function warnOnDuplicateWorkspace(root: string): void {
  if (warnedRoots.has(root)) return;
  const warning = duplicateWorkspaceWarning(root);
  if (!warning) return;
  warnedRoots.add(root);
  process.stderr.write(`${warning}\n`);
}

/**
 * The workspace directory name inside `root`: `.kotta` when it is there, `.a-team` otherwise. With
 * no workspace at all the answer is the primary name — that is what would be created next. A
 * symlinked candidate loses to a real sibling, because Git plumbing sees a symlink as a link entry.
 */
export function workspaceDirectoryName(root: string): string {
  const present = WORKSPACE_DIRECTORIES.filter((name) => isWorkspaceDirectory(join(root, name)));
  if (present.length === 0) return WORKSPACE_DIRECTORY;
  warnOnDuplicateWorkspace(root);
  return present.find((name) => !isSymbolicLink(join(root, name))) ?? present[0];
}

/** Absolute path inside the discovered workspace directory of `root`. */
export function workspacePath(root: string, ...segments: string[]): string {
  return join(root, workspaceDirectoryName(root), ...segments);
}

/** Project-owned specification knowledge: form registry and every directory declared by a form. */
export function specPath(root: string, ...segments: string[]): string {
  return workspacePath(root, SPEC_DIRECTORY, ...segments);
}

/** The read-only archive of the pre-1.0 process state. Nothing in Kotta 1.0 writes here. */
export function legacyPath(root: string, ...segments: string[]): string {
  return workspacePath(root, LEGACY_DIRECTORY, ...segments);
}

/** True when `root` holds a workspace under either name. */
export function hasWorkspace(root: string): boolean {
  return WORKSPACE_DIRECTORIES.some((name) => isWorkspaceDirectory(join(root, name)));
}

/** Both names, for the "no workspace here" messages. */
export const WORKSPACE_DIRECTORY_LABEL = WORKSPACE_DIRECTORIES.join(" or ");

/** The pre-1.0 entries still present at the top of the workspace. Empty means nothing to archive. */
export function preV6Entries(root: string): string[] {
  if (!hasWorkspace(root)) return [];
  const workspace = workspacePath(root);
  return PRE_V6_ENTRIES.filter((entry) => existsSync(join(workspace, entry))).map(String);
}

export function workspaceSchemaVersion(root: string): number | null {
  if (!hasWorkspace(root)) return null;
  const config = workspacePath(root, "config.yaml");
  if (!existsSync(config)) return null;
  try {
    const value = (parse(readFileSync(config, "utf8")) as { version?: unknown } | null)?.version;
    return typeof value === "number" ? value : Number(value);
  } catch {
    return Number.NaN;
  }
}

/**
 * A workspace this build will not read, in either direction. A type, so the CLI's preAction hook can
 * tell its own refusal from an unrelated throw without matching words.
 */
export class WorkspaceShapeError extends Error {
  readonly standing: ShapeStanding;
  constructor(standing: ShapeStanding, message: string) {
    super(message);
    this.name = "WorkspaceShapeError";
    this.standing = standing;
  }
}

/** Which side of this Kotta's window a workspace sits on. `current` is the only side that may be read. */
export type ShapeStanding = "current" | "older" | "newer" | "unreadable";

export function workspaceShapeStanding(root: string): ShapeStanding {
  const version = workspaceSchemaVersion(root);
  if (version === WORKSPACE_SCHEMA_VERSION && preV6Entries(root).length === 0) return "current";
  if (version === null) return "older";
  if (Number.isNaN(version)) return "unreadable";
  return version > WORKSPACE_SCHEMA_VERSION ? "newer" : "older";
}

/**
 * The refusal a newer workspace gets, wherever it is met. It exists apart from
 * `assertCurrentWorkspaceShape` because `migrate` is exempt from that check — deliberately, so it
 * can read old workspaces at all — and the exemption must not extend to this direction: migration
 * only ever carries a workspace forward.
 */
export function assertNotNewerWorkspace(root: string): void {
  if (!hasWorkspace(root)) return;
  const standing = workspaceShapeStanding(root);
  if (standing !== "newer" && standing !== "unreadable") return;
  const config = `${workspaceDirectoryName(root)}/config.yaml`;
  if (standing === "unreadable") {
    throw new WorkspaceShapeError(standing,
      `${root}: ${config} does not record a readable workspace shape version, so Kotta cannot tell whether it is older or newer than the version ${WORKSPACE_SCHEMA_VERSION} this build implements. `
      + "Repair that file before running anything else; no command guesses at an unreadable version, and migrate will not either.",
    );
  }
  throw new WorkspaceShapeError(standing,
    `${root} was written by a newer Kotta: ${config} records workspace shape version ${workspaceSchemaVersion(root)}, and this build implements version ${WORKSPACE_SCHEMA_VERSION}. `
    + "Upgrade Kotta to read it. Migration only ever carries a workspace forward, so it will not rewrite this one to the older shape.",
  );
}

/**
 * The refusal every ordinary command makes on a pre-1.0 workspace. There is no compatibility layer
 * behind it on purpose: the old release stays installable under its own version, and 1.0 offers the
 * migration and does nothing else on a workspace that has not had it.
 */
export function assertCurrentWorkspaceShape(root: string): void {
  if (!hasWorkspace(root)) return;
  assertNotNewerWorkspace(root);
  const version = workspaceSchemaVersion(root);
  const entries = preV6Entries(root);
  if (!entries.length && version === WORKSPACE_SCHEMA_VERSION) return;
  const directory = workspaceDirectoryName(root);
  const listed = entries.map((name) => `${directory}/${name}${name.includes(".") ? "" : "/"}`);
  if (version !== WORKSPACE_SCHEMA_VERSION) listed.push(`${directory}/config.yaml (schema version ${version === null ? "absent" : version}; expected ${WORKSPACE_SCHEMA_VERSION})`);
  throw new WorkspaceShapeError("older",
    `${root} uses a pre-1.0 Kotta workspace shape: ${listed.join(", ")}. Kotta 1.0 owns the technical specification and keeps no process layer, `
    + `so it reads only workspaces on shape version ${WORKSPACE_SCHEMA_VERSION}. Run 'kotta migrate --dry-run' to see exactly what would change, then 'kotta migrate': `
    + `the process state moves untouched into ${directory}/${LEGACY_DIRECTORY}/ as a read-only archive and ${directory}/${SPEC_DIRECTORY}/ stays byte-identical. `
    + "No other command runs on the old shape. The pre-1.0 release stays installable as @arpadtamasi/kotta@0.11.x if you need the old commands.",
  );
}

export interface InitOptions {
  root?: string;
  projectName?: string;
}

export function findRepositoryRoot(start = process.cwd()): string {
  let current = resolve(start);
  while (true) {
    if (existsSync(join(current, ".git"))) return current;
    const parent = resolve(current, "..");
    if (parent === current) throw new Error("Not inside a Git repository. Run git init first.");
    current = parent;
  }
}

/** The configuration a version-6 workspace carries: project, git and validation, nothing about a process. */
export function workspaceConfigTemplate(projectName: string, overrides: { baseBranch?: string; protectedBranches?: string[]; strict?: boolean } = {}): Record<string, unknown> {
  const baseBranch = overrides.baseBranch ?? "main";
  const protectedBranches = overrides.protectedBranches ?? ["main", "master", "develop"];
  return {
    version: WORKSPACE_SCHEMA_VERSION,
    project: { name: projectName },
    git: {
      base_branch: baseBranch,
      protected_branches: [...new Set([...protectedBranches, baseBranch])],
    },
    validation: { strict: overrides.strict ?? true },
  };
}

export function workspaceReadmeTemplate(): string {
  return readFileSync(fileURLToPath(new URL("../../templates/workspace/README.md", import.meta.url)), "utf8");
}

export function initializeWorkspace(options: InitOptions = {}): { root: string; created: string[] } {
  const root = options.root ?? findRepositoryRoot();
  const existingName = WORKSPACE_DIRECTORIES.find((name) => existsSync(join(root, name)));
  if (existingName) {
    throw new Error(`${existingName} already exists; initialization preserves existing files.`);
  }
  const workspace = join(root, WORKSPACE_DIRECTORY);
  const created: string[] = [];
  mkdirSync(join(workspace, SPEC_DIRECTORY, "forms"), { recursive: true });
  created.push(join(workspace, SPEC_DIRECTORY, "forms"));
  writeFileSync(join(workspace, "config.yaml"), stringify(workspaceConfigTemplate(options.projectName ?? basename(root))));
  writeFileSync(join(workspace, "README.md"), workspaceReadmeTemplate());
  syncWorkspaceForms(root);
  return { root, created };
}

/**
 * Install the data-driven specification form registry into a workspace. Form definitions are
 * project-owned once installed: sync adds newly shipped forms but never replaces an existing file.
 */
export function syncWorkspaceForms(root: string): void {
  const bundledForms = bundledFormsDirectory();
  if (!existsSync(bundledForms)) return;
  const target = specPath(root, "forms");
  mkdirSync(target, { recursive: true });
  for (const filename of readdirSync(bundledForms).filter((name) => name.endsWith(".yaml")).sort()) {
    const destination = join(target, filename);
    if (!existsSync(destination)) copyFileSync(join(bundledForms, filename), destination);
  }
  for (const directory of registeredSpecDirectories(root)) mkdirSync(specPath(root, directory), { recursive: true });
}

export function bundledFormsDirectory(): string {
  return fileURLToPath(new URL("../../templates/workspace/spec/forms", import.meta.url));
}

/** Validate a form directory as a portable path that cannot escape or occupy the registry itself. */
export function validateSpecDirectory(value: unknown, source = "form"): string {
  const directory = String(value ?? "").trim();
  const segments = directory.split("/");
  if (!directory || directory !== String(value ?? "") || isAbsolute(directory) || /^[A-Za-z]:\//.test(directory) || directory.includes("\\")
    || segments.some((segment) => !segment || segment === "." || segment === "..") || directory === "forms" || directory.startsWith("forms/")) {
    throw new Error(`${source} has invalid directory '${String(value ?? "")}': directory must be a relative path inside the workspace spec root and cannot use '.', '..', backslashes, absolute paths, or the reserved forms/ registry.`);
  }
  return directory;
}

/** All project-declared node libraries. New custom forms participate without TypeScript changes. */
export function registeredSpecDirectories(root: string, formsDirectory = specPath(root, "forms")): string[] {
  if (!existsSync(formsDirectory)) return [];
  const directories = new Set<string>();
  for (const filename of readdirSync(formsDirectory).filter((name) => name.endsWith(".yaml")).sort()) {
    const path = join(formsDirectory, filename);
    const data = parse(readFileSync(path, "utf8")) as { directory?: unknown } | null;
    if (data?.directory === undefined) throw new Error(`${path} has no directory field.`);
    directories.add(validateSpecDirectory(data.directory, path));
  }
  return [...directories].sort();
}
