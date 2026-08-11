import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

function cliRun(repository: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  return spawnSync("node", [cli, ...args], { cwd: repository, encoding: "utf8" });
}

function json<T>(repository: string, args: string[]): T {
  const result = cliRun(repository, [...args, "--json"]);
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as T;
}

function git(repository: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: repository, encoding: "utf8" }).trim();
}

const DEFINITION = [
  "## Outcome", "", "The exporter ships.", "", "## Scope", "", "1. Ship it.", "",
  "## Non-goals", "", "- Anything else.", "", "## Acceptance", "", "- It ships.", "",
  "## Verification", "", "- Run it.", "", "## Constraints", "", "- Ship nothing else.", "",
  "## Open decisions", "", "None.", "", "## Execution notes", "", "- Start in src/.", "",
].join("\n");

function commit(repository: string, message: string): void {
  git(repository, "add", "-A");
  if (git(repository, "status", "--porcelain")) git(repository, "commit", "-m", message);
}

function fixture(label: string, options: { start?: boolean } = {}): { repository: string; id: string; definition: string; state(): string } {
  const repository = mkdtempSync(join(tmpdir(), `kotta-revise-${label}-`));
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Kotta Test");
  git(repository, "config", "user.email", "test@example.com");
  writeFileSync(join(repository, "README.md"), "fixture\n");
  cliRun(repository, ["init", "--json"]);
  git(repository, "add", "-A");
  git(repository, "commit", "-m", "chore: workspace");
  const id = json<{ data: { id: string } }>(repository, ["contract", "new", "--title", "Ship the exporter", "--type", "feature"]).data.id;
  // `new` and `define` write without committing, and every gate below asserts a clean
  // control worktree; the definition lives outside the repository for the same reason.
  const definition = join(mkdtempSync(join(tmpdir(), "kotta-revise-definition-")), "definition.md");
  writeFileSync(definition, DEFINITION);
  commit(repository, "chore: capture");
  cliRun(repository, ["contract", "define", id, "--from", definition, "--json"]);
  commit(repository, "chore: define");
  expect(cliRun(repository, ["contract", "sign", id, "--approve", "--json"]).status).toBe(0);
  if (options.start) expect(cliRun(repository, ["contract", "start", id, "--caller", "--agent", "claude", "--json"]).status).toBe(0);
  const state = (): string => json<{ data: { entities: { state: string }[] } }>(repository, ["contract", "list"]).data.entities[0].state;
  return { repository, id, definition, state };
}

describe("a contract that proves incomplete has a way back", () => {
  test("revise returns a signed contract to backlog, where define applies a new definition", () => {
    const { repository, id, definition, state } = fixture("defined");
    expect(state()).toBe("defined");

    const revised = json<{ data: { previousState: string; reason: string; claimReleased: boolean; state: string } }>(
      repository, ["contract", "revise", id, "--reason", "The premise expired: the lockfile came right on its own.", "--approve"],
    );
    expect(revised.data).toMatchObject({ state: "backlog", previousState: "defined", claimReleased: false });
    expect(state()).toBe("backlog");

    // Backlog is where define works, which is the whole point of going there.
    writeFileSync(definition, DEFINITION.replace("The exporter ships.", "The exporter ships, and says so."));
    expect(cliRun(repository, ["contract", "define", id, "--from", definition, "--json"]).status).toBe(0);
    expect(json<{ data: { body: string } }>(repository, ["contract", "show", id]).data.body).toContain("says so");
  });

  test("revise from active releases the claim, keeps the branch and worktree, and start reuses them", () => {
    const { repository, id, definition, state } = fixture("active", { start: true });
    expect(state()).toBe("active");
    const worktree = join(repository, ".worktrees", id);
    const branch = git(repository, "branch", "--list", "--format=%(refname:short)").split("\n").find((name) => name.includes(id));
    expect(existsSync(worktree)).toBe(true);

    const revised = json<{ data: { previousState: string; claimReleased: boolean } }>(
      repository, ["contract", "revise", id, "--reason", "Eight facts were missing from the contract.", "--approve"],
    );
    expect(revised.data).toMatchObject({ previousState: "active", claimReleased: true });
    expect(state()).toBe("backlog");
    expect(existsSync(join(repository, ".kotta", "claims", `${id}.yaml`))).toBe(false);
    // Preserved, not destroyed: a revision never discards work.
    expect(existsSync(worktree)).toBe(true);
    expect(git(repository, "branch", "--list", branch!)).toBeTruthy();

    // The round trip closes: define, sign, and start again onto what was kept.
    cliRun(repository, ["contract", "define", id, "--from", definition, "--json"]);
    commit(repository, "chore: redefine");
    expect(cliRun(repository, ["contract", "sign", id, "--approve", "--json"]).status).toBe(0);
    const restarted = cliRun(repository, ["contract", "start", id, "--caller", "--agent", "claude", "--json"]);
    expect(restarted.status).toBe(0);
    expect(state()).toBe("active");
  });

  test("refuses without approval, without a reason, and from review or done", () => {
    const { repository, id, state } = fixture("refusals");
    const unapproved = cliRun(repository, ["contract", "revise", id, "--reason", "Because."]);
    expect(unapproved.status).not.toBe(0);
    expect(unapproved.stdout + unapproved.stderr).toContain("Human approval is required");

    const reasonless = cliRun(repository, ["contract", "revise", id, "--approve"]);
    expect(reasonless.status).not.toBe(0);
    expect(reasonless.stdout + reasonless.stderr).toContain("--reason");

    // Nothing moved on either refusal.
    expect(state()).toBe("defined");

    cliRun(repository, ["contract", "start", id, "--caller", "--agent", "claude", "--json"]);
    cliRun(repository, ["contract", "review", id, "--evidence", "Acceptance met.", "--json"]);
    const fromReview = cliRun(repository, ["contract", "revise", id, "--reason", "Too late.", "--approve"]);
    expect(fromReview.status).not.toBe(0);
    expect(fromReview.stdout + fromReview.stderr).toContain("Reopen owns those states");
  });

  test("uncommitted work in the execution worktree stops the revision and releases nothing", () => {
    const { repository, id, state } = fixture("dirty", { start: true });
    writeFileSync(join(repository, ".worktrees", id, "in-progress.txt"), "half a change\n");

    const refused = cliRun(repository, ["contract", "revise", id, "--reason", "Wrong scope.", "--approve"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout + refused.stderr).toContain("uncommitted changes");
    expect(state()).toBe("active");
    expect(existsSync(join(repository, ".kotta", "claims", `${id}.yaml`))).toBe(true);
  });

  test("claim release returns the contract to defined instead of stranding it in active", () => {
    // The measured defect: release undid half of start, and left the contract where
    // no command accepted it.
    const { repository, id, state } = fixture("release", { start: true });
    const released = json<{ data: { contractState: string } }>(repository, ["claim", "release", id, "--force"]);
    expect(released.data.contractState).toBe("defined");
    expect(state()).toBe("defined");
    expect(existsSync(join(repository, ".kotta", "claims", `${id}.yaml`))).toBe(false);
    // And from defined every exit is open again — including starting onto the kept branch.
    expect(cliRun(repository, ["contract", "start", id, "--caller", "--agent", "claude", "--json"]).status).toBe(0);
  });

  test("the lifecycle event and status carry the reason, and revise is not a cancellation", () => {
    const { repository, id } = fixture("record");
    const reason = "The premise expired before it ran.";
    cliRun(repository, ["contract", "revise", id, "--reason", reason, "--approve", "--json"]);

    const events = json<{ data: { revisedContracts: { id: string; reason: string }[] } }>(repository, ["status"]);
    expect(events.data.revisedContracts).toEqual([{ id, title: "Ship the exporter", reason }]);
    expect(cliRun(repository, ["status"]).stdout).toContain(reason);

    const eventFiles = execFileSync("grep", ["-rl", "Revised from defined", join(repository, ".kotta", "events")], { encoding: "utf8" }).trim();
    expect(eventFiles).toBeTruthy();
    const recorded = JSON.parse(readFileSync(eventFiles.split("\n")[0], "utf8")) as { state: string; summary: string };
    expect(recorded.state).toBe("backlog");
    expect(recorded.summary).toContain(reason);
    // The contract keeps its identity: no resolution, and it is not in done.
    const shown = json<{ data: { state: string; facts: Record<string, string> } }>(repository, ["contract", "show", id]);
    expect(shown.data.state).toBe("backlog");
    expect(shown.data.facts.resolution).toBeUndefined();
  });
});
