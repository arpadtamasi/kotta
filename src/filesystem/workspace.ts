import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";

const DIRECTORIES = [
  "backlog",
  "defined",
  "active",
  "review",
  "done",
  "observations/new",
  "observations/resolved",
  "batches/backlog",
  "batches/defined",
  "batches/active",
  "batches/done",
  "profiles",
  "forms",
  "claims",
  "decisions",
  "events",
];

/** The primary workspace directory name: what `init` creates and what discovery looks for first (D-007). */
export const WORKSPACE_DIRECTORY = ".kotta";

/** The pre-rename name. Still read, never created; `kotta migrate` moves a real one onto the new name. */
export const LEGACY_WORKSPACE_DIRECTORY = ".a-team";

/**
 * The pre-vocabulary state directories (D-01kz240dn155hb97h6px6n2p85). Their presence *is* the old
 * shape: no reader outside `kotta migrate` understands them, so every other command refuses a
 * workspace that still has one and names the command that fixes it. The directory *name* of the
 * workspace itself is deliberately not part of this test — `.a-team/` stays readable (D-007), it is
 * only moved when the migration runs.
 */
export const LEGACY_STATE_DIRECTORIES = [
  { from: "ready", to: "defined" },
  { from: "findings", to: "observations" },
  { from: "packages", to: "batches" },
] as const;

/** Discovery order: the new name wins, the legacy name keeps every existing workspace working. */
export const WORKSPACE_DIRECTORIES = [WORKSPACE_DIRECTORY, LEGACY_WORKSPACE_DIRECTORY] as const;

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
 * Both names as real directories is an ambiguity only the operator can resolve: two independent
 * workspaces, and Kotta silently reading one of them would hide half the state. `.kotta/` wins
 * (D-007), and the caller says so out loud. A symlink between the names is not ambiguous — it is
 * the supported bridge — so it never triggers this.
 *
 * @returns the warning text, or `undefined` when `root` is unambiguous.
 */
export function duplicateWorkspaceWarning(root: string): string | undefined {
  const real = WORKSPACE_DIRECTORIES.filter((name) => {
    const path = join(root, name);
    return isWorkspaceDirectory(path) && !isSymbolicLink(path);
  });
  if (real.length < 2) return undefined;
  return `Warning: ${root} contains both ${WORKSPACE_DIRECTORY}/ and ${LEGACY_WORKSPACE_DIRECTORY}/ as real directories. Kotta uses ${WORKSPACE_DIRECTORY}/ and ignores ${LEGACY_WORKSPACE_DIRECTORY}/. Merge them, then replace the leftover with a symlink: ln -s ${WORKSPACE_DIRECTORY} ${LEGACY_WORKSPACE_DIRECTORY}`;
}

/** Once per root per process: discovery runs on every path join, the operator needs the sentence once. */
const warnedRoots = new Set<string>();

function warnOnDuplicateWorkspace(root: string): void {
  if (warnedRoots.has(root)) return;
  const warning = duplicateWorkspaceWarning(root);
  if (!warning) return;
  warnedRoots.add(root);
  process.stderr.write(`${warning}\n`);
}

/**
 * The workspace directory name inside `root`: `.kotta` when it is there, `.a-team` otherwise (D-007).
 * With no workspace at all the answer is the primary name — that is what would be created next.
 *
 * A symlinked candidate loses to a real sibling directory. During the transition a project bridges the
 * two names with `ln -s`, and only the real directory is a tracked tree in Git — the UI reads state
 * through `git archive`/`ls-tree`, which see a symlink as a link entry, not as the files behind it.
 * Resolving to the real name keeps both symlink directions readable.
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

/** True when `root` holds a workspace under either name. */
export function hasWorkspace(root: string): boolean {
  return WORKSPACE_DIRECTORIES.some((name) => isWorkspaceDirectory(join(root, name)));
}

/** Both names, for the "no workspace here" messages — the reader may be on either side of the rename. */
export const WORKSPACE_DIRECTORY_LABEL = WORKSPACE_DIRECTORIES.join(" or ");

/** The pre-vocabulary state directories still present in `root`, in migration order. Empty means current. */
export function legacyStateDirectories(root: string): string[] {
  if (!hasWorkspace(root)) return [];
  const workspace = workspacePath(root);
  const legacy: string[] = LEGACY_STATE_DIRECTORIES.filter(({ from }) => isWorkspaceDirectory(join(workspace, from))).map(({ from }) => String(from));
  if (isWorkspaceDirectory(join(workspace, "batches/ready"))) legacy.push("batches/ready");
  return legacy;
}

/**
 * The refusal every ordinary command makes on a pre-vocabulary workspace. There is no compatibility
 * layer behind it on purpose: four workspaces exist in the world and all four are migrated by running
 * the command this message names, so a silent fallback would be insurance for nobody — and a reader
 * that half-understands the old shape is worse than one that refuses it.
 */
export function assertCurrentWorkspaceShape(root: string): void {
  const legacy = legacyStateDirectories(root);
  if (!legacy.length) return;
  const directory = workspaceDirectoryName(root);
  throw new Error(
    `${root} is a pre-vocabulary Kotta workspace: ${legacy.map((name) => `${directory}/${name}/`).join(", ")} ${legacy.length === 1 ? "is" : "are"} still on the old names. `
    + "Run 'kotta migrate --dry-run' to see exactly what would change, then 'kotta migrate'. No other command reads the old shape.",
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

export function initializeWorkspace(options: InitOptions = {}): { root: string; created: string[] } {
  const root = options.root ?? findRepositoryRoot();
  // A repository that already carries either name is initialized: `init` never migrates one to the other.
  const existingName = WORKSPACE_DIRECTORIES.find((name) => existsSync(join(root, name)));
  if (existingName) {
    throw new Error(`${existingName} already exists; initialization preserves existing files.`);
  }
  const workspace = join(root, WORKSPACE_DIRECTORY);

  const created: string[] = [];
  for (const directory of DIRECTORIES) {
    const path = join(workspace, directory);
    mkdirSync(path, { recursive: true });
    created.push(path);
  }

  const config = {
    version: 2,
    project: { name: options.projectName ?? basename(root) },
    workflow: {
      require_human_sign_approval: true,
      require_human_done_approval: true,
      allow_agent_observations: true,
      allow_agent_defined_contracts: false,
    },
    // null means Kotta passes no permission flag and the agent's own project
    // settings decide. Widening this is the operator's deliberate act.
    agents: { permission_mode: null },
    git: {
      base_branch: "main",
      protected_branches: ["main", "master", "develop"],
      worktrees: "auto",
      worktree_root: ".worktrees",
      branch_pattern: "{prefix}/{id}-{slug}",
    },
    batches: { default_parallelism: 2, stop_on_failure: true },
    validation: {
      strict: true,
      reject_unknown_profiles: true,
      require_verification_for_defined: true,
      require_review_evidence_for_done: true,
    },
  };

  writeFileSync(join(workspace, "config.yaml"), stringify(config));
  writeFileSync(
    join(workspace, "README.md"),
    "# Kotta workspace\n\nRepository files are canonical. Use the calling host chat's Kotta MCP tools for scoped human approvals and the `kotta` CLI as an automation-compatible fallback; both call the same validated mutation services. `kotta ui` is read-only.\n\nLive state and visible conversation stay on the configured control branch while implementation remains isolated in contract worktrees. Create durable human decisions from a reviewed Markdown draft with `kotta decision create --from <draft.md> --approve`; do not edit `decisions/` directly. Canonical records use identity-only filenames such as `D-001.md`.\n",
  );
  writeFileSync(join(workspace, "index.md"), renderEmptyIndex());
  const bundledProfiles = fileURLToPath(new URL("../../profiles", import.meta.url));
  if (existsSync(bundledProfiles)) {
    for (const filename of readdirSync(bundledProfiles).filter((name) => name.endsWith(".yaml"))) {
      copyFileSync(join(bundledProfiles, filename), join(workspace, "profiles", filename));
    }
  }
  syncWorkspaceForms(root);

  const gitignore = join(root, ".gitignore");
  const existing = existsSync(gitignore) ? readFileSync(gitignore, "utf8") : "";
  if (!existing.split(/\r?\n/).includes(".worktrees/")) {
    writeFileSync(gitignore, `${existing}${existing && !existing.endsWith("\n") ? "\n" : ""}.worktrees/\n`);
  }
  ensureIndexMergeAttribute(root);

  return { root, created };
}

/**
 * Install the data-driven specification form registry into a workspace.
 *
 * Form definitions are project-owned once installed: sync adds newly shipped forms but never
 * replaces an existing YAML file. This also leaves custom forms alongside the bundled registry,
 * so extending the model remains a data change rather than a TypeScript change.
 */
export function syncWorkspaceForms(root: string): void {
  const bundledForms = fileURLToPath(new URL("../../templates/workspace/forms", import.meta.url));
  if (!existsSync(bundledForms)) return;
  const target = workspacePath(root, "forms");
  mkdirSync(target, { recursive: true });
  for (const filename of readdirSync(bundledForms).filter((name) => name.endsWith(".yaml")).sort()) {
    const destination = join(target, filename);
    if (!existsSync(destination)) copyFileSync(join(bundledForms, filename), destination);
  }
}

/** The merge attribute for a workspace under `directory`; the name moved with the rename (T-020). */
export function indexMergeAttribute(directory: string): string {
  return `${directory}/index.md merge=union`;
}

export const INDEX_MERGE_ATTRIBUTE = indexMergeAttribute(WORKSPACE_DIRECTORY);

/**
 * `index.md` is a generated projection, so two branches that each add an entity have no real
 * disagreement about it. The union driver takes both sides instead of raising a conflict; the next
 * write regenerates the file from disk, so nothing stale survives.
 */
export function ensureIndexMergeAttribute(root: string): void {
  const attribute = indexMergeAttribute(workspaceDirectoryName(root));
  const path = join(root, ".gitattributes");
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (existing.split(/\r?\n/).includes(attribute)) return;
  writeFileSync(path, `${existing}${existing && !existing.endsWith("\n") ? "\n" : ""}${attribute}\n`);
}

export function renderEmptyIndex(): string {
  return `# Kotta Status

> Generated file. Do not edit manually.

## Defined batches

## Active batches

## Defined contracts

## Active contracts

## Review

## Blocked

## New observations
`;
}

export function regenerateIndex(root: string): void {
  const workspace = workspacePath(root);
  if (!existsSync(workspace)) return;
  const entries = (directory: string) => {
    const path = join(workspace, directory);
    if (!existsSync(path)) return [];
    return readdirSync(path).filter((name) => name.endsWith(".md")).sort().map((name) => `- ${name.replace(/\.md$/, "")}`);
  };
  const section = (title: string, lines: string[]) => `## ${title}\n\n${lines.length ? lines.join("\n") : "None."}`;
  writeFileSync(join(workspace, "index.md"), `# Kotta Status\n\n> Generated file. Do not edit manually.\n\n${[
    section("Defined batches", entries("batches/defined")),
    section("Active batches", entries("batches/active")),
    section("Defined contracts", entries("defined")),
    section("Active contracts", entries("active")),
    section("Review", entries("review")),
    section("Blocked", []),
    section("New observations", entries("observations/new")),
  ].join("\n\n")}\n`);
}
