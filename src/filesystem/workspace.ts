import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
/** The pre-1.0 namespace. Its presence is a refusal, naming the release that migrates it. */
export const PROCESS_DIRECTORY = "process";

/**
 * The one workspace directory name (BR-01m413z0y4dtjs9rs718bdnm4j): what `init` creates and the
 * only name discovery looks for. The pre-rename name is not looked for.
 */
export const WORKSPACE_DIRECTORY = ".kotta";

/**
 * Every pre-1.0 directory a workspace could carry, in any shape from v1 to v5. Their presence is
 * what makes a workspace pre-1.0 whatever its config says, and refused.
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

/** The workspace directory name inside `root`. One name, so the answer is always the same. */
export function workspaceDirectoryName(_root: string): string {
  return WORKSPACE_DIRECTORY;
}

/** Absolute path inside the discovered workspace directory of `root`. */
export function workspacePath(root: string, ...segments: string[]): string {
  return join(root, workspaceDirectoryName(root), ...segments);
}

/** Project-owned specification knowledge: form registry and every directory declared by a form. */
export function specPath(root: string, ...segments: string[]): string {
  return workspacePath(root, SPEC_DIRECTORY, ...segments);
}

/** True when `root` holds a workspace. */
export function hasWorkspace(root: string): boolean {
  return isWorkspaceDirectory(join(root, WORKSPACE_DIRECTORY));
}

/** The name, for the "no workspace here" messages. */
export const WORKSPACE_DIRECTORY_LABEL = WORKSPACE_DIRECTORY;

/** The pre-1.0 entries still present at the top of the workspace. Empty means none. */
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
 * The refusal a newer workspace gets, wherever it is met, including the commands the CLI exempts from
 * the shape check because they judge their own workspace (`ui`, `mcp`). A version boundary refuses in both directions
 * (BR-01m0q89b16xcfasfj1z8mc2hgg); a newer workspace is refused, not downgraded
 * (EX-01m0q89b1693yvwzx0j8tr5zjp).
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
 * The refusal every command makes on a pre-1.0 workspace (BR-01m0q89b16xcfasfj1z8mc2hgg,
 * EX-01m415fx4jbbqpyqqa52ftgqs0): there is no compatibility layer and no migration behind it; the last release that
 * migrates stays installable under its own version.
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
    `${root} uses a pre-1.0 Kotta workspace shape: ${listed.join(", ")}. This Kotta reads only workspaces on shape version ${WORKSPACE_SCHEMA_VERSION}, `
    + "and no command of it, migrate included, reads or rewrites an older one. Migrate it with the last release that can: "
    + "'npx -y -p @arpadtamasi/kotta@1.0.0-alpha.4 kotta migrate', then run this Kotta again. The pre-1.0 release stays installable as @arpadtamasi/kotta@0.11.x if you need the old commands.",
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
  if (existsSync(join(root, WORKSPACE_DIRECTORY))) {
    throw new Error(`${WORKSPACE_DIRECTORY} already exists; initialization preserves existing files.`);
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
