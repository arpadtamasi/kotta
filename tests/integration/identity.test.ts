import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";

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
  retainLegacySignGate(root);
  git(root, "add", "-A");
  git(root, "commit", "-m", "init kotta");
  return root;
}

/** A contract the way the workspace looked before D-003: a sequential id in a `<id>-slug.md` file. */
function writeSequentialContract(root: string, id: string, slug: string, extra: Record<string, string> = {}): string {
  const frontmatter = [
    `id: ${id}`, `title: ${slug}`, "status: backlog", "origin: human", "types:", "  - feature",
    "profiles: []", "priority: medium", "risk: medium", "batch: null",
    ...Object.entries(extra).map(([key, value]) => `${key}: ${value}`),
    "created_at: 2026-01-01", "updated_at: 2026-01-01",
  ].join("\n");
  const body = ["Outcome", "Scope", "Non-goals", "Acceptance", "Verification", "Constraints", "Open decisions", "Execution notes"]
    .map((heading) => `## ${heading}\n\n${heading === "Open decisions" ? "None." : "Preserved."}`)
    .join("\n\n");
  const path = join(root, ".kotta/process/backlog", `${id}-${slug}.md`);
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
      const contract = run(path, ["contract", "new", "--title", `Slice ${label}`, "--type", "feature"]).data as { id: string; path: string };
      const observation = run(path, ["observation", "new", "--title", `Observation ${label}`, "--type", "bug", "--evidence", `${label} evidence`]).data as { id: string; path: string };
      const batch = run(path, ["batch", "new", "--title", `Batch ${label}`, "--goal", `Ship ${label}`]).data as { id: string };
      run(path, ["batch", "add", batch.id, contract.id]);
      expect(git(path, "status", "--porcelain")).toBe("");
      git(root, "add", "-A");
      git(root, "commit", "-m", `chore: capture ${label}`);
      return { label, contract, observation, batch };
    });

    for (const entry of minted) {
      expect(entry.contract.id).toMatch(MINTED);
      expect(entry.observation.id).toMatch(MINTED);
      expect(entry.batch.id).toMatch(MINTED);
      // The filename is slug + short id suffix, unique on disk even across branches.
      expect(basename(entry.contract.path)).toBe(`slice-${entry.label}-${entry.contract.id.slice(-8)}.md`);
    }
    const [alpha, beta] = minted;
    expect(alpha.contract.id).not.toBe(beta.contract.id);
    expect(alpha.observation.id).not.toBe(beta.observation.id);
    expect(alpha.batch.id).not.toBe(beta.batch.id);

    // The generated index is already canonical; there is no state merge to perform.
    const index = readFileSync(join(root, ".kotta/process/index.md"), "utf8");
    expect(index).not.toContain("<<<<<<<");
    for (const entry of minted) expect(index).toContain(`${entry.observation.id.slice(-8)}`);

    const validation = run(root, ["validate"]);
    expect(validation).toMatchObject({ ok: true });
    expect(readdirSync(join(root, ".kotta/process/backlog")).filter((name) => name.endsWith(".md"))).toHaveLength(2);

    for (const { path } of worktrees) git(root, "worktree", "remove", path, "--force");
  });

  test("sequential ids stay valid, resolvable and cross-referenced beside minted ones", () => {
    const root = repository("mixed");
    const created = run(root, ["contract", "new", "--title", "Minted work", "--type", "feature"]).data as { id: string; path: string };

    // Legacy → minted and minted → legacy references, in one mixed workspace.
    const legacyPath = writeSequentialContract(root, "T-001", "legacy-work", { blocks: `\n  - ${created.id}`, depends_on: "[]" });
    writeFileSync(created.path, readFileSync(created.path, "utf8").replace("depends_on: []", "depends_on:\n  - T-001"));

    expect(run(root, ["validate"])).toMatchObject({ ok: true });
    expect(run(root, ["contract", "validate", "T-001"])).toMatchObject({ ok: true, data: { id: "T-001", state: "backlog" } });
    expect(run(root, ["contract", "validate", created.id])).toMatchObject({ ok: true, data: { id: created.id, state: "backlog" } });
    expect(basename(legacyPath)).toBe("T-001-legacy-work.md");

    const status = run(root, ["status"]).data as { allContracts: string[] };
    expect(status.allContracts.sort()).toEqual([created.id, "T-001"].sort());

    // The legacy contract still moves through the workflow under its own id and filename.
    expect(run(root, ["contract", "sign", "T-001", "--approve"])).toMatchObject({ ok: true });
    expect(readdirSync(join(root, ".kotta/process/defined"))).toEqual(["T-001-legacy-work.md"]);
  });

  test("validate reports DUPLICATE_ID when two entities share one id, in either form", () => {
    for (const [label, duplicate] of [["minted", null], ["sequential", "T-001"]] as const) {
      const root = repository(`duplicate-${label}`);
      const source = duplicate
        ? writeSequentialContract(root, duplicate, "shared-identity")
        : (run(root, ["contract", "new", "--title", "Shared identity", "--type", "feature"]).data as { path: string }).path;
      // Two distinct entities claiming one id inside a single state directory. One entity left in two
      // state directories is a different failure with a deterministic resolution (T-036).
      const twin = duplicate ? `${duplicate}-second-entity.md` : `second-entity-${basename(source).split("-").pop()}`;
      copyFileSync(source, join(root, ".kotta/process/backlog", twin));

      const report = attempt(root, ["validate"]);
      expect(report.status).toBe(1);
      const parsed = JSON.parse(report.stdout) as { ok: boolean; errors: Array<{ code: string }> };
      expect(parsed).toMatchObject({
        ok: false,
        errors: expect.arrayContaining([expect.objectContaining({ code: "DUPLICATE_ID" })]),
      });
      expect(parsed.errors.some((error) => error.code === "DUPLICATE_STATE")).toBe(false);
    }
  });
});
