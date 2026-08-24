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
import { findTask } from "../../src/filesystem/entities.js";

const cli = resolve("dist/cli/index.js");
const MCP_TASK_SPEC_ID = "GT-01m0c0000000000000000000mc";
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
  writeFileSync(join(root, ".kotta/spec/glossary-terms/caller-approval-000000mc.md"), [
    "---", `id: ${MCP_TASK_SPEC_ID}`, "form: glossary-term", "title: Caller approval", "---", "",
    "## Definition", "Human approval is recorded from host-chat elicitation.", "", "## Usage", "MCP lifecycle fixture.", "", "## Non-examples", "An unrecorded response.", "",
  ].join("\n"));
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
spec: [${MCP_TASK_SPEC_ID}]
coverage:
  "Human approval is recorded from host-chat elicitation.": [${MCP_TASK_SPEC_ID}]
---
# ${id} — Caller chat task

## Outcome

The calling chat controls the task without copied commands.

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
  const created = await client.callTool({ name: "task_create", arguments: { title: "Caller chat task", type: "feature", profiles: [] } });
  const id = String((created.structuredContent as { data: { id: string } }).data.id);
  expect(id).toMatch(/^T-/);
  expect(created.content).toEqual(expect.arrayContaining([expect.objectContaining({ text: expect.stringContaining(id) })]));
  expect(readWorkspace(root).tasks.some((task) => task.id === id)).toBe(true);
  expect(execFileSync("git", ["status", "--porcelain", "--", ".kotta"], { cwd: root, encoding: "utf8" })).toBe("");
  const defined = await client.callTool({ name: "task_define", arguments: { id, definition: definition(id) } });
  expect(defined.isError).not.toBe(true);
  return id;
}

const GLOSSARY_ID = "GT-01m0c0000000000000000000ab";

function landGlossaryNode(root: string): string {
  const directory = join(root, ".kotta/spec/glossary-terms");
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "amend-spec-disposition-000000ab.md"), [
    "---", `id: ${GLOSSARY_ID}`, "form: glossary-term", "title: Amend-spec disposition", "---", "",
    "## Definition", "The constructive exit that changes the accepted agreement.", "",
    "## Usage", "Named by a resolved observation.", "",
    "## Non-examples", "An automatic close.", "",
  ].join("\n"));
  execFileSync("git", ["add", ".kotta/spec"], { cwd: root });
  execFileSync("git", ["commit", "-m", "docs(spec): define amend-spec"], { cwd: root });
  return GLOSSARY_ID;
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
    // The invocation is proved from the running process, not written as a bare name
    // (BR-01m0qyxvz954ay2rbm00bazrd5), so the interpreter and entry point are whatever is running.
    expect(content).toContain(`command = "${process.execPath}"`);
    expect(content).toMatch(/^args = \["\/.*index\.js", "mcp", "--workspace", "\."\]$/m);
  });

  test("returns stable ids and applies one exact human-approved transition", async () => {
    const root = fixture();
    const connected = await connect(root, "approve");
    const tools = await connected.client.listTools();
    expect(tools.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining([
      "workspace_status", "gap_report", "task_create", "task_define", "task_validate", "task_start_caller", "approval_request",
      "task_list", "observation_list", "decision_list", "batch_list",
      "task_show", "observation_show", "decision_show", "batch_show",
    ]));
    // The deprecated contract_* aliases are gone: task_list/task_show are the only vocabulary.
    expect(tools.tools.map((tool) => tool.name)).not.toContain("contract_list");
    expect(tools.tools.map((tool) => tool.name)).not.toContain("contract_show");
    expect(tools.tools.find((tool) => tool.name === "workspace_status")?.annotations?.readOnlyHint).toBe(true);
    expect(tools.tools.find((tool) => tool.name === "gap_report")?.annotations?.readOnlyHint).toBe(true);
    const gaps = await connected.client.callTool({ name: "gap_report", arguments: {} });
    expect(gaps.isError).not.toBe(true);
    expect(JSON.stringify(gaps.structuredContent)).toContain("gap report");
    // Orientation reaches chat with the same answer the terminal gets, and reads nothing into the bargain.
    for (const name of ["task_list", "observation_list", "decision_list", "batch_list", "task_show", "observation_show", "decision_show", "batch_show"]) {
      expect(tools.tools.find((tool) => tool.name === name)?.annotations?.readOnlyHint).toBe(true);
    }
    const listed = await connected.client.callTool({ name: "task_list", arguments: {} });
    expect((listed.structuredContent as { ok: boolean; data: { entity: string; entities: unknown[] } }).data.entity).toBe("task");
    const narrowed = await connected.client.callTool({ name: "task_list", arguments: { state: ["review"] } });
    expect((narrowed.structuredContent as { data: { count: number } }).data.count).toBe(0);

    const id = await createAndDefine(connected.client, root);
    const validated = await connected.client.callTool({ name: "task_validate", arguments: { id } });
    expect((validated.structuredContent as { ok: boolean }).ok).toBe(true);

    expect(findTask(root, id).state).toBe("defined");

    const started = await connected.client.callTool({
      name: "task_start_caller",
      arguments: { id, agent: "codex" },
    });
    expect(started.isError).not.toBe(true);
    const worktree = String((started.structuredContent as { data: { worktree: string } }).data.worktree);
    expect(existsSync(worktree)).toBe(true);
    expect(findTask(root, id).state).toBe("active");
    expect(findTask(worktree, id).state).toBe("defined");

    const submitted = await connected.client.callTool({
      name: "task_submit_review",
      arguments: { id, evidence: "Caller-chat MCP integration exercised through review." },
    });
    expect(submitted.isError).not.toBe(true);
    expect(findTask(root, id).state).toBe("review");

    const approval = await connected.client.callTool({
      name: "approval_request",
      arguments: { entity: id, action: "task.close", payload: {}, clientRequestId: "close-once" },
    });
    expect(approval.isError).not.toBe(true);
    expect(JSON.stringify(connected.prompt())).toContain(`task.close ${id}`);
    expect(findTask(root, id).state).toBe("done");
    const events = readEvents(root, id);
    expect(events.filter((event) => event.kind === "approval").map((event) => event.phase)).toEqual(["proposed", "approved", "applied"]);
    const approved = events.find((event) => event.phase === "approved");
    expect(approved?.source_message).toMatch(/^E-/);
    expect(events.find((event) => event.id === approved?.source_message)?.text).toContain("Approved in caller chat");

    const repeated = await connected.client.callTool({
      name: "approval_request",
      arguments: { entity: id, action: "task.close", payload: {}, clientRequestId: "close-once" },
    });
    expect((repeated.structuredContent as { phase: string }).phase).toBe("applied");
    expect(readEvents(root, id).filter((event) => event.kind === "approval")).toHaveLength(3);
  });

  test("records a rejection and leaves lifecycle state unchanged", async () => {
    const root = fixture();
    const { client } = await connect(root, "reject");
    const id = await createAndDefine(client, root);
    await client.callTool({ name: "task_message_record", arguments: { task: id, role: "human", text: "ok, mehet" } });
    expect(findTask(root, id).state).toBe("defined");
    expect(readEvents(root, id).filter((event) => event.kind === "approval")).toEqual([]);
    const result = await client.callTool({
      name: "approval_request",
      arguments: { entity: id, action: "task.cancel", payload: { resolution: "cancelled", reason: "The work is objectless" } },
    });
    expect(result.isError).not.toBe(true);
    expect(findTask(root, id).state).toBe("defined");
    expect(readEvents(root, id).filter((event) => event.kind === "approval").map((event) => event.phase)).toEqual(["proposed", "rejected"]);
  });

  test("resolves amend-spec through caller-chat approval and records the named specification nodes", async () => {
    const root = fixture();
    const connected = await connect(root, "approve");
    const specId = landGlossaryNode(root);
    const captured = JSON.parse(execFileSync("node", [
      cli, "observation", "new",
      "--title", "The disposition glossary is incomplete",
      "--type", "inconsistency",
      "--evidence", "The accepted specification now defines amend-spec.",
      "--json",
    ], { cwd: root, encoding: "utf8" })) as { data: { id: string } };
    const id = captured.data.id;

    const resolved = await connected.client.callTool({
      name: "approval_request",
      arguments: {
        entity: id,
        action: "observation.resolve",
        payload: { disposition: "amend-spec", spec: [specId] },
      },
    });

    expect(resolved.isError).not.toBe(true);
    expect(JSON.stringify(connected.prompt())).toContain(`--spec ${specId}`);
    expect(readWorkspace(root).observations.find((observation) => observation.id === id)).toMatchObject({
      status: "resolved",
      disposition: "amend-spec",
      spec: [specId],
    });
    const approvalPayloads = readEvents(root, id)
      .filter((event) => event.kind === "approval")
      .map((event) => event.payload);
    expect(approvalPayloads).toEqual([
      expect.objectContaining({ disposition: "amend-spec", spec: [specId] }),
      expect.objectContaining({ disposition: "amend-spec", spec: [specId] }),
      expect.objectContaining({ disposition: "amend-spec", spec: [specId] }),
    ]);
  });

  test("amends an already-defined task through the MCP define tool", async () => {
    const root = fixture();
    const connected = await connect(root);
    const id = await createAndDefine(connected.client, root);
    expect(findTask(root, id).state).toBe("defined");

    const amendedDefinition = definition(id)
      .replace(`id: ${id}`, `id: ${id}\ntitle: Revised caller chat task`)
      .replaceAll("Caller chat task", "Revised caller chat task");
    const amended = await connected.client.callTool({ name: "task_define", arguments: { id, definition: amendedDefinition } });

    expect(amended.isError).not.toBe(true);
    const location = findTask(root, id);
    expect(location.state).toBe("defined");
    expect(location.filename).toBe(`revised-caller-chat-task-${id.slice(-8)}.md`);
    expect(readFileSync(location.path, "utf8")).toContain("title: Revised caller chat task");
    expect(readEvents(root, id).at(-1)).toMatchObject({ state: "defined", summary: "Task definition amended before execution." });
    expect(execFileSync("git", ["status", "--porcelain", "--", ".kotta"], { cwd: root, encoding: "utf8" })).toBe("");
  });

  test("accepts named review evidence and refuses duplicated answers through MCP", async () => {
    const root = fixture();
    const connected = await connect(root);
    const id = await createAndDefine(connected.client, root);
    const first = "Caller-chat approval is recorded.";
    const second = "The submitted task remains auditable.";
    const mappedDefinition = definition(id).replace(
      "- Human approval is recorded from host-chat elicitation.",
      `- ${first}\n- ${second}`,
    ).replace(
      `  "Human approval is recorded from host-chat elicitation.": [${MCP_TASK_SPEC_ID}]`,
      `  "${first}": [${MCP_TASK_SPEC_ID}]\n  "${second}": [${MCP_TASK_SPEC_ID}]`,
    );
    const mapped = await connected.client.callTool({ name: "task_define", arguments: { id, definition: mappedDefinition } });
    expect(mapped.isError).not.toBe(true);
    await connected.client.callTool({ name: "task_start_caller", arguments: { id, agent: "codex" } });

    const duplicate = await connected.client.callTool({
      name: "task_submit_review",
      arguments: { id, evidence: { [first]: "one copied blob", [second]: "one   copied\nblob" } },
    });
    expect(duplicate.isError).toBe(true);
    expect(JSON.stringify(duplicate.structuredContent)).toContain(first);
    expect(JSON.stringify(duplicate.structuredContent)).toContain(second);
    expect(findTask(root, id).state).toBe("active");

    const distinct = await connected.client.callTool({
      name: "task_submit_review",
      arguments: { id, evidence: { [first]: "approval event phases inspected", [second]: "review record inspected on the control plane" } },
    });
    expect(distinct.isError).not.toBe(true);
    expect(findTask(root, id).state).toBe("review");
  });

  test("retires a defined task from the caller chat, with the reason and the supersession in the prompt", async () => {
    const root = fixture();
    const connected = await connect(root);
    const id = await createAndDefine(connected.client, root);
    expect(findTask(root, id).state).toBe("defined");

    const unnamed = await connected.client.callTool({
      name: "approval_request",
      arguments: { entity: id, action: "task.cancel", payload: { resolution: "obsolete", reason: "A decision settled the opposite" } },
    });
    expect(unnamed.isError).toBe(true);
    expect(JSON.stringify(unnamed.structuredContent)).toContain("supersededBy");
    expect(findTask(root, id).state).toBe("defined");

    const retired = await connected.client.callTool({
      name: "approval_request",
      arguments: { entity: id, action: "task.cancel", payload: { resolution: "cancelled", reason: "The work is objectless" } },
    });
    expect(retired.isError).not.toBe(true);
    // The human is shown what ends and why, not only which command runs.
    expect(JSON.stringify(connected.prompt())).toContain("The work is objectless");
    expect(findTask(root, id).state).toBe("done");
    // The chat-surface approval leaves a receipt on the retired task, its basis linking the
    // visible human message that carried the yes.
    const retiredFile = readFileSync(findTask(root, id).path, "utf8");
    // The cancel's own visible yes is the last human message; its id is what the basis links.
    const cancelYes = readEvents(root, id).filter((event) => event.kind === "message" && event.role === "human").at(-1);
    expect(retiredFile).toContain("approved_by: caller-chat");
    expect(retiredFile).toMatch(/approved_at: /);
    expect(retiredFile).toContain(`caller-chat yes (${cancelYes?.id}): task.cancel`);
    // The refused proposal above never reached the event log; only the cancel did.
    const phases = readEvents(root, id).filter((event) => event.kind === "approval").map((event) => event.phase);
    expect(phases).toEqual(["proposed", "approved", "applied"]);
  });

  test("fails closed when the calling host cannot present elicitation", async () => {
    const root = fixture();
    const client = await connectWithoutElicitation(root);
    const id = await createAndDefine(client, root);
    const result = await client.callTool({
      name: "approval_request",
      arguments: { entity: id, action: "task.cancel", payload: { resolution: "cancelled", reason: "The work is objectless" } },
    });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.structuredContent)).toContain("Nothing was applied");
    expect(findTask(root, id).state).toBe("defined");
    expect(readEvents(root, id).filter((event) => event.kind === "approval").map((event) => event.phase)).toEqual(["proposed", "failed"]);
  });
});
