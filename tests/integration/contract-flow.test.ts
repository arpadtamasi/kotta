import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { readEvents } from "../../src/core/events.js";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";

const cli = resolve("dist/cli/index.js");
const FLOW_SPEC_ID = "GT-01m0c0000000000000000000fl";

function run(repository: string, args: string[]): Record<string, unknown> {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd: repository, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout);
}

function git(repository: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: repository });
}

describe("contract execution vertical slice", () => {
  test("human contract creation output includes the stable id and canonical path", () => {
    const repository = mkdtempSync(join(tmpdir(), "kotta-new-output-"));
    git(repository, "init", "-b", "main");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    run(repository, ["init"]);
    retainLegacySignGate(repository);
    const created = spawnSync("node", [cli, "contract", "new", "--title", "Visible id", "--type", "feature"], { cwd: repository, encoding: "utf8" });
    expect(created.status).toBe(0);
    expect(created.stdout).toMatch(/^Created contract T-[0-9a-hjkmnp-tv-z]{26} at .+\.md\.\n$/);
    expect(created.stdout).not.toBe("kotta contract new completed.\n");
  });

  test("defines a complete backlog contract through the canonical CLI", () => {
    const repository = mkdtempSync(join(tmpdir(), "kotta-define-"));
    git(repository, "init", "-b", "main");
    git(repository, "config", "user.name", "Kotta Test");
    git(repository, "config", "user.email", "test@example.com");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    run(repository, ["init"]);
    retainLegacySignGate(repository);
    writeFileSync(join(repository, ".kotta/spec/glossary-terms/clean-install-000000fl.md"), [
      "---", `id: ${FLOW_SPEC_ID}`, "form: glossary-term", "title: Clean install", "---", "",
      "## Definition", "A clean install succeeds.", "", "## Usage", "Release verification.", "", "## Non-examples", "An existing installation.", "",
    ].join("\n"));
    const first = run(repository, ["contract", "new", "--title", "Release CLI", "--type", "feature", "--profile", "workflow"]) as { data: { id: string; path: string } };
    const second = run(repository, ["contract", "new", "--title", "Publish site", "--type", "feature"]) as { data: { id: string } };
    const definition = join(repository, "definition.md");
    writeFileSync(definition, `---
id: ${first.data.id}
spec: [${FLOW_SPEC_ID}]
coverage:
  "A clean install succeeds.": [${FLOW_SPEC_ID}]
priority: high
risk: high
depends_on: []
blocks: [${second.data.id}]
---
# ${first.data.id} — Release CLI

## Outcome

The CLI is publicly installable.

## Actors

Maintainer and user.

## Initial state

The batch is unpublished.

## States

Tested, published, verified.

## Transitions

Tests move the batch to publish; verification moves it to done.

## Triggers

A protected version tag.

## Permissions

Only the release environment can publish.

## Error paths

Failure leaves the previous version current.

## Cancellation path

Cancellation before publish is safe.

## Retry and duplicate-action behaviour

Retries never overwrite an existing version.

## Audit and notification expectations

The release run records the version and commit.

## Scope

Publish the CLI.

## Non-goals

Build the website.

## Acceptance

- A clean install succeeds.

## Verification

- Run the clean-install canary.

## Constraints

Use the public npm registry.

## Open decisions

None.

## Execution notes

None.
`);

    expect(run(repository, ["contract", "define", first.data.id, "--from", definition])).toMatchObject({ ok: true, command: "contract define", data: { id: first.data.id } });
    const contract = first.data.path;
    expect(basename(contract)).toBe(`release-cli-${first.data.id.slice(-8)}.md`);
    expect(readFileSync(contract, "utf8")).toContain("priority: high");
    expect(readFileSync(contract, "utf8")).toContain(`blocks:\n  - ${second.data.id}`);
    expect(run(repository, ["contract", "sign", first.data.id, "--approve"])).toMatchObject({ ok: true, command: "contract sign" });
    expect(execFileSync("git", ["status", "--porcelain", "--", ".kotta"], { cwd: repository, encoding: "utf8" })).toBe("");
    expect(execFileSync("git", ["log", "-1", "--format=%s"], { cwd: repository, encoding: "utf8" }).trim()).toBe(`chore(kotta): sign ${first.data.id}`);
  });

  test("amends a defined contract in place, including its title, filename and history", () => {
    const repository = mkdtempSync(join(tmpdir(), "kotta-redefine-"));
    git(repository, "init", "-b", "main");
    git(repository, "config", "user.name", "Kotta Test");
    git(repository, "config", "user.email", "test@example.com");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    run(repository, ["init"]);
    retainLegacySignGate(repository);
    writeFileSync(join(repository, ".kotta/spec/glossary-terms/corrected-task-000000fl.md"), [
      "---", `id: ${FLOW_SPEC_ID}`, "form: glossary-term", "title: Corrected task", "---", "",
      "## Definition", "The title and body are corrected in place.", "", "## Usage", "Pre-execution amendment.", "", "## Non-examples", "Changing active work.", "",
    ].join("\n"));
    const created = run(repository, ["contract", "new", "--title", "Shpi the exporter", "--type", "feature"]) as { data: { id: string; path: string } };
    run(repository, ["contract", "sign", created.data.id, "--approve"]);

    const oldPath = join(repository, ".kotta/process/defined", basename(created.data.path));
    writeFileSync(oldPath, readFileSync(oldPath, "utf8").replace(/updated_at: .+/, "updated_at: 2020-01-01"));
    const history = readEvents(repository, created.data.id).map((event) => event.id);
    const definition = join(repository, "amended-definition.md");
    writeFileSync(definition, `---
id: ${created.data.id}
title: Ship the exporter
spec: [${FLOW_SPEC_ID}]
coverage:
  "The title and body are corrected in place.": [${FLOW_SPEC_ID}]
priority: high
---
# ${created.data.id} — Ship the exporter

## Outcome

The corrected exporter is ready to ship.

## Scope

Correct the task before execution.

## Non-goals

No execution starts.

## Acceptance

- The title and body are corrected in place.

## Verification

- Exercise the define command against a defined task.

## Constraints

The identifier and prior history stay unchanged.

## Open decisions

None.

## Execution notes

None.
`);

    const amended = run(repository, ["contract", "define", created.data.id, "--from", definition]) as { data: { path: string } };
    const newPath = amended.data.path;
    expect(basename(newPath)).toBe(`ship-the-exporter-${created.data.id.slice(-8)}.md`);
    expect(existsSync(oldPath)).toBe(false);
    expect(readFileSync(newPath, "utf8")).toContain(`id: ${created.data.id}`);
    expect(readFileSync(newPath, "utf8")).toContain("title: Ship the exporter");
    expect(readFileSync(newPath, "utf8")).toContain("status: defined");
    expect(readFileSync(newPath, "utf8")).toContain("priority: high");
    expect(readFileSync(newPath, "utf8")).toContain(`updated_at: '${new Date().toISOString().slice(0, 10)}'`);
    expect(readFileSync(newPath, "utf8")).toContain("The corrected exporter is ready to ship.");

    const after = readEvents(repository, created.data.id);
    expect(after.slice(0, history.length).map((event) => event.id)).toEqual(history);
    expect(after.at(-1)).toMatchObject({ state: "defined", summary: "Contract definition amended before execution." });
  });

  test.each(["active", "review", "done"])("refuses to redefine a task in %s", (state) => {
    const repository = mkdtempSync(join(tmpdir(), `kotta-redefine-${state}-`));
    git(repository, "init", "-b", "main");
    git(repository, "config", "user.name", "Kotta Test");
    git(repository, "config", "user.email", "test@example.com");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    run(repository, ["init"]);
    retainLegacySignGate(repository);
    const created = run(repository, ["contract", "new", "--title", `Immutable ${state}`, "--type", "feature"]) as { data: { id: string; path: string } };
    run(repository, ["contract", "sign", created.data.id, "--approve"]);
    const defined = join(repository, ".kotta/process/defined", basename(created.data.path));
    const targetDirectory = join(repository, ".kotta/process", state);
    const target = join(targetDirectory, basename(created.data.path));
    const snapshot = readFileSync(defined, "utf8").replace("status: defined", `status: ${state}`);
    writeFileSync(target, snapshot);
    rmSync(defined);
    const definition = join(repository, "refused-definition.md");
    writeFileSync(definition, `# ${created.data.id} — Changed too late\n\n## Outcome\n\nMust not be applied.\n`);

    const result = spawnSync("node", [cli, "contract", "define", created.data.id, "--from", definition, "--json"], { cwd: repository, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(`can only be defined before execution, while it is in backlog or defined; it is ${state}`);
    expect(readFileSync(target, "utf8")).toBe(snapshot);
  });

  test("rejects unsupported definition metadata without changing the contract", () => {
    const repository = mkdtempSync(join(tmpdir(), "kotta-define-reject-"));
    git(repository, "init", "-b", "main");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    run(repository, ["init"]);
    retainLegacySignGate(repository);
    const created = run(repository, ["contract", "new", "--title", "Safe definition", "--type", "feature"]) as { data: { id: string; path: string } };
    const contract = created.data.path;
    const before = readFileSync(contract, "utf8");
    const definition = join(repository, "invalid-definition.md");
    writeFileSync(definition, `---\nid: ${created.data.id}\nstatus: defined\n---\n## Outcome\n\nUnsafe.\n`);
    const result = spawnSync("node", [cli, "contract", "define", created.data.id, "--from", definition, "--json"], { cwd: repository, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("Unsupported definition fields: status");
    expect(readFileSync(contract, "utf8")).toBe(before);
  });

  test("define reports the resolved path for a missing --from file and leaves the contract in backlog", () => {
    const repository = mkdtempSync(join(tmpdir(), "kotta-define-missing-"));
    git(repository, "init", "-b", "main");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    run(repository, ["init"]);
    retainLegacySignGate(repository);
    const created = run(repository, ["contract", "new", "--title", "Missing source", "--type", "feature"]) as { data: { id: string; path: string } };
    const missing = join(repository, "no-such-definition.md");
    const result = spawnSync("node", [cli, "contract", "define", created.data.id, "--from", missing, "--json"], { cwd: repository, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(`Contract definition was not found: ${resolve(missing)}`);
    expect(existsSync(created.data.path)).toBe(true);
    expect(readFileSync(created.data.path, "utf8")).toContain("status: backlog");
  });

  test("sign accepts an unambiguous no-open-decisions statement without exact punctuation", () => {
    const repository = mkdtempSync(join(tmpdir(), "kotta-open-decisions-"));
    git(repository, "init", "-b", "main");
    git(repository, "config", "user.name", "Kotta Test");
    git(repository, "config", "user.email", "test@example.com");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    run(repository, ["init"]);
    retainLegacySignGate(repository);
    const created = run(repository, ["contract", "new", "--title", "Flexible approval", "--type", "feature"]) as { data: { id: string; path: string } };
    writeFileSync(created.data.path, readFileSync(created.data.path, "utf8")
      .replace("Describe the observable outcome.", "Approval is not punctuation-sensitive.")
      .replace("- Define an observable condition.", "- The valid contract is signed.")
      .replace("- Explain how acceptance will be checked.", "- Run this test.")
      .replace("## Open decisions\n\nNone.", "## Open decisions\n\nNone"));
    expect(run(repository, ["contract", "sign", created.data.id, "--approve"])).toMatchObject({ ok: true, data: { id: created.data.id } });
  });

  test("moves a valid profiled contract to defined and starts it in an isolated worktree", () => {
    const repository = mkdtempSync(join(tmpdir(), "kotta-flow-"));
    git(repository, "init", "-b", "main");
    git(repository, "config", "user.name", "Kotta Test");
    git(repository, "config", "user.email", "test@example.com");
    writeFileSync(join(repository, "README.md"), "fixture\n");
    git(repository, "add", ".");
    git(repository, "commit", "-m", "initial");

    run(repository, ["init"]);
    retainLegacySignGate(repository);
    git(repository, "add", ".gitattributes", ".gitignore");
    git(repository, "commit", "-m", "initialize Kotta metadata");
    const created = run(repository, ["contract", "new", "--title", "Ship export", "--type", "feature", "--profile", "workflow"]) as { data: { id: string; path: string } };
    const id = created.data.id;
    expect(created).toMatchObject({ ok: true, command: "contract new" });
    expect(id).toMatch(/^T-[0-9a-hjkmnp-tv-z]{26}$/);

    const contract = created.data.path;
    writeFileSync(contract, readFileSync(contract, "utf8").replace(
      "Describe the observable outcome.",
      "Users can export filtered courses.\n\n## Actors\n\nCourse administrator.\n\n## Initial state\n\nA filtered course list is visible.\n\n## States\n\nReady and exported.\n\n## Transitions\n\nReady to exported.\n\n## Triggers\n\nExport action.\n\n## Permissions\n\nCourse export permission.\n\n## Error paths\n\nAn actionable error is shown.\n\n## Cancellation path\n\nCancellation leaves the list unchanged.\n\n## Retry and duplicate-action behaviour\n\nRetry is safe and duplicate actions are ignored.\n\n## Audit and notification expectations\n\nThe export is audited; no notification is sent.",
    ).replace("- Define an observable condition.", "- A filtered export file is produced.")
      .replace("- Explain how acceptance will be checked.", "- Run the export integration test."));

    rmSync(join(repository, ".kotta/process/defined"), { recursive: true });
    expect(run(repository, ["contract", "sign", id, "--approve"])).toMatchObject({ ok: true, command: "contract sign" });
    expect(existsSync(join(repository, ".kotta/process/defined", basename(contract)))).toBe(true);

    const started = run(repository, ["contract", "start", id, "--agent", "codex"]);
    expect(started).toMatchObject({ ok: true, command: "contract start", data: { branch: `feat/${id}-ship-export` } });
    const worktree = join(repository, ".worktrees", id);
    expect(existsSync(join(repository, ".kotta/process/active", basename(contract)))).toBe(true);
    expect(existsSync(join(worktree, ".kotta/process/active", basename(contract)))).toBe(false);
    expect(readFileSync(join(repository, ".kotta/process/claims", `${id}.yaml`), "utf8")).toContain("agent: codex");
    expect(run(worktree, ["status"])).toMatchObject({ ok: true, data: { activeContracts: [id] } });
    expect(run(repository, ["claim", "list"])).toMatchObject({ ok: true, data: { claims: [{ contract: id, agent: "codex" }] } });
  });
});
