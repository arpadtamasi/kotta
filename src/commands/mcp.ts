import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

/** The server reports the version it actually is: a literal here said 0.5.0 for two releases. */
const packageVersion = String((JSON.parse(readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8")) as { version: unknown }).version);
import { APPROVAL_ACTIONS, approvalDescription, approvalDetail, approvalEntity, decideApproval, failApproval, proposeApproval, type ApprovalAction, type ApprovalDecision } from "./approval.js";
import { recordTaskMessage } from "./conversation.js";
import { briefTask, defineTask, newTask, reviewTask, startTask, validateTask } from "./task.js";
import { newObservation } from "./observation.js";
import { statusCommand } from "./status.js";
import { sweep } from "./sweep.js";
import { openQuestions } from "./questions.js";
import { listCommand } from "./list.js";
import { showCommand } from "./show.js";
import { OBSERVATION_ORIGINS, entityStates, entityTitleById } from "../filesystem/entities.js";
import { named } from "../core/naming.js";
import { readEvents } from "../core/events.js";
import { assertCurrentWorkspaceShape, findRepositoryRoot } from "../filesystem/workspace.js";
import { commitControlState, controlPlaneRoot, withControlPlaneMutation } from "../git/control-plane.js";
import { gapReport } from "./gap.js";
import { expandOperations } from "../core/operations.js";

type ToolPayload = Record<string, unknown>;

function toolResult(payload: ToolPayload, summary: string) {
  return {
    structuredContent: payload,
    content: [{ type: "text" as const, text: summary }],
  };
}

function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    structuredContent: { ok: false, error: message },
    content: [{ type: "text" as const, text: message }],
  };
}

const readOnly = { readOnlyHint: true, destructiveHint: false, openWorldHint: false, idempotentHint: true };
const localWrite = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };

export function createKottaMcpServer(repositoryRoot?: string): McpServer {
  const root = findRepositoryRoot(repositoryRoot ? resolve(repositoryRoot) : process.cwd());
  assertCurrentWorkspaceShape(root);
  const server = new McpServer(
    { name: "kotta", version: packageVersion },
    {
      instructions: [
        "Kotta is the canonical task control plane for this repository.",
        "Use these structured tools instead of asking the human to copy ids or run lifecycle commands.",
        "Caller execution uses task_start_caller; fresh context remains available through the CLI for automation.",
        // Derived, not retyped: this sentence was a fourth copy of the gating knowledge, and it
        // said five actions while APPROVAL_ACTIONS held six.
        `For ${APPROVAL_ACTIONS.join(", ")}, call approval_request: it elicits the exact human decision in the host chat and records the receipt before applying.`,
        "The Kotta board is read-only. Record only visible user/assistant task messages; never hidden reasoning or raw tool output.",
      ].join(" "),
    },
  );

  // One operation, one declaration (BR-01m0nsyasfnjc9s4073r8zb33j): the tools below are built
  // here but registered by the declaration below, so this server cannot carry a tool no operation
  // names, and cannot silently omit one it does.
  const built = new Map<string, { definition: unknown; handler: unknown }>();
  // Same signature as registerTool, so every definition below keeps inferring its handler's
  // arguments from its own input schema; only the storage is deferred.
  const define = ((name: string, definition: unknown, handler: unknown) => {
    if (built.has(name)) throw new Error(`MCP tool '${name}' is built twice.`);
    built.set(name, { definition, handler });
  }) as unknown as McpServer["registerTool"];

  define("workspace_status", {
    title: "Read Kotta workspace status",
    description: "Read canonical task and observation state before deciding what Kotta action is needed.",
    inputSchema: {},
    annotations: readOnly,
  }, async () => {
    try {
      const result = statusCommand(root);
      return toolResult(result as unknown as ToolPayload, `Kotta has ${result.data.activeTasks.length} active, ${result.data.definedTasks.length} defined, and ${result.data.reviewTasks.length} review tasks.`);
    } catch (error) { return toolError(error); }
  });

  define("workspace_sweep", {
    title: "Report what has stopped in the Kotta workspace",
    description: "Derive the unfinished work and why it stopped: each item carries the reason and the one action that would move it. Reads only; writes nothing.",
    inputSchema: {
      stalledHours: z.number().optional(),
      undispositionedDays: z.number().optional(),
    },
    annotations: readOnly,
  }, async ({ stalledHours, undispositionedDays }) => {
    try {
      const result = sweep(root, {
        ...(stalledHours === undefined ? {} : { stalledHours }),
        ...(undispositionedDays === undefined ? {} : { undispositionedDays }),
      });
      const { items, counts } = result.data;
      const summary = items.length
        ? `${items.length} stopped: ${Object.entries(counts).map(([category, count]) => `${category} ${count}`).join(", ")}.`
        : "Nothing has stopped.";
      return toolResult(result as unknown as ToolPayload, summary);
    } catch (error) { return toolError(error); }
  });

  define("workspace_questions", {
    title: "Read the open questions an entity asks",
    description: "List the undecided points written under an entity's Open decisions heading — one entity, or every entity at once — each with the position that addresses it, whether it still blocks defining, and the decision that answered it where one did. Reads only; writes nothing.",
    inputSchema: {
      id: z.string().optional(),
    },
    annotations: readOnly,
  }, async ({ id }) => {
    try {
      const result = openQuestions(id, root);
      const { entities, open, total } = result.data;
      const summary = total
        ? `${open} open of ${total} across ${entities.length} ${entities.length === 1 ? "entity" : "entities"}.`
        : "No entity asks an open question.";
      return toolResult(result as unknown as ToolPayload, summary);
    } catch (error) { return toolError(error); }
  });

  define("gap_report", {
    title: "Read the implementation gap",
    description: "Read the accepted specification on the configured base branch and report promises without explicit code/test/command evidence plus enforced behavior without a specification trace. Deterministic and read-only; creates no tasks or observations.",
    inputSchema: {},
    annotations: readOnly,
  }, async () => {
    try {
      const result = gapReport(root);
      return toolResult(result as unknown as ToolPayload, result.data.report);
    } catch (error) { return toolError(error); }
  });

  // Orientation is the question chat asks most, and the answer must not be
  // "read .kotta/ yourself" — the one thing the workspace rule forbids.
  for (const entity of ["task", "observation", "decision", "batch"] as const) {
    const states = entityStates(entity);
    const inputSchema: Record<string, z.ZodTypeAny> = {};
    if (entity !== "decision") inputSchema.state = z.array(z.enum(states as [string, ...string[]])).optional();
    const definition = {
      title: `List Kotta ${entity === "batch" ? "batches" : `${entity}s`}`,
      description: `List every ${entity} in the workspace with its id, state and title. Read-only; use it to orient before choosing an action, instead of reading the workspace directories.`,
      inputSchema,
      annotations: readOnly,
    };
    const handler = async (input: { state?: string[] }) => {
      try {
        const result = listCommand(entity, { state: input?.state }, root);
        return toolResult(result as unknown as ToolPayload, `${result.data.count} ${entity === "batch" && result.data.count !== 1 ? "batches" : `${entity}${result.data.count === 1 ? "" : "s"}`}.`);
      } catch (error) { return toolError(error); }
    };
    define(`${entity}_list`, definition, handler);
  }

  for (const entity of ["task", "observation", "decision", "batch"] as const) {
    const definition = {
      title: `Show one Kotta ${entity}`,
      description: `Read one ${entity} as it is stored: its state, its set facts and its body. Accepts the short id the listings print. Read-only, and not the execution brief — use task_brief when an agent is about to implement.`,
      inputSchema: { id: z.string().min(1) },
      annotations: readOnly,
    };
    const handler = async ({ id }: { id: string }) => {
      try {
        const result = showCommand(entity, id, root);
        return toolResult(result as unknown as ToolPayload, `${result.data.title || result.data.id} is ${result.data.state}.`);
      } catch (error) { return toolError(error); }
    };
    define(`${entity}_show`, definition, handler);
  }

  define("task_create", {
    title: "Create a Kotta task",
    description: "Create a backlog task from explicit user intent and return its stable id and canonical path. Never ask the user to relay the id.",
    inputSchema: {
      title: z.string().min(1),
      type: z.string().min(1),
      profiles: z.array(z.string().min(1)).default([]),
    },
    annotations: localWrite,
  }, async ({ title, type, profiles }) => {
    try {
      const result = withControlPlaneMutation(root, (controlRoot) => {
        const created = newTask({ title, type, profiles }, controlRoot);
        commitControlState(controlRoot, `chore(kotta): capture ${created.data.id}`);
        return created;
      }, { requireClean: false });
      return toolResult(result as unknown as ToolPayload, `Created ${named(result.data.title, result.data.id)} at ${result.data.path}.`);
    } catch (error) { return toolError(error); }
  });

  define("task_define", {
    title: "Define a Kotta task",
    description: "Apply a complete Markdown definition before execution. Every acceptance condition must explicitly map to a referenced accepted spec node; valid coverage moves the task to defined. With draft=true a backlog capture is stored or amended with its structure validated and no coverage check, and stays in backlog.",
    inputSchema: {
      id: z.string().min(1),
      definition: z.string().min(1),
      draft: z.boolean().optional(),
    },
    annotations: localWrite,
  }, async ({ id, definition, draft }) => {
    try {
      const result = withControlPlaneMutation(root, (controlRoot) => {
        const defined = defineTask(id, definition, controlRoot, { draft: Boolean(draft) });
        commitControlState(controlRoot, `chore(kotta): ${draft ? "draft" : "define"} ${id}`);
        return defined;
      }, { requireClean: false });
      return toolResult(result as unknown as ToolPayload, `Updated ${named(result.data.title, id)}; it is ${result.data.state}. ${result.data.nextStep}`);
    } catch (error) { return toolError(error); }
  });

  define("task_validate", {
    title: "Validate a Kotta task",
    description: "Validate one task definition and return structured rule violations without changing state.",
    inputSchema: { id: z.string().min(1) },
    annotations: readOnly,
  }, async ({ id }) => {
    try {
      const result = validateTask(id, root);
      return toolResult(result as unknown as ToolPayload, result.ok ? `${named(result.data.title, id)} is valid.` : `${named(result.data.title, id)} is invalid: ${result.errors.map((item) => item.message).join("; ")}`);
    } catch (error) { return toolError(error); }
  });

  define("task_brief", {
    title: "Read a Kotta execution brief",
    description: "Read the deterministic, bounded execution brief for one task without including unrelated chat or workspace history.",
    inputSchema: { id: z.string().min(1) },
    annotations: readOnly,
  }, async ({ id }) => {
    try {
      const result = briefTask(id, {}, root);
      return toolResult(result as unknown as ToolPayload, result.data.brief);
    } catch (error) { return toolError(error); }
  });

  define("task_start_caller", {
    title: "Start task for the calling agent",
    description: "Claim a defined task and return its isolated feature branch and worktree to the current caller, preserving inherited chat context explicitly.",
    inputSchema: { id: z.string().min(1), agent: z.string().min(1).default("codex") },
    annotations: localWrite,
  }, async ({ id, agent }) => {
    try {
      const result = startTask(id, agent, "inherited", root);
      return toolResult(result as unknown as ToolPayload, `Started ${named(result.data.title, id)} for caller execution in ${result.data.worktree} on ${result.data.branch}.`);
    } catch (error) { return toolError(error); }
  });

  define("task_submit_review", {
    title: "Submit task for review",
    description: "Submit an active task with acceptance evidence after implementation and verification are complete. An evidence value starting with 'run: <command>' declares a runnable check: it is executed in the execution checkout, a non-zero exit refuses the submission, and a success is recorded next to the evidence as command, commit and exit 0.",
    inputSchema: {
      id: z.string().min(1),
      evidence: z.union([z.string().min(1), z.record(z.string(), z.string().min(1))]),
      pullRequest: z.string().optional(),
      deviations: z.string().optional(),
      observationsCreated: z.string().optional(),
      knownConcerns: z.string().optional(),
    },
    annotations: localWrite,
  }, async ({ id, evidence, pullRequest, deviations, observationsCreated, knownConcerns }) => {
    try {
      const result = reviewTask(id, evidence, pullRequest, { deviations, observationsCreated, knownConcerns }, root);
      return toolResult(result as unknown as ToolPayload, `Submitted ${named(result.data.title, id)} for review${pullRequest ? ` in ${pullRequest}` : ""}.`);
    } catch (error) { return toolError(error); }
  });

  define("observation_create", {
    title: "Capture a Kotta observation",
    description: "Capture evidence-backed out-of-scope work without silently widening the active task.",
    inputSchema: {
      title: z.string().min(1),
      type: z.string().min(1),
      evidence: z.string().min(1),
      discoveredDuring: z.string().optional(),
      // The chat is where the operator's noticings are made, and where they were lost
      // (UC-01m0f0wn89jqb5mpcjjt1j5j8p): relaying one says so rather than claiming it.
      origin: z.enum(OBSERVATION_ORIGINS).optional(),
    },
    annotations: localWrite,
  }, async ({ title, type, evidence, discoveredDuring, origin }) => {
    try {
      // One lock, taken by the service. Wrapping this call in a second withControlPlaneMutation
      // made the inner acquisition find the lock held by the outer one, so the standalone chat
      // capture always refused as busy (F-01m0ypjk6gzymm0y51m96mmdaw); the wrapper's commit was
      // already newObservation's own.
      const result = newObservation({ title, type, evidence, discoveredDuring, origin }, root);
      return toolResult(result as unknown as ToolPayload, `Captured ${named(result.data.title, result.data.id)} at ${result.data.path}.`);
    } catch (error) { return toolError(error); }
  });

  define("task_message_record", {
    title: "Record visible task conversation",
    description: "Persist an exact user-visible human or assistant task message on the canonical control branch. Never store hidden reasoning or raw tool output.",
    inputSchema: {
      task: z.string().min(1),
      role: z.enum(["human", "assistant"]),
      text: z.string().min(1),
      clientEventId: z.string().optional(),
      threadId: z.string().optional(),
    },
    annotations: localWrite,
  }, async ({ task, role, text, clientEventId, threadId }) => {
    try {
      const result = recordTaskMessage({ task, role, text, clientEventId, threadId }, root);
      return toolResult(result as unknown as ToolPayload, `${result.data.created ? "Recorded" : "Already recorded"} ${role} message for ${named(entityTitleById(root, task), task)}.`);
    } catch (error) { return toolError(error); }
  });

  define("approval_request", {
    title: "Request an exact Kotta approval",
    description: "Present one exact pending Kotta transition in the current host chat. Apply it only after the human explicitly approves the elicitation; rejection and cancellation are durable.",
    inputSchema: {
      // Omitted only for decision.create, whose entity does not exist until the approval applies:
      // the id is minted with the proposal and reported back with it.
      entity: z.string().min(1).optional(),
      // Derived, not restated: a hand-kept copy of this list is how a retired action survives in
      // one surface after leaving the other (BR-01m0nsyasfnjc9s4073r8zb33j).
      action: z.enum(APPROVAL_ACTIONS),
      payload: z.record(z.string(), z.unknown()).default({}),
      clientRequestId: z.string().optional(),
    },
    annotations: { ...localWrite, idempotentHint: false },
  }, async ({ entity, action, payload, clientRequestId }) => {
    try {
      // Resolved once: from here on the proposal, the elicitation and the record name one entity,
      // whether the caller supplied it or decision.create minted it.
      const subject = approvalEntity(action, entity);
      const proposed = proposeApproval({ entity: subject, action, payload, clientRequestId }, root);
      const approvalId = String(proposed.data.event.approval_id);
      if (!proposed.data.created) {
        const terminal = readEvents(controlPlaneRoot(root), subject).find((event) => event.approval_id === approvalId && ["applied", "rejected", "cancelled", "failed"].includes(String(event.phase)));
        if (terminal) return toolResult({ ok: terminal.phase === "applied", approvalId, phase: terminal.phase, event: terminal }, `Approval ${approvalId} is already ${terminal.phase}.`);
      }

      const description = String(proposed.data.description);
      const detail = approvalDetail(action as ApprovalAction, payload);
      let elicited;
      try {
        elicited = await server.server.elicitInput({
          mode: "form",
          message: detail
            ? `Kotta requests one scoped decision: ${description}\n\nThis is what will be recorded, exactly as shown:\n\n${detail}`
            : `Kotta requests one scoped decision: ${description}`,
          requestedSchema: {
            type: "object",
            properties: {
              decision: {
                type: "string",
                title: "Decision",
                description: "This decision applies only to the exact transition shown above.",
                oneOf: [
                  { const: "approve", title: "Approve" },
                  { const: "reject", title: "Reject" },
                  { const: "cancel", title: "Cancel" },
                ],
              },
            },
            required: ["decision"],
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failApproval(approvalId, `Caller chat could not present human approval: ${message}`, root);
        throw new Error(`Caller chat could not present human approval. Nothing was applied. ${message}`);
      }

      const selected = elicited.action === "accept" && elicited.content && typeof elicited.content.decision === "string"
        ? elicited.content.decision
        : elicited.action === "decline" ? "reject" : "cancel";
      const decision: ApprovalDecision = selected === "approve" ? "approved" : selected === "reject" ? "rejected" : "cancelled";
      const sourceText = decision === "approved"
        ? `Approved in caller chat: ${description}.`
        : decision === "rejected" ? `Rejected in caller chat: ${description}.` : `Cancelled in caller chat: ${description}.`;
      const result = decideApproval({ approvalId, decision, sourceText }, root);
      return toolResult(result as unknown as ToolPayload, decision === "approved" ? `Approved and applied ${description}.` : `${description} was ${decision}.`);
    } catch (error) { return toolError(error); }
  });

  for (const operation of expandOperations()) {
    if (!operation.mcp) continue;
    const tool = built.get(operation.mcp);
    if (!tool) throw new Error(`Operation ${operation.id} declares the MCP tool '${operation.mcp}', which this server does not build.`);
    built.delete(operation.mcp);
    // The map erased the per-tool schema types; the declaration decides what is registered, and
    // the surface snapshot proves each tool kept its schema and annotations.
    (server.registerTool as (name: string, definition: unknown, handler: unknown) => unknown)(operation.mcp, tool.definition, tool.handler);
  }
  if (built.size) throw new Error(`This server builds MCP tools no operation declares: ${[...built.keys()].sort().join(", ")}.`);

  return server;
}

export async function mcpCommand(workspace?: string): Promise<void> {
  const server = createKottaMcpServer(workspace);
  await server.connect(new StdioServerTransport());
}
