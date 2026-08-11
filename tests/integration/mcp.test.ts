import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ElicitRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, test } from "vitest";
import { createKottaMcpServer } from "../../src/commands/mcp.js";
import { integrateCodex } from "../../src/commands/integrate.js";
import { readWorkspace } from "../../src/commands/ui.js";
import { readEvents } from "../../src/core/events.js";
import { findContract } from "../../src/filesystem/entities.js";

const cli = resolve("dist/cli/index.js");
const clients: Client[] = [];
const servers: ReturnType<typeof createKottaMcpServer>[] = [];

afterEach(async () => {
  await Promise.all([...clients.splice(0).map((client) => client.close()), ...servers.splice(0).map((server) => server.close())]);
});

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-mcp-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-m", "init"], { cwd: root });
  return root;
}

async function connect(root: string, decision: "approve" | "reject" | "cancel" = "approve") {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createKottaMcpServer(root);
  servers.push(server);
  const client = new Client({ name: "kotta-test", version: "1.0.0" }, { capabilities: { elicitation: { form: {} } } });
  let prompt: unknown = null;
  client.setRequestHandler(ElicitRequestSchema, async (request) => {
    prompt = request.params;
    return { action: "accept", content: { decision } };
  });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  clients.push(client);
  return { client, prompt: () => prompt };
}

async function connectWithoutElicitation(root: string) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createKottaMcpServer(root);
  servers.push(server);
  const client = new Client({ name: "kotta-test-no-elicitation", version: "1.0.0" }, { capabilities: {} });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  clients.push(client);
  return client;
}

function definition(id: string): string {
  return `---
id: ${id}
---
# ${id} — Caller chat contract

## Outcome

The calling chat controls the contract without copied commands.

## Scope

Expose structured Kotta tools.

## Non-goals

No board mutations.

## Acceptance

- Human approval is recorded from host-chat elicitation.

## Verification

- Exercise the MCP tool through an in-memory client.

## Constraints

Keep canonical state on main.

## Open decisions

None.

## Execution notes

None.
`;
}

async function createAndDefine(client: Client, root: string) {
  const created = await client.callTool({ name: "contract_create", arguments: { title: "Caller chat contract", type: "feature", profiles: [] } });
  const id = String((created.structuredContent as { data: { id: string } }).data.id);
  expect(id).toMatch(/^T-/);
  expect(created.content).toEqual(expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining(id) })]));
  expect(readWorkspace(root).contracts.some((contract) => contract.id === id)).toBe(true);
  expect(execFileSync("git", ["status", "--porcelain", "--", ".kotta"], { cwd: root, encoding: "utf8" })).toBe("");
  const defined = await client.callTool({ name: "contract_define", arguments: { id, definition: definition(id) } });
  expect(defined.isError).not.toBe(true);
  return id;
}

describe("Kotta caller-chat MCP", () => {
  test("adds project MCP configuration idempotently without replacing existing settings", () => {
    const root = fixture();
    const directory = join(root, ".codex");
    mkdirSync(directory);
    const config = join(directory, "config.toml");
    writeFileSync(config, "model = \"gpt-5\"\n");
    expect(integrateCodex(root).data.changed).toBe(true);
    expect(integrateCodex(root).data.changed).toBe(false);
    const content = readFileSync(config, "utf8");
    expect(content).toContain('model = "gpt-5"');
    expect(content.match(/\[mcp_servers\.kotta\]/g)).toHaveLength(1);
    expect(content).toContain('args = ["mcp", "--workspace", "."]');
  });

  test("returns stable ids and applies one exact human-approved transition", async () => {
    const root = fixture();
    const connected = await connect(root, "approve");
    const tools = await connected.client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining([
      "workspace_status", "contract_create", "contract_define", "contract_validate", "contract_start_caller", "approval_request",
      "contract_list", "observation_list", "decision_list", "batch_list",
      "contract_show", "observation_show", "decision_show", "batch_show",
    ]));
    expect(tools.tools.find((tool) => tool.name === "workspace_status")?.annotations?.readOnlyHint).toBe(true);
    // Orientation reaches chat with the same answer the terminal gets, and reads nothing into the bargain.
    for (const name of ["contract_list", "observation_list", "decision_list", "batch_list", "contract_show", "observation_show", "decision_show", "batch_show"]) {
      expect(tools.tools.find((tool) => tool.name === name)?.annotations?.readOnlyHint).toBe(true);
    }
    const listed = await connected.client.callTool({ name: "contract_list", arguments: {} });
    expect((listed.structuredContent as { ok: boolean; data: { entity: string; entities: unknown[] } }).data.entity).toBe("contract");
    const narrowed = await connected.client.callTool({ name: "contract_list", arguments: { state: ["review"] } });
    expect((narrowed.structuredContent as { data: { count: number } }).data.count).toBe(0);

    const id = await createAndDefine(connected.client, root);
    const validated = await connected.client.callTool({ name: "contract_validate", arguments: { id } });
    expect((validated.structuredContent as { ok: boolean }).ok).toBe(true);

    const approval = await connected.client.callTool({
      name: "approval_request",
      arguments: { entity: id, action: "contract.sign", payload: {}, clientRequestId: "sign-once" },
    });
    expect(approval.isError).not.toBe(true);
    expect(JSON.stringify(connected.prompt())).toContain(`contract.sign ${id}`);
    expect(findContract(root, id).state).toBe("defined");
    const events = readEvents(root, id);
    expect(events.filter((event) => event.kind === "approval").map((event) => event.phase)).toEqual(["proposed", "approved", "applied"]);
    const approved = events.find((event) => event.phase === "approved");
    expect(approved?.source_message).toMatch(/^E-/);
    expect(events.find((event) => event.id === approved?.source_message)?.text).toContain("Approved in caller chat");

    const repeated = await connected.client.callTool({
      name: "approval_request",
      arguments: { entity: id, action: "contract.sign", payload: {}, clientRequestId: "sign-once" },
    });
    expect((repeated.structuredContent as { phase: string }).phase).toBe("applied");
    expect(readEvents(root, id).filter((event) => event.kind === "approval")).toHaveLength(3);

    const started = await connected.client.callTool({
      name: "contract_start_caller",
      arguments: { id, agent: "codex" },
    });
    expect(started.isError).not.toBe(true);
    const worktree = String((started.structuredContent as { data: { worktree: string } }).data.worktree);
    expect(existsSync(worktree)).toBe(true);
    expect(findContract(root, id).state).toBe("active");
    expect(findContract(worktree, id).state).toBe("defined");

    const submitted = await connected.client.callTool({
      name: "contract_submit_review",
      arguments: { id, evidence: "Caller-chat MCP integration exercised through review." },
    });
    expect(submitted.isError).not.toBe(true);
    expect(findContract(root, id).state).toBe("review");
  });

  test("records a rejection and leaves lifecycle state unchanged", async () => {
    const root = fixture();
    const { client } = await connect(root, "reject");
    const id = await createAndDefine(client, root);
    await client.callTool({ name: "contract_message_record", arguments: { contract: id, role: "human", text: "ok, mehet" } });
    expect(findContract(root, id).state).toBe("backlog");
    expect(readEvents(root, id).filter((event) => event.kind === "approval")).toEqual([]);
    const result = await client.callTool({ name: "approval_request", arguments: { entity: id, action: "contract.sign", payload: {} } });
    expect(result.isError).not.toBe(true);
    expect(findContract(root, id).state).toBe("backlog");
    expect(readEvents(root, id).filter((event) => event.kind === "approval").map((event) => event.phase)).toEqual(["proposed", "rejected"]);
  });

  test("retires a signed contract from the caller chat, with the reason and the supersession in the prompt", async () => {
    const root = fixture();
    const connected = await connect(root);
    const id = await createAndDefine(connected.client, root);
    await connected.client.callTool({ name: "approval_request", arguments: { entity: id, action: "contract.sign", payload: {} } });
    expect(findContract(root, id).state).toBe("defined");

    const unnamed = await connected.client.callTool({
      name: "approval_request",
      arguments: { entity: id, action: "contract.cancel", payload: { resolution: "obsolete", reason: "A decision settled the opposite" } },
    });
    expect(unnamed.isError).toBe(true);
    expect(JSON.stringify(unnamed.structuredContent)).toContain("supersededBy");
    expect(findContract(root, id).state).toBe("defined");

    const retired = await connected.client.callTool({
      name: "approval_request",
      arguments: { entity: id, action: "contract.cancel", payload: { resolution: "cancelled", reason: "The work is objectless" } },
    });
    expect(retired.isError).not.toBe(true);
    // The human is shown what ends and why, not only which command runs.
    expect(JSON.stringify(connected.prompt())).toContain("The work is objectless");
    expect(findContract(root, id).state).toBe("done");
    // The refused proposal above never reached the event log; only sign and cancel did.
    const phases = readEvents(root, id).filter((event) => event.kind === "approval").map((event) => event.phase);
    expect(phases).toEqual(["proposed", "approved", "applied", "proposed", "approved", "applied"]);
  });

  test("fails closed when the calling host cannot present elicitation", async () => {
    const root = fixture();
    const client = await connectWithoutElicitation(root);
    const id = await createAndDefine(client, root);
    const result = await client.callTool({ name: "approval_request", arguments: { entity: id, action: "contract.sign", payload: {} } });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.structuredContent)).toContain("Nothing was applied");
    expect(findContract(root, id).state).toBe("backlog");
    expect(readEvents(root, id).filter((event) => event.kind === "approval").map((event) => event.phase)).toEqual(["proposed", "failed"]);
  });
});
