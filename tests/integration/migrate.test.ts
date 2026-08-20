import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";
import { readWorkspace } from "../../src/commands/ui.js";
import { migrateWorkspace, workspaceIds, type MigrateResult } from "../../src/commands/migrate.js";

/**
 * `kotta migrate` is the only reader of the pre-vocabulary shape, and the next task migrates three
 * live neighbour workspaces by running it. Everything asserted here is exercised on a real workspace
 * on disk: the dry run touches nothing, the run validates, a second run is a no-op, an already-current
 * workspace is left alone, every other command refuses the old shape by name, and no identifier moves.
 */

const cli = resolve("dist/cli/index.js");
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
const invoke = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = invoke(cwd, [...args, "--json"]);
  if (result.status !== 0) throw new Error(result.stdout || result.stderr);
  return JSON.parse(result.stdout) as { ok: boolean; command: string; data: Record<string, unknown> };
};

const TASK_BODY = [
  "## Outcome", "", "The result is observable.", "",
  "## Scope", "", "What is included.", "",
  "## Non-goals", "", "What is excluded.", "",
  "## Acceptance", "", "- The result exists.", "",
  "## Verification", "", "- Run the integration test.", "",
  "## Constraints", "", "None.", "",
  "## Open decisions", "", "None.", "",
  "## Execution notes", "", "None.", "",
].join("\n");

const CUSTOM_FORM = [
  "id: custom", "version: 1", "directory: custom-nodes", "canonical_source: Project",
  "description: A project-owned node kind.",
  "identity:", "  prefix: CU", '  format: "<prefix>-<26-character lowercase Crockford ULID>"', '  filename: "<slug>-<last 8 id characters>.md"',
  "required_fields:", "  frontmatter: [id, form, title]", "  body_headings: [Note]",
  "required_edges: []",
  "recognition_signals:", "  - The project needs a node kind Kotta does not ship.", "",
].join("\n");

const CUSTOM_NODE = [
  "---", "id: CU-01m0c0000000000000cv000001", "form: custom", "title: Project-owned specification", "---", "",
  "## Note", "project-owned specification", "",
].join("\n");

const OBSERVATION_BODY = [
  "## Observation", "", "Something was noticed.", "",
  "## Evidence", "", "A log line.", "",
  "## Impact hypothesis", "", "It may mislead.", "",
  "## Confidence", "", "High: directly observed.", "",
  "## Suggested disposition", "", "Investigate.", "",
].join("\n");

const BATCH_BODY = [
  "## Goal", "", "Ship the slice.", "",
  "## Completion", "", "Every member task is accepted.", "",
  "## Execution notes", "", "Coordinated by a human.", "",
].join("\n");

function write(path: string, data: Record<string, unknown>, body: string): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, matter.stringify(`# ${String(data.id)} — ${String(data.title)}\n\n${body}`, data));
}

/** A git repository holding a workspace in the pre-vocabulary shape, under the pre-rename directory name. */
/** A repository already on the current shape, committed, so linked worktrees can branch from it. */
function currentRepository(label: string): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), `kotta-shape-${label}-`)));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  const created = invoke(root, ["init"]);
  if (created.status !== 0) throw new Error(created.stderr);
  git(root, "add", "-A");
  git(root, "commit", "-m", "init");
  return root;
}

function legacyRepository(label: string, directory = ".a-team"): string {
  // realpath, so the board takes its git base-ref path: `git rev-parse --show-toplevel` reports the
  // resolved directory, and a mismatch would silently fall back to plain working-tree reads.
  const root = realpathSync(mkdtempSync(join(tmpdir(), `kotta-migrate-${label}-`)));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  const workspace = join(root, directory);
  for (const sub of ["backlog", "ready", "active", "review", "done", "findings/new", "findings/resolved", "packages/backlog", "packages/ready", "claims", "decisions", "profiles"]) {
    mkdirSync(join(workspace, sub), { recursive: true });
  }
  writeFileSync(join(workspace, "config.yaml"), [
    "version: 1",
    "project:",
    "  name: legacy-fixture",
    "workflow:",
    "  require_human_ready_approval: true",
    "  require_human_done_approval: true",
    "  allow_agent_findings: true",
    "  allow_agent_ready_tickets: false",
    "git:",
    "  base_branch: main",
    "  protected_branches:",
    "    - main",
    "packages:",
    "  default_parallelism: 2",
    "  stop_on_failure: true",
    "validation:",
    "  strict: true",
    "  require_verification_for_ready: true",
    "",
  ].join("\n"));
  writeFileSync(join(workspace, "index.md"), "# Kotta Status\n");

  write(join(workspace, "backlog/T-001-shape-the-export.md"), {
    id: "T-001", title: "Shape the export", status: "backlog", origin: "finding", types: ["feature"], profiles: [],
    priority: "medium", risk: "medium", package: "P-001", source_finding: "F-001", depends_on: [], blocks: [],
    created_at: "2026-07-01", updated_at: "2026-07-01",
  }, TASK_BODY);
  write(join(workspace, "ready/T-002-export-job-api.md"), {
    id: "T-002", title: "Export job API", status: "ready", origin: "human", types: ["feature"], profiles: [],
    priority: "medium", risk: "low", package: "P-001", depends_on: ["T-001"], blocks: [],
    created_at: "2026-07-02", updated_at: "2026-07-02",
  }, TASK_BODY);
  write(join(workspace, "active/T-003-export-audit.md"), {
    id: "T-003", title: "Export audit", status: "active", origin: "human", types: ["feature"], profiles: [],
    priority: "medium", risk: "low", package: null, depends_on: [], blocks: [],
    branch: "feat/T-003-export-audit", assigned_agent: "codex", created_at: "2026-07-03", updated_at: "2026-07-03",
  }, TASK_BODY);
  writeFileSync(join(workspace, "claims/T-003.yaml"), [
    "ticket: T-003",
    "agent: codex",
    "branch: feat/T-003-export-audit",
    "worktree: .worktrees/T-003",
    "started_at: 2026-07-03T09:00:00Z",
    "",
  ].join("\n"));
  write(join(workspace, "findings/new/F-001-divergent-checks.md"), {
    id: "F-001", title: "Divergent checks", status: "new", origin: "agent", finding_type: "inconsistency",
    confidence: "high", severity: "medium", discovered_during: "T-003", created_at: "2026-07-04",
  }, OBSERVATION_BODY);
  write(join(workspace, "findings/resolved/F-002-duplicate-read.md"), {
    id: "F-002", title: "Duplicate read", status: "resolved", origin: "agent", finding_type: "performance",
    confidence: "high", severity: "low", disposition: "create-ticket", ticket: "T-001", related_ticket: "T-001",
    created_at: "2026-07-05", resolved_at: "2026-07-06T10:00:00.000Z",
  }, OBSERVATION_BODY);
  write(join(workspace, "packages/ready/P-001-export-slice.md"), {
    id: "P-001", kind: "milestone", title: "Export slice", status: "ready", tickets: ["T-001", "T-002"],
    execution: { mode: "dependency-aware", parallelism: 2, stop_on_failure: true },
    authority: { create_findings: true, create_subtickets: false, reorder_independent_tickets: false, change_scope: false },
    created_at: "2026-07-01", updated_at: "2026-07-02",
  }, BATCH_BODY);

  git(root, "add", ".");
  git(root, "commit", "-m", "legacy workspace");
  return root;
}

function flatV2Repository(label: string): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), `kotta-flat-v2-${label}-`)));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  const workspace = join(root, ".kotta");
  for (const directory of ["backlog", "defined", "active", "review", "done", "observations/new", "observations/resolved", "batches/backlog", "batches/defined", "batches/active", "batches/done", "profiles", "claims", "events", "decisions", "forms", "custom-nodes"]) {
    mkdirSync(join(workspace, directory), { recursive: true });
  }
  writeFileSync(join(workspace, "config.yaml"), "version: 2\nproject:\n  name: flat-v2\ngit:\n  base_branch: main\n");
  writeFileSync(join(workspace, "index.md"), "# Flat index\n");
  copyFileSync(resolve("templates/workspace/spec/forms/goal.yaml"), join(workspace, "forms/goal.yaml"));
  // A project-owned form, complete enough to be a real one: `kotta validate` measures spec nodes
  // against their form, so a stand-in that could never resolve by id would fail the migrated workspace.
  writeFileSync(join(workspace, "forms/custom.yaml"), CUSTOM_FORM);
  writeFileSync(join(workspace, "custom-nodes/example-cv000001.md"), CUSTOM_NODE);
  writeFileSync(join(root, ".gitattributes"), ".kotta/index.md merge=union\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "flat v2 workspace");
  return root;
}

/** Content-addressed picture of a directory tree: any write at all changes it. */
function snapshot(directory: string): Record<string, string> {
  const files: Record<string, string> = {};
  const walk = (current: string) => {
    for (const name of readdirSync(current).sort()) {
      if (name === ".git") continue;
      const path = join(current, name);
      if (statSync(path).isDirectory()) walk(path);
      else files[relative(directory, path)] = createHash("sha1").update(readFileSync(path)).digest("hex");
    }
  };
  walk(directory);
  return files;
}

/** Ids read straight off disk, independently of anything the migration reports about itself. */
function idsOnDisk(root: string): string[] {
  const workspace = [".kotta", ".a-team"].map((name) => join(root, name)).find((path) => existsSync(path));
  return workspaceIds(workspace as string);
}

describe("kotta migrate", () => {
  test("--dry-run lists every change and modifies nothing", () => {
    const root = legacyRepository("dry-run");
    const before = snapshot(root);

    const result = invoke(root, ["migrate", "--dry-run"]);
    expect(result.status, result.stderr).toBe(0);
    expect(snapshot(root)).toEqual(before);

    const report = result.stdout;
    expect(report).toContain("Nothing was written.");
    for (const line of [
      ".a-team → .kotta",
      ".a-team/ready → .kotta/process/defined",
      ".a-team/findings → .kotta/process/observations",
      ".a-team/packages → .kotta/process/batches",
      ".a-team/packages/ready → .kotta/process/batches/defined",
    ]) expect(report).toContain(line);
    expect(report).toContain("package → batch");
    expect(report).toContain("source_finding → source_observation");
    expect(report).toContain("status: ready → defined");
    expect(report).toContain("kind removed");
    expect(report).toContain("tickets → tasks");
    expect(report).toContain("finding_type → observation_type");
    expect(report).toContain("disposition: create-ticket → create-task");
    expect(report).toContain("ticket → task");
    expect(report).toContain("6 identifiers, all unchanged");
  });

  test("the run produces a workspace kotta validate accepts, with every cross-reference resolving", () => {
    const root = legacyRepository("apply");
    const before = idsOnDisk(root);

    const migrated = run(root, ["migrate"]).data as MigrateResult["data"];
    expect(migrated.current).toBe(false);
    expect(migrated.workspace).toBe(join(root, ".kotta"));

    expect(existsSync(join(root, ".a-team"))).toBe(false);
    expect(existsSync(join(root, ".kotta/process/defined/T-002-export-job-api.md"))).toBe(true);
    expect(existsSync(join(root, ".kotta/process/observations/new/F-001-divergent-checks.md"))).toBe(true);
    expect(existsSync(join(root, ".kotta/process/batches/defined/P-001-export-slice.md"))).toBe(true);

    expect(run(root, ["validate"])).toMatchObject({ ok: true, errors: [] });

    const task = matter(readFileSync(join(root, ".kotta/process/defined/T-002-export-job-api.md"), "utf8"));
    expect(task.data).toMatchObject({ id: "T-002", status: "defined", batch: "P-001", depends_on: ["T-001"] });
    expect(task.data.package).toBeUndefined();

    const backlog = matter(readFileSync(join(root, ".kotta/process/backlog/T-001-shape-the-export.md"), "utf8"));
    expect(backlog.data).toMatchObject({ origin: "observation", source_observation: "F-001", batch: "P-001" });

    const batch = matter(readFileSync(join(root, ".kotta/process/batches/defined/P-001-export-slice.md"), "utf8"));
    expect(batch.data).toMatchObject({ status: "defined", tasks: ["T-001", "T-002"] });
    expect(batch.data.kind).toBeUndefined();
    expect(batch.data.tickets).toBeUndefined();
    expect(batch.data.authority).toEqual({ create_observations: true, create_subtasks: false, reorder_independent_tasks: false, change_scope: false });

    const resolved = matter(readFileSync(join(root, ".kotta/process/observations/resolved/F-002-duplicate-read.md"), "utf8"));
    expect(resolved.data).toMatchObject({ observation_type: "performance", disposition: "create-task", task: "T-001", related_task: "T-001" });

    const claim = readFileSync(join(root, ".kotta/process/claims/T-003.yaml"), "utf8");
    expect(claim).toContain("task: T-003");
    expect(claim).not.toContain("ticket: T-003");

    const config = readFileSync(join(root, ".kotta/config.yaml"), "utf8");
    expect(config).toContain("version: 4");
    expect(config).toContain("batches:");
    expect(config).toContain("require_human_sign_approval");
    expect(config).toContain("allow_agent_observations");
    expect(config).toContain("allow_agent_defined_tasks");
    expect(config).toContain("require_verification_for_defined");

    // Every reference still points at something that is on disk. The board reads the base ref, so the
    // migration has to be committed first — the very gap the notices below are about.
    git(root, "add", "-A");
    git(root, "commit", "-m", "migrate");
    const board = readWorkspace(root);
    const taskIds = new Set(board.tasks.map((entity) => String(entity.id)));
    const observationIds = new Set(board.observations.map((entity) => String(entity.id)));
    const batchIds = new Set(board.batches.map((entity) => String(entity.id)));
    for (const entity of board.tasks) {
      if (entity.batch) expect(batchIds).toContain(String(entity.batch));
      if (entity.source_observation) expect(observationIds).toContain(String(entity.source_observation));
      for (const reference of (entity.depends_on ?? []) as string[]) expect(taskIds).toContain(reference);
    }
    for (const entity of board.batches) for (const member of (entity.tasks ?? []) as string[]) expect(taskIds).toContain(member);

    // Acceptance 6: the id set is identical, asserted from disk rather than from the command's report.
    expect(idsOnDisk(root)).toEqual(before);
    expect(before).toEqual(["F-001", "F-002", "P-001", "T-001", "T-002", "T-003"]);
  });

  test("running it a second time changes nothing and says so", () => {
    const root = legacyRepository("idempotent");
    run(root, ["migrate"]);
    const after = snapshot(root);

    const second = invoke(root, ["migrate"]);
    expect(second.status, second.stderr).toBe(0);
    expect(second.stdout).toContain("already on the current shape");
    expect(snapshot(root)).toEqual(after);
    expect((run(root, ["migrate"]).data as MigrateResult["data"]).current).toBe(true);
  });

  test("a workspace already in the new shape is left alone", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "kotta-migrate-current-")));
    git(root, "init", "-b", "main");
    git(root, "config", "user.name", "Kotta Test");
    git(root, "config", "user.email", "test@example.com");
    run(root, ["init"]);
    const created = run(root, ["task", "new", "--title", "Fresh task", "--type", "feature"]).data as { id: string };
    const before = snapshot(root);

    const result = run(root, ["migrate"]).data as MigrateResult["data"];
    expect(result.current).toBe(true);
    expect(result.changes).toEqual([]);
    expect(result.ids).toContain(created.id);
    expect(snapshot(root)).toEqual(before);
  });

  test("a mixed flat and nested workspace fails before writing", () => {
    const root = legacyRepository("interrupted");
    execFileSync("mv", [join(root, ".a-team"), join(root, ".kotta")]);
    mkdirSync(join(root, ".kotta/process/observations"), { recursive: true });
    const before = snapshot(root);

    const result = invoke(root, ["migrate"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("mixed legacy and nested workspace data");
    expect(snapshot(root)).toEqual(before);
  });
});

describe("flat v2 namespace migration", () => {
  test("dry-run is byte-identical and apply preserves custom forms and nodes", () => {
    const root = flatV2Repository("custom-spec");
    const before = snapshot(root);
    const dry = invoke(root, ["migrate", "--dry-run"]);
    expect(dry.status, dry.stderr).toBe(0);
    expect(snapshot(root)).toEqual(before);
    for (const change of [
      ".kotta/forms → .kotta/spec/forms",
      ".kotta/custom-nodes → .kotta/spec/custom-nodes",
      ".kotta/backlog → .kotta/process/backlog",
      ".kotta/index.md → .kotta/process/index.md",
      ".kotta/process/index.md merge=union",
    ]) expect(dry.stdout).toContain(change);

    run(root, ["migrate"]);
    expect(readFileSync(join(root, ".kotta/spec/forms/custom.yaml"), "utf8")).toContain("directory: custom-nodes");
    expect(readFileSync(join(root, ".kotta/spec/custom-nodes/example-cv000001.md"), "utf8")).toBe(CUSTOM_NODE);
    expect(readFileSync(join(root, ".kotta/config.yaml"), "utf8")).toContain("version: 4");
    expect(readFileSync(join(root, ".gitattributes"), "utf8")).toBe(".kotta/process/index.md merge=union\n");
    expect(run(root, ["validate"])).toMatchObject({ ok: true, errors: [] });
    const after = snapshot(root);
    expect((run(root, ["migrate"]).data as MigrateResult["data"]).current).toBe(true);
    expect(snapshot(root)).toEqual(after);
  });

  test.each([
    ["destination conflict", (root: string) => mkdirSync(join(root, ".kotta/spec/forms"), { recursive: true }), "destination conflict"],
    ["invalid form directory", (root: string) => writeFileSync(join(root, ".kotta/forms/custom.yaml"), "id: custom\nversion: 1\ndirectory: ../escape\n"), "invalid directory"],
    ["unknown root directory", (root: string) => { mkdirSync(join(root, ".kotta/unclassified")); writeFileSync(join(root, ".kotta/unclassified/data.txt"), "unknown\n"); }, "cannot classify workspace data"],
  ])("%s fails before the first write", (_label, arrange, message) => {
    const root = flatV2Repository(String(_label).replaceAll(" ", "-"));
    arrange(root);
    const before = snapshot(root);
    const result = invoke(root, ["migrate"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
    expect(snapshot(root)).toEqual(before);
  });
});

describe("the old shape outside the migration command", () => {
  test("ordinary commands refuse it and name kotta migrate", () => {
    const root = legacyRepository("refusal");
    for (const args of [["validate"], ["status"], ["sync"], ["task", "validate", "T-002"], ["batch", "validate", "P-001"], ["claim", "list"]]) {
      const result = invoke(root, args);
      expect(result.status, `${args.join(" ")} was accepted`).toBe(1);
      expect(result.stderr).toContain("legacy Kotta workspace shape");
      expect(result.stderr).toContain("kotta migrate");
    }
  });

  test("a linked worktree carrying its pre-migration baseline is judged by the control plane, not by its own copy", () => {
    const root = currentRepository("worktree-baseline");
    const worktree = join(root, "work");
    git(root, "worktree", "add", "-b", "feat/baseline", worktree);
    // An implementation worktree keeps the `.kotta/` it branched from, so one started before the
    // control plane migrated still holds the flat shape. Its state changes route to the control
    // plane anyway, so the copy it carries must not refuse the command.
    mkdirSync(join(worktree, ".kotta", "backlog"), { recursive: true });

    const result = invoke(worktree, ["status"]);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain(join(root, ".kotta"));
  });

  test("a flat control plane is still refused, whichever worktree the command was typed in", () => {
    const root = currentRepository("worktree-control-flat");
    const worktree = join(root, "work");
    git(root, "worktree", "add", "-b", "feat/control-flat", worktree);
    // Here it is the workspace the command would actually write that carries the old shape.
    mkdirSync(join(root, ".kotta", "backlog"), { recursive: true });

    for (const cwd of [root, worktree]) {
      const result = invoke(cwd, ["status"]);
      expect(result.status, `${cwd} was accepted`).toBe(1);
      expect(result.stderr).toContain("legacy Kotta workspace shape");
      expect(result.stderr).toContain("kotta migrate");
    }
  });

  test("the migration command itself reads it correctly", () => {
    const root = legacyRepository("readable");
    const planned = run(root, ["migrate", "--dry-run"]).data as MigrateResult["data"];
    expect(planned.ids).toEqual(["F-001", "F-002", "P-001", "T-001", "T-002", "T-003"]);
    expect(planned.changes.filter((change) => change.kind === "move").length).toBeGreaterThanOrEqual(10);
  });

  test("planning twice in one process reports the same changes both times (F-01kz294gj4sy9gcc56s8j3h62g)", () => {
    const root = legacyRepository("shared-frontmatter");

    const first = migrateWorkspace({ dryRun: true }, root).data;
    const second = migrateWorkspace({ dryRun: true }, root).data;

    expect(second.ids).toEqual(first.ids);
    expect(second.changes).toEqual(first.changes);
  });

  test("the board says why it looks incomplete instead of showing an empty page", () => {
    const root = legacyRepository("board-notice");
    const board = readWorkspace(root);
    expect(board.tasks).toEqual([]);
    expect(board.notices.join("\n")).toContain("legacy flat shape");
    expect(board.notices.join("\n")).toContain("kotta migrate");
  });

  test("after migrating, the board explains the base-ref gap until the commit lands (F-01kz25qf318bmn1t860n2rjcpt)", () => {
    const root = legacyRepository("base-ref");
    const report = invoke(root, ["migrate"]).stdout;
    // The command says it before the operator can be surprised by it.
    expect(report).toContain("reads the workspace from the 'main' ref");
    expect(report).toContain("Commit the migration");

    // And the board says the same thing while the migration is only in the working tree.
    const board = readWorkspace(root);
    expect(board.tasks).toHaveLength(0);
    expect(board.notices.join("\n")).toContain("from the 'main' ref");
    expect(board.notices.join("\n")).toContain("the board is empty until then, and the workspace is not");

    // Committing to the base ref closes the gap, and the notice goes away.
    git(root, "add", "-A");
    git(root, "commit", "-m", "migrate");
    const after = readWorkspace(root);
    expect(after.tasks).toHaveLength(3);
    expect(after.notices).toEqual([]);
  });
});

describe("the removed kind field", () => {
  test("batch new no longer accepts --kind, and writes none", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "kotta-migrate-kind-")));
    git(root, "init", "-b", "main");
    git(root, "config", "user.name", "Kotta Test");
    git(root, "config", "user.email", "test@example.com");
    run(root, ["init"]);
    expect(invoke(root, ["batch", "new", "--title", "A batch", "--kind", "sprint"]).status).toBe(1);

    const created = run(root, ["batch", "new", "--title", "A batch", "--goal", "Ship it"]).data as { path: string };
    expect(matter(readFileSync(created.path, "utf8")).data.kind).toBeUndefined();
  });

  test("kind is gone from the published schema", () => {
    const schema = JSON.parse(readFileSync(resolve("schemas/batch.schema.json"), "utf8")) as { required: string[]; properties: Record<string, unknown> };
    expect(schema.required).not.toContain("kind");
    expect(schema.properties.kind).toBeUndefined();
  });

  test("a batch that still carries it loads, with a warning", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "kotta-migrate-kind-load-")));
    git(root, "init", "-b", "main");
    git(root, "config", "user.name", "Kotta Test");
    git(root, "config", "user.email", "test@example.com");
    run(root, ["init"]);
    const created = run(root, ["task", "new", "--title", "Member", "--type", "feature"]).data as { id: string };
    const batch = run(root, ["batch", "new", "--title", "With kind", "--goal", "Ship it"]).data as { id: string; path: string };
    run(root, ["batch", "add", batch.id, created.id]);
    const parsed = matter(readFileSync(batch.path, "utf8"));
    writeFileSync(batch.path, matter.stringify(parsed.content, { ...parsed.data, kind: "sprint" }));

    const result = invoke(root, ["batch", "validate", batch.id, "--json"]);
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout) as { ok: boolean; data: { warnings: string[] } };
    expect(report.ok).toBe(true);
    expect(report.data.warnings.join("\n")).toContain("still carries the removed 'kind' field");
    expect(result.stderr).toContain("kotta migrate");
  });
});

describe("a workspace the size of a real one", () => {
  test("165 tasks, 105 observations and 21 batches migrate and validate", () => {
    const root = realpathSync(mkdtempSync(join(tmpdir(), "kotta-migrate-large-")));
    git(root, "init", "-b", "main");
    git(root, "config", "user.name", "Kotta Test");
    git(root, "config", "user.email", "test@example.com");
    const workspace = join(root, ".a-team");
    for (const sub of ["backlog", "ready", "findings/new", "packages/backlog", "claims", "decisions", "profiles"]) {
      mkdirSync(join(workspace, sub), { recursive: true });
    }
    writeFileSync(join(workspace, "config.yaml"), "version: 1\nproject:\n  name: large\ngit:\n  base_branch: main\npackages:\n  default_parallelism: 2\n");
    writeFileSync(join(workspace, "index.md"), "# Kotta Status\n");

    const taskIds: string[] = [];
    for (let index = 1; index <= 165; index += 1) {
      const id = `T-${String(index).padStart(3, "0")}`;
      taskIds.push(id);
      const state = index % 3 === 0 ? "ready" : "backlog";
      write(join(workspace, state, `${id}-task-${index}.md`), {
        id, title: `Task ${index}`, status: state === "ready" ? "ready" : "backlog", origin: "human",
        types: ["feature"], profiles: [], priority: "medium", risk: "medium",
        package: `P-${String(Math.floor((index - 1) / 8) + 1).padStart(3, "0")}`,
        depends_on: [], blocks: [], created_at: "2026-07-01", updated_at: "2026-07-01",
      }, TASK_BODY);
    }
    for (let index = 1; index <= 105; index += 1) {
      const id = `F-${String(index).padStart(3, "0")}`;
      write(join(workspace, "findings/new", `${id}-observation-${index}.md`), {
        id, title: `Observation ${index}`, status: "new", origin: "agent", finding_type: "bug",
        confidence: "high", severity: "medium", created_at: "2026-07-01",
      }, OBSERVATION_BODY);
    }
    for (let index = 1; index <= 21; index += 1) {
      const id = `P-${String(index).padStart(3, "0")}`;
      write(join(workspace, "packages/backlog", `${id}-batch-${index}.md`), {
        id, title: `Batch ${index}`, status: "backlog", kind: "batch",
        tickets: taskIds.slice((index - 1) * 8, index * 8),
        execution: { mode: "dependency-aware", parallelism: 2, stop_on_failure: true },
        authority: { create_findings: true, create_subtickets: false, reorder_independent_tickets: false, change_scope: false },
        created_at: "2026-07-01", updated_at: "2026-07-01",
      }, BATCH_BODY);
    }
    git(root, "add", ".");
    git(root, "commit", "-m", "large legacy workspace");

    const before = idsOnDisk(root);
    expect(before).toHaveLength(165 + 105 + 21);

    const result = run(root, ["migrate"]).data as MigrateResult["data"];
    expect(result.current).toBe(false);
    expect(result.ids).toHaveLength(before.length);
    expect(idsOnDisk(root)).toEqual(before);
    expect(run(root, ["validate"])).toMatchObject({ ok: true, errors: [] });
    expect(readdirSync(join(root, ".kotta/process/observations/new"))).toHaveLength(105);
    expect(readdirSync(join(root, ".kotta/process/batches/backlog"))).toHaveLength(21);
    expect(run(root, ["migrate"]).data).toMatchObject({ current: true });
  }, 120_000);
});
