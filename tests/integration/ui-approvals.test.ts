import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { uiCommand } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");
const servers: Server[] = [];

async function stop(server: Server): Promise<void> {
  await new Promise<void>((done, fail) => {
    server.close((error) => error ? fail(error) : done());
    server.closeAllConnections();
  });
}
afterEach(async () => { await Promise.all(servers.splice(0).map(stop)); });

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-ui-readonly-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  return root;
}

async function start(root: string): Promise<string | null> {
  let server: Server;
  try { server = await uiCommand({ workspace: root, port: 0, host: "127.0.0.1", open: false }, async () => undefined); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EPERM") return null;
    throw error;
  }
  servers.push(server);
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}

describe("read-only Kotta board API", () => {
  test("serves canonical state but rejects every historical write endpoint", async () => {
    const base = await start(fixture());
    if (!base) return;
    const workspace = await fetch(`${base}/api/workspace`);
    expect(workspace.status).toBe(200);

    for (const path of [
      "/api/chat",
      "/api/approval/propose",
      "/api/approval/decide",
      "/api/task/sign",
      "/api/batch",
      "/api/batch/tasks",
      "/api/observation",
      "/api/observation/resolve",
    ]) {
      const response = await fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      const body = await response.json() as { error: string };
      expect(response.status, path).toBe(405);
      expect(body.error, path).toContain("board is read-only");
      expect(body.error, path).toContain("calling chat");
    }
  });
});
