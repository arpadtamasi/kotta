import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, test } from "vitest";
import { createKottaMcpServer } from "../../src/commands/mcp.js";

/**
 * The two surfaces, captured as they are. `T-01kzda6nj9hd2z45tt06fw8n0g` derives both from one
 * operation registry, and the only proof that a derivation preserved behaviour is a picture of the
 * behaviour taken beforehand. So these snapshots are the baseline: they are read from the built
 * binary and from a live server rather than from the source, and a diff in either file after the
 * registry lands means the refactor changed what it promised not to.
 *
 * They are equally the standing guard afterwards (BR-01m0nsyasfnjc9s4073r8zb33j): no count is
 * asserted anywhere, because a count is stale by the time it is read — the whole surface is.
 */

const cli = resolve("dist/cli/index.js");

const clients: Client[] = [];
const servers: ReturnType<typeof createKottaMcpServer>[] = [];

afterEach(async () => {
  await Promise.all([...clients.splice(0).map((client) => client.close()), ...servers.splice(0).map((server) => server.close())]);
});

/** Help text for one command path. Commander wraps to 80 columns off a TTY, so this is stable. */
function help(path: string[]): string {
  const result = spawnSync("node", [cli, ...path, "--help"], { encoding: "utf8", env: { ...process.env, COLUMNS: "80" } });
  return `${result.stdout}${result.stderr}`.trimEnd();
}

/** The command names a help text lists, in the order the CLI prints them. */
function subcommands(text: string): string[] {
  const section = /\nCommands:\n([\s\S]*)$/.exec(text)?.[1] ?? "";
  return section.split(/\r?\n/)
    .map((line) => /^\s{2}(\S+)/.exec(line)?.[1])
    .filter((name): name is string => Boolean(name) && name !== "help");
}

/** Every reachable command path, walked from the root the way an operator discovers them. */
function walk(path: string[] = []): Array<{ path: string[]; text: string }> {
  const text = help(path);
  const children = subcommands(text).flatMap((name) => walk([...path, name]));
  return [{ path, text }, ...children];
}

describe("the surfaces Kotta exposes", () => {
  test("the CLI surface, read from the built binary", () => {
  // Roughly sixty process spawns against the built binary at ~0.4s each; the default 15s timeout
  // was always marginal for that and tipped over as the surface grew. The walk is the point of the
  // test, so the budget moves rather than the coverage.
    const surface = walk().map(({ path, text }) => `### kotta ${path.join(" ")}\n${text}`).join("\n\n");
    expect(surface).toMatchSnapshot();
  }, 120_000);

  test("the MCP tool surface, read from a live server", async () => {
    const server = createKottaMcpServer(process.cwd());
    const client = new Client({ name: "surface-snapshot", version: "0" });
    servers.push(server);
    clients.push(client);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const { tools } = await client.listTools();
    const surface = [...tools]
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((tool) => ({
        name: tool.name,
        title: tool.title ?? null,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations ?? null,
      }));
    expect(surface).toMatchSnapshot();
  });
});
