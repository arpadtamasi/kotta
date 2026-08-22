import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import matter from "gray-matter";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { readEvents } from "../../src/core/events.js";

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};
/** The same call, but keeping the exit status and streams so a refusal can be asserted. */
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });

function initRepository(prefix: string): string {
  const root = mkdtempSync(join(tmpdir(), prefix));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  run(root, ["init"]);
  return root;
}

const GLOSSARY_ID = "GT-01m0c0000000000000000000ab";
/** Lands a real specification node so amend-spec has something to name, the way the amendment would. */
function writeGlossaryNode(root: string): string {
  const directory = join(root, ".kotta/spec/glossary-terms");
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "amend-spec-disposition-000000ab.md"), [
    "---", `id: ${GLOSSARY_ID}`, "form: glossary-term", "title: Amend-spec disposition", "---", "",
    "## Definition", "The constructive exit that changes the accepted agreement.", "",
    "## Usage", "Named by a resolved observation.", "",
    "## Non-examples", "An automatic close.", "",
  ].join("\n"));
  return GLOSSARY_ID;
}

describe("a standalone observation", () => {
  test("is committed, so the next command that needs a clean control plane is not refused (F-01kzhjhsknj52aqr4mxfkbpp0q)", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-observation-standalone-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    writeFileSync(join(root, "README.md"), "fixture\n");
    run(root, ["init"]);
    const commitFixture = (message: string) => {
      execFileSync("git", ["add", "-A"], { cwd: root });
      execFileSync("git", ["commit", "-m", message], { cwd: root });
    };
    commitFixture("fixture: initialised workspace");
    const task = run(root, ["task", "new", "--title", "Something to retire", "--type", "fix"]) as { data: { id: string } };
    // 'task new' does not commit either, so commit it here: this test is about what
    // 'observation new' leaves behind, not about what precedes it.
    commitFixture("fixture: task new");
    const status = () => execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
    expect(status()).toBe("");

    const created = run(root, ["observation", "new", "--title", "Two writers disagree", "--type", "inconsistency", "--evidence", "src/a.ts and src/b.ts differ"]) as { data: { id: string; path: string } };

    expect(status()).toBe("");
    expect(execFileSync("git", ["log", "-1", "--format=%s"], { cwd: root, encoding: "utf8" }).trim()).toBe(`chore(kotta): capture ${created.data.id}`);
    expect(execFileSync("git", ["show", "--name-only", "--format=", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n").sort())
      .toEqual([".kotta/process/index.md", `.kotta/process/observations/${basename(created.data.path)}`].sort());

    // 'task cancel' refuses a dirty control plane, and it is one of the two commands the
    // report saw fail immediately after a successful 'observation new'.
    expect(run(root, ["task", "cancel", task.data.id, "--resolution", "cancelled", "--reason", "the fixture no longer needs it", "--approve"])).toMatchObject({ ok: true });
  });
});

describe("observation disposition", () => {
  test("keeps a observation separate until a human resolves it into backlog work", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-observation-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    writeFileSync(join(root, "README.md"), "fixture\n");
    run(root, ["init"]);
    const created = run(root, ["observation", "new", "--title", "Divergent permission checks", "--type", "inconsistency", "--evidence", "src/a.ts and src/b.ts differ"]) as { ok: boolean; data: { id: string; path: string } };
    expect(created.ok).toBe(true);
    const observationId = created.data.id;
    expect(observationId).toMatch(/^F-[0-9a-hjkmnp-tv-z]{26}$/);
    expect(basename(created.data.path)).toBe(`divergent-permission-checks-${observationId.slice(-8)}.md`);
    expect(run(root, ["observation", "validate", observationId])).toMatchObject({ ok: true });
    const resolved = run(root, ["observation", "resolve", observationId, "--disposition", "create-task", "--approve"]) as { ok: boolean; data: { taskId: string } };
    expect(resolved.ok).toBe(true);
    const taskId = resolved.data.taskId;
    expect(taskId).toMatch(/^T-[0-9a-hjkmnp-tv-z]{26}$/);
    // Files never move: resolution edits the record in place and the frontmatter status is the state.
    const observationFile = join(root, ".kotta/process/observations", basename(created.data.path));
    expect(existsSync(observationFile)).toBe(true);
    expect(matter(readFileSync(observationFile, "utf8")).data.status).toBe("resolved");
    const task = join(root, ".kotta/process/tasks", `divergent-permission-checks-${taskId.slice(-8)}.md`);
    expect(readFileSync(task, "utf8")).toContain(`source_observation: ${observationId}`);
    expect(execFileSync("git", ["status", "--porcelain", "--", ".kotta"], { cwd: root, encoding: "utf8" })).toBe("");
    expect(execFileSync("git", ["log", "-1", "--format=%s"], { cwd: root, encoding: "utf8" }).trim()).toBe(`chore(kotta): resolve ${observationId}`);
  });
});

describe("the amend-spec disposition", () => {
  const capture = (root: string, title = "The lifecycle glossary is silent on amend-spec"): string => {
    const created = run(root, ["observation", "new", "--title", title, "--type", "inconsistency", "--evidence", "The glossary omits the constructive exit."]) as { data: { id: string } };
    run(root, ["observation", "validate", created.data.id]);
    return created.data.id;
  };

  test("resolves an observation into the specification, naming the amended nodes", () => {
    const root = initRepository("kotta-observation-amend-");
    const specId = writeGlossaryNode(root);
    const observationId = capture(root);

    const resolved = run(root, ["observation", "resolve", observationId, "--disposition", "amend-spec", "--spec", specId, "--approve"]) as { ok: boolean; data: { disposition: string; spec: string[]; taskId?: string } };
    expect(resolved.ok).toBe(true);
    expect(resolved.data.disposition).toBe("amend-spec");
    expect(resolved.data.spec).toEqual([specId]);
    expect(resolved.data.taskId).toBeUndefined();

    const record = matter(readFileSync(join(root, ".kotta/process/observations", `the-lifecycle-glossary-is-silent-on-amend-spec-${observationId.slice(-8)}.md`), "utf8")).data;
    expect(record.status).toBe("resolved");
    expect(record.disposition).toBe("amend-spec");
    expect(record.spec).toEqual([specId]);
    expect(readEvents(root, observationId).filter((event) => event.kind === "approval").map((event) => event.payload)).toEqual([
      expect.objectContaining({ disposition: "amend-spec", spec: [specId], surface: "cli" }),
      expect.objectContaining({ disposition: "amend-spec", spec: [specId], surface: "cli" }),
      expect.objectContaining({ disposition: "amend-spec", spec: [specId], surface: "cli" }),
    ]);
    expect(execFileSync("git", ["status", "--porcelain", "--", ".kotta"], { cwd: root, encoding: "utf8" })).toBe("");
    expect(execFileSync("git", ["log", "-1", "--format=%s"], { cwd: root, encoding: "utf8" }).trim()).toBe(`chore(kotta): resolve ${observationId}`);
  });

  test("refuses to resolve without human approval", () => {
    const root = initRepository("kotta-observation-amend-approve-");
    const specId = writeGlossaryNode(root);
    const observationId = capture(root);

    const refused = attempt(root, ["observation", "resolve", observationId, "--disposition", "amend-spec", "--spec", specId]);
    expect(refused.status).not.toBe(0);
    expect(`${refused.stdout}${refused.stderr}`).toContain("Human approval is required");
    const untouched = join(root, ".kotta/process/observations", `the-lifecycle-glossary-is-silent-on-amend-spec-${observationId.slice(-8)}.md`);
    expect(existsSync(untouched)).toBe(true);
    expect(matter(readFileSync(untouched, "utf8")).data.status).toBe("new");
  });

  test("refuses amend-spec that names no specification node", () => {
    const root = initRepository("kotta-observation-amend-empty-");
    const observationId = capture(root);

    const refused = attempt(root, ["observation", "resolve", observationId, "--disposition", "amend-spec", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(`${refused.stdout}${refused.stderr}`).toContain("requires --spec");
  });

  test("refuses a named specification node that does not exist", () => {
    const root = initRepository("kotta-observation-amend-dangling-");
    const observationId = capture(root);

    const refused = attempt(root, ["observation", "resolve", observationId, "--disposition", "amend-spec", "--spec", "GT-01m0c0000000000000000000zz", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(`${refused.stdout}${refused.stderr}`).toContain("does not exist");
  });

  test("refuses --spec on a disposition other than amend-spec", () => {
    const root = initRepository("kotta-observation-amend-scoped-");
    const specId = writeGlossaryNode(root);
    const observationId = capture(root);

    const refused = attempt(root, ["observation", "resolve", observationId, "--disposition", "reject", "--spec", specId, "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(`${refused.stdout}${refused.stderr}`).toContain("applies only to the amend-spec disposition");
  });
});
