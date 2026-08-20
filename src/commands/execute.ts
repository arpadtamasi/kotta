import { spawn, spawnSync } from "node:child_process";
import { accessSync, constants, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { findRepositoryRoot, processPath } from "../filesystem/workspace.js";
import { findTask } from "../filesystem/entities.js";
import { assertClean, git } from "../git/git.js";
import { briefTask, startTask } from "./task.js";
import { ENV_PREFIX, readEnv } from "../core/env.js";
import { commitControlState, controlPlaneRoot, withControlPlaneMutation } from "../git/control-plane.js";
import { appendEvent } from "../core/events.js";
import { validateClaim } from "../core/claim.js";
import { readAgentPermissionMode } from "../core/config.js";
import { normalizeAgentOutput, type TokenUsage } from "../core/execution-metrics.js";

/**
 * Arguments a named agent expects around a prompt that arrives on stdin.
 * Unknown agents are invoked bare: the prompt is still the whole stdin.
 *
 * No permission mode is baked in here. What a launched agent may do is the
 * operator's decision, read from `.kotta/config.yaml`; with nothing configured,
 * Kotta passes no flag and the agent's own project settings apply. The isolated
 * worktree bounds the Git state, not the process, so it is not a reason for Kotta
 * to hand out an authority the caller never granted.
 */
const AGENT_ARGUMENTS: Record<string, string[]> = {
  claude: ["-p", "--output-format", "json"],
  codex: ["exec", "--json", "-"],
};

/** Modes that forbid edits by definition, whatever the agent's own settings say. */
const READ_ONLY_MODES = new Set(["plan"]);

/**
 * Why a resolved invocation structurally cannot change files. Evaluated before
 * launch so a disarmed agent is a launch-time error naming the cause, never a
 * successful-looking empty run.
 *
 * Absence of a mode is not such a case. It means the agent's settings decide, and
 * Kotta cannot read them — so it warns rather than refuses, and the baseline
 * comparison reports a run that then changed nothing as `no-change`.
 */
export function invocationWriteFailure(agent: string, args: string[]): string | null {
  if (agent !== "claude") return null;
  const mode = args[args.indexOf("--permission-mode") + 1];
  if (!args.includes("--permission-mode") || !mode?.trim()) return null;
  if (READ_ONLY_MODES.has(mode)) return `--permission-mode ${mode} forbids edits by design, so it cannot implement a task.`;
  return null;
}

/**
 * Said once at launch when nothing states what the agent may do: the run is about
 * to depend on settings Kotta cannot see, and may legitimately change nothing.
 */
export function invocationWriteWarning(agent: string, args: string[]): string | null {
  if (agent !== "claude" || args.includes("--permission-mode")) return null;
  return "No agents.permission_mode is set in .kotta/config.yaml, so this run inherits whatever the agent's own project settings permit. 'claude -p' asks before it writes and a headless run has nobody to answer, so it may complete having changed nothing.";
}

function assertInvocationCanWrite(agent: string, command: string, args: string[], tail: string): void {
  const cause = invocationWriteFailure(agent, args);
  if (cause) throw new Error(`Agent '${agent}' cannot change files as invoked ('${[command, ...args].join(" ")}'): ${cause} ${tail}`);
}

/** The launch seam: tests substitute a deterministic script double for a real agent binary. */
export const AGENT_COMMAND_ENV = `${ENV_PREFIX}AGENT_COMMAND`;

export interface AgentInvocation {
  command: string;
  args: string[];
  cwd: string;
  prompt: string;
}

export interface AgentRun {
  status: number | null;
  signal: string | null;
  cancelled: boolean;
  stdout: string;
  stderr: string;
  error: string | null;
}

export type AgentLauncher = (invocation: AgentInvocation) => Promise<AgentRun>;

export function resolveAgentCommand(agent: string, root?: string): { command: string; args: string[] } {
  const override = readEnv("AGENT_COMMAND")?.trim();
  const base = AGENT_ARGUMENTS[agent] ?? [];
  const mode = agent === "claude" && root ? readAgentPermissionMode(root) : null;
  return { command: override || agent, args: mode ? [...base, "--permission-mode", mode] : [...base] };
}

export function agentCommandAvailable(command: string): boolean {
  if (command.includes("/") || command.includes("\\")) {
    try {
      accessSync(command, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
  return spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
}

/**
 * Run the agent with the brief on stdin. Its stderr is forwarded live so a long
 * run is observable; its stdout is captured because an empty result is a failure.
 * An interrupt terminates the agent and returns `cancelled` instead of killing
 * this process, so the caller can report what the operator must now decide.
 */
const spawnAgent: AgentLauncher = (invocation) =>
  new Promise<AgentRun>((settle) => {
    const child = spawn(invocation.command, invocation.args, { cwd: invocation.cwd, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let cancelled = false;
    const cancel = (): void => {
      cancelled = true;
      child.kill("SIGTERM");
    };
    const done = (run: AgentRun): void => {
      process.off("SIGINT", cancel);
      process.off("SIGTERM", cancel);
      settle(run);
    };
    process.on("SIGINT", cancel);
    process.on("SIGTERM", cancel);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on("error", (error) => done({ status: null, signal: null, cancelled, stdout, stderr, error: error.message }));
    child.on("close", (status, signal) => done({ status, signal, cancelled, stdout, stderr, error: null }));
    child.stdin.on("error", () => { /* the agent may exit before reading the prompt */ });
    child.stdin.end(invocation.prompt);
  });

export interface ExecutionContext {
  worktree: string;
  branch: string;
  agent: string;
  claimPath: string;
}

/** An execution context exists when a claim for the task lives in its worktree. */
export function locateExecutionContext(root: string, id: string): ExecutionContext | null {
  const controlRoot = controlPlaneRoot(root);
  const canonicalClaim = processPath(controlRoot, "claims", `${id}.yaml`);
  const conventionalWorktree = join(controlRoot, ".worktrees", id);
  const legacyClaim = processPath(conventionalWorktree, "claims", `${id}.yaml`);
  const claimPath = existsSync(canonicalClaim) ? canonicalClaim : existsSync(legacyClaim) ? legacyClaim : null;
  if (!claimPath) return null;
  const claim = parseYaml(readFileSync(claimPath, "utf8")) as Record<string, unknown>;
  const recorded = typeof claim.worktree === "string" ? claim.worktree : `.worktrees/${id}`;
  const worktree = recorded.startsWith("/") ? recorded : join(controlRoot, recorded);
  return { worktree, branch: String(claim.branch ?? ""), agent: String(claim.agent ?? ""), claimPath };
}

/**
 * The comparison point for "did this run do anything". The task branch tip
 * plus the worktree's porcelain status, captured before the agent launches —
 * after the fact there is nothing left to compare against.
 */
export interface ExecutionBaseline {
  commit: string;
  status: string;
}

function captureBaseline(id: string, worktree: string, tail: string): ExecutionBaseline {
  try {
    return { commit: git(worktree, ["rev-parse", "HEAD"]), status: git(worktree, ["status", "--porcelain"]) };
  } catch (error) {
    throw new Error(`Baseline capture failed for ${id} in ${worktree}: ${errorMessage(error)}. The agent was not launched, because a run with no comparison point cannot be recorded faithfully. ${tail}`);
  }
}

/**
 * Re-read the worktree after the run. An unreadable worktree counts as changed:
 * Kotta never reports an empty run it could not verify.
 */
function inspectWorktree(worktree: string, baseline: ExecutionBaseline): { commit: string; status: string; changed: boolean } {
  try {
    const commit = git(worktree, ["rev-parse", "HEAD"]);
    const status = git(worktree, ["status", "--porcelain"]);
    return { commit, status, changed: commit !== baseline.commit || status !== baseline.status };
  } catch {
    return { commit: baseline.commit, status: baseline.status, changed: true };
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type ExecutionState = "implemented" | "no-change" | "agent-failed" | "cancelled";

export interface ExecuteResult {
  ok: boolean;
  command: "task execute";
  data: {
    id: string;
    state: ExecutionState;
    taskState: string;
    agent: string;
    agentCommand: string;
    branch: string;
    worktree: string;
    briefTokens: number;
    briefSections: number;
    briefWarning: string | null;
    /** Said when nothing states what the agent may do; null when the workspace configured it. */
    permissionWarning: string | null;
    context: "fresh" | "inherited";
    inheritContext: string | null;
    resumed: boolean;
    exitCode: number | null;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    tokenUsage: TokenUsage | null;
    baselineCommit: string;
    commit: string;
    uncommittedChanges: boolean;
    /** Where this run's account was stored; null means the record write failed. */
    recordPath: string | null;
    reason: string | null;
  };
  errors?: { code: string; message: string }[];
}

export interface ExecuteOptions {
  agent?: string;
  inheritContext?: string;
  resume?: boolean;
}

const INHERITANCE_HEADING = "## Context inheritance (explicit exception to D-009)";

function promptFor(brief: string, inheritContext: string | null): string {
  if (!inheritContext) return brief;
  return `${brief}\n${INHERITANCE_HEADING}\n\nThe caller declared context inheritance for this run.\n\nReason: ${inheritContext}\n`;
}

/**
 * Run one defined task in a fresh agent context (D-009): start, brief, launch —
 * one command, so the fresh-context model is the default path and not discipline.
 * The coordinator's context never reaches the agent: its only input is the brief.
 */
export async function executeTask(id: string, options: ExecuteOptions, launch: AgentLauncher = spawnAgent): Promise<ExecuteResult> {
  const callerRoot = findRepositoryRoot();
  const root = controlPlaneRoot(callerRoot);
  if (options.inheritContext !== undefined && !options.inheritContext.trim()) {
    throw new Error("--inherit-context requires a reason. Context carry-over is an explicit, logged exception (D-009); state why this task needs it.");
  }
  const inheritContext = options.inheritContext?.trim() ?? null;
  const existing = locateExecutionContext(callerRoot, id);

  if (options.resume) {
    if (!existing) throw new Error(`Task ${id} has no execution context to resume. Run 'kotta task execute ${id} --agent <agent>' to create one.`);
    const agent = options.agent?.trim() || existing.agent;
    if (!agent) throw new Error(`Claim for ${id} names no agent; pass --agent <agent> to resume.`);
    const task = findTask(root, id);
    const legacyTask = task.state === "defined" ? findTask(existing.worktree, id) : task;
    if (legacyTask.state !== "active") throw new Error(`Task ${id} must be active to resume; it is ${legacyTask.state}.`);
    const { command, args } = resolveAgentCommand(agent, root);
    if (!agentCommandAvailable(command)) throw new Error(agentMissingMessage(command));
    const contextNote = `Execution context ${existing.worktree} is untouched.`;
    assertInvocationCanWrite(agent, command, args, contextNote);
    const briefRoot = task.state === "defined" ? existing.worktree : root;
    return await runAgent({ id, root: briefRoot, controlRoot: root, agent, command, args, context: existing, inheritContext, resumed: true, launch });
  }

  const task = findTask(root, id);
  if (existing) {
    throw new Error(`Task ${id} already has an execution context (branch ${existing.branch}, worktree ${existing.worktree}). Execute refuses to start a second agent: retry inside it with '--resume', or release it with 'kotta claim release ${id} --force'.`);
  }
  if (task.state !== "defined") throw new Error(`Task ${id} must be defined before execute; it is ${task.state}. Nothing was created.`);
  if (existsSync(processPath(root, "claims", `${id}.yaml`))) throw new Error(`Task ${id} already has a claim. Execute refuses to start a second agent.`);
  const agent = options.agent?.trim();
  if (!agent) throw new Error("--agent <agent> is required to create an execution context.");
  assertClean(root);
  const { command, args } = resolveAgentCommand(agent, root);
  // The agent is resolved before any mutation: a missing binary, or one that cannot
  // write, must not leave a half-built context.
  if (!agentCommandAvailable(command)) throw new Error(agentMissingMessage(command));
  assertInvocationCanWrite(agent, command, args, "No execution context was created.");

  const started = startTask(id, agent);
  const worktree = String(started.data.worktree);
  const context: ExecutionContext = { worktree, branch: String(started.data.branch), agent, claimPath: processPath(root, "claims", `${id}.yaml`) };
  return await runAgent({ id, root, controlRoot: root, agent, command, args, context, inheritContext, resumed: false, launch });
}

function agentMissingMessage(command: string): string {
  return `Agent command not found: '${command}'. Install it, pass a different --agent, or set ${AGENT_COMMAND_ENV}. No execution context was created.`;
}

async function runAgent(input: {
  id: string;
  root: string;
  controlRoot: string;
  agent: string;
  command: string;
  args: string[];
  context: ExecutionContext;
  inheritContext: string | null;
  resumed: boolean;
  launch: AgentLauncher;
}): Promise<ExecuteResult> {
  const { id, root, controlRoot, agent, command, args, context, inheritContext, resumed, launch } = input;
  const contextNote = `Execution context exists: branch ${context.branch}, worktree ${context.worktree}. Inspect it, then retry with '--resume' or release it with 'kotta claim release ${id} --force'.`;

  let brief;
  try {
    brief = briefTask(id, {}, root);
  } catch (error) {
    throw new Error(`Brief assembly failed for ${id}: ${errorMessage(error)}. ${contextNote}`);
  }

  const baseline = captureBaseline(id, context.worktree, contextNote);
  const startedAt = new Date().toISOString();
  const run = await launch({ command, args, cwd: context.worktree, prompt: promptFor(brief.data.brief, inheritContext) });
  const completedAt = new Date().toISOString();
  const durationMs = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));
  const normalizedOutput = normalizeAgentOutput(agent, run.stdout);

  // The failure ladder keeps its order and its messages; `no-change` is only
  // reached when it yields nothing.
  const failure = run.cancelled
    ? { state: "cancelled" as const, reason: `Execution was interrupted; the agent was terminated with ${run.signal ?? "SIGTERM"}.` }
    : run.error
      ? { state: "agent-failed" as const, reason: `Agent could not be launched: ${run.error}.` }
      : run.status !== 0
        ? { state: "agent-failed" as const, reason: run.signal ? `Agent was terminated by ${run.signal}.` : `Agent exited with code ${String(run.status)}.` }
        : !run.stdout.trim()
          ? { state: "agent-failed" as const, reason: "Agent produced no output; the result is empty and cannot be treated as an implementation." }
          : null;

  const after = inspectWorktree(context.worktree, baseline);
  const state: ExecutionState = failure?.state ?? (after.changed ? "implemented" : "no-change");
  const noChangeReason = `Agent completed and changed nothing: ${context.worktree} still matches the pre-run baseline ${baseline.commit.slice(0, 12)}. This run produced no implementation.`;
  const reason = failure?.reason ?? (state === "no-change" ? noChangeReason : null);
  const taskState = safeTaskState(controlRoot, id);
  const data: ExecuteResult["data"] = {
    id,
    state,
    taskState,
    agent,
    agentCommand: command,
    branch: context.branch,
    worktree: context.worktree,
    briefTokens: brief.data.tokens,
    briefSections: brief.data.sections.length,
    briefWarning: brief.data.warning,
    permissionWarning: invocationWriteWarning(agent, args),
    context: inheritContext ? "inherited" : "fresh",
    inheritContext,
    resumed,
    exitCode: run.status,
    startedAt,
    completedAt,
    durationMs,
    tokenUsage: normalizedOutput.usage,
    baselineCommit: baseline.commit,
    commit: after.commit,
    uncommittedChanges: Boolean(after.status),
    recordPath: null,
    reason,
  };

  // The agent that actually ran owns the claim from here on, so a later bare
  // `--resume` relaunches it. Recorded in the same mutation as the run, before
  // the event, so the claim can never name an agent no run mentions.
  const replacedAgent = context.agent && context.agent !== agent ? context.agent : null;
  const payload = {
    agent,
    agent_command: command,
    resumed,
    exit_code: run.status,
    started_at: startedAt,
    completed_at: completedAt,
    duration_ms: durationMs,
    token_usage: normalizedOutput.usage,
    baseline_commit: baseline.commit,
    commit: after.commit,
    baseline_uncommitted_changes: Boolean(baseline.status),
    uncommitted_changes: Boolean(after.status),
    ...(replacedAgent ? { claim_agent_replaced: replacedAgent } : {}),
    // The agent's own account of the run. Stored as reported, never promoted
    // into the state decision above.
    agent_report: { source: "agent stdout", verified: false, output: normalizedOutput.report },
  };
  try {
    withControlPlaneMutation(controlRoot, (canonicalRoot) => {
      if (replacedAgent) rewriteClaimAgent(context, agent);
      data.recordPath = appendEvent(canonicalRoot, {
        entity: id,
        task: id,
        kind: "lifecycle",
        state: `execution-${state}`,
        summary: reason ?? `Executor ${agent} completed its implementation run.`,
        payload,
      }).path;
      commitControlState(canonicalRoot, `chore(kotta): record ${state} execution for ${id}`);
    }, { requireClean: false });
  } catch (error) {
    // The run already happened. Say so, and say that it is now unrecorded —
    // this error is about finishing, never about failing to start.
    return {
      ok: false,
      command: "task execute",
      data,
      errors: [{
        code: "EXECUTION_UNRECORDED",
        message: `Execution of ${id} finished as ${state} but its record could not be written: ${errorMessage(error)}. The work exists on branch ${context.branch} in ${context.worktree} and is now unrecorded; nothing there was changed or reverted. Inspect it, then re-record by resuming with 'kotta task execute ${id} --resume'.`,
      }],
    };
  }

  if (!failure) return { ok: true, command: "task execute", data };
  return {
    ok: false,
    command: "task execute",
    data,
    errors: [{ code: failure.state === "cancelled" ? "EXECUTION_CANCELLED" : "AGENT_FAILED", message: `${failure.reason} ${contextNote}` }],
  };
}

/** Point the claim at the agent that actually ran. The claim is the resume seam. */
function rewriteClaimAgent(context: ExecutionContext, agent: string): void {
  const claim = parseYaml(readFileSync(context.claimPath, "utf8")) as Record<string, unknown>;
  claim.agent = agent;
  const errors = validateClaim(claim);
  if (errors.length) throw new Error(`Claim ${context.claimPath} would become invalid: ${errors.join(", ")}.`);
  writeFileSync(context.claimPath, stringifyYaml(claim));
}

function safeTaskState(worktree: string, id: string): string {
  try {
    return findTask(worktree, id).state;
  } catch {
    return "unknown";
  }
}

export function formatExecution(result: ExecuteResult): string {
  const data = result.data;
  const duration = data.durationMs < 1000 ? `${data.durationMs}ms` : data.durationMs < 60_000 ? `${Math.round(data.durationMs / 1000)}s` : `${Math.floor(data.durationMs / 60_000)}m ${Math.round((data.durationMs % 60_000) / 1000)}s`;
  const tokens = data.tokenUsage ? `${data.tokenUsage.total_tokens.toLocaleString("en-US")} tokens` : "tokens not recorded";
  const lines = [
    `kotta task execute ${data.id}: ${data.state}`,
    `  agent:    ${data.agent} (command: ${data.agentCommand})`,
    `  brief:    ~${data.briefTokens} tokens, ${data.briefSections} sections — the agent's only input`,
    `  run:      ${duration} · ${tokens}`,
    `  branch:   ${data.branch}`,
    `  worktree: ${data.worktree}`,
    `  context:  ${data.context === "fresh" ? "fresh (D-009 default)" : `INHERITED — ${String(data.inheritContext)}`}`,
    `  task:   ${data.taskState}${data.uncommittedChanges ? " (worktree has uncommitted changes)" : ""}`,
  ];
  if (data.briefWarning) lines.push(`  WARNING:  ${data.briefWarning}`);
  if (data.permissionWarning) lines.push(`  WARNING:  ${data.permissionWarning}`);
  if (data.state === "no-change") {
    lines.push(
      `  reason:   ${String(data.reason)}`,
      `Nothing to review: the worktree is unchanged at ${data.baselineCommit.slice(0, 12)}. Read what the agent reported in ${data.recordPath ?? "this run's execution event"}, then retry with 'kotta task execute ${data.id} --resume' or release with 'kotta claim release ${data.id} --force'.`,
    );
  } else if (result.ok) lines.push(`Next: verify the work, then 'kotta task review ${data.id} --evidence "..."'. Review stays a separate gate.`);
  else if (result.errors?.[0]?.code === "EXECUTION_UNRECORDED") lines.push(`  UNRECORDED: ${result.errors[0].message}`);
  else lines.push(`  reason:   ${String(data.reason)}`, `The claim and worktree are preserved. Retry with 'kotta task execute ${data.id} --resume' or release with 'kotta claim release ${data.id} --force'.`);
  return lines.join("\n");
}
