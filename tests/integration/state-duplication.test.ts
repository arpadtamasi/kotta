import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { acceptFixtureSpec, coveredDefinition } from "../helpers/covered-task.js";

/**
 * State lives in one place (T-01m0jdnshte2ffyzcp3bhf9kh1, successor of T-036).
 *
 * The old shape stored lifecycle state twice — in the frontmatter and in the directory the file
 * sat in — and a Git merge could keep both copies of one entity. The flat v5 shape stores state in
 * the frontmatter alone, so the same disagreement now lands where Git can show it: as a merge
 * conflict on the status line of one stable file, never as a second copy. These tests pin both
 * halves: the migration that flattens a v4 workspace (refusing the duplicated-state damage rather
 * than resolving it), and the conflict shape two concurrent transitions produce afterwards.
 */

const cli = resolve("dist/cli/index.js");

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = attempt(cwd, args);
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown> };
};

function repository(label: string): string {
  // realpath: on macOS the temp directory is a symlink, and the CLI reports resolved paths.
  const root = realpathSync(mkdtempSync(join(tmpdir(), `kotta-state-${label}-`)));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  return root;
}

const V4_CONFIG = `version: 4
project:
  name: fixture
workflow:
  require_human_sign_approval: false
  require_human_done_approval: true
git:
  base_branch: main
`;

function taskFile(id: string, title: string, status: string): string {
  return `---\nid: ${id}\ntitle: ${title}\nstatus: ${status}\ntypes:\n  - feature\ncreated_at: "2026-01-01"\nupdated_at: "2026-01-01"\n---\n# ${id} — ${title}\n`;
}

/** A hand-built v4 workspace: state directories under process/, frontmatter mirroring them. */
function v4Workspace(root: string): string {
  const workspace = join(root, ".kotta");
  writeFileSync(join(mkdirs(workspace), "config.yaml"), V4_CONFIG);
  const process = join(workspace, "process");
  for (const directory of ["backlog", "defined", "done", "observations/new", "observations/resolved", "batches/backlog", "claims", "decisions", "events", "profiles"]) {
    mkdirSync(join(process, directory), { recursive: true });
  }
  writeFileSync(join(process, "backlog", "T-001-first.md"), taskFile("T-001", "First", "backlog"));
  writeFileSync(join(process, "defined", "T-002-second.md"), taskFile("T-002", "Second", "defined"));
  writeFileSync(join(process, "done", "T-003-third.md"), taskFile("T-003", "Third", "done").replace("---\n#", "resolution: completed\n---\n#"));
  writeFileSync(join(process, "observations", "new", "F-001-noticed.md"), `---\nid: F-001\ntitle: Noticed\nstatus: new\n---\n# F-001\n`);
  writeFileSync(join(process, "batches", "backlog", "P-001-wave.md"), `---\nid: P-001\ntitle: Wave\nstatus: backlog\ntasks: []\n---\n# P-001\n`);
  return workspace;
}

function mkdirs(path: string): string {
  mkdirSync(path, { recursive: true });
  return path;
}

const status = (path: string): string => /^status: (.+)$/m.exec(readFileSync(path, "utf8"))?.[1] ?? "";

describe("state lives in one place", () => {
  test("kotta migrate flattens a v4 workspace: files move once, states land in the frontmatter, ids survive", () => {
    const root = repository("migrate");
    v4Workspace(root);
    git(root, "add", "-A");
    git(root, "commit", "-m", "v4 workspace");

    // Dry run plans the flatten and writes nothing.
    const dry = run(root, ["migrate", "--dry-run"]).data as { current: boolean; changes: Array<{ kind: string; from?: string; to?: string }>; ids: string[] };
    expect(dry.current).toBe(false);
    expect(dry.changes.some((change) => change.kind === "move" && change.to === ".kotta/process/tasks/T-001-first.md")).toBe(true);
    expect(dry.changes.some((change) => change.kind === "remove")).toBe(true);
    expect(existsSync(join(root, ".kotta/process/backlog/T-001-first.md"))).toBe(true);

    const applied = run(root, ["migrate"]).data as { ids: string[] };
    expect(applied.ids).toEqual(["F-001", "P-001", "T-001", "T-002", "T-003"]);

    const tasks = join(root, ".kotta/process/tasks");
    expect(readdirSync(tasks).sort()).toEqual(["T-001-first.md", "T-002-second.md", "T-003-third.md"]);
    expect(status(join(tasks, "T-001-first.md"))).toBe("backlog");
    expect(status(join(tasks, "T-002-second.md"))).toBe("defined");
    expect(status(join(tasks, "T-003-third.md"))).toBe("done");
    expect(status(join(root, ".kotta/process/observations/F-001-noticed.md"))).toBe("new");
    expect(status(join(root, ".kotta/process/batches/P-001-wave.md"))).toBe("backlog");
    // The state directories are gone; version says v5; a second run has nothing to do.
    for (const directory of ["backlog", "defined", "done", "observations/new", "batches/backlog"]) {
      expect(existsSync(join(root, ".kotta/process", directory))).toBe(false);
    }
    expect(readFileSync(join(root, ".kotta/config.yaml"), "utf8")).toContain("version: 5");
    expect((run(root, ["migrate", "--dry-run"]).data as { current: boolean }).current).toBe(true);
  });

  test("the directory's verdict wins over a drifted frontmatter, and the transcription is named", () => {
    const root = repository("drift");
    const workspace = v4Workspace(root);
    // In v4 every reader trusted the directory; a drifted status field was the lie.
    writeFileSync(join(workspace, "process", "defined", "T-002-second.md"), taskFile("T-002", "Second", "backlog"));
    git(root, "add", "-A");
    git(root, "commit", "-m", "v4 workspace with drift");

    const dry = run(root, ["migrate", "--dry-run"]).data as { changes: Array<{ kind: string; path?: string; fields?: string[] }> };
    const rewrite = dry.changes.find((change) => change.kind === "rewrite" && change.path?.endsWith("T-002-second.md"));
    expect(rewrite?.fields?.some((field) => field.includes("backlog → defined"))).toBe(true);

    run(root, ["migrate"]);
    expect(status(join(root, ".kotta/process/tasks/T-002-second.md"))).toBe("defined");
  });

  test("migrate refuses the duplicated-state damage, naming both copies, and writes nothing", () => {
    const root = repository("duplicate");
    const workspace = v4Workspace(root);
    // The old T-036 shape: a merge kept one entity in two state directories.
    writeFileSync(join(workspace, "process", "done", "T-002-second.md"), taskFile("T-002", "Second", "done"));
    git(root, "add", "-A");
    git(root, "commit", "-m", "duplicated state");

    for (const args of [["migrate", "--dry-run"], ["migrate"]]) {
      const refused = attempt(root, args);
      expect(refused.status).toBe(1);
      const output = `${refused.stdout}${refused.stderr}`;
      expect(output).toContain("multiple sources");
      expect(output).toContain(join(workspace, "process/defined/T-002-second.md"));
      expect(output).toContain(join(workspace, "process/done/T-002-second.md"));
      expect(output).toContain("Nothing was written");
    }
    expect(existsSync(join(workspace, "process/defined/T-002-second.md"))).toBe(true);
    expect(existsSync(join(workspace, "process/done/T-002-second.md"))).toBe(true);
    expect(existsSync(join(workspace, "process/tasks"))).toBe(false);
  });

  test("two concurrent transitions meet as a merge conflict on the status line of one file, never as a second copy", () => {
    const root = repository("conflict");
    run(root, ["init"]);
    acceptFixtureSpec(root);
    git(root, "add", "-A");
    git(root, "commit", "-m", "init kotta");
    const task = run(root, ["task", "new", "--title", "Contested", "--type", "feature"]).data as { id: string; path: string };
    const filename = basename(task.path);
    git(root, "add", "-A");
    git(root, "commit", "-m", "capture task");
    const base = git(root, "rev-parse", "HEAD");

    // One side takes the task to defined; the other retires it.
    run(root, ["task", "define", task.id, "--from", coveredDefinition(task.path)]);
    git(root, "branch", "branch-defined");
    git(root, "reset", "--hard", base);
    run(root, ["task", "cancel", task.id, "--resolution", "cancelled", "--reason", "Retired on the other side", "--approve"]);

    const merge = spawnSync("git", ["merge", "--no-ff", "branch-defined", "-m", "merge"], { cwd: root, encoding: "utf8" });
    expect(merge.status).not.toBe(0);
    expect(`${merge.stdout}${merge.stderr}`).toContain("CONFLICT");

    // The disagreement is visible in the one stable file — both status lines, conflict markers —
    // and nowhere does a second copy of the entity appear.
    const stable = join(root, ".kotta/process/tasks", filename);
    const conflicted = readFileSync(stable, "utf8");
    expect(conflicted).toContain("<<<<<<<");
    expect(conflicted).toContain("status: done");
    expect(conflicted).toContain("status: defined");
    // During an unresolved merge ls-files repeats the one path per stage; the set is the claim.
    const copies = [...new Set(git(root, "ls-files", "--", ".kotta").split("\n").filter((line) => line.endsWith(filename)))];
    expect(copies).toEqual([`.kotta/process/tasks/${filename}`]);
  });
});
