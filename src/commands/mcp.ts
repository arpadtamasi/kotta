import { join, resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { approvalDescription, decideApproval, failApproval, proposeApproval, type ApprovalAction, type ApprovalDecision } from "./approval.js";
import { recordContractMessage } from "./conversation.js";
import { briefContract, defineContract, newContract, reviewContract, startContract, validateContract } from "./contract.js";
import { newObservation } from "./observation.js";
import { statusCommand } from "./status.js";
import { readEvents } from "../core/events.js";
import { assertCurrentWorkspaceShape, findRepositoryRoot } from "../filesystem/workspace.js";
import { commitControlState, controlPlaneRoot, withControlPlaneMutation } from "../git/control-plane.js";

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
    { name: "kotta", version: "0.5.0" },
    {
      instructions: [
        "Kotta is the canonical contract control plane for this repository.",
        "Use these structured tools instead of asking the human to copy ids or run lifecycle commands.",
        "Caller execution uses contract_start_caller; fresh context remains available through the CLI for automation.",
        "For sign, close, request-changes, observation disposition, or batch close, call approval_request: it elicits the exact human decision in the host chat and records the receipt before applying.",
        "The Kotta board is read-only. Record only visible user/assistant contract messages; never hidden reasoning or raw tool output.",
      ].join(" "),
    },
  );

  server.registerTool("workspace_status", {
    title: "Read Kotta workspace status",
    description: "Read canonical contract and observation state before deciding what Kotta action is needed.",
    inputSchema: {},
    annotations: readOnly,
  }, async () => {
    try {
      const result = statusCommand(root);
      return toolResult(result as unknown as ToolPayload, `Kotta has ${result.data.activeContracts.length} active, ${result.data.definedContracts.length} defined, and ${result.data.reviewContracts.length} review contracts.`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("contract_create", {
    title: "Create a Kotta contract",
    description: "Create a backlog contract from explicit user intent and return its stable id and canonical path. Never ask the user to relay the id.",
    inputSchema: {
      title: z.string().min(1),
      type: z.string().min(1),
      profiles: z.array(z.string().min(1)).default([]),
    },
    annotations: localWrite,
  }, async ({ title, type, profiles }) => {
    try {
      const result = withControlPlaneMutation(root, (controlRoot) => {
        const created = newContract({ title, type, profiles }, controlRoot);
        commitControlState(controlRoot, `chore(kotta): capture ${created.data.id}`);
        return created;
      }, { requireClean: false });
      return toolResult(result as unknown as ToolPayload, `Created ${result.data.id} at ${result.data.path}.`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("contract_define", {
    title: "Define a Kotta contract",
    description: "Replace a backlog contract placeholder with a complete Markdown definition, preserving canonical identity and validating before publication.",
    inputSchema: {
      id: z.string().min(1),
      definition: z.string().min(1),
    },
    annotations: localWrite,
  }, async ({ id, definition }) => {
    try {
      const result = withControlPlaneMutation(root, (controlRoot) => {
        const defined = defineContract(id, definition, controlRoot);
        commitControlState(controlRoot, `chore(kotta): define ${id}`);
        return defined;
      }, { requireClean: false });
      return toolResult(result as unknown as ToolPayload, `Defined ${id}; it is ready for validation.`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("contract_validate", {
    title: "Validate a Kotta contract",
    description: "Validate one contract definition and return structured rule violations without changing state.",
    inputSchema: { id: z.string().min(1) },
    annotations: readOnly,
  }, async ({ id }) => {
    try {
      const result = validateContract(id, root);
      return toolResult(result as unknown as ToolPayload, result.ok ? `${id} is valid.` : `${id} is invalid: ${result.errors.map((item) => item.message).join("; ")}`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("contract_brief", {
    title: "Read a Kotta execution brief",
    description: "Read the deterministic, bounded execution brief for one contract without including unrelated chat or workspace history.",
    inputSchema: { id: z.string().min(1) },
    annotations: readOnly,
  }, async ({ id }) => {
    try {
      const result = briefContract(id, {}, root);
      return toolResult(result as unknown as ToolPayload, result.data.brief);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("contract_start_caller", {
    title: "Start contract for the calling agent",
    description: "Claim a defined contract and return its isolated feature branch and worktree to the current caller, preserving inherited chat context explicitly.",
    inputSchema: { id: z.string().min(1), agent: z.string().min(1).default("codex") },
    annotations: localWrite,
  }, async ({ id, agent }) => {
    try {
      const result = startContract(id, agent, "inherited", root);
      return toolResult(result as unknown as ToolPayload, `Started ${id} for caller execution in ${result.data.worktree} on ${result.data.branch}.`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("contract_submit_review", {
    title: "Submit contract for review",
    description: "Submit an active contract with acceptance evidence after implementation and verification are complete.",
    inputSchema: {
      id: z.string().min(1),
      evidence: z.string().min(1),
      pullRequest: z.string().optional(),
      deviations: z.string().optional(),
      observationsCreated: z.string().optional(),
      knownConcerns: z.string().optional(),
    },
    annotations: localWrite,
  }, async ({ id, evidence, pullRequest, deviations, observationsCreated, knownConcerns }) => {
    try {
      const result = reviewContract(id, evidence, pullRequest, { deviations, observationsCreated, knownConcerns }, root);
      return toolResult(result as unknown as ToolPayload, `Submitted ${id} for review${pullRequest ? ` in ${pullRequest}` : ""}.`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("observation_create", {
    title: "Capture a Kotta observation",
    description: "Capture evidence-backed out-of-scope work without silently widening the active contract.",
    inputSchema: {
      title: z.string().min(1),
      type: z.string().min(1),
      evidence: z.string().min(1),
      discoveredDuring: z.string().optional(),
    },
    annotations: localWrite,
  }, async ({ title, type, evidence, discoveredDuring }) => {
    try {
      const result = discoveredDuring
        ? newObservation({ title, type, evidence, discoveredDuring }, root)
        : withControlPlaneMutation(root, (controlRoot) => {
          const created = newObservation({ title, type, evidence }, controlRoot);
          commitControlState(controlRoot, `chore(kotta): capture ${created.data.id}`);
          return created;
        }, { requireClean: false });
      return toolResult(result as unknown as ToolPayload, `Captured ${result.data.id} at ${result.data.path}.`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("contract_message_record", {
    title: "Record visible contract conversation",
    description: "Persist an exact user-visible human or assistant contract message on the canonical control branch. Never store hidden reasoning or raw tool output.",
    inputSchema: {
      contract: z.string().min(1),
      role: z.enum(["human", "assistant"]),
      text: z.string().min(1),
      clientEventId: z.string().optional(),
      threadId: z.string().optional(),
    },
    annotations: localWrite,
  }, async ({ contract, role, text, clientEventId, threadId }) => {
    try {
      const result = recordContractMessage({ contract, role, text, clientEventId, threadId }, root);
      return toolResult(result as unknown as ToolPayload, `${result.data.created ? "Recorded" : "Already recorded"} ${role} message for ${contract}.`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("approval_request", {
    title: "Request an exact Kotta approval",
    description: "Present one exact pending Kotta transition in the current host chat. Apply it only after the human explicitly approves the elicitation; rejection and cancellation are durable.",
    inputSchema: {
      entity: z.string().min(1),
      action: z.enum(["contract.sign", "observation.resolve", "contract.close", "contract.request-changes", "batch.close"]),
      payload: z.record(z.string(), z.unknown()).default({}),
      clientRequestId: z.string().optional(),
    },
    annotations: { ...localWrite, idempotentHint: false },
  }, async ({ entity, action, payload, clientRequestId }) => {
    try {
      const proposed = proposeApproval({ entity, action, payload, clientRequestId }, root);
      const approvalId = String(proposed.data.event.approval_id);
      if (!proposed.data.created) {
        const terminal = readEvents(controlPlaneRoot(root), entity).find((event) => event.approval_id === approvalId && ["applied", "rejected", "cancelled", "failed"].includes(String(event.phase)));
        if (terminal) return toolResult({ ok: terminal.phase === "applied", approvalId, phase: terminal.phase, event: terminal }, `Approval ${approvalId} is already ${terminal.phase}.`);
      }

      const description = approvalDescription(action as ApprovalAction, entity, payload);
      let elicited;
      try {
        elicited = await server.server.elicitInput({
          mode: "form",
          message: `Kotta requests one scoped decision: ${description}`,
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

  return server;
}

export async function mcpCommand(workspace?: string): Promise<void> {
  const server = createKottaMcpServer(workspace);
  await server.connect(new StdioServerTransport());
}
