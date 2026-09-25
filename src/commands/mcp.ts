import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseMarkdown, sections } from "../core/markdown.js";
import { displayId } from "../core/identity.js";
import { assertCurrentWorkspaceShape, findRepositoryRoot } from "../filesystem/workspace.js";
import { readFormRegistry, readSpecNodes } from "../spec/registry.js";
import { gapReport } from "./gap.js";
import { openQuestions } from "./questions.js";
import { validateWorkspace } from "./validate.js";

/** The server reports the version it actually is. */
const packageVersion = String((JSON.parse(readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8")) as { version: unknown }).version);

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

/**
 * The calling chat's read of the technical specification. Every tool here reads; the shaping of a
 * node stays in the conversation and the CLI (`kotta spec new`), and landing it on the base branch
 * on a human yes is the acceptance. There is no process to drive from chat any more, so there is
 * nothing here to approve, claim or transition.
 */
export function createKottaMcpServer(repositoryRoot?: string): McpServer {
  const root = findRepositoryRoot(repositoryRoot ? resolve(repositoryRoot) : process.cwd());
  assertCurrentWorkspaceShape(root);
  const server = new McpServer(
    { name: "kotta", version: packageVersion },
    {
      instructions: [
        "Kotta owns this repository's technical specification: the accepted rules, examples, entities, state machines, use cases, stories and interfaces under the workspace's spec/ directory.",
        "These tools read it. Use them to orient before proposing a change instead of reading the workspace directories yourself.",
        "Nothing here writes: a node is drafted with 'kotta spec new' and becomes the agreement when it lands on the base branch on a human yes.",
      ].join(" "),
    },
  );

  server.registerTool("spec_list", {
    title: "List the specification nodes",
    description: "List every accepted specification node with its id, form, title and path, optionally narrowed to one form. Read-only.",
    inputSchema: { form: z.string().min(1).optional() },
    annotations: readOnly,
  }, async ({ form }) => {
    try {
      const { forms } = readFormRegistry(root);
      const known = forms.map((candidate) => candidate.id);
      if (form && !known.includes(form)) throw new Error(`No form '${form}' is registered. This workspace registers: ${known.join(", ")}.`);
      const nodes = readSpecNodes(root, forms).nodes
        .filter((node) => !form || node.form === form)
        .map((node) => ({ id: node.id, form: node.form, title: String(node.data.title ?? node.id), path: relative(root, node.path) }))
        .sort((left, right) => left.form.localeCompare(right.form) || left.title.localeCompare(right.title));
      return toolResult({ ok: true, data: { forms: known, count: nodes.length, nodes } }, `${nodes.length} node${nodes.length === 1 ? "" : "s"} across ${known.length} form${known.length === 1 ? "" : "s"}.`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("spec_show", {
    title: "Show one specification node",
    description: "Read one node as it is stored: its frontmatter, its sections and its path. Accepts the short id the listing prints. Read-only.",
    inputSchema: { id: z.string().min(1) },
    annotations: readOnly,
  }, async ({ id }) => {
    try {
      const { forms } = readFormRegistry(root);
      const trimmed = id.trim();
      const matches = readSpecNodes(root, forms).nodes.filter((node) => node.id === trimmed || displayId(node.id) === trimmed);
      if (matches.length > 1) throw new Error(`Node id '${trimmed}' is ambiguous; it matches ${matches.map((node) => node.id).join(", ")}. Name one of them in full.`);
      const node = matches[0];
      if (!node) throw new Error(`No specification node matches '${trimmed}'.`);
      const source = readFileSync(node.path, "utf8");
      const parsed = parseMarkdown(source);
      const body = Object.fromEntries([...sections(parsed.content)].map(([key, value]) => [key, value.trim()]));
      const title = String(node.data.title ?? node.id);
      return toolResult({ ok: true, data: { id: node.id, form: node.form, title, path: relative(root, node.path), frontmatter: parsed.data, sections: body } }, `${title} is a ${node.form} at ${relative(root, node.path)}.`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("workspace_validate", {
    title: "Validate the specification",
    description: "Measure every node against its form: required fields, required sections, required edges and the nodes they name. Read-only; returns the structured violations.",
    inputSchema: {},
    annotations: readOnly,
  }, async () => {
    try {
      const result = validateWorkspace(root);
      return toolResult(result as unknown as ToolPayload, result.ok ? `${result.data.specNodes} nodes across ${result.data.forms} forms validate.` : `${result.errors.length} problem${result.errors.length === 1 ? "" : "s"}: ${result.errors.map((error) => error.message).join("; ")}`);
    } catch (error) { return toolError(error); }
  });

  server.registerTool("workspace_questions", {
    title: "Read the open questions a node asks",
    description: "List the undecided points written under a node's Open decisions heading — one node, or every node at once — each with the position that addresses it. Read-only.",
    inputSchema: { id: z.string().optional() },
    annotations: readOnly,
  }, async ({ id }) => {
    try {
      const result = openQuestions(id, root);
      const { entities, open, total } = result.data;
      return toolResult(result as unknown as ToolPayload, total ? `${open} open of ${total} across ${entities.length} node${entities.length === 1 ? "" : "s"}.` : "No node asks an open question.");
    } catch (error) { return toolError(error); }
  });

  server.registerTool("gap_report", {
    title: "Read the implementation gap",
    description: "Read the accepted specification on the configured base branch and report promises without explicit code/test/command evidence plus enforced behavior without a specification trace. Deterministic and read-only.",
    inputSchema: {},
    annotations: readOnly,
  }, async () => {
    try {
      const result = gapReport(root);
      return toolResult(result as unknown as ToolPayload, result.data.report);
    } catch (error) { return toolError(error); }
  });

  return server;
}

export async function mcpCommand(workspace?: string): Promise<void> {
  const server = createKottaMcpServer(workspace);
  await server.connect(new StdioServerTransport());
}
