#!/usr/bin/env node
import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { initCommand } from "../commands/init.js";
import { openQuestions, type EntityQuestions } from "../commands/questions.js";
import { REPLACE_RULES_REMEDY, type WorkspaceAgentsState } from "../commands/agents.js";
import { validateWorkspace } from "../commands/validate.js";
import { resolveWorkspaceLocation, uiCommand } from "../commands/ui.js";
import { formatMigration, migrateWorkspace } from "../commands/migrate.js";
import { formatSpecNew, newSpecNode, type SpecNewResult } from "../commands/spec.js";
import { WorkspaceShapeError, assertCurrentWorkspaceShape, findRepositoryRoot } from "../filesystem/workspace.js";
import { mcpCommand } from "../commands/mcp.js";
import { integrateCodex } from "../commands/integrate.js";
import { doctorCommand } from "../commands/doctor.js";
import { syncCommand } from "../commands/sync.js";
import { gapReport } from "../commands/gap.js";
import { checkModules, listModules, publishSpec, renderModules, renderModulesCheck, renderPublishSpec } from "../commands/modules.js";
import { displayId } from "../core/identity.js";
import { formatPlan, planChange, type PlanResult } from "../commands/plan.js";
import { approveChange, formatApprove, type ApproveResult } from "../commands/approve.js";
import { archiveChange, formatArchive, type ArchiveResult } from "../commands/archive.js";
import { formatImport, importOpenSpec, type ImportResult } from "../commands/import.js";
import { formatNarrative, narrativeCommand, type NarrativeResult } from "../commands/narrative.js";

const program = new Command();
const packagePath = fileURLToPath(new URL("../../package.json", import.meta.url));
const packageVersion = String((JSON.parse(readFileSync(packagePath, "utf8")) as { version: unknown }).version);
program.name("kotta").description("The technical specification beside your code: forms, nodes, evidence").version(packageVersion);

function print(result: unknown, json: boolean): void {
  process.stdout.write(json ? `${JSON.stringify(result)}\n` : `${humanize(result)}\n`);
  if (typeof result === "object" && result && "ok" in result && (result as { ok: unknown }).ok === false) process.exitCode = 1;
}

type AgentsSummary = { path: string; state: WorkspaceAgentsState; discardedLines?: number } | null;
type ProjectAgentsSummary = { path: string; state: "created" | "linked" | "migrated" | "already-linked"; line: string } | null;

/** A title long enough to recognise, short enough to keep one item to one line. */
function truncate(text: string, width: number): string {
  return text.length <= width ? text : `${text.slice(0, width - 1)}…`;
}

/**
 * What happened to the rules file, and — when the project's own AGENTS.md was left alone — the exact
 * line to add, so the agent asking the human can quote it instead of inventing one.
 */
function agentsLines(agents: AgentsSummary | undefined, project: ProjectAgentsSummary | undefined, pointer: string | null | undefined): string[] {
  const lines: string[] = [];
  if (agents) {
    if (agents.state === "drifted") lines.push(`Rules: ${agents.path} was edited; it was left alone and not refreshed. ${REPLACE_RULES_REMEDY}`);
    else if (agents.state === "replaced") lines.push(`Rules: ${agents.path} was rewritten from Kotta's template; ${agents.discardedLines ?? 0} lines of local edits were discarded.`);
    else if (agents.state !== "unchanged") lines.push(`Rules: ${agents.state} ${agents.path}.`);
  }
  if (project) {
    if (project.state === "already-linked") lines.push(`${project.path} already points at the rules.`);
    else if (project.state === "migrated") lines.push(`Migrated Kotta's legacy inline rules in ${project.path} to ${project.line}; preserved the project section.`);
    else if (project.state === "created") lines.push(`The project had no AGENTS.md; Kotta created ${project.path} pointing at the rules with ${project.line}.`);
    else lines.push(`Added a Kotta section to ${project.path}, pointing at the rules with ${project.line}.`);
  } else if (agents && pointer) {
    lines.push(`Kotta did not touch the project's AGENTS.md. To point it at the rules, ask the human, then re-run with --link-agents; the line is: ${pointer}`);
  }
  return lines;
}

function renderGapReport(result: unknown): string {
  return String((result as { data: { report: unknown } }).data.report).trimEnd();
}

function renderValidate(result: unknown): string {
  const { data, warnings = [] } = result as { data: { forms: number; specNodes: number; changes?: number; changeNodes?: number }; warnings?: Array<{ code: string; message: string }> };
  const changes = data.changes ? `; ${data.changes} open change${data.changes === 1 ? "" : "s"} with ${data.changeNodes ?? 0} model node${data.changeNodes === 1 ? "" : "s"}` : "";
  return [`The specification validates: ${data.specNodes} node${data.specNodes === 1 ? "" : "s"} across ${data.forms} form${data.forms === 1 ? "" : "s"}${changes}.`, ...warnings.map((warning) => `Warning: ${warning.code}: ${warning.message}`)].join("\n");
}

function renderSync(result: unknown): string {
  const data = (result as { data: { target: unknown; created: string[]; updated: string[]; unchanged: string[]; skipped: string[]; removed: string[]; agents?: AgentsSummary; projectAgents?: ProjectAgentsSummary; pointer?: string | null } }).data;
  const changed = [
    data.created.length ? `${data.created.length} installed` : "",
    data.updated.length ? `${data.updated.length} updated` : "",
    data.unchanged.length ? `${data.unchanged.length} unchanged` : "",
  ].filter(Boolean).join(", ");
  const lines = [`Skills in ${String(data.target)}: ${changed || "none shipped"}.`];
  if (data.removed.length) lines.push(`Removed ${data.removed.length} Kotta-owned skill director${data.removed.length === 1 ? "y" : "ies"} this release no longer ships: ${data.removed.join(", ")}.`);
  // A name collision is reported, never resolved: Kotta cannot know what put the other skill
  // there, so it does not get to decide the directory is disposable.
  if (data.skipped.length) lines.push(`Left alone — another skill already uses the name: ${data.skipped.join(", ")}.`);
  lines.push(...agentsLines(data.agents, data.projectAgents, data.pointer));
  return lines.join("\n");
}

function renderInit(result: unknown): string {
  const data = (result as { data: { root: unknown; skills?: { created: string[]; updated: string[]; unchanged: string[] }; agents?: AgentsSummary; projectAgents?: ProjectAgentsSummary; pointer?: string | null } }).data;
  const installed = data.skills ? data.skills.created.length + data.skills.updated.length + data.skills.unchanged.length : 0;
  const written = ["the workspace"];
  if (data.projectAgents?.state === "created") written.push("the AGENTS.md it created for you");
  return [
    `Created workspace at ${String(data.root)}${installed ? `, and ${installed} skills are installed.` : "."}`,
    ...agentsLines(data.agents, data.projectAgents, data.pointer),
    `Nothing here is committed yet. Look it over, then commit ${written.join(" and ")}.`,
  ].join("\n");
}

function renderDoctor(result: unknown): string {
  const data = (result as { data: { invocation: string; bareName: string | null } }).data;
  return [
    `Kotta runs as: ${data.invocation}`,
    data.bareName
      ? `The name 'kotta' resolves here, to ${data.bareName}.`
      : "The name 'kotta' resolves to nothing on this PATH.",
  ].join("\n");
}

function renderIntegrate(result: unknown): string {
  const data = (result as { data: { path: unknown; changed: unknown; recorded: string | null; resolves: boolean; replacement: string | null } }).data;
  if (data.changed) return `Connected Kotta's specification tools in ${String(data.path)}.`;
  if (data.replacement) {
    return [
      `Kotta's tools are configured in ${String(data.path)}, but the command they name is gone: ${data.recorded}`,
      `This Kotta runs as ${data.replacement}. Point the [mcp_servers.kotta] block at it, or remove the block and run 'kotta integrate codex' again.`,
    ].join("\n");
  }
  return `Kotta's tools are already configured in ${String(data.path)}.`;
}

/**
 * The list to work through: the node, then its questions in the order they are written, each
 * addressed by the position that names it.
 */
function renderQuestions(result: unknown): string {
  const data = (result as { data: { entity: string | null; entities: EntityQuestions[]; total: number; open: number } }).data;
  if (!data.entities.length) {
    return data.entity
      ? `${displayId(data.entity)} asks no open question.`
      : "No specification node asks an open question.";
  }
  const lines: string[] = [];
  for (const entity of data.entities) {
    lines.push(`${displayId(entity.id)}  ${truncate(entity.title, 52)}  (${entity.form} · ${entity.open} open of ${entity.questions.length})`);
    for (const question of entity.questions) {
      const mark = question.resolved ? `answered by ${question.decisions.join(", ")}` : "open";
      lines.push(`  Q${question.position}  ${truncate(question.text, 68)}`);
      lines.push(`      ${mark} · ${entity.path}:${question.line}`);
    }
  }
  lines.push("");
  lines.push(`${data.open} open of ${data.total} across ${data.entities.length} ${data.entities.length === 1 ? "node" : "nodes"}.`);
  return lines.join("\n");
}

const renderers = new Map<string, (result: unknown) => string>();

/**
 * What failed, named, for any command at all. A result carrying errors but no registered renderer
 * used to print as a completed line; deriving the failure from the result's own errors fixes every
 * command at once, including the ones not yet written.
 */
function renderFailure(command: string, result: unknown): string {
  const errors = (result as { errors?: unknown }).errors;
  const listed = Array.isArray(errors) ? errors : [];
  if (!listed.length) return `kotta ${command} failed.`;
  const lines = listed.map((entry) => {
    const error = (entry ?? {}) as { code?: unknown; message?: unknown; path?: unknown };
    const code = error.code ? `${String(error.code)}: ` : "";
    const where = error.path ? `\n      ${String(error.path)}` : "";
    return `  ${code}${String(error.message ?? "")}${where}`;
  });
  return [`kotta ${command} failed with ${listed.length === 1 ? "1 error" : `${listed.length} errors`}:`, ...lines].join("\n");
}

function humanize(result: unknown): string {
  if (typeof result === "object" && result && "command" in result) {
    const command = String((result as { command: unknown }).command);
    const render = renderers.get(command);
    // A rendering never reports an outcome its own result denies. A renderer still runs on a failed
    // result — `kotta gap` refuses while its report is the whole point of running it — but the named
    // failure is appended either way, so the reader cannot reach the end without meeting it.
    if ((result as { ok?: unknown }).ok === false) {
      const failure = renderFailure(command, result);
      return render && command !== "validate" ? `${render(result)}\n\n${failure}` : failure;
    }
    return render ? render(result) : `kotta ${command} completed.`;
  }
  return String(result);
}

/**
 * The old shape is refused once, here, instead of in every reader. `init` has no workspace to judge
 * and `migrate` exists precisely to read the old shape. `ui` and `mcp` take a `--workspace` of their
 * own and judge that one themselves; everything else stops with a message that names `kotta migrate`.
 */
const SHAPE_EXEMPT = new Set(["init", "migrate", "ui", "mcp"]);

program.hook("preAction", (_program, action) => {
  if (SHAPE_EXEMPT.has(action.name())) return;
  try {
    assertCurrentWorkspaceShape(findRepositoryRoot());
  } catch (error) {
    // Ours by type, never by wording. Anything else thrown here — no repository, no workspace — is
    // not this hook's business and stays swallowed for the command's own error to name.
    if (!(error instanceof WorkspaceShapeError)) return;
    throw error;
  }
});

function define(signature: string, render?: (result: unknown) => string, resultCommand?: string): Command {
  const [name, ...args] = signature.split(" ");
  const command = new Command(name);
  if (args.length) command.arguments(args.join(" "));
  if (render) renderers.set(resultCommand ?? name, render);
  program.addCommand(command);
  return command;
}

define("init", renderInit)
  .description("Create a .kotta workspace: the form registry, the rules file, the skills")
  .option("--project-name <name>")
  .option("--link-agents", "Link the project's AGENTS.md to the workspace rules, migrating a recognized legacy Kotta prelude after the human said yes")
  .option("--json")
  .action((options: { projectName?: string; linkAgents?: boolean; json?: boolean }) => print(initCommand(options.projectName, { linkAgents: options.linkAgents }), Boolean(options.json)));

define("migrate")
  .description("Carry a pre-1.0 workspace to version 6: the process state into a read-only legacy/ archive, the specification untouched")
  .option("--workspace <path>", "Repository root or workspace directory; omitted uses the repository around the cwd")
  .option("--dry-run", "Report every change without writing anything")
  .option("--json")
  .action((options: { workspace?: string; dryRun?: boolean; json?: boolean }) => {
    const root = options.workspace === undefined ? undefined : resolveWorkspaceLocation(options.workspace).projectRoot;
    const result = migrateWorkspace({ dryRun: options.dryRun }, root);
    process.stdout.write(options.json ? `${JSON.stringify(result)}\n` : `${formatMigration(result)}\n`);
  });

define("validate", renderValidate)
  .description("Validate the specification: every node against its form, every edge against the node it names")
  .option("--json")
  .action((options: { json?: boolean }) => print(validateWorkspace(), Boolean(options.json)));

define("gap", renderGapReport, "gap report")
  .description("Report accepted spec promises without repository evidence and enforcement without a spec trace")
  .option("--module <name>", "Report only the promises of one module: those evidenced in it, and the interfaces naming it")
  .option("--json")
  .action((options: { module?: string; json?: boolean }) => print(gapReport(findRepositoryRoot(), { module: options.module }), Boolean(options.json)));

const modules = define("modules", renderModules)
  .description("List the modules the manifests declare; check their boundaries; publish a module's promises")
  .option("--json")
  .action((options: { json?: boolean }) => print(listModules(), Boolean(options.json)));
modules.command("check")
  .description("Check module boundaries and cross-repository references: missing interfaces, straddling nodes, references across a boundary, stale pins, drifted copies")
  .option("--json")
  // `--json` is also the parent's option, and commander hands it to whichever command declares it first.
  .action((_options: unknown, command: Command) => print(checkModules(), Boolean(command.optsWithGlobals().json)));
renderers.set("modules check", renderModulesCheck);
modules.command("publish-spec")
  .description("Copy a module's interface nodes and the rules and examples bound to them into <module>/kotta-spec/, to ship with the package")
  .argument("<module>", "A module name the manifests declare")
  .option("--json")
  .action((module: string, _options: unknown, command: Command) => print(publishSpec(module), Boolean(command.optsWithGlobals().json)));
renderers.set("modules publish-spec", renderPublishSpec);

define("questions [id]", renderQuestions)
  .description("Report the open questions a specification draft asks, or every draft's at once")
  .option("--json")
  .action((id: string | undefined, options: { json?: boolean }) => print(openQuestions(id), Boolean(options.json)));

const spec = program.command("spec").description("Draft specification nodes from the registered forms");
spec.command("new")
  .description("Mint and scaffold a specification node from its registered form")
  .argument("<form>", "A form id the workspace registry declares")
  .requiredOption("--title <title>", "What the node is called wherever a human reads it")
  .option("--into <change>", "Draft the node into a change's model delta (openspec/changes/<change>/model/) instead of the accepted specification")
  .option("--json")
  .action((form: string, options: { title: string; into?: string; json?: boolean }) => print(newSpecNode({ form, title: options.title, into: options.into }), Boolean(options.json)));
renderers.set("spec new", (result: unknown) => formatSpecNew(result as SpecNewResult));

// The planning phase: measure a change's model delta, record the one human gate, land what was approved.
define("plan <change>", (result: unknown) => formatPlan(result as PlanResult))
  .description("Measure a change's model delta against the accepted model and write its planning.md: structure, conflicts, silences, drift, provenance")
  .option("--json")
  .action((change: string, options: { json?: boolean }) => print(planChange(change), Boolean(options.json)));

define("approve <change>", (result: unknown) => formatApprove(result as ApproveResult))
  .description("Record the human's yes to a planned change's model delta: the one gate, written as approval.yaml")
  .requiredOption("--by <who>", "The human who said yes in the conversation")
  .option("--json")
  .action((change: string, options: { by: string; json?: boolean }) => print(approveChange(change, options.by), Boolean(options.json)));

define("archive <change>", (result: unknown) => formatArchive(result as ArchiveResult))
  .description("Land an approved change: merge its model into the specification, regenerate the narrative, move it to the archive")
  .option("--json")
  .action((change: string, options: { json?: boolean }) => print(archiveChange(change), Boolean(options.json)));

// Taking an existing narrative in: drafts through the planning phase, never a direct translation.
const importCommand = program.command("import").description("Take an existing specification into the technical model through the planning phase");
importCommand.command("openspec")
  .description("Draft an OpenSpec project's requirements, scenarios and purposes into a change's model, for the planning phase to complete")
  .option("--change <name>", "The change to open under openspec/changes/; omitted is import-openspec-<date>")
  .option("--json")
  .action((options: { change?: string; json?: boolean }) => print(importOpenSpec({ change: options.change }), Boolean(options.json)));
renderers.set("import openspec", (result: unknown) => formatImport(result as ImportResult));
define("narrative <change>", (result: unknown) => formatNarrative(result as NarrativeResult))
  .description("Distil an agent session log into the change's conversation.md: intent, proposals with the human's answers, paths turned down, questions")
  .requiredOption("--from <path>", "A Claude Code or Codex session log (.jsonl), or a directory of them")
  .option("--since <time>", "Only messages at or after this ISO 8601 time")
  .option("--json")
  .action((change: string, options: { from: string; since?: string; json?: boolean }) => print(narrativeCommand(change, { from: options.from, since: options.since }), Boolean(options.json)));

define("sync", renderSync)
  .description("Install the skills Kotta ships, add newly shipped forms, and refresh the workspace rules file")
  .option("--link-agents", "Link the project's AGENTS.md to the workspace rules, migrating a recognized legacy Kotta prelude after the human said yes")
  .option("--replace-rules", "Discard local edits to the workspace rules file and take Kotta's copy; without this an edited file is never replaced")
  .option("--json")
  .action((options: { linkAgents?: boolean; replaceRules?: boolean; json?: boolean }) => print(syncCommand({ linkAgents: options.linkAgents, replaceRules: options.replaceRules }), Boolean(options.json)));

define("doctor", renderDoctor)
  .description("Report whether Kotta is reachable from where its work happens")
  .option("--json")
  .action((options: { json?: boolean }) => print(doctorCommand(), Boolean(options.json)));

define("integrate", renderIntegrate, "integrate codex")
  .description("Connect Kotta's specification tools to a calling agent host")
  .argument("<host>", "Supported host: codex")
  .option("--json")
  .action((host: string, options: { json?: boolean }) => {
    if (host !== "codex") throw new Error(`Unsupported host '${host}'. Supported host: codex.`);
    print(integrateCodex(), Boolean(options.json));
  });

define("mcp")
  .description("Serve Kotta's read-only specification tools to the calling chat over stdio MCP")
  .option("--workspace <path>", "Repository root or linked worktree", ".")
  .action(async (options: { workspace: string }) => {
    await mcpCommand(options.workspace);
  });

define("ui")
  .description("Serve the local read-only board of the specification")
  .option("--workspace <path>", "Repository root or workspace directory", ".")
  .option("--port <port>", "Local port; omitted starts at 4311 and advances to the next free port")
  .option("--host <host>", "Bind host", "127.0.0.1")
  .option("--no-open", "Print the URL without opening it in the default browser")
  .option("--json")
  .action(async (options: { workspace: string; port?: string; host: string; open: boolean; json?: boolean }) => {
    await uiCommand({ workspace: options.workspace, port: options.port === undefined ? undefined : Number(options.port), host: options.host, json: options.json, open: options.open });
  });

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
