import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, test } from "vitest";
import { createKottaMcpServer } from "../../src/commands/mcp.js";
import { OPERATIONS, OPERATION_EFFECTS, REPORTING_VERBS, WRITING_STEMS, declaredCliCommands, declaredMcpTools, exposed, expandOperations } from "../../src/core/operations.js";

/**
 * The registry is total (BR-01m0nsyasfnjc9s4073r8zb33j): both surfaces are derived from the code
 * as sets and compared against the declaration. Nothing here counts anything — the observation
 * that produced this rule was a task pinned to "40 subcommands" and "10 tools" when the code had
 * 44 and 18, and 43 and 19 four days later. A set comparison stays true as the surface grows.
 */

const cli = resolve("dist/cli/index.js");

const clients: Client[] = [];
const servers: ReturnType<typeof createKottaMcpServer>[] = [];

afterEach(async () => {
  await Promise.all([...clients.splice(0).map((client) => client.close()), ...servers.splice(0).map((server) => server.close())]);
});

function help(path: string[]): string {
  const result = spawnSync("node", [cli, ...path, "--help"], { encoding: "utf8", env: { ...process.env, COLUMNS: "80" } });
  return `${result.stdout}${result.stderr}`;
}

/** Every invocable command path the built binary offers; groups are containers, not operations. */
function cliCommands(path: string[] = []): string[] {
  const section = /\nCommands:\n([\s\S]*)$/.exec(help(path))?.[1] ?? "";
  const children = section.split(/\r?\n/)
    .map((line) => /^\s{2}(\S+)/.exec(line)?.[1])
    .filter((name): name is string => Boolean(name) && name !== "help");
  return children.flatMap((name) => {
    const nested = cliCommands([...path, name]);
    return nested.length ? nested : [[...path, name].join(" ")];
  });
}

async function mcpTools(): Promise<string[]> {
  const server = createKottaMcpServer(process.cwd());
  const client = new Client({ name: "registry-totality", version: "0" });
  servers.push(server);
  clients.push(client);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  const { tools } = await client.listTools();
  return tools.map((tool) => tool.name).sort();
}

describe("the operation registry is total", () => {
  // EX-01m0psa97ffhvt91tgbanbt8mz — a surface name without a declaration fails the build — is what
  // the two set comparisons below demonstrate, in both directions.
  test("every CLI command traces to a declaration, and every declared command exists", () => {
  // Roughly sixty process spawns against the built binary at ~0.4s each; the default 15s timeout
  // was always marginal for that and tipped over as the surface grew. The walk is the point of the
  // test, so the budget moves rather than the coverage.
    expect(cliCommands().sort()).toEqual(declaredCliCommands());
  }, 120_000);

  test("every MCP tool traces to a declaration, and every declared tool exists", async () => {
    expect(await mcpTools()).toEqual(declaredMcpTools());
  });

  test("an operation absent from a surface says why, and an id belongs to neither surface", () => {
    for (const operation of OPERATIONS) {
      if (!exposed(operation.cli)) expect(operation.cli.absent.trim().length, `${operation.id} cli`).toBeGreaterThan(20);
      if (!exposed(operation.mcp)) expect(operation.mcp.absent.trim().length, `${operation.id} mcp`).toBeGreaterThan(20);
      expect(operation.summary.trim().length, `${operation.id} summary`).toBeGreaterThan(0);
      // The identity is neither spelling: no underscores (MCP) and no spaces (CLI).
      expect(operation.id, `${operation.id} identity`).toMatch(/^[a-z]+\.[a-z-]+$/);
      expect(exposed(operation.cli) || exposed(operation.mcp), `${operation.id} reaches no surface`).toBe(true);
    }
  });

  test("every operation declares whether it reads or writes", () => {
    // Required, like a surface name: an entry that is silent about its effect is the caller being
    // left to guess, which is the state this rule exists to end (BR-01m0nsyasfnjc9s4073r8zb33j).
    for (const operation of OPERATIONS) {
      expect(OPERATION_EFFECTS, `${operation.id} declares no effect`).toContain(operation.effect);
    }
    expect(expandOperations().every((operation) => OPERATION_EFFECTS.includes(operation.effect))).toBe(true);
  });

  test("an operation that writes is not summarised as a report", () => {
    // "A declaration that names an operation for what it reports says so when the operation also
    // writes." Two entries broke this: `validate` and `batch validate` both promote a backlog batch
    // to defined and commit, under summaries that said only that they validate.
    const misdescribed = OPERATIONS.filter((operation) => {
      if (operation.effect !== "writes") return false;
      const summary = operation.summary.toLowerCase();
      const opens = REPORTING_VERBS.some((verb) => summary.startsWith(verb));
      return opens && !WRITING_STEMS.some((stem) => new RegExp(`\\b${stem}`).test(summary));
    });

    expect(misdescribed.map((operation) => `${operation.id}: ${operation.summary}`)).toEqual([]);
  });

  test("declarations and expansions are unique, so no surface name has two owners", () => {
    const ids = expandOperations().map((operation) => operation.id);
    expect([...new Set(ids)]).toEqual(ids);
    const commands = declaredCliCommands();
    expect([...new Set(commands)]).toEqual(commands);
    const tools = declaredMcpTools();
    expect([...new Set(tools)]).toEqual(tools);
  });
});
