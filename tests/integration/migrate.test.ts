import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from "node:fs";

import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";
import { createKottaMcpServer } from "../../src/commands/mcp.js";
import { readWorkspace } from "../../src/commands/ui.js";
import { migrateWorkspace, workspaceIds, type MigrateResult } from "../../src/commands/migrate.js";

/**
 * `kotta migrate` is the only reader of the pre-1.0 shapes. Everything asserted here is exercised on
 * a real workspace on disk: the dry run touches nothing, the run archives the process state
 * untouched under `legacy/`, leaves `spec/` byte-identical, rewrites the workspace's own files to
 * version 6, a second run is a no-op, and every other command refuses the old shape by name — and
 * does nothing else — until the migration has run. The older shapes (v1 under `.a-team/`, flat v2,
 * v4 with state directories) reach the archive in the v5 shape, in one run.
 */

const cli = resolve("dist/cli/index.js");
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
const invoke = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = invoke(cwd, [...args, "--json"]);
  if (result.status !== 0) throw new Error(result.stdout || result.stderr);
  return JSON.parse(result.stdout) as { ok: boolean; command: string; data: Record<string, unknown> };
};
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;

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

const TERM_ID = "GT-01m0c0000000000000000000t1";
const TERM_NODE = [
  "---", `id: ${TERM_ID}`, "form: glossary-term", "title: Coordinator branch", "accepted:", '  - "unexamined: nobody has looked yet"', "---", "",
  "## Definition", "", "The branch a batch ran on.", "", "## Usage", "", "History.", "", "## Non-examples", "", "A feature branch.", "",
].join("\n");

const V5_CONFIG = [
  "version: 5",
  "project:", "  name: fixture-v5",
  "workflow:", "  require_human_done_approval: true", "  allow_agent_observations: true", "  allow_agent_defined_tasks: false",
  "agents:", "  permission_mode: null",
  "git:", "  base_branch: main", "  protected_branches:", "    - main", "    - master", "    - develop", "  worktrees: auto", "  worktree_root: .worktrees", '  branch_pattern: "{prefix}/{id}-{slug}"',
  "batches:", "  default_parallelism: 2", "  stop_on_failure: true",
  "validation:", "  strict: true", "  reject_unknown_profiles: true", "  require_verification_for_defined: true", "  require_review_evidence_for_done: true",
  "",
].join("\n");

function write(path: string, data: Record<string, unknown>, body: string): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, matter.stringify(`# ${String(data.id)} — ${String(data.title)}\n\n${body}`, data));
}

function newRepository(label: string): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), `kotta-migrate-${label}-`)));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  return root;
}

function installBundledForms(target: string): void {
  mkdirSync(target, { recursive: true });
  const bundled = resolve("templates/workspace/spec/forms");
  for (const name of readdirSync(bundled).filter((entry) => entry.endsWith(".yaml"))) copyFileSync(join(bundled, name), join(target, name));
}

/** The last pre-1.0 shape, as the 0.11 release wrote it: process/ flat by kind, spec/ beside it. */
function v5Repository(label: string): string {
  const root = newRepository(`v5-${label}`);
  const workspace = join(root, ".kotta");
  mkdirSync(workspace, { recursive: true });
  writeFileSync(join(workspace, "config.yaml"), V5_CONFIG);
  writeFileSync(join(workspace, "README.md"), "# Kotta workspace\n\nTwo ownership boundaries: spec/ and process/.\n");
  for (const directory of ["tasks", "observations", "batches", "claims", "decisions", "profiles", "events/task"]) mkdirSync(join(workspace, "process", directory), { recursive: true });
  write(join(workspace, "process/tasks/shape-the-export-0000t001.md"), {
    id: "T-01m0c000000000000000000t01", title: "Shape the export", status: "done", resolution: "completed", origin: "human", types: ["feature"], profiles: [],
    priority: "medium", risk: "medium", batch: "P-001", depends_on: [], blocks: [], spec: [TERM_ID], created_at: "2026-07-01", updated_at: "2026-07-09",
  }, `${TASK_BODY}\n## Review evidence\n\n- The result exists: tests/export.test.ts\n`);
  write(join(workspace, "process/tasks/T-002-export-job-api.md"), {
    id: "T-002", title: "Export job API", status: "active", origin: "human", types: ["feature"], profiles: [],
    priority: "medium", risk: "low", batch: "P-001", depends_on: [], blocks: [], created_at: "2026-07-02", updated_at: "2026-07-02",
  }, TASK_BODY);
  write(join(workspace, "process/observations/F-001-divergent-checks.md"), {
    id: "F-001", title: "Divergent checks", status: "new", origin: "agent", observation_type: "inconsistency",
    confidence: "high", severity: "medium", discovered_during: "T-002", created_at: "2026-07-04",
  }, OBSERVATION_BODY);
  write(join(workspace, "process/batches/P-001-export-slice.md"), {
    id: "P-001", title: "Export slice", status: "active", tasks: ["T-01m0c000000000000000000t01", "T-002"],
    execution: { mode: "dependency-aware", parallelism: 2, stop_on_failure: true },
    created_at: "2026-07-01", updated_at: "2026-07-02",
  }, BATCH_BODY);
  writeFileSync(join(workspace, "process/claims/T-002.yaml"), "task: T-002\nagent: codex\nbranch: feat/T-002-export-job-api\nworktree: .worktrees/T-002\nstarted_at: 2026-07-03T09:00:00Z\n");
  writeFileSync(join(workspace, "process/decisions/D-001.md"), "---\nid: D-001\ntitle: Cut over\ndate: 2026-07-01\n---\n## Decision\n\nProceed.\n\n## Context\n\nReady.\n\n## Consequences\n\nMonitor.\n");
  writeFileSync(join(workspace, "process/profiles/bug.yaml"), "id: bug\nrequired_sections: [Actual behaviour]\n");
  writeFileSync(join(workspace, "process/events/task/E-01m0c000000000000000000e01.json"), `${JSON.stringify({ id: "E-01m0c000000000000000000e01", entity: "T-002", task: "T-002", kind: "lifecycle", state: "active", created_at: "2026-07-03T09:00:00Z" }, null, 2)}\n`);
  writeFileSync(join(workspace, "process/index.md"), "# Kotta Status\n\n> Generated file. Do not edit manually.\n\n## Active tasks\n\n- T-002-export-job-api\n");
  installBundledForms(join(workspace, "spec/forms"));
  mkdirSync(join(workspace, "spec/glossary-terms"), { recursive: true });
  writeFileSync(join(workspace, "spec/glossary-terms/coordinator-branch-000000t1.md"), TERM_NODE);
  writeFileSync(join(root, ".gitattributes"), "*.md text\n.kotta/process/index.md merge=union\n");
  writeFileSync(join(root, ".gitignore"), ".worktrees/\n");
  writeFileSync(join(root, "tests.ts"), `// ${TERM_ID}\n`);
  git(root, "add", ".");
  git(root, "commit", "-m", "v5 workspace");
  return root;
}

/** The v4 shape: state directories under process/, the directory being the state authority. */
function v4Repository(label: string): string {
  const root = newRepository(`v4-${label}`);
  const workspace = join(root, ".kotta");
  mkdirSync(workspace, { recursive: true });
  writeFileSync(join(workspace, "config.yaml"), V5_CONFIG.replace("version: 5", "version: 4"));
  for (const directory of ["backlog", "defined", "active", "review", "done", "observations/new", "observations/resolved", "batches/backlog", "batches/defined", "claims", "decisions", "profiles"]) mkdirSync(join(workspace, "process", directory), { recursive: true });
  write(join(workspace, "process/backlog/T-001-shape-the-export.md"), {
    id: "T-001", title: "Shape the export", status: "backlog", origin: "human", types: ["feature"], profiles: [],
    priority: "medium", risk: "medium", batch: "P-001", depends_on: [], blocks: [], created_at: "2026-07-01", updated_at: "2026-07-01",
  }, TASK_BODY);
  write(join(workspace, "process/defined/T-002-export-job-api.md"), {
    id: "T-002", title: "Export job API", status: "backlog", origin: "human", types: ["feature"], profiles: [],
    priority: "medium", risk: "low", batch: "P-001", depends_on: ["T-001"], blocks: [], created_at: "2026-07-02", updated_at: "2026-07-02",
  }, TASK_BODY);
  write(join(workspace, "process/observations/new/F-001-divergent-checks.md"), {
    id: "F-001", title: "Divergent checks", status: "new", origin: "agent", observation_type: "inconsistency",
    confidence: "high", severity: "medium", created_at: "2026-07-04",
  }, OBSERVATION_BODY);
  write(join(workspace, "process/batches/defined/P-001-export-slice.md"), {
    id: "P-001", title: "Export slice", status: "defined", tasks: ["T-001", "T-002"], created_at: "2026-07-01", updated_at: "2026-07-02",
  }, BATCH_BODY);
  writeFileSync(join(workspace, "process/decisions/D-001.md"), "---\nid: D-001\ntitle: Cut over\ndate: 2026-07-01\n---\n## Decision\n\nProceed.\n\n## Context\n\nReady.\n\n## Consequences\n\nMonitor.\n");
  writeFileSync(join(workspace, "process/index.md"), "# Kotta Status\n");
  installBundledForms(join(workspace, "spec/forms"));
  mkdirSync(join(workspace, "spec/glossary-terms"), { recursive: true });
  writeFileSync(join(workspace, "spec/glossary-terms/coordinator-branch-000000t1.md"), TERM_NODE);
  writeFileSync(join(root, ".gitattributes"), ".kotta/process/index.md merge=union\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "v4 workspace");
  return root;
}

/** The v1 shape, under the pre-rename directory name, with the pre-vocabulary words. */
function legacyRepository(label: string): string {
  const root = newRepository(`v1-${label}`);
  const workspace = join(root, ".a-team");
  for (const sub of ["backlog", "ready", "active", "findings/new", "findings/resolved", "packages/backlog", "packages/ready", "claims", "decisions", "profiles"]) {
    mkdirSync(join(workspace, sub), { recursive: true });
  }
  writeFileSync(join(workspace, "config.yaml"), [
    "version: 1", "project:", "  name: legacy-fixture",
    "workflow:", "  require_human_ready_approval: true", "  require_human_done_approval: true", "  allow_agent_findings: true", "  allow_agent_ready_tickets: false",
    "git:", "  base_branch: main", "  protected_branches:", "    - main",
    "packages:", "  default_parallelism: 2", "  stop_on_failure: true",
    "validation:", "  strict: true", "  require_verification_for_ready: true", "",
  ].join("\n"));
  writeFileSync(join(workspace, "index.md"), "# Kotta Status\n");
  writeFileSync(join(workspace, "README.md"), "# A-Team workspace\n\nRepository files are canonical.\n");
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
  writeFileSync(join(workspace, "claims/T-003.yaml"), "ticket: T-003\nagent: codex\nbranch: feat/T-003-export-audit\nworktree: .worktrees/T-003\nstarted_at: 2026-07-03T09:00:00Z\n");
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

/** The flat v2 shape: state directories and the registry at the top of `.kotta/`. */
function flatV2Repository(label: string): string {
  const root = newRepository(`v2-${label}`);
  const workspace = join(root, ".kotta");
  for (const directory of ["backlog", "defined", "active", "review", "done", "observations/new", "observations/resolved", "batches/backlog", "batches/defined", "profiles", "claims", "events", "decisions", "forms", "custom-nodes"]) {
    mkdirSync(join(workspace, directory), { recursive: true });
  }
  writeFileSync(join(workspace, "config.yaml"), "version: 2\nproject:\n  name: flat-v2\ngit:\n  base_branch: main\n");
  writeFileSync(join(workspace, "index.md"), "# Flat index\n");
  installBundledForms(join(workspace, "forms"));
  writeFileSync(join(workspace, "forms/custom.yaml"), CUSTOM_FORM);
  writeFileSync(join(workspace, "custom-nodes/example-cv000001.md"), CUSTOM_NODE);
  writeFileSync(join(root, ".gitattributes"), ".kotta/index.md merge=union\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "flat v2 workspace");
  return root;
}

/** Content-addressed picture of a directory tree: any write at all changes it. */
function snapshot(directory: string, options: { skipGit?: boolean } = { skipGit: true }): Record<string, string> {
  const files: Record<string, string> = {};
  const walk = (current: string) => {
    for (const name of readdirSync(current).sort()) {
      if (options.skipGit && name === ".git") continue;
      const path = join(current, name);
      if (statSync(path).isDirectory()) walk(path);
      else files[relative(directory, path)] = createHash("sha1").update(readFileSync(path)).digest("hex");
    }
  };
  if (existsSync(directory)) walk(directory);
  return files;
}

/** Ids read straight off disk, independently of anything the migration reports about itself. */
function idsOnDisk(root: string): string[] {
  const workspace = [".kotta", ".a-team"].map((name) => join(root, name)).find((path) => existsSync(path));
  return workspaceIds(workspace as string);
}

/** The commands that read a workspace, every one of which must refuse the old shape and write nothing. */
const READERS: string[][] = [["validate"], ["gap"], ["questions"], ["spec", "new", "goal", "--title", "Nope"], ["sync"], ["doctor"], ["ui", "--port", "0", "--no-open"]];

describe("a v5 workspace, the last pre-1.0 shape", () => {
  test("--dry-run names every change, in detail, and modifies nothing", () => {
    const root = v5Repository("dry-run");
    const before = snapshot(root);

    const result = invoke(root, ["migrate", "--dry-run"]);
    expect(result.status, result.stderr).toBe(0);
    expect(snapshot(root)).toEqual(before);
    expect(git(root, "status", "--porcelain")).toBe("");

    const report = result.stdout;
    expect(report).toContain("Nothing was written.");
    expect(report).toContain("from shape version 5 to version 6");
    expect(report).toContain("move       .kotta/process → .kotta/legacy/process");
    expect(report).toContain("create     .kotta/legacy/README.md");
    expect(report).toContain("rewrite    .kotta/config.yaml: version: 5 → 6, workflow removed, agents removed, batches removed, git.worktrees removed, git.worktree_root removed, git.branch_pattern removed, validation.reject_unknown_profiles removed, validation.require_verification_for_defined removed, validation.require_review_evidence_for_done removed");
    expect(report).toContain("rewrite    .kotta/README.md");
    expect(report).toContain("rewrite    .gitattributes: index merge attribute removed");
    expect(report).toContain("rewrite    .kotta/AGENTS.md");
    expect(report).toContain("byte-identical");
    // The archive is moved, never rewritten: no process file appears as a rewrite.
    expect(report).not.toMatch(/rewrite {4}\.kotta\/legacy/);
  });

  test("the run archives the process state untouched, leaves spec/ byte-identical, and produces a version-6 workspace", () => {
    const root = v5Repository("apply");
    const processBefore = snapshot(join(root, ".kotta/process"));
    const specBefore = snapshot(join(root, ".kotta/spec"));
    const idsBefore = idsOnDisk(root);

    const migrated = run(root, ["migrate"]).data as MigrateResult["data"];
    expect(migrated.current).toBe(false);
    expect(migrated.fromVersion).toBe(5);

    // The archive: every file, byte for byte, under legacy/process; nothing left under process/.
    expect(existsSync(join(root, ".kotta/process"))).toBe(false);
    expect(snapshot(join(root, ".kotta/legacy/process"))).toEqual(processBefore);
    expect(Object.keys(processBefore).length).toBeGreaterThan(8);
    const readme = readFileSync(join(root, ".kotta/legacy/README.md"), "utf8");
    expect(readme).toContain("read-only archive");
    expect(readme).toContain("workspace shape version 5");
    expect(readme).toContain("@arpadtamasi/kotta@0.11.1");

    // The specification: byte-identical, and the id set on disk unchanged.
    expect(snapshot(join(root, ".kotta/spec"))).toEqual(specBefore);
    expect(idsOnDisk(root)).toEqual(idsBefore);
    expect(idsBefore).toEqual(["D-001", "F-001", "P-001", "T-002", "T-01m0c000000000000000000t01"]);

    // The workspace's own files: version 6, with only what version 6 keeps.
    const config = readFileSync(join(root, ".kotta/config.yaml"), "utf8");
    expect(config).toContain("version: 6");
    expect(config).toContain("name: fixture-v5");
    expect(config).toContain("base_branch: main");
    expect(config).toContain("- develop");
    expect(config).toContain("strict: true");
    for (const gone of ["workflow", "agents", "batches", "worktrees", "worktree_root", "branch_pattern", "reject_unknown_profiles", "require_verification_for_defined", "require_review_evidence_for_done"]) {
      expect(config, `${gone} is gone`).not.toContain(gone);
    }
    expect(readFileSync(join(root, ".kotta/README.md"), "utf8")).toContain("version 6");
    expect(readFileSync(join(root, ".gitattributes"), "utf8")).toBe("*.md text\n");
    expect(readFileSync(join(root, ".kotta/AGENTS.md"), "utf8")).toContain("The four layers");
    expect(readFileSync(join(root, ".gitignore"), "utf8"), "the project's own ignore file is not Kotta's to edit").toBe(".worktrees/\n");

    // Recorded as a rename in the index, so history follows the archive.
    const staged = git(root, "diff", "--cached", "--name-status", "-M");
    expect(staged).toMatch(/^R\d*\t\.kotta\/process\/tasks\/T-002-export-job-api\.md\t\.kotta\/legacy\/process\/tasks\/T-002-export-job-api\.md$/m);

    expect(run(root, ["validate"])).toMatchObject({ ok: true, data: { specNodes: 1 } });
    expect(migrated.validation).toMatchObject({ ok: true });
  });

  test("after the migration every command runs, and the archive is read by none of them", () => {
    const root = v5Repository("after");
    run(root, ["migrate"]);
    git(root, "add", "-A");
    git(root, "commit", "-m", "migrate");
    const archive = snapshot(join(root, ".kotta/legacy"));

    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    // The evidence citation in the fixture keeps the one node; the archive's task naming it is not evidence.
    const gap = run(root, ["gap"]).data as { promises: unknown[]; nodes: Array<{ id: string; evidence: Array<{ path: string }> }> };
    expect(gap.promises).toEqual([]);
    expect(gap.nodes.find((node) => node.id === TERM_ID)?.evidence.map((entry) => entry.path)).toEqual(["tests.ts"]);
    expect(run(root, ["questions"])).toMatchObject({ ok: true, data: { total: 0 } });
    expect(readWorkspace(root).spec.map((node) => node.id)).toEqual([TERM_ID]);
    expect(run(root, ["spec", "new", "goal", "--title", "A goal"])).toMatchObject({ ok: true });
    expect(invoke(root, ["sync", "--json"]).status).toBe(0);
    expect(() => createKottaMcpServer(root)).not.toThrow();

    expect(snapshot(join(root, ".kotta/legacy")), "nothing wrote into the archive").toEqual(archive);
  });

  test("running it a second time changes nothing and says so", () => {
    const root = v5Repository("idempotent");
    run(root, ["migrate"]);
    const after = snapshot(root);

    const second = invoke(root, ["migrate"]);
    expect(second.status, second.stderr).toBe(0);
    expect(second.stdout).toContain("already on the current shape");
    expect(snapshot(root)).toEqual(after);
    expect((run(root, ["migrate"]).data as MigrateResult["data"]).current).toBe(true);
  });

  test("a workspace already in the new shape is left alone", () => {
    const root = newRepository("current");
    run(root, ["init"]);
    const created = run(root, ["spec", "new", "goal", "--title", "Fresh goal"]).data as { id: string };
    const before = snapshot(root);

    const result = run(root, ["migrate"]).data as MigrateResult["data"];
    expect(result.current).toBe(true);
    expect(result.changes).toEqual([]);
    expect(snapshot(root)).toEqual(before);
    expect(existsSync(join(root, created.id ? ".kotta/spec/goals" : ""))).toBe(true);
  });

  test("an existing archive is a conflict that stops before the first write", () => {
    const root = v5Repository("conflict");
    mkdirSync(join(root, ".kotta/legacy"), { recursive: true });
    writeFileSync(join(root, ".kotta/legacy/README.md"), "already here\n");
    const before = snapshot(root);

    const result = invoke(root, ["migrate"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Migration destination already exists");
    expect(result.stderr).toContain(".kotta/legacy");
    expect(snapshot(root)).toEqual(before);
  });

  test("planning twice in one process reports the same changes both times", () => {
    const root = v5Repository("twice");
    const first = migrateWorkspace({ dryRun: true }, root).data;
    const second = migrateWorkspace({ dryRun: true }, root).data;
    expect(second.ids).toEqual(first.ids);
    expect(second.changes).toEqual(first.changes);
  });
});

describe("no command but the migration runs on a pre-1.0 workspace", () => {
  test("every reader refuses, names the migration, and writes nothing", () => {
    const root = v5Repository("refusal");
    const before = snapshot(root);
    for (const args of READERS) {
      const result = invoke(root, args);
      expect(result.status, `${args.join(" ")} was accepted`).toBe(1);
      expect(result.stderr, `${args.join(" ")} names the shape`).toContain("pre-1.0 Kotta workspace shape");
      expect(result.stderr, `${args.join(" ")} names the remedy`).toContain("kotta migrate --dry-run");
      expect(result.stderr, `${args.join(" ")} names what it will not do`).toContain("No other command runs on the old shape");
    }
    expect(() => readWorkspace(root)).toThrow(/pre-1\.0 Kotta workspace shape/);
    expect(() => createKottaMcpServer(root)).toThrow(/pre-1\.0 Kotta workspace shape/);
    expect(snapshot(root)).toEqual(before);
    expect(git(root, "status", "--porcelain")).toBe("");
  }, 60_000);

  test("the refusal is by shape, not by version alone: a version-6 config beside a process/ directory is still old", () => {
    const root = newRepository("shape-not-version");
    run(root, ["init"]);
    mkdirSync(join(root, ".kotta/process/tasks"), { recursive: true });
    const result = invoke(root, ["validate"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(".kotta/process/");
    expect(result.stderr).toContain("kotta migrate");
  });

  test("the old commands are gone, not merely refused: task, batch, observation, decision, claim, status and sweep", () => {
    const root = v5Repository("gone");
    for (const command of ["task", "batch", "observation", "decision", "claim", "status", "sweep"]) {
      const result = invoke(root, [command]);
      expect(result.status, `${command} exists`).not.toBe(0);
      expect(result.stderr).toContain(`unknown command '${command}'`);
    }
    const help = invoke(root, ["--help"]).stdout;
    expect(help).toContain("migrate");
    // The 0.x approval surface is gone; `approve` is back only as the planning phase's one gate.
    expect(help).not.toMatch(/^\s{2}approval\b/m);
    expect(help).toMatch(/^\s{2}approve \[options\] <change>\s+Record the human's yes/m);
  });
});

describe("the older shapes reach the archive in the v5 shape, in one run", () => {
  test("v4: the state directories flatten, the directory's verdict is transcribed, and the result is archived", () => {
    const root = v4Repository("chain");
    const specBefore = snapshot(join(root, ".kotta/spec"));
    const idsBefore = idsOnDisk(root);

    const planned = invoke(root, ["migrate", "--dry-run"]).stdout;
    expect(planned).toContain("from shape version 4 to version 6");
    expect(planned).toContain(".kotta/process/defined/T-002-export-job-api.md → .kotta/legacy/process/tasks/T-002-export-job-api.md");
    expect(planned).toContain("status: backlog → defined (the state directory was the authority)");
    expect(planned).toContain("remove     .kotta/process/defined");

    const migrated = run(root, ["migrate"]).data as MigrateResult["data"];
    expect(migrated.fromVersion).toBe(4);
    expect(existsSync(join(root, ".kotta/process"))).toBe(false);
    expect(readdirSync(join(root, ".kotta/legacy/process")).sort()).toEqual(["batches", "claims", "decisions", "index.md", "observations", "profiles", "tasks"]);
    expect(readdirSync(join(root, ".kotta/legacy/process/tasks")).sort()).toEqual(["T-001-shape-the-export.md", "T-002-export-job-api.md"]);
    const defined = matter(readFileSync(join(root, ".kotta/legacy/process/tasks/T-002-export-job-api.md"), "utf8"));
    expect(defined.data).toMatchObject({ id: "T-002", status: "defined", depends_on: ["T-001"] });
    expect(existsSync(join(root, ".kotta/legacy/process/observations/F-001-divergent-checks.md"))).toBe(true);
    expect(existsSync(join(root, ".kotta/legacy/process/batches/P-001-export-slice.md"))).toBe(true);

    expect(snapshot(join(root, ".kotta/spec"))).toEqual(specBefore);
    expect(idsOnDisk(root)).toEqual(idsBefore);
    expect(readFileSync(join(root, ".kotta/config.yaml"), "utf8")).toContain("version: 6");
    expect(existsSync(join(root, ".gitattributes")), "held only the merge attribute, so it is gone").toBe(false);
    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    expect((run(root, ["migrate"]).data as MigrateResult["data"]).current).toBe(true);
  });

  test("v1 under .a-team: the directory moves, the vocabulary is carried to the v5 words in the archive, and the registry is installed", () => {
    const root = legacyRepository("chain");
    const before = idsOnDisk(root);

    const planned = invoke(root, ["migrate", "--dry-run"]);
    expect(planned.status, planned.stderr).toBe(0);
    for (const line of [
      ".a-team → .kotta",
      ".a-team/ready/T-002-export-job-api.md → .kotta/legacy/process/tasks/T-002-export-job-api.md",
      ".a-team/findings/new/F-001-divergent-checks.md → .kotta/legacy/process/observations/F-001-divergent-checks.md",
      ".a-team/packages/ready/P-001-export-slice.md → .kotta/legacy/process/batches/P-001-export-slice.md",
      "package → batch", "status: ready → defined", "tickets → tasks", "finding_type → observation_type", "disposition: create-ticket → create-task",
      "create     .kotta/spec/forms (the bundled form registry)",
      "6 identifiers, all unchanged",
    ]) expect(planned.stdout).toContain(line);

    const migrated = run(root, ["migrate"]).data as MigrateResult["data"];
    expect(migrated.fromVersion).toBe(1);
    expect(existsSync(join(root, ".a-team"))).toBe(false);
    expect(existsSync(join(root, ".kotta/process"))).toBe(false);
    const task = matter(readFileSync(join(root, ".kotta/legacy/process/tasks/T-002-export-job-api.md"), "utf8"));
    expect(task.data).toMatchObject({ id: "T-002", status: "defined", batch: "P-001" });
    expect(task.data.package).toBeUndefined();
    const batch = matter(readFileSync(join(root, ".kotta/legacy/process/batches/P-001-export-slice.md"), "utf8"));
    expect(batch.data).toMatchObject({ status: "defined", tasks: ["T-001", "T-002"] });
    expect(batch.data.kind).toBeUndefined();
    expect(readFileSync(join(root, ".kotta/legacy/process/claims/T-003.yaml"), "utf8")).toContain("task: T-003");
    expect(readFileSync(join(root, ".kotta/legacy/README.md"), "utf8")).toContain("`.a-team/` directory");
    expect(existsSync(join(root, ".kotta/spec/forms/goal.yaml"))).toBe(true);
    expect(readFileSync(join(root, ".kotta/config.yaml"), "utf8")).toContain("name: legacy-fixture");
    expect(readFileSync(join(root, ".kotta/config.yaml"), "utf8")).not.toContain("packages");
    expect(idsOnDisk(root)).toEqual(before);
    expect(run(root, ["validate"])).toMatchObject({ ok: true, errors: [] });
  });

  test("flat v2: the registry and the custom nodes move to spec/, byte-identical, and the rest is archived", () => {
    const root = flatV2Repository("chain");
    const before = snapshot(root);
    const dry = invoke(root, ["migrate", "--dry-run"]);
    expect(dry.status, dry.stderr).toBe(0);
    expect(snapshot(root)).toEqual(before);
    for (const change of [
      ".kotta/forms → .kotta/spec/forms",
      ".kotta/custom-nodes → .kotta/spec/custom-nodes",
      "remove     .kotta/backlog",
      ".kotta/index.md → .kotta/legacy/process/index.md",
      "remove     .gitattributes",
    ]) expect(dry.stdout).toContain(change);

    run(root, ["migrate"]);
    expect(readFileSync(join(root, ".kotta/spec/forms/custom.yaml"), "utf8")).toBe(CUSTOM_FORM);
    expect(readFileSync(join(root, ".kotta/spec/custom-nodes/example-cv000001.md"), "utf8")).toBe(CUSTOM_NODE);
    expect(readFileSync(join(root, ".kotta/config.yaml"), "utf8")).toContain("version: 6");
    expect(existsSync(join(root, ".gitattributes"))).toBe(false);
    expect(existsSync(join(root, ".kotta/legacy/process/index.md"))).toBe(true);
    expect(run(root, ["validate"])).toMatchObject({ ok: true, errors: [] });
    expect((run(root, ["migrate"]).data as MigrateResult["data"]).current).toBe(true);
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

describe("a migration hands over a whole workspace, and says whether it holds", () => {
  test("the rules file arrives with the records, as the running package writes it", () => {
    const root = v5Repository("rules");
    const output = invoke(root, ["migrate"]);
    expect(output.status, output.stderr).toBe(0);
    const written = readFileSync(join(root, ".kotta/AGENTS.md"), "utf8");
    expect(written).toContain("kotta validate");
    expect(written).toContain("legacy/");
    expect(written).toContain(`@arpadtamasi/kotta@${JSON.parse(readFileSync(resolve("package.json"), "utf8")).version}`);
    expect(output.stdout).toContain(".kotta/AGENTS.md");
    expect((run(root, ["sync"]).data as { agents: { state: string } }).agents.state).toBe("unchanged");
  });

  test("a hand-edited rules file is reported, not replaced, and the report names the way out", () => {
    const root = v5Repository("rules-drifted");
    const edited = "# AGENTS.md\n\nOur own rules, written by hand.\n";
    writeFileSync(join(root, ".kotta/AGENTS.md"), edited);

    const output = invoke(root, ["migrate"]);
    expect(output.status, output.stderr).toBe(0);
    expect(readFileSync(join(root, ".kotta/AGENTS.md"), "utf8")).toBe(edited);
    expect(output.stdout).toContain("was edited by hand");
    expect(output.stdout).toContain("kotta sync --replace-rules");
  });

  test("a migrated specification that does not validate is reported as migrated and named as broken", () => {
    const root = v5Repository("invalid-spec");
    writeFileSync(join(root, ".kotta/spec/glossary-terms/half-000000t2.md"), "---\nid: GT-01m0c0000000000000000000t2\nform: glossary-term\ntitle: Half\n---\n\n## Definition\n\nOnly.\n");
    const output = invoke(root, ["migrate"]);
    expect(output.status, output.stderr).toBe(0);
    expect(output.stdout).toContain("does not validate");
    expect(output.stdout).toContain("SPEC_NODE_MISSING_SECTION");
    expect((run(root, ["migrate", "--dry-run"]).data as MigrateResult["data"]).current).toBe(true);
  });

  test("a dry run plans the rules refresh, performs neither it nor the validation, and writes nothing", () => {
    const root = v5Repository("dry-rules");
    const before = snapshot(root);
    const result = run(root, ["migrate", "--dry-run"]).data as MigrateResult["data"];
    expect(result.rules).toBeNull();
    expect(result.validation).toBeNull();
    expect(result.changes.some((change) => change.kind === "rewrite" && change.path === ".kotta/AGENTS.md")).toBe(true);
    expect(snapshot(root)).toEqual(before);
  });
});

describe("Kotta's own workspace", () => {
  test("is on the current shape: the archive under legacy/ is read-only history, spec/ validates, migrate has nothing to do", () => {
    // The repository's own `.kotta/` was migrated on 2026-09-25 (v5 → v6). A local clone proves the
    // migrated shape is what ships: the process tree lives under legacy/, the specification validates,
    // and a second `migrate` reports the workspace as current.
    const clone = realpathSync(mkdtempSync(join(tmpdir(), "kotta-migrate-self-")));
    execFileSync("git", ["clone", "--local", "--no-hardlinks", "--quiet", resolve("."), clone]);
    execFileSync("git", ["checkout", "-B", "main", "--quiet"], { cwd: clone });
    git(clone, "config", "user.name", "Kotta Test");
    git(clone, "config", "user.email", "test@example.com");
    expect(existsSync(join(clone, ".kotta/process"))).toBe(false);
    expect(Object.keys(snapshot(join(clone, ".kotta/legacy/process"))).length).toBeGreaterThan(100);
    expect(Object.keys(snapshot(join(clone, ".kotta/spec"))).length).toBeGreaterThan(100);
    expect(readFileSync(join(clone, ".kotta/config.yaml"), "utf8")).toContain("version: 6");
    expect(run(clone, ["validate"])).toMatchObject({ ok: true });
    expect((run(clone, ["migrate"]).data as MigrateResult["data"]).current).toBe(true);
  }, 180_000);
});
