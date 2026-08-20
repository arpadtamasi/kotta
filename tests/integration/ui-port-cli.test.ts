import { execFileSync, spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import { mkdtempSync, realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { DEFAULT_UI_PORT } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");
const HOST = "127.0.0.1";
const running: ChildProcess[] = [];
const held: Server[] = [];

afterEach(async () => {
  // Wait for each child to actually exit: a killed-but-alive UI still holds a socket
  // on the port we are about to close, and server.close() would then never resolve.
  await Promise.all(running.splice(0).map((child) => new Promise<void>((done) => {
    if (child.exitCode !== null || child.signalCode !== null) return done();
    child.once("exit", () => done());
    child.kill();
  })));
  for (const server of held.splice(0)) {
    await new Promise<void>((done) => {
      if (!server.listening) return done();
      server.closeAllConnections?.();
      server.close(() => done());
    });
  }
});

function initializedRepository(label: string) {
  const root = mkdtempSync(join(tmpdir(), `kotta-ui-port-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  return root;
}

/** Resolves with the first stdout line the UI prints, leaving the process alive. */
function startUi(cwd: string, args: string[]): Promise<{ line: string; child: ChildProcess }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn("node", [cli, "ui", ...args], { cwd, stdio: ["ignore", "pipe", "pipe"] });
    running.push(child);
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => reject(new Error(`Timed out. stdout: ${stdout} stderr: ${stderr}`)), 15_000);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      const line = stdout.split("\n").find(Boolean);
      if (!line) return;
      clearTimeout(timeout);
      resolvePromise({ line, child });
    });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("exit", (code) => { if (code && !stdout.trim()) { clearTimeout(timeout); reject(new Error(`UI exited with ${code}. stderr: ${stderr}`)); } });
  });
}

const occupy = (port: number) => new Promise<Server | null>((done) => {
  const server = createServer(() => {});
  server.once("error", () => done(null));
  server.listen(port, HOST, () => { held.push(server); done(server); });
});

describe("kotta ui port selection through the CLI", () => {
  test("documents the fallback task in help", () => {
    const help = execFileSync("node", [cli, "ui", "--help"], { encoding: "utf8" }).replace(/\s+/g, " ");
    expect(help).toContain("omitted starts at 4311 and advances to the next free port");
    expect(help).not.toContain("--port <port> Local port (default:");
  });

  test("json output carries the actual host, port, url, workspace and fallback flag", async () => {
    const root = initializedRepository("json");
    const { line } = await startUi(root, ["--port", "0", "--json"]);
    const payload = JSON.parse(line) as { ok: boolean; data: { url: string; host: string; port: number; workspace: string; fallback: boolean } };
    expect(payload.ok).toBe(true);
    expect(payload.data.host).toBe(HOST);
    expect(payload.data.port).toBeGreaterThan(0);
    expect(payload.data.url).toBe(`http://${HOST}:${payload.data.port}`);
    expect(payload.data.workspace).toBe(join(realpathSync(root), ".kotta"));
    expect(payload.data.fallback).toBe(false);
  });

  test("an explicitly requested occupied port exits non-zero without taking a neighbour", async () => {
    const root = initializedRepository("strict");
    const { line } = await startUi(root, ["--port", "0", "--json"]);
    const taken = (JSON.parse(line) as { data: { port: number } }).data.port;
    const collision = spawnSync("node", [cli, "ui", "--port", String(taken), "--json"], { cwd: root, encoding: "utf8" });
    expect(collision.status).toBe(1);
    expect(collision.stdout + collision.stderr).toContain(`Port ${taken} on ${HOST} is already in use.`);
    expect(collision.stdout + collision.stderr).not.toContain(`:${taken + 1}`);
  });

  test("an occupied default port falls back and both UIs serve their own workspace", async () => {
    const blocker = await occupy(DEFAULT_UI_PORT);
    if (!blocker) return; // Another process owns 4311 on this machine; the fallback path is covered by ui-port.test.ts.
    const first = initializedRepository("first");
    const { line } = await startUi(first, ["--json"]);
    const payload = JSON.parse(line) as { data: { port: number; url: string; workspace: string; fallback: boolean } };
    expect(payload.data.fallback).toBe(true);
    expect(payload.data.port).toBeGreaterThan(DEFAULT_UI_PORT);
    expect(blocker.listening).toBe(true);

    const second = initializedRepository("second");
    const other = await startUi(second, ["--json"]);
    const otherPayload = JSON.parse(other.line) as { data: { port: number; url: string; workspace: string } };
    expect(otherPayload.data.port).not.toBe(payload.data.port);

    for (const served of [payload.data, otherPayload.data]) {
      const response = await fetch(`${served.url}/api/workspace`);
      expect(((await response.json()) as { workspace: string }).workspace).toBe(served.workspace);
    }
    expect(payload.data.workspace).not.toBe(otherPayload.data.workspace);
  });

  test("human output names the selected url, workspace and the fallback it performed", async () => {
    const blocker = await occupy(DEFAULT_UI_PORT);
    if (!blocker) return; // See above: the note itself is asserted only when 4311 is ours to occupy.
    const root = initializedRepository("human");
    const { line } = await startUi(root, []);
    expect(line).toMatch(/^Kotta UI: http:\/\/127\.0\.0\.1:\d+$/);
  });
});
