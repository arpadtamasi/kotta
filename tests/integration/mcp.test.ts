import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, test } from "vitest";
import { createKottaMcpServer } from "../../src/commands/mcp.js";
import { integrateCodex } from "../../src/commands/integrate.js";

/**
 * The calling chat reads the technical specification through these tools and writes nothing. There
 * is no process to drive from chat any more: no approval, no claim, no transition — so the server
 * carries read tools only, and refuses a pre-1.0 workspace like every other command.
 */

const cli = resolve("dist/cli/index.js");
const TERM = "GT-01m0c0000000000000000000mc";
const RULE = "GT-01m0c0000000000000000000mr";
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
  writeFileSync(join(root, ".kotta/spec/glossary-terms/caller-read-000000mc.md"), [
    "---", `id: ${TERM}`, "form: glossary-term", "title: Caller read", "---", "",
    "## Definition", "The calling chat reads the specification through tools.", "", "## Usage", "MCP fixture.", "", "## Non-examples", "A chat that edits the workspace.", "",
  ].join("\n"));
  writeFileSync(join(root, ".kotta/spec/glossary-terms/read-only-000000mr.md"), [
    "---", `id: ${RULE}`, "form: glossary-term", "title: The chat never writes", "accepted:", '  - "unimplemented: the fixture admits it on purpose"', "---", "",
    "## Definition", "Nothing.", "", "## Usage", "Here.", "", "## Non-examples", "A write.", "", "## Open decisions", "- Should the board show admissions?", "",
  ].join("\n"));
  writeFileSync(join(root, "keeps.ts"), `// ${TERM}\nexport const kept = true;\n`);
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-m", "init"], { cwd: root });
  return root;
}

async function connect(root: string) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createKottaMcpServer(root);
  servers.push(server);
  const client = new Client({ name: "kotta-test", version: "1.0.0" });
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  clients.push(client);
  return client;
}

describe("the specification tools", () => {
  test("every tool is a read, and there is no approval, task, observation or batch tool", async () => {
    const client = await connect(fixture());
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(["gap_report", "spec_list", "spec_show", "workspace_questions", "workspace_validate"]);
    for (const tool of tools) expect(tool.annotations?.readOnlyHint, `${tool.name} is read-only`).toBe(true);
  });

  test("spec_list lists every node, narrows to a form, and refuses an unregistered one by naming the registry", async () => {
    const client = await connect(fixture());
    const all = await client.callTool({ name: "spec_list", arguments: {} });
    const listed = (all.structuredContent as { data: { count: number; nodes: Array<{ id: string; form: string; title: string; path: string }> } }).data;
    expect(listed.count).toBe(2);
    expect(listed.nodes.map((node) => node.id).sort()).toEqual([RULE, TERM].sort());
    expect(listed.nodes.find((node) => node.id === TERM)).toMatchObject({ form: "glossary-term", title: "Caller read", path: ".kotta/spec/glossary-terms/caller-read-000000mc.md" });

    const narrowed = await client.callTool({ name: "spec_list", arguments: { form: "business-rule" } });
    expect((narrowed.structuredContent as { data: { nodes: Array<{ id: string }> } }).data.nodes).toEqual([]);
    const terms = await client.callTool({ name: "spec_list", arguments: { form: "glossary-term" } });
    expect((terms.structuredContent as { data: { nodes: Array<{ id: string }> } }).data.nodes.map((node) => node.id).sort()).toEqual([RULE, TERM].sort());

    const refused = await client.callTool({ name: "spec_list", arguments: { form: "nonesuch" } });
    expect(refused.isError).toBe(true);
    expect(String((refused.content as Array<{ text: string }>)[0].text)).toContain("use-case");
  });

  test("spec_show reads one node by full or short id, with its frontmatter and sections", async () => {
    const client = await connect(fixture());
    const shown = await client.callTool({ name: "spec_show", arguments: { id: `GT-${TERM.slice(-8)}` } });
    const node = (shown.structuredContent as { data: { id: string; form: string; title: string; frontmatter: Record<string, unknown>; sections: Record<string, string> } }).data;
    expect(node).toMatchObject({ id: TERM, form: "glossary-term", title: "Caller read" });
    expect(node.frontmatter.title).toBe("Caller read");
    expect(node.sections.definition).toBe("The calling chat reads the specification through tools.");
    expect(String((shown.content as Array<{ text: string }>)[0].text)).toContain("Caller read is a glossary-term");

    const missing = await client.callTool({ name: "spec_show", arguments: { id: "GT-nope" } });
    expect(missing.isError).toBe(true);
  });

  test("workspace_validate, workspace_questions and gap_report answer what the CLI answers", async () => {
    const root = fixture();
    const client = await connect(root);
    const validated = await client.callTool({ name: "workspace_validate", arguments: {} });
    expect((validated.structuredContent as { ok: boolean; data: { specNodes: number } })).toMatchObject({ ok: true, data: { specNodes: 2 } });

    const questions = await client.callTool({ name: "workspace_questions", arguments: {} });
    const asked = (questions.structuredContent as { data: { open: number; entities: Array<{ id: string }> } }).data;
    expect(asked.open).toBe(1);
    expect(asked.entities.map((entity) => entity.id)).toEqual([RULE]);

    const gap = await client.callTool({ name: "gap_report", arguments: {} });
    const report = (gap.structuredContent as { ok: boolean; data: { promises: unknown[]; acceptedGaps: Array<{ id: string }>; nodes: Array<{ id: string; evidence: unknown[] }> } });
    expect(report.ok).toBe(true);
    expect(report.data.promises).toEqual([]);
    expect(report.data.acceptedGaps.map((entry) => entry.id)).toEqual([RULE]);
    expect(report.data.nodes.find((node) => node.id === TERM)?.evidence).toHaveLength(1);
  });

  test("the tools write nothing", async () => {
    const root = fixture();
    const client = await connect(root);
    for (const name of ["spec_list", "workspace_validate", "workspace_questions", "gap_report"]) await client.callTool({ name, arguments: {} });
    await client.callTool({ name: "spec_show", arguments: { id: TERM } });
    expect(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" })).toBe("");
  });

  test("a pre-1.0 workspace is refused at server creation, naming the migration", () => {
    const root = fixture();
    mkdirSync(join(root, ".kotta/process/tasks"), { recursive: true });
    expect(() => createKottaMcpServer(root)).toThrow(/pre-1\.0 Kotta workspace shape[\s\S]*kotta migrate/);
  });

  test("integrate codex records the running interpreter and entry, with no approval tool block", () => {
    const root = fixture();
    const first = integrateCodex(root);
    expect(first.data.changed).toBe(true);
    const config = readFileSync(join(root, ".codex/config.toml"), "utf8");
    expect(config).toContain("[mcp_servers.kotta]");
    expect(config).toContain(`command = "${process.execPath}"`);
    expect(config).toContain('"mcp", "--workspace", "."');
    expect(config).not.toContain("approval_request");
    const second = integrateCodex(root);
    expect(second.data.changed).toBe(false);
    expect(readFileSync(join(root, ".codex/config.toml"), "utf8")).toBe(config);
  });
});
