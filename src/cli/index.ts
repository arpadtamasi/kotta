#!/usr/bin/env node
import { Command } from "commander";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initCommand } from "../commands/init.js";
import { expandOperations } from "../core/operations.js";
import { briefTask, cancelTask, closeTask, defineTask, newTask, signTask, reopenTask, reviewTask, startTask, validateTask } from "../commands/task.js";
import { executeTask, formatExecution } from "../commands/execute.js";
import { statusCommand } from "../commands/status.js";
import { newObservation, resolveObservation, validateObservation } from "../commands/observation.js";
import { closeBatch, finalizeBatch, newBatch, batchStatus, signBatch, startBatch, updateBatchTasks, validateBatch } from "../commands/batch.js";
import { validateWorkspace } from "../commands/validate.js";
import { listClaims, releaseClaim } from "../commands/claim.js";
import { formatList, listCommand, type ListResult } from "../commands/list.js";
import { formatShow, showCommand, type ShowResult } from "../commands/show.js";
import { canonicalEntityId, type ListableEntity } from "../filesystem/entities.js";
import { resolveWorkspaceLocation, uiCommand } from "../commands/ui.js";
import { createDecision } from "../commands/decision.js";
import { formatMigration, migrateWorkspace } from "../commands/migrate.js";
import { assertCurrentWorkspaceShape, findRepositoryRoot } from "../filesystem/workspace.js";
import { commitControlState, controlPlaneRoot, withControlPlaneMutation } from "../git/control-plane.js";
import { mcpCommand } from "../commands/mcp.js";
import { integrateCodex } from "../commands/integrate.js";
import { syncCommand } from "../commands/sync.js";
import { gapReport } from "../commands/gap.js";

const program = new Command();
const packagePath = fileURLToPath(new URL("../../package.json", import.meta.url));
const packageVersion = String((JSON.parse(readFileSync(packagePath, "utf8")) as { version: unknown }).version);
program.name("kotta").description("Repository-native human-AI development workflow").version(packageVersion);

function print(result: unknown, json: boolean): void {
  process.stdout.write(json ? `${JSON.stringify(result)}\n` : `${humanize(result)}\n`);
  if (typeof result === "object" && result && "ok" in result && (result as { ok: unknown }).ok === false) process.exitCode = 1;
}

type AgentsSummary = { path: string; state: "created" | "updated" | "unchanged" | "drifted" } | null;
type ProjectAgentsSummary = { path: string; state: "created" | "linked" | "migrated" | "already-linked"; line: string } | null;

/**
 * What happened to the rules file, and — when the project's own AGENTS.md was left alone — the exact
 * line to add, so the agent asking the human can quote it instead of inventing one.
 */
function agentsLines(agents: AgentsSummary | undefined, project: ProjectAgentsSummary | undefined, pointer: string | null | undefined): string[] {
  const lines: string[] = [];
  if (agents) {
    if (agents.state === "drifted") lines.push(`Rules: ${agents.path} was edited; it was left alone and not refreshed.`);
    else if (agents.state !== "unchanged") lines.push(`Rules: ${agents.state} ${agents.path}.`);
  }
  if (project) {
    if (project.state === "already-linked") lines.push(`${project.path} already points at the rules.`);
    else if (project.state === "migrated") lines.push(`Migrated Kotta's legacy inline rules in ${project.path} to ${project.line}; preserved the project section.`);
    else lines.push(`Added one line to ${project.path}: ${project.line}`);
  } else if (agents && pointer) {
    lines.push(`Kotta did not touch the project's AGENTS.md. To point it at the rules, ask the human, then re-run with --link-agents; the line is: ${pointer}`);
  }
  return lines;
}

function humanize(result: unknown): string {
  if (typeof result === "object" && result && "command" in result) {
    const command = String((result as { command: unknown }).command);
    if (command === "gap report" && "data" in result) {
      return String((result as { data: { report: unknown } }).data.report).trimEnd();
    }
    if (command === "task start" && "data" in result) {
      const data = (result as { data: { id: unknown; branch: unknown; worktree: unknown; startRef: unknown; startCommit: unknown; nextStep: unknown; executionMode?: unknown; callerStep?: unknown } }).data;
      return [
        `Started ${String(data.id)} from ${String(data.startRef)} at ${String(data.startCommit)}: branch ${String(data.branch)}, worktree ${String(data.worktree)}.`,
        data.executionMode === "inherited"
          ? `Execution mode: inherited context — ${String(data.callerStep)}`
          : `Next: run the task in a fresh agent context (D-009) — ${String(data.nextStep)}.`,
        `'kotta task execute <id> --agent <agent>' does start, brief and agent launch in one command.`,
      ].join("\n");
    }
    if (command === "batch start" && "data" in result) {
      const data = (result as { data: { id: unknown; starts: Array<{ id: unknown; startRef: unknown; startCommit: unknown }>; waiting: unknown[]; failures: Array<{ id: unknown; message: unknown }>; coordinator: { branch: unknown; commit: unknown } } }).data;
      const lines = [`Batch ${String(data.id)} coordinator ${String(data.coordinator.branch)} at ${String(data.coordinator.commit)}.`];
      for (const start of data.starts) lines.push(`Started ${String(start.id)} from ${String(start.startRef)} at ${String(start.startCommit)}.`);
      for (const failure of data.failures) lines.push(`Failed ${String(failure.id)}: ${String(failure.message)}`);
      if (data.waiting.length) lines.push(`Waiting: ${data.waiting.map(String).join(", ")}.`);
      if (!data.starts.length && !data.waiting.length) lines.push("No tasks were dispatched; every member is done.");
      return lines.join("\n");
    }
    if (command.endsWith(" list") && "data" in result && "entity" in (result as { data: Record<string, unknown> }).data) {
      return formatList(result as ListResult);
    }
    if (command.endsWith(" show") && "data" in result && "body" in (result as { data: Record<string, unknown> }).data) {
      return formatShow(result as ShowResult);
    }
    if (command === "task new" && "data" in result) {
      const data = (result as { data: { id: unknown; path: unknown } }).data;
      return `Created task ${String(data.id)} at ${String(data.path)}.`;
    }
    if (command === "status" && "data" in result) {
      // The workspace path leads: with `.kotta/` and `.a-team/` both readable, the directory that
      // answered is the first thing a reader needs (D-007).
      const data = (result as { data: { workspace: unknown; definedTasks: unknown[]; activeTasks: unknown[]; reviewTasks: unknown[]; newObservations: unknown[]; skills?: { shipped: number; installed: number; drifted: string[] }; rules?: { present: boolean; drifted: boolean; path: string }; controlPlane?: { mode: string; branch: string | null } } }).data;
      const lines = [
        `Workspace: ${String(data.workspace)}`,
        `Defined ${data.definedTasks.length}, active ${data.activeTasks.length}, review ${data.reviewTasks.length}, new observations ${data.newObservations.length}.`,
      ];
      // Absent skills and stale skills fail the same way — silently — so both are named here,
      // with the one command that fixes either.
      if (data.skills && data.skills.installed === 0 && data.skills.shipped > 0) {
        lines.push(`Skills: none installed of ${data.skills.shipped} shipped. Run 'kotta sync'.`);
      } else if (data.skills && data.skills.drifted.length) {
        lines.push(`Skills: ${data.skills.drifted.join(", ")} differ from the shipped version. Run 'kotta sync'.`);
      }
      // The rules an agent reads are as silent a failure as an absent skill: an old copy still
      // parses, and nothing else in the workspace would notice it moved.
      if (data.rules && !data.rules.present) lines.push(`Rules: ${data.rules.path} is missing. Run 'kotta sync'.`);
      else if (data.rules && data.rules.drifted) lines.push(`Rules: ${data.rules.path} differs from the shipped version.`);
      // Which checkout answered, and why that one: a command that silently picks a writer the
      // reader did not expect is the failure the single-checkout rule has to stay visible about.
      if (data.controlPlane?.mode === "single") lines.push(`Control plane: this checkout, the only one, on ${data.controlPlane.branch ?? "a detached HEAD"}.`);
      return lines.join("\n");
    }
    if ((result as { command: unknown }).command === "decision create" && "data" in result) {
      const data = (result as { data: { id: unknown; path: unknown } }).data;
      return `Recorded decision ${String(data.id)} at ${String(data.path)}.`;
    }
    if (command === "sync" && "data" in result) {
      const data = (result as { data: { target: unknown; created: string[]; updated: string[]; unchanged: string[]; skipped: string[]; removed: string[]; agents?: AgentsSummary; projectAgents?: ProjectAgentsSummary; pointer?: string | null } }).data;
      const changed = [
        data.created.length ? `${data.created.length} installed` : "",
        data.updated.length ? `${data.updated.length} updated` : "",
        data.unchanged.length ? `${data.unchanged.length} unchanged` : "",
      ].filter(Boolean).join(", ");
      const lines = [`Skills in ${String(data.target)}: ${changed || "none shipped"}.`];
      if (data.removed.length) lines.push(`Removed ${data.removed.length} deprecated Kotta-owned skill director${data.removed.length === 1 ? "y" : "ies"}: ${data.removed.join(", ")}.`);
      // A name collision is reported, never resolved: Kotta cannot know what put the other skill
      // there, so it does not get to decide the directory is disposable.
      if (data.skipped.length) lines.push(`Left alone — another skill already uses the name: ${data.skipped.join(", ")}.`);
      lines.push(...agentsLines(data.agents, data.projectAgents, data.pointer));
      return lines.join("\n");
    }
    if (command === "init" && "data" in result) {
      const data = (result as { data: { root: unknown; skills?: { created: string[]; updated: string[]; unchanged: string[] }; agents?: AgentsSummary; projectAgents?: ProjectAgentsSummary; pointer?: string | null } }).data;
      const installed = data.skills ? data.skills.created.length + data.skills.updated.length + data.skills.unchanged.length : 0;
      return [
        `Created workspace at ${String(data.root)}${installed ? `, and ${installed} skills are installed.` : "."}`,
        ...agentsLines(data.agents, data.projectAgents, data.pointer),
      ].join("\n");
    }
    if (command === "integrate codex" && "data" in result) {
      const data = (result as { data: { path: unknown; changed: unknown } }).data;
      return data.changed ? `Connected Kotta caller-chat tools in ${String(data.path)}.` : `Kotta caller-chat tools are already configured in ${String(data.path)}.`;
    }
    return `kotta ${String((result as { command: unknown }).command)} completed.`;
  }
  return String(result);
}

/**
 * The old shape is refused once, here, instead of in every reader. `init` has no workspace to judge,
 * `migrate` exists precisely to read the old shape, and `ui` explains the gap on the board rather than
 * refusing to start — everything else stops with a message that names `kotta migrate`.
 */
const SHAPE_EXEMPT = new Set(["init", "migrate", "ui", "mcp"]);

/**
 * The shape that decides is the workspace the command will actually read and write — the control
 * plane — not the checkout the command was typed in. An implementation worktree keeps the baseline
 * `.kotta/` it branched from and routes every state change back to the control worktree, so judging
 * the caller's copy refused commands over a workspace they never touch: after the control plane
 * migrated, every worktree started before it was bricked. A caller that cannot resolve a control
 * plane falls back to itself, which is also what `resolveControlPlane` returns for a single checkout.
 */
function shapeJudgementRoot(caller: string): string {
  try {
    return controlPlaneRoot(caller);
  } catch {
    return caller;
  }
}

/**
 * Which entity an id argument belongs to, by the command group it was typed under.
 * Claims are keyed by the task they belong to, so they resolve as tasks.
 */
const ID_ENTITY: Record<string, ListableEntity> = {
  task: "task",
  observation: "observation",
  decision: "decision",
  batch: "batch",
  claim: "task",
};

/**
 * The id the CLI printed is the id the CLI accepts. `displayId` shows a minted id by
 * its short form everywhere — listings, status, human output — so the short form is
 * resolved here, once, for every command that takes one, rather than in each of them.
 * Services below this line always receive the full id and never learn the difference.
 */
function normaliseIdArgument(action: { parent?: { name(): string } | null; processedArgs?: unknown[] }): void {
  const group = action.parent?.name();
  const entity = group ? ID_ENTITY[group] : undefined;
  const given = action.processedArgs?.[0];
  if (!entity || typeof given !== "string" || !given.trim()) return;
  try {
    action.processedArgs![0] = canonicalEntityId(findRepositoryRoot(), entity, given);
  } catch (error) {
    // An ambiguous short form is the operator's decision and must surface; anything
    // else — no workspace, no repository — is left to the command's own error.
    if (error instanceof Error && error.message.includes("ambiguous")) throw error;
  }
}

program.hook("preAction", (_program, action) => {
  const names = [action.name(), action.parent?.name()].filter(Boolean) as string[];
  if (names.some((name) => SHAPE_EXEMPT.has(name))) return;
  try {
    assertCurrentWorkspaceShape(shapeJudgementRoot(findRepositoryRoot()));
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("kotta migrate")) return; // no repository, no workspace: not our refusal
    throw error;
  }
  normaliseIdArgument(action as unknown as Parameters<typeof normaliseIdArgument>[0]);
});

/**
 * One operation, one declaration (BR-01m0nsyasfnjc9s4073r8zb33j): every command below is built
 * here and attached by the declaration, so the terminal cannot carry a command no operation names,
 * and cannot silently drop one it does. Groups are containers, not operations: each takes the
 * position of its first declared member, which is what keeps `--help` in its published order.
 */
const GROUP_DESCRIPTIONS: Record<string, string> = {
  task: "Create and transition tasks",
  observation: "Capture and disposition observations",
  decision: "Record durable human decisions",
  batch: "Validate and execute coordinated batches",
  claim: "Inspect and recover execution claims",
};

const builtCommands = new Map<string, Command>();

/** Builds one command under `group`, from the same signature commander took before. */
function defineCommand(group: string | null, signature: string): Command {
  const [name, ...args] = signature.split(" ");
  const path = [...(group ? [group] : []), name].join(" ");
  if (builtCommands.has(path)) throw new Error(`CLI command '${path}' is built twice.`);
  const command = new Command(name);
  if (args.length) command.arguments(args.join(" "));
  builtCommands.set(path, command);
  return command;
}

/** Attaches every built command where the declaration says it belongs. */
function attachDeclaredCommands(): void {
  const attachedGroups = new Map<string, Command>();
  for (const operation of expandOperations()) {
    if (!operation.cli) continue;
    const path = operation.cli.join(" ");
    const command = builtCommands.get(path);
    if (!command) throw new Error(`Operation ${operation.id} declares the CLI command '${path}', which this binary does not build.`);
    builtCommands.delete(path);
    if (operation.cli.length === 1) {
      program.addCommand(command);
      continue;
    }
    const [groupName] = operation.cli;
    let group = attachedGroups.get(groupName);
    if (!group) {
      const description = GROUP_DESCRIPTIONS[groupName];
      if (!description) throw new Error(`CLI group '${groupName}' has no description.`);
      group = program.command(groupName).description(description);
      attachedGroups.set(groupName, group);
    }
    group.addCommand(command);
  }
  if (builtCommands.size) throw new Error(`This binary builds CLI commands no operation declares: ${[...builtCommands.keys()].sort().join(", ")}.`);
}

defineCommand(null, "migrate")
  .description("Carry a legacy or flat workspace into the spec/ and process/ namespaces")
  .option("--workspace <path>", "Repository root or workspace directory; omitted uses the repository around the cwd")
  .option("--dry-run", "Report every change without writing anything")
  .option("--json")
  .action((options: { workspace?: string; dryRun?: boolean; json?: boolean }) => {
    const root = options.workspace === undefined ? undefined : resolveWorkspaceLocation(options.workspace).projectRoot;
    const result = migrateWorkspace({ dryRun: options.dryRun }, root);
    process.stdout.write(options.json ? `${JSON.stringify(result)}\n` : `${formatMigration(result)}\n`);
  });

defineCommand(null, "init")
  .description("Create a .kotta workspace")
  .option("--project-name <name>")
  .option("--link-agents", "Link the project's AGENTS.md to the workspace rules, migrating a recognized legacy Kotta prelude after the human said yes")
  .option("--json")
  .action((options: { projectName?: string; linkAgents?: boolean; json?: boolean }) => print(initCommand(options.projectName, { linkAgents: options.linkAgents }), Boolean(options.json)));

defineCommand(null, "validate")
  .description("Validate the Kotta workspace")
  .option("--json")
  .action((options: { json?: boolean }) => print(validateWorkspace(), Boolean(options.json)));

defineCommand(null, "status")
  .description("Show canonical workspace status")
  .option("--json")
  .action((options: { json?: boolean }) => print(statusCommand(), Boolean(options.json)));

defineCommand(null, "gap")
  .description("Report accepted spec promises without repository evidence and enforcement without a spec trace")
  .option("--json")
  .action((options: { json?: boolean }) => print(gapReport(findRepositoryRoot()), Boolean(options.json)));

defineCommand(null, "sync")
  .description("Install the skills Kotta ships and refresh the workspace rules file")
  .option("--link-agents", "Link the project's AGENTS.md to the workspace rules, migrating a recognized legacy Kotta prelude after the human said yes")
  .option("--json")
  .action((options: { linkAgents?: boolean; json?: boolean }) => print(syncCommand({ linkAgents: options.linkAgents }), Boolean(options.json)));

defineCommand("task", "list")
  .description("List tasks with their state and title")
  .option("--state <state...>", "Narrow to one or more states")
  .option("--json")
  .action((options: { state?: string[]; json?: boolean }) => print(listCommand("task", { state: options.state }), Boolean(options.json)));
defineCommand("task", "show <id>")
  .description("Show one task: its state, its set facts and its body")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(showCommand("task", id), Boolean(options.json)));
defineCommand("task", "new")
  .requiredOption("--title <title>")
  .requiredOption("--type <type>")
  .option("--profile <profile...>", "Requirement profiles", [])
  .option("--json")
  .action((options: { title: string; type: string; profile: string[]; json?: boolean }) => print(newTask({ title: options.title, type: options.type, profiles: options.profile }), Boolean(options.json)));
defineCommand("task", "validate <id>")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(validateTask(id), Boolean(options.json)));
defineCommand("task", "define <id>")
  .requiredOption("--from <path>", "Markdown definition file")
  .option("--draft", "Store or amend a backlog capture without the coverage check; the task stays in backlog")
  .option("--json")
  .action((id: string, options: { from: string; draft?: boolean; json?: boolean }) => {
    const sourcePath = resolve(options.from);
    if (!existsSync(sourcePath)) throw new Error(`Task definition was not found: ${sourcePath}`);
    const definition = readFileSync(sourcePath, "utf8");
    const result = withControlPlaneMutation(findRepositoryRoot(), (root) => {
      const defined = defineTask(id, definition, root, { draft: Boolean(options.draft) });
      commitControlState(root, `chore(kotta): ${options.draft ? "draft" : "define"} ${id}`);
      return defined;
    }, { requireClean: false });
    print(result, Boolean(options.json));
  });
// Accepted-spec coverage normally makes define the backlog -> defined transition. This command
// remains only for workspaces that deliberately retain the compatibility gate.
defineCommand("task", "sign <id>")
  .description("Opt-in compatibility gate: sign a covered backlog task, moving it to defined")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(signTask(id, Boolean(options.approve)), Boolean(options.json)));
defineCommand("task", "start <id>")
  .requiredOption("--agent <agent>")
  .option("--caller", "Let the current caller execute inside the new worktree with inherited context")
  .option("--json")
  .action((id: string, options: { agent: string; caller?: boolean; json?: boolean }) => print(startTask(id, options.agent, options.caller ? "inherited" : "fresh"), Boolean(options.json)));
defineCommand("task", "execute <id>")
  .description("Run a defined task in a fresh agent context: start, brief and agent launch in one command (D-009)")
  .option("--agent <agent>", "Agent to launch; required unless --resume reuses the claim's agent")
  .option("--resume", "Reuse the existing execution context instead of creating a second one")
  .option("--inherit-context <reason>", "Explicit, logged exception to the fresh-context default; a reason is required")
  .option("--json")
  .action(async (id: string, options: { agent?: string; resume?: boolean; inheritContext?: string; json?: boolean }) => {
    const result = await executeTask(id, { agent: options.agent, resume: options.resume, inheritContext: options.inheritContext });
    process.stdout.write(options.json ? `${JSON.stringify(result)}\n` : `${formatExecution(result)}\n`);
    if (!result.ok) process.exitCode = 1;
  });
defineCommand("task", "review <id>")
  .requiredOption("--evidence <evidence>", "Evidence text, or repeat '<exact check>=<evidence>' for a named mapping", (value: string, previous: string[]) => [...previous, value], [])
  .option("--pull-request <identifier>")
  .option("--deviations <text>", "Declared deviations from the task; omitted means 'Not declared.'")
  .option("--observations-created <text>", "Observations created during execution; omitted means 'Not declared.'")
  .option("--known-concerns <text>", "Known concerns left open; omitted means 'Not declared.'")
  .option("--json")
  .action((id: string, options: { evidence: string[]; pullRequest?: string; deviations?: string; observationsCreated?: string; knownConcerns?: string; json?: boolean }) => print(reviewTask(id, options.evidence, options.pullRequest, { deviations: options.deviations, observationsCreated: options.observationsCreated, knownConcerns: options.knownConcerns }), Boolean(options.json)));
defineCommand("task", "close <id>")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(closeTask(id, Boolean(options.approve)), Boolean(options.json)));
defineCommand("task", "cancel <id>")
  .description("Retire a live task into done with a non-completed resolution, from any state before done")
  .requiredOption("--resolution <resolution>", "duplicate | obsolete | cancelled")
  .requiredOption("--reason <reason>", "Why this work is being retired")
  .option("--superseded-by <id>", "The task or decision that took this work's place; required for duplicate and obsolete")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { resolution: string; reason: string; supersededBy?: string; approve?: boolean; json?: boolean }) =>
    print(cancelTask(id, options.resolution, options.reason, Boolean(options.approve), undefined, { supersededBy: options.supersededBy }), Boolean(options.json)));
defineCommand("task", "brief <id>")
  .description("Assemble the minimal execution context for a task (D-009)")
  .option("--out <path>", "Write the brief to a file instead of stdout")
  .option("--warn-tokens <count>", "Warn above this approximate token count", (value) => Number(value), 12000)
  .option("--json")
  .action((id: string, options: { out?: string; warnTokens: number; json?: boolean }) => {
    const result = briefTask(id, { out: options.out, warnTokens: options.warnTokens });
    if (options.json) {
      console.log(JSON.stringify(result));
      return;
    }
    if (!options.out) process.stdout.write(result.data.brief);
    const summary = `brief ${id}: ~${result.data.tokens} tokens (${result.data.sections.length} sections)${result.data.path ? ` → ${result.data.path}` : ""}`;
    console.error(result.data.warning ? `${summary}\nWARNING: ${result.data.warning}` : summary);
  });
defineCommand("task", "reopen <id>")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(reopenTask(id, Boolean(options.approve)), Boolean(options.json)));

defineCommand("observation", "list")
  .description("List observations with their state and title")
  .option("--state <state...>", "Narrow to one or more states")
  .option("--json")
  .action((options: { state?: string[]; json?: boolean }) => print(listCommand("observation", { state: options.state }), Boolean(options.json)));
defineCommand("observation", "show <id>")
  .description("Show one observation: its state, its set facts and its body")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(showCommand("observation", id), Boolean(options.json)));
defineCommand("observation", "new")
  .requiredOption("--title <title>")
  .requiredOption("--type <type>")
  .requiredOption("--evidence <evidence>")
  .option("--discovered-during <task>")
  .option("--json")
  .action((options: { title: string; type: string; evidence: string; discoveredDuring?: string; json?: boolean }) => print(newObservation(options), Boolean(options.json)));
defineCommand("observation", "validate <id>")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(validateObservation(id), Boolean(options.json)));
defineCommand("observation", "resolve <id>")
  .requiredOption("--disposition <disposition>")
  .option("--spec <spec...>", "Specification nodes the amendment touched (amend-spec only)")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { disposition: string; spec?: string[]; approve?: boolean; json?: boolean }) => print(resolveObservation(id, options.disposition, Boolean(options.approve), undefined, { spec: options.spec }), Boolean(options.json)));

defineCommand("decision", "list")
  .description("List decisions with their state and title")
  // Accepted so the refusal can say why decisions have no states, rather than
  // commander answering "unknown option" and leaving the reason unstated.
  .option("--state <state...>", "Not applicable to decisions; refused with the reason")
  .option("--json")
  .action((options: { state?: string[]; json?: boolean }) => print(listCommand("decision", { state: options.state }), Boolean(options.json)));
defineCommand("decision", "show <id>")
  .description("Show one decision: its state, its set facts and its body")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(showCommand("decision", id), Boolean(options.json)));
defineCommand("decision", "create")
  .description("Validate and atomically record a durable decision")
  .requiredOption("--from <path>", "Markdown decision source")
  .option("--id <id>", "Stable decision identifier (for example D-001)")
  .option("--approve", "Confirm the human-owned decision and consequences")
  .option("--json")
  .action((options: { from: string; id?: string; approve?: boolean; json?: boolean }) =>
    print(createDecision({ from: options.from, id: options.id, approved: Boolean(options.approve) }), Boolean(options.json)));

defineCommand("batch", "list")
  .description("List batches with their state and title")
  .option("--state <state...>", "Narrow to one or more states")
  .option("--json")
  .action((options: { state?: string[]; json?: boolean }) => print(listCommand("batch", { state: options.state }), Boolean(options.json)));
defineCommand("batch", "show <id>")
  .description("Show one batch: its state, its set facts and its body")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(showCommand("batch", id), Boolean(options.json)));
defineCommand("batch", "new")
  .requiredOption("--title <title>")
  .option("--goal <goal>")
  .option("--parallelism <count>", "Maximum concurrent tasks", (value) => Number(value), 2)
  .option("--json")
  .action((options: { title: string; goal?: string; parallelism: number; json?: boolean }) => print(newBatch(options), Boolean(options.json)));
defineCommand("batch", "add <batch-id> <member-id>")
  .description("Add a task, or another batch to group under this one")
  .option("--json")
  .action((batchId: string, memberId: string, options: { json?: boolean }) => print(updateBatchTasks(batchId, memberId, "add"), Boolean(options.json)));
defineCommand("batch", "remove <batch-id> <member-id>")
  .description("Remove a member task, or a grouped child batch")
  .option("--json")
  .action((batchId: string, memberId: string, options: { json?: boolean }) => print(updateBatchTasks(batchId, memberId, "remove"), Boolean(options.json)));
defineCommand("batch", "validate <id>")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(validateBatch(id), Boolean(options.json)));
defineCommand("batch", "sign <id>")
  .description("Human gate: sign a validated backlog batch, moving it to defined")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(signBatch(id, Boolean(options.approve)), Boolean(options.json)));
defineCommand("batch", "start <id>")
  .requiredOption("--agent <agent>")
  .option("--json")
  .action((id: string, options: { agent: string; json?: boolean }) => print(startBatch(id, options.agent), Boolean(options.json)));
defineCommand("batch", "status <id>")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(batchStatus(id), Boolean(options.json)));
defineCommand("batch", "close <id>")
  .description("Complete a batch whose member tasks have all reached done, from any batch state")
  .option("--approve")
  .option("--json")
  .action((id: string, options: { approve?: boolean; json?: boolean }) => print(closeBatch(id, Boolean(options.approve)), Boolean(options.json)));
defineCommand("batch", "finalize <id>")
  .description("Clean up the coordinator branch of a done batch after its integration is proven")
  .option("--json")
  .action((id: string, options: { json?: boolean }) => print(finalizeBatch(id), Boolean(options.json)));

defineCommand("claim", "list")
  .option("--json")
  .action((options: { json?: boolean }) => print(listClaims(), Boolean(options.json)));
defineCommand("claim", "release <id>")
  .option("--force")
  .option("--json")
  .action((id: string, options: { force?: boolean; json?: boolean }) => print(releaseClaim(id, Boolean(options.force)), Boolean(options.json)));

defineCommand(null, "integrate")
  .description("Connect Kotta to a calling agent host")
  .argument("<host>", "Supported host: codex")
  .option("--json")
  .action((host: string, options: { json?: boolean }) => {
    if (host !== "codex") throw new Error(`Unsupported host '${host}'. Supported host: codex.`);
    print(integrateCodex(), Boolean(options.json));
  });

defineCommand(null, "mcp")
  .description("Serve Kotta tools to the calling chat over stdio MCP")
  .option("--workspace <path>", "Repository root or linked worktree", ".")
  .action(async (options: { workspace: string }) => {
    await mcpCommand(options.workspace);
  });

defineCommand(null, "ui")
  .description("Serve the local filesystem-backed Kotta board")
  .option("--workspace <path>", "Repository root or workspace directory", ".")
  .option("--port <port>", "Local port; omitted starts at 4311 and advances to the next free port")
  .option("--host <host>", "Bind host", "127.0.0.1")
  .option("--no-open", "Print the URL without opening it in the default browser")
  .option("--json")
  .action(async (options: { workspace: string; port?: string; host: string; open: boolean; json?: boolean }) => {
    await uiCommand({ workspace: options.workspace, port: options.port === undefined ? undefined : Number(options.port), host: options.host, json: options.json, open: options.open });
  });

attachDeclaredCommands();

program.configureOutput({ outputError: (message) => process.stderr.write(message) });

try {
  await program.parseAsync();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  const json = process.argv.includes("--json");
  if (json) process.stdout.write(`${JSON.stringify({ ok: false, errors: [{ code: "COMMAND_FAILED", message }] })}\n`);
  else process.stderr.write(`Error: ${message}\n`);
  process.exitCode = 1;
}
