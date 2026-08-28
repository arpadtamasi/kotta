import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { acceptFixtureSpec, coveredDefinition } from "../helpers/covered-task.js";

const cli = resolve("dist/cli/index.js");
const MINTED = /^[TFP]-[0-9a-hjkmnp-tv-z]{26}$/;

const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = attempt(cwd, args);
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: Record<string, unknown>; errors?: Array<{ code: string; message: string }> };
};

function repository(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-identity-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  acceptFixtureSpec(root);
  git(root, "add", "-A");
  git(root, "commit", "-m", "init kotta");
  return root;
}

/** A task the way the workspace looked before D-003: a sequential id in a `<id>-slug.md` file. */
function writeSequentialTask(root: string, id: string, slug: string, extra: Record<string, string> = {}): string {
  const frontmatter = [
    `id: ${id}`, `title: ${slug}`, "status: backlog", "origin: human", "types:", "  - feature",
    "profiles: []", "priority: medium", "risk: medium", "batch: null",
    ...Object.entries(extra).map(([key, value]) => `${key}: ${value}`),
    "created_at: 2026-01-01", "updated_at: 2026-01-01",
  ].join("\n");
  const body = ["Outcome", "Scope", "Non-goals", "Acceptance", "Verification", "Constraints", "Open decisions", "Execution notes"]
    .map((heading) => `## ${heading}\n\n${heading === "Open decisions" ? "None." : "Preserved."}`)
    .join("\n\n");
  const path = join(root, ".kotta/process/tasks", `${id}-${slug}.md`);
  writeFileSync(path, `---\n${frontmatter}\n---\n# ${id} — ${slug}\n\n${body}\n`);
  return path;
}

describe("coordination-free identity (D-003, narrowed by D-010)", () => {
  test("two isolated callers mint distinct ids into the shared control plane", () => {
    const root = repository("branches");
    const worktrees = ["alpha", "beta"].map((label) => {
      const path = join(root, `.worktrees/${label}`);
      git(root, "worktree", "add", path, "-b", `feat/${label}`);
      return { label, path };
    });

    // Callers stay isolated, while all durable workflow state lands on the checked-out main.
    const minted = worktrees.map(({ label, path }) => {
      const task = run(path, ["task", "new", "--title", `Slice ${label}`, "--type", "feature"]).data as { id: string; path: string };
      const observation = run(path, ["observation", "new", "--title", `Observation ${label}`, "--type", "bug", "--evidence", `${label} evidence`]).data as { id: string; path: string };
      const batch = run(path, ["batch", "new", "--title", `Batch ${label}`, "--goal", `Ship ${label}`]).data as { id: string };
      run(path, ["batch", "add", batch.id, task.id]);
      expect(git(path, "status", "--porcelain")).toBe("");
      // Kotta commits the canonical state it writes (BR-01m0f0wn89r5np2yce79y2pctq), so the
      // fixture commits only what it changed itself — an empty commit would fail.
      git(root, "add", "-A");
      if (git(root, "status", "--porcelain").trim()) git(root, "commit", "-m", `chore: capture ${label}`);
      return { label, task, observation, batch };
    });

    for (const entry of minted) {
      expect(entry.task.id).toMatch(MINTED);
      expect(entry.observation.id).toMatch(MINTED);
      expect(entry.batch.id).toMatch(MINTED);
      // The filename is slug + short id suffix, unique on disk even across branches.
      expect(basename(entry.task.path)).toBe(`slice-${entry.label}-${entry.task.id.slice(-8)}.md`);
    }
    const [alpha, beta] = minted;
    expect(alpha.task.id).not.toBe(beta.task.id);
    expect(alpha.observation.id).not.toBe(beta.observation.id);
    expect(alpha.batch.id).not.toBe(beta.batch.id);

    // The generated index is already canonical; there is no state merge to perform.
    const index = readFileSync(join(root, ".kotta/process/index.md"), "utf8");
    expect(index).not.toContain("<<<<<<<");
    for (const entry of minted) expect(index).toContain(`${entry.observation.id.slice(-8)}`);

    const validation = run(root, ["validate"]);
    expect(validation).toMatchObject({ ok: true });
    expect(readdirSync(join(root, ".kotta/process/tasks")).filter((name) => name.endsWith(".md"))).toHaveLength(2);

    for (const { path } of worktrees) git(root, "worktree", "remove", path, "--force");
  });

  test("sequential ids stay valid, resolvable and cross-referenced beside minted ones", () => {
    const root = repository("mixed");
    const created = run(root, ["task", "new", "--title", "Minted work", "--type", "feature"]).data as { id: string; path: string };

    // Legacy → minted and minted → legacy references, in one mixed workspace.
    const legacyPath = writeSequentialTask(root, "T-001", "legacy-work", { blocks: `\n  - ${created.id}`, depends_on: "[]" });
    writeFileSync(created.path, readFileSync(created.path, "utf8").replace("depends_on: []", "depends_on:\n  - T-001"));

    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    expect(run(root, ["task", "validate", "T-001"])).toMatchObject({ ok: true, data: { id: "T-001", state: "backlog" } });
    expect(run(root, ["task", "validate", created.id])).toMatchObject({ ok: true, data: { id: created.id, state: "backlog" } });
    expect(basename(legacyPath)).toBe("T-001-legacy-work.md");

    const status = run(root, ["status"]).data as { allTasks: string[] };
    expect(status.allTasks.sort()).toEqual([created.id, "T-001"].sort());

    // The legacy task still moves through the workflow under its own id and filename.
    const source = join(root, "legacy-definition.md");
    writeFileSync(source, readFileSync(legacyPath, "utf8").split(/^---$/m).slice(2).join("---").replace(/^\n+/, ""));
    expect(run(root, ["task", "define", "T-001", "--from", source])).toMatchObject({ ok: true, data: { state: "defined" } });
    const legacyAfterDefine = join(root, ".kotta/process/tasks", "T-001-legacy-work.md");
    expect(existsSync(legacyAfterDefine)).toBe(true);
    expect(readFileSync(legacyAfterDefine, "utf8")).toMatch(/^status: defined$/m);
  });

  test("validate reports DUPLICATE_ID when two entities share one id, in either form", () => {
    for (const [label, duplicate] of [["minted", null], ["sequential", "T-001"]] as const) {
      const root = repository(`duplicate-${label}`);
      const source = duplicate
        ? writeSequentialTask(root, duplicate, "shared-identity")
        : (run(root, ["task", "new", "--title", "Shared identity", "--type", "feature"]).data as { path: string }).path;
      // Two distinct entities claiming one id inside the same flat directory.
      const twin = duplicate ? `${duplicate}-second-entity.md` : `second-entity-${basename(source).split("-").pop()}`;
      copyFileSync(source, join(root, ".kotta/process/tasks", twin));

      const report = attempt(root, ["validate"]);
      expect(report.status).toBe(1);
      const parsed = JSON.parse(report.stdout) as { ok: boolean; errors: Array<{ code: string }> };
      expect(parsed).toMatchObject({
        ok: false,
        errors: expect.arrayContaining([expect.objectContaining({ code: "DUPLICATE_ID" })]),
      });
    }
  });
});
