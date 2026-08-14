import { execFileSync, spawn, spawnSync, type SpawnSyncReturns } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

/**
 * Deterministic stand-in for a real agent binary. It records exactly what the
 * command handed it — argv, cwd and the prompt on stdin — so the tests can prove
 * the fresh-context contract without ever spawning `claude` or `codex`.
 */
const DOUBLE = `#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

let stdin = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) stdin += chunk;
writeFileSync(process.env.DOUBLE_RECORD, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), stdin }));

const mode = process.env.DOUBLE_MODE ?? "commit";
if (mode === "empty") process.exit(0);
if (mode === "fail") {
  process.stderr.write("double: refusing to implement\\n");
  process.exit(3);
}
if (mode === "no-change") {
  // Exits 0 and talks about work it never did: the shape the record must not call implemented.
  process.stdout.write("double: analysed the brief and decided nothing was needed\\n");
  process.exit(0);
}
if (mode === "uncommitted") {
  writeFileSync("agent-output.txt", "left uncommitted by the double\\n");
  process.stdout.write("double: implemented without committing\\n");
  process.exit(0);
}
if (mode === "hang") {
  writeFileSync(process.env.DOUBLE_MARKER, "running");
  setInterval(() => {}, 1000);
} else {
  writeFileSync("agent-output.txt", "implemented by the double\\n");
  execFileSync("git", ["add", "-A"], { cwd: process.cwd() });
  execFileSync("git", ["commit", "-m", "feat: double implementation"], { cwd: process.cwd() });
  process.stdout.write(mode === "structured"
    ? JSON.stringify({ type: "result", result: "double: implemented with metrics", usage: { input_tokens: 80, cache_read_input_tokens: 20, output_tokens: 25 } })
    : "double: implemented\\n");
}
`;

function git(repository: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: repository, encoding: "utf8" }).trim();
}

function cliRun(repository: string, args: string[], environment: Record<string, string> = {}): SpawnSyncReturns<string> {
  return spawnSync("node", [cli, ...args], { cwd: repository, encoding: "utf8", env: { ...process.env, ...environment } });
}

function json(result: SpawnSyncReturns<string>): Record<string, unknown> {
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

function expectOk(result: SpawnSyncReturns<string>): Record<string, unknown> {
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return json(result);
}

interface Fixture {
  repository: string;
  id: string;
  double: string;
  record: string;
  marker: string;
}

function fixture(label: string, options: { defined?: boolean } = {}): Fixture {
  const repository = mkdtempSync(join(tmpdir(), `kotta-execute-${label}-`));
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Kotta Test");
  git(repository, "config", "user.email", "test@example.com");
  writeFileSync(join(repository, "README.md"), "fixture\n");
  expectOk(cliRun(repository, ["init", "--json"]));
  const id = (expectOk(cliRun(repository, ["contract", "new", "--title", "Ship the exporter", "--type", "feature", "--json"])) as { data: { id: string } }).data.id;
  const definition = join(repository, "definition.md");
  writeFileSync(definition, `# ${id} — Ship the exporter

## Outcome

Exports run.

## Scope

One exporter.

## Non-goals

Nothing else.

## Acceptance

- Exporter produces a file.

## Verification

- Run it.

## Constraints

None.

## Open decisions

None.

## Execution notes

None.
`);
  expectOk(cliRun(repository, ["contract", "define", id, "--from", definition, "--json"]));
  if (options.defined !== false) expectOk(cliRun(repository, ["contract", "sign", id, "--approve", "--json"]));
  git(repository, "add", "-A");
  git(repository, "commit", "-m", "fixture");

  const tools = mkdtempSync(join(tmpdir(), `kotta-agent-${label}-`));
  const double = join(tools, "agent-double.mjs");
  writeFileSync(double, DOUBLE);
  chmodSync(double, 0o755);
  return { repository, id, double, record: join(tools, "record.json"), marker: join(tools, "marker") };
}

function agentEnvironment(fixtureUnderTest: Fixture, mode: string): Record<string, string> {
  return { KOTTA_AGENT_COMMAND: fixtureUnderTest.double, DOUBLE_RECORD: fixtureUnderTest.record, DOUBLE_MODE: mode, DOUBLE_MARKER: fixtureUnderTest.marker };
}

function claimPath(repository: string, id: string): string {
  return join(repository, ".kotta/claims", `${id}.yaml`);
}

interface ExecutionEvent {
  state: string;
  summary: string;
  payload: {
    agent: string;
    exit_code: number | null;
    baseline_commit: string;
    commit: string;
    uncommitted_changes: boolean;
    started_at: string;
    completed_at: string;
    duration_ms: number;
    token_usage: { input_tokens: number; output_tokens: number; total_tokens: number; cached_input_tokens?: number } | null;
    claim_agent_replaced?: string;
    agent_report: { source: string; verified: boolean; output: string };
  };
}

/** The stored account of every run, in order. `.kotta/` is the source of truth for it. */
function executionEvents(repository: string, id: string): ExecutionEvent[] {
  const directory = join(repository, ".kotta/events", id);
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(directory, name), "utf8")) as ExecutionEvent)
    .filter((event) => event.state?.startsWith("execution-"));
}

describe("contract execute (T-035 / D-009)", () => {
  test("runs a defined contract in a fresh agent context and returns implemented work", () => {
    const context = fixture("happy");
    const { repository, id } = context;
    const result = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "commit"));
    const data = (expectOk(result) as { ok: boolean; data: Record<string, unknown> }).data;
    const worktree = join(repository, ".worktrees", id);

    expect(json(result)).toMatchObject({ ok: true, command: "contract execute" });
    expect(data).toMatchObject({ id, state: "implemented", contractState: "active", agent: "claude", agentCommand: context.double, branch: `feat/${id}-ship-the-exporter`, context: "fresh", inheritContext: null, exitCode: 0, uncommittedChanges: false });
    expect(String(data.worktree)).toContain(join(".worktrees", id));
    expect(Number(data.briefTokens)).toBeGreaterThan(0);
    expect(Number(data.briefSections)).toBeGreaterThan(1);

    // Acceptance 1: claim, branch, worktree and committed work exist.
    expect(existsSync(claimPath(repository, id))).toBe(true);
    expect(readFileSync(join(worktree, "agent-output.txt"), "utf8")).toContain("implemented by the double");
    expect(git(worktree, "log", "--oneline", "-1")).toContain("feat: double implementation");
    expect(git(worktree, "status", "--porcelain")).toBe("");
    expect(expectOk(cliRun(worktree, ["status", "--json"]))).toMatchObject({ data: { activeContracts: [id] } });

    // Acceptance 2: the agent's input is the brief and nothing else.
    const recorded = JSON.parse(readFileSync(context.record, "utf8")) as { argv: string[]; cwd: string; stdin: string };
    const brief = (expectOk(cliRun(worktree, ["contract", "brief", id, "--json"])) as { data: { brief: string; tokens: number } }).data;
    expect(recorded.stdin).toBe(brief.brief);
    // Kotta adds no permission flag of its own: an unconfigured workspace grants
    // nothing the caller had not already granted through the agent's settings.
    expect(recorded.argv).toEqual(["-p", "--output-format", "json"]);
    expect(String(data.permissionWarning)).toContain("agents.permission_mode");
    expect(recorded.cwd.endsWith(join(".worktrees", id))).toBe(true);
    expect(recorded.stdin).not.toContain("Context inheritance");
    expect(Number(data.briefTokens)).toBe(brief.tokens);

    // Acceptance 3: the record describes the run, and stores the agent's own account as reported.
    const events = executionEvents(repository, id);
    expect(events).toHaveLength(1);
    expect(existsSync(String(data.recordPath))).toBe(true);
    expect(JSON.parse(readFileSync(String(data.recordPath), "utf8"))).toMatchObject({ state: "execution-implemented" });
    expect(events[0].state).toBe("execution-implemented");
    expect(events[0].payload).toMatchObject({ agent: "claude", exit_code: 0, uncommitted_changes: false, resumed: false });
    expect(Number.isFinite(Date.parse(events[0].payload.started_at))).toBe(true);
    expect(Number.isFinite(Date.parse(events[0].payload.completed_at))).toBe(true);
    expect(events[0].payload.duration_ms).toBeGreaterThanOrEqual(0);
    expect(events[0].payload.token_usage).toBeNull();
    expect(events[0].payload.baseline_commit).not.toBe(events[0].payload.commit);
    expect(events[0].payload.commit).toBe(git(worktree, "rev-parse", "HEAD"));
    expect(events[0].payload.agent_report).toMatchObject({ source: "agent stdout", verified: false });
    expect(events[0].payload.agent_report.output).toContain("double: implemented");
  });

  test("records normalized token usage from supported structured agent output", () => {
    const context = fixture("structured-usage");
    const { repository, id } = context;
    const parsed = expectOk(cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "structured"))) as { data: Record<string, unknown> };

    expect(parsed.data.tokenUsage).toEqual({ input_tokens: 100, output_tokens: 25, total_tokens: 125, cached_input_tokens: 20 });
    const event = executionEvents(repository, id)[0];
    expect(event.payload.token_usage).toEqual({ input_tokens: 100, output_tokens: 25, total_tokens: 125, cached_input_tokens: 20 });
    expect(event.payload.agent_report.output).toBe("double: implemented with metrics");
  });

  test("an agent that changes nothing is no-change, not implemented", () => {
    const context = fixture("no-change");
    const { repository, id } = context;
    const result = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "no-change"));
    const parsed = expectOk(result) as { ok: boolean; data: Record<string, unknown> };
    const worktree = join(repository, ".worktrees", id);

    expect(parsed.data).toMatchObject({ state: "no-change", exitCode: 0, uncommittedChanges: false });
    expect(parsed.data.commit).toBe(parsed.data.baselineCommit);
    expect(String(parsed.data.reason)).toContain("changed nothing");
    expect(git(worktree, "status", "--porcelain")).toBe("");

    const events = executionEvents(repository, id);
    expect(events.map((event) => event.state)).toEqual(["execution-no-change"]);
    expect(events[0].payload.agent_report.output).toContain("decided nothing was needed");

    // The human output says so plainly and names what to check.
    const human = cliRun(repository, ["contract", "execute", id, "--resume"], agentEnvironment(context, "no-change"));
    expect(human.status).toBe(0);
    expect(human.stdout).toContain(`kotta contract execute ${id}: no-change`);
    expect(human.stdout).toContain("Nothing to review");
    expect(human.stdout).toContain(join(".kotta/events", id));
    expect(human.stdout).toContain("Read what the agent reported in ");
    expect(human.stdout).not.toContain("--evidence");
    // A resume appends a second run record instead of rewriting the first.
    expect(executionEvents(repository, id).map((event) => event.state)).toEqual(["execution-no-change", "execution-no-change"]);
  });

  test("work left uncommitted in the worktree is implemented, not an empty run", () => {
    const context = fixture("uncommitted");
    const { repository, id } = context;
    const data = (expectOk(cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "uncommitted"))) as { data: Record<string, unknown> }).data;
    const worktree = join(repository, ".worktrees", id);

    expect(data).toMatchObject({ state: "implemented", uncommittedChanges: true });
    expect(data.commit).toBe(data.baselineCommit);
    expect(readFileSync(join(worktree, "agent-output.txt"), "utf8")).toContain("left uncommitted");
    expect(executionEvents(repository, id)[0].payload).toMatchObject({ uncommitted_changes: true, baseline_uncommitted_changes: false });
  });

  test("a run that completes while the control worktree is dirty still writes its record", () => {
    const context = fixture("dirty-control");
    const { repository, id } = context;
    expectOk(cliRun(repository, ["contract", "start", id, "--agent", "claude", "--json"]));
    // The 2026-08-07 failure: an unrelated untracked file made assertClean destroy the record.
    const unrelated = join(repository, "unrelated-scratch.txt");
    writeFileSync(unrelated, "not Kotta's business\n");
    const before = git(repository, "rev-parse", "HEAD");

    const data = (expectOk(cliRun(repository, ["contract", "execute", id, "--resume", "--json"], agentEnvironment(context, "commit"))) as { data: Record<string, unknown> }).data;
    expect(data).toMatchObject({ state: "implemented" });

    expect(executionEvents(repository, id).map((event) => event.state)).toEqual(["execution-implemented"]);
    expect(git(repository, "log", "--oneline", `${before}..HEAD`)).toContain(`record implemented execution for ${id}`);
    expect(existsSync(unrelated)).toBe(true);
    expect(git(repository, "status", "--porcelain")).toBe("?? unrelated-scratch.txt");
  });

  test("a record write that fails for a real reason names the run at risk, not a failed start", () => {
    const context = fixture("unrecorded");
    const { repository, id } = context;
    expectOk(cliRun(repository, ["contract", "start", id, "--agent", "claude", "--json"]));
    const worktree = join(repository, ".worktrees", id);
    const before = git(worktree, "rev-parse", "HEAD");

    // Hold the control-plane lock with a live owner so only the record write fails.
    const lock = join(repository, ".git/kotta-mutation.lock");
    mkdirSync(lock, { recursive: true });
    writeFileSync(join(lock, "owner.json"), JSON.stringify({ pid: process.pid }));

    const result = cliRun(repository, ["contract", "execute", id, "--resume", "--json"], agentEnvironment(context, "commit"));
    expect(result.status).not.toBe(0);
    const parsed = json(result) as { ok: boolean; data: Record<string, unknown>; errors: { code: string; message: string }[] };
    expect(parsed).toMatchObject({ ok: false, data: { state: "implemented", recordPath: null }, errors: [{ code: "EXECUTION_UNRECORDED" }] });
    expect(parsed.errors[0].message).toContain(`Execution of ${id} finished as implemented`);
    expect(parsed.errors[0].message).toContain("is now unrecorded");
    // The message is about finishing a run; nothing here failed to start.
    expect(parsed.errors[0].message).not.toContain("before starting");
    expect(parsed.errors[0].message).not.toContain("No execution context was created");

    // The work is untouched and still there to be recorded on the next attempt.
    expect(git(worktree, "log", "--oneline", "-1")).toContain("feat: double implementation");
    expect(git(worktree, "rev-parse", "HEAD")).not.toBe(before);
    expect(executionEvents(repository, id)).toEqual([]);
    rmSync(lock, { recursive: true, force: true });
  });

  test("a configured permission mode reaches the invocation, and configuring one silences the warning", () => {
    // The operator's deliberate act, and the only way a launched agent receives
    // more than the caller's own settings already permit.
    const context = fixture("permission-mode");
    const { repository, id } = context;
    const configPath = join(repository, ".kotta", "config.yaml");
    writeFileSync(configPath, readFileSync(configPath, "utf8").replace("permission_mode: null", "permission_mode: bypassPermissions"));
    git(repository, "add", "-A");
    git(repository, "commit", "-m", "chore: permit writes for launched agents");

    const result = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "commit"));
    const data = (expectOk(result) as { data: Record<string, unknown> }).data;
    expect(data.permissionWarning).toBeNull();
    const recorded = JSON.parse(readFileSync(context.record, "utf8")) as { argv: string[] };
    expect(recorded.argv).toEqual(["-p", "--output-format", "json", "--permission-mode", "bypassPermissions"]);
  });

  test("refuses at launch when the configured mode forbids edits by definition", () => {
    const context = fixture("permission-plan");
    const { repository, id } = context;
    const configPath = join(repository, ".kotta", "config.yaml");
    writeFileSync(configPath, readFileSync(configPath, "utf8").replace("permission_mode: null", "permission_mode: plan"));
    git(repository, "add", "-A");
    git(repository, "commit", "-m", "chore: planning mode");

    const result = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "commit"));
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toContain("forbids edits");
    // Nothing was created: the refusal happens before the context exists.
    expect(existsSync(claimPath(repository, id))).toBe(false);
    expect(existsSync(context.record)).toBe(false);
  });

  test("a resume that names another agent leaves the claim naming the agent that ran", () => {
    const context = fixture("resume-agent");
    const { repository, id } = context;
    expectOk(cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "no-change")));
    expect(readFileSync(claimPath(repository, id), "utf8")).toContain("agent: claude");

    const switched = (expectOk(cliRun(repository, ["contract", "execute", id, "--resume", "--agent", "codex", "--json"], agentEnvironment(context, "commit"))) as { data: Record<string, unknown> }).data;
    expect(switched).toMatchObject({ state: "implemented", resumed: true, agent: "codex" });
    expect(readFileSync(claimPath(repository, id), "utf8")).toContain("agent: codex");
    expect(executionEvents(repository, id).at(-1)?.payload).toMatchObject({ agent: "codex", claim_agent_replaced: "claude" });

    // A later bare resume relaunches the agent that actually ran.
    const bare = (expectOk(cliRun(repository, ["contract", "execute", id, "--resume", "--json"], agentEnvironment(context, "no-change"))) as { data: Record<string, unknown> }).data;
    expect(bare).toMatchObject({ agent: "codex", state: "no-change" });
    expect((JSON.parse(readFileSync(context.record, "utf8")) as { argv: string[] }).argv).toEqual(["exec", "--json", "-"]);
    expect(readFileSync(claimPath(repository, id), "utf8")).toContain("agent: codex");
    expect(expectOk(cliRun(repository, ["validate", "--json"]))).toMatchObject({ ok: true });
  });

  test("human output names the brief size, the agent, the branch and the worktree", () => {
    const context = fixture("output");
    const { repository, id } = context;
    const result = cliRun(repository, ["contract", "execute", id, "--agent", "codex"], agentEnvironment(context, "commit"));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`kotta contract execute ${id}: implemented`);
    expect(result.stdout).toMatch(/brief:\s+~\d+ tokens/);
    expect(result.stdout).toContain(`agent:    codex (command: ${context.double})`);
    expect(result.stdout).toContain(`branch:   feat/${id}-ship-the-exporter`);
    expect(result.stdout).toContain(join(".worktrees", id));
    expect(result.stdout).toContain("fresh (D-009 default)");
    const recorded = JSON.parse(readFileSync(context.record, "utf8")) as { argv: string[] };
    expect(recorded.argv).toEqual(["exec", "--json", "-"]);
  });

  test("a non-zero agent exit is agent-failed and preserves the execution context", () => {
    const context = fixture("failing");
    const { repository, id } = context;
    const result = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "fail"));
    expect(result.status).not.toBe(0);
    expect(json(result)).toMatchObject({ ok: false, data: { state: "agent-failed", exitCode: 3, contractState: "active" }, errors: [{ code: "AGENT_FAILED" }] });
    expect(existsSync(claimPath(repository, id))).toBe(true);
    expect(existsSync(join(repository, ".worktrees", id))).toBe(true);
    expect(existsSync(join(repository, ".worktrees", id, ".kotta/review"))).toBe(false);
  });

  test("an empty agent result is agent-failed", () => {
    const context = fixture("empty");
    const { repository, id } = context;
    const result = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "empty"));
    expect(result.status).not.toBe(0);
    expect(json(result)).toMatchObject({ ok: false, data: { state: "agent-failed", exitCode: 0 } });
    expect(String((json(result) as { data: { reason: string } }).data.reason)).toContain("no output");
    expect(existsSync(claimPath(repository, id))).toBe(true);
  });

  test("retry after a failure reuses the existing execution context instead of creating a second one", () => {
    const context = fixture("retry");
    const { repository, id } = context;
    expect(cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "fail")).status).not.toBe(0);

    const duplicate = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "commit"));
    expect(duplicate.status).not.toBe(0);
    expect(duplicate.stdout).toContain("refuses to start a second agent");
    expect(existsSync(join(context.record))).toBe(true);
    expect((JSON.parse(readFileSync(context.record, "utf8")) as { stdin: string }).stdin.length).toBeGreaterThan(0);

    const resumed = cliRun(repository, ["contract", "execute", id, "--resume", "--json"], agentEnvironment(context, "commit"));
    const data = (expectOk(resumed) as { data: Record<string, unknown> }).data;
    expect(data).toMatchObject({ state: "implemented", resumed: true, agent: "claude" });
    expect(git(repository, "worktree", "list").split("\n").filter((line) => line.includes(id)).length).toBe(1);
  });

  test("a second execute on a claimed contract refuses and starts no second agent", () => {
    const context = fixture("duplicate");
    const { repository, id } = context;
    expectOk(cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "commit")));
    const firstRecord = readFileSync(context.record, "utf8");

    const second = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--json"], agentEnvironment(context, "commit"));
    expect(second.status).not.toBe(0);
    expect(json(second)).toMatchObject({ ok: false, errors: [{ code: "COMMAND_FAILED" }] });
    expect(second.stdout).toContain("already has an execution context");
    expect(readFileSync(context.record, "utf8")).toBe(firstRecord);
  });

  test("refuses a non-defined contract, a dirty repository and a missing agent command without mutating anything", () => {
    const backlog = fixture("backlog", { defined: false });
    const notReady = cliRun(backlog.repository, ["contract", "execute", backlog.id, "--agent", "claude", "--json"], agentEnvironment(backlog, "commit"));
    expect(notReady.status).not.toBe(0);
    expect(notReady.stdout).toContain("must be defined before execute");
    expect(existsSync(join(backlog.repository, ".worktrees", backlog.id))).toBe(false);
    expect(existsSync(backlog.record)).toBe(false);

    const dirty = fixture("dirty");
    writeFileSync(join(dirty.repository, "scratch.txt"), "uncommitted\n");
    const dirtyResult = cliRun(dirty.repository, ["contract", "execute", dirty.id, "--agent", "claude", "--json"], agentEnvironment(dirty, "commit"));
    expect(dirtyResult.status).not.toBe(0);
    expect(dirtyResult.stdout).toContain("Repository is dirty");
    expect(existsSync(join(dirty.repository, ".worktrees", dirty.id))).toBe(false);
    expect(existsSync(dirty.record)).toBe(false);

    const missing = fixture("missing-agent");
    const missingResult = cliRun(missing.repository, ["contract", "execute", missing.id, "--agent", "claude", "--json"], { ...agentEnvironment(missing, "commit"), KOTTA_AGENT_COMMAND: join(missing.repository, "no-such-agent") });
    expect(missingResult.status).not.toBe(0);
    expect(missingResult.stdout).toContain("Agent command not found");
    expect(missingResult.stdout).toContain("No execution context was created");
    expect(existsSync(join(missing.repository, ".worktrees", missing.id))).toBe(false);
    expect(git(missing.repository, "branch", "--list")).toBe("* main");
    expect(git(missing.repository, "status", "--porcelain")).toBe("");

    const unknownAgent = cliRun(missing.repository, ["contract", "execute", missing.id, "--agent", "no-such-agent-t035", "--json"], { DOUBLE_RECORD: missing.record });
    expect(unknownAgent.status).not.toBe(0);
    expect(unknownAgent.stdout).toContain("Agent command not found");
    expect(existsSync(join(missing.repository, ".worktrees", missing.id))).toBe(false);
  });

  test("--inherit-context demands a reason and logs it when granted", () => {
    const context = fixture("inherit");
    const { repository, id } = context;
    const withoutReason = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--inherit-context", "", "--json"], agentEnvironment(context, "commit"));
    expect(withoutReason.status).not.toBe(0);
    expect(withoutReason.stdout).toContain("--inherit-context requires a reason");
    expect(existsSync(join(repository, ".worktrees", id))).toBe(false);

    const missingValue = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--inherit-context"], agentEnvironment(context, "commit"));
    expect(missingValue.status).not.toBe(0);
    expect(missingValue.stderr).toContain("--inherit-context");

    const reason = "F-032 hotfix shares the coordinator's incident context";
    const granted = cliRun(repository, ["contract", "execute", id, "--agent", "claude", "--inherit-context", reason], agentEnvironment(context, "commit"));
    expect(granted.status).toBe(0);
    expect(granted.stdout).toContain(`INHERITED — ${reason}`);
    const recorded = JSON.parse(readFileSync(context.record, "utf8")) as { stdin: string };
    expect(recorded.stdin).toContain("## Context inheritance (explicit exception to D-009)");
    expect(recorded.stdin).toContain(`Reason: ${reason}`);
  });

  test("contract start names execute as the next step", () => {
    const context = fixture("start");
    const { repository, id } = context;
    const human = cliRun(repository, ["contract", "start", id, "--agent", "claude"]);
    expect(human.status).toBe(0);
    expect(human.stdout).toContain(`kotta contract execute ${id} --resume`);
    expect(human.stdout).toContain("fresh agent context");
    const state = expectOk(cliRun(repository, ["claim", "list", "--json"])) as { data: { claims: { contract: string }[] } };
    expect(state.data.claims.map((claim) => claim.contract)).toEqual([id]);

    const resumed = expectOk(cliRun(repository, ["contract", "execute", id, "--resume", "--json"], agentEnvironment(context, "commit"))) as { data: Record<string, unknown> };
    expect(resumed.data).toMatchObject({ state: "implemented", resumed: true, agent: "claude" });
  });

  test("contract start can explicitly hand execution to the caller", () => {
    const context = fixture("caller");
    const result = cliRun(context.repository, ["contract", "start", context.id, "--agent", "codex", "--caller", "--json"]);
    const data = (expectOk(result) as { data: Record<string, unknown> }).data;
    expect(data).toMatchObject({ executionMode: "inherited" });
    expect(String(data.callerStep)).toContain("inherited-context mode");
    expect(readFileSync(claimPath(context.repository, context.id), "utf8")).toContain("execution_mode: inherited");
  });

  test("claim recovery checks the recorded execution worktree and commits canonical state", () => {
    const context = fixture("release-claim");
    const started = (expectOk(cliRun(context.repository, ["contract", "start", context.id, "--agent", "codex", "--caller", "--json"])) as { data: { worktree: string } }).data;
    const executionWorktree = resolve(context.repository, started.worktree);
    const dirty = join(executionWorktree, "unfinished.txt");
    writeFileSync(dirty, "not committed\n");

    const refused = cliRun(executionWorktree, ["claim", "release", context.id, "--force", "--json"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain(`Execution worktree ${executionWorktree} has uncommitted changes`);
    expect(existsSync(claimPath(context.repository, context.id))).toBe(true);

    unlinkSync(dirty);
    expectOk(cliRun(executionWorktree, ["claim", "release", context.id, "--force", "--json"]));
    expect(existsSync(claimPath(context.repository, context.id))).toBe(false);
    expect(git(context.repository, "status", "--porcelain")).toBe("");
  });

  test.each(["after-worktree", "after-active", "after-claim"])("start rolls back cleanly when it fails %s", (boundary) => {
    const context = fixture(`rollback-${boundary}`);
    const result = cliRun(context.repository, ["contract", "start", context.id, "--agent", "codex", "--json"], { KOTTA_TEST_FAIL_START_AT: boundary });
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain("Injected start failure");
    expect(existsSync(join(context.repository, ".worktrees", context.id))).toBe(false);
    expect(existsSync(claimPath(context.repository, context.id))).toBe(false);
    expect(git(context.repository, "branch", "--list", `feat/${context.id}-ship-the-exporter`)).toBe("");
    expect(expectOk(cliRun(context.repository, ["contract", "validate", context.id, "--json"]))).toMatchObject({ data: { state: "defined" } });
    expect(git(context.repository, "status", "--porcelain")).toBe("");
  });

  test("an interrupt leaves the claim and worktree in place and names the manual decision", async () => {
    const context = fixture("cancel");
    const { repository, id } = context;
    const child = spawn("node", [cli, "contract", "execute", id, "--agent", "claude", "--json"], { cwd: repository, env: { ...process.env, ...agentEnvironment(context, "hang") } });
    let stdout = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.resume();
    const exit = new Promise<number | null>((settle) => child.on("close", (code) => settle(code)));

    const deadline = Date.now() + 10_000;
    while (!existsSync(context.marker) && Date.now() < deadline) await new Promise((wake) => setTimeout(wake, 50));
    expect(existsSync(context.marker)).toBe(true);
    child.kill("SIGINT");
    expect(await exit).not.toBe(0);

    const result = JSON.parse(stdout) as { ok: boolean; data: { state: string }; errors: { code: string; message: string }[] };
    expect(result).toMatchObject({ ok: false, data: { state: "cancelled" }, errors: [{ code: "EXECUTION_CANCELLED" }] });
    expect(result.errors[0].message).toContain(`kotta claim release ${id} --force`);
    expect(existsSync(claimPath(repository, id))).toBe(true);
    expect(existsSync(join(repository, ".worktrees", id))).toBe(true);
  });
});
