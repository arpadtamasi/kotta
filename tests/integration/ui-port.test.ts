import { createServer, type Server } from "node:http";
import { describe, expect, test } from "vitest";
import { DEFAULT_UI_PORT, UI_PORT_RETRY_BOUND, bindUiServer, isAddressInUse, uiPortCandidates, validateUiPort } from "../../src/commands/ui.js";

const HOST = "127.0.0.1";

const idleServer = () => createServer(() => {});

const close = (server: Server) => new Promise<void>((resolve) => { server.listening ? server.close(() => resolve()) : resolve(); });

/** Binds an ephemeral port, then releases it — the freed number is a base no other suite is parked on. */
const freeBasePort = async (): Promise<number> => {
  const probe = idleServer();
  await new Promise<void>((resolve) => probe.listen(0, HOST, resolve));
  const port = (probe.address() as { port: number }).port;
  await close(probe);
  return port;
};

/**
 * A run of consecutive ports, all held. `freeBasePort` finds one free port, and these tests then
 * assumed its neighbours were free too — true when the suite runs alone and false under load, where
 * another test binds one of them between the probe and the occupation. The run is claimed as a whole
 * or released and retried, so the test asserts what it means to and not the machine's luck.
 */
const occupyRun = async (count: number): Promise<{ base: number; held: Server[] }> => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const base = await freeBasePort();
    const held: Server[] = [];
    try {
      for (let index = 0; index < count; index += 1) held.push(await occupy(base + index));
      return { base, held };
    } catch {
      for (const listener of held) await close(listener);
    }
  }
  throw new Error(`No run of ${count} consecutive free ports on ${HOST} after 40 attempts.`);
};

const occupy = async (port: number): Promise<Server> => {
  const server = idleServer();
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(port, HOST, resolve); });
  return server;
};

describe("ui port candidates", () => {
  test("an explicit port is the only candidate", () => {
    expect(uiPortCandidates(4399)).toEqual([4399]);
  });

  test("an omitted port walks upwards from the default within the retry bound", () => {
    const candidates = uiPortCandidates();
    expect(candidates[0]).toBe(DEFAULT_UI_PORT);
    expect(candidates).toHaveLength(UI_PORT_RETRY_BOUND);
    expect(candidates[candidates.length - 1]).toBe(DEFAULT_UI_PORT + UI_PORT_RETRY_BOUND - 1);
  });

  test("candidates stop at the maximum port instead of overflowing", () => {
    expect(uiPortCandidates(undefined, 65530)).toEqual([65530, 65531, 65532, 65533, 65534, 65535]);
  });

  test("only EADDRINUSE is eligible for fallback", () => {
    expect(isAddressInUse(Object.assign(new Error("in use"), { code: "EADDRINUSE" }))).toBe(true);
    expect(isAddressInUse(Object.assign(new Error("denied"), { code: "EACCES" }))).toBe(false);
    expect(isAddressInUse(new Error("plain"))).toBe(false);
  });

  test("out-of-range explicit ports are rejected, while 0 stays a legal ephemeral request", () => {
    expect(() => validateUiPort(70000)).toThrow(/between 0 and 65535/);
    expect(() => validateUiPort(-1)).toThrow(/between 0 and 65535/);
    expect(() => validateUiPort(4311.5)).toThrow(/between 0 and 65535/);
    expect(() => validateUiPort(0)).not.toThrow();
  });
});

describe("ui server binding", () => {
  test("a free base port binds without fallback", async () => {
    const base = await freeBasePort();
    const server = idleServer();
    try {
      expect(await bindUiServer(server, HOST, undefined, base)).toEqual({ port: base, fallback: false });
    } finally { await close(server); }
  });

  test("one collision advances to the next port and leaves the existing listener alone", async () => {
    const base = await freeBasePort();
    const existing = await occupy(base);
    const server = idleServer();
    try {
      expect(await bindUiServer(server, HOST, undefined, base)).toEqual({ port: base + 1, fallback: true });
      expect(existing.listening).toBe(true);
    } finally { await close(server); await close(existing); }
  });

  test("consecutive collisions advance in ascending order", async () => {
    // Three consecutive ports: two to hold, and the third free for the bind to land on.
    const { base, held } = await occupyRun(3);
    const third = held.pop()!;
    await close(third);
    const server = idleServer();
    try {
      expect(await bindUiServer(server, HOST, undefined, base)).toEqual({ port: base + 2, fallback: true });
    } finally { await close(server); for (const listener of held) await close(listener); }
  });

  test("an explicit occupied port fails without selecting a neighbour", async () => {
    const base = await freeBasePort();
    const existing = await occupy(base);
    const server = idleServer();
    try {
      await expect(bindUiServer(server, HOST, base)).rejects.toThrow(`Port ${base} on ${HOST} is already in use.`);
      expect(server.listening).toBe(false);
    } finally { await close(server); await close(existing); }
  });

  test("exhausting the retry bound explains how to supply an explicit port", async () => {
    const { base, held } = await occupyRun(UI_PORT_RETRY_BOUND);
    const server = idleServer();
    try {
      await expect(bindUiServer(server, HOST, undefined, base)).rejects.toThrow(`Ports ${base}-${base + UI_PORT_RETRY_BOUND - 1} on ${HOST} are all in use.`);
    } finally { await close(server); for (const listener of held) await close(listener); }
  });

  test("an explicit 0 reports the ephemeral port the OS handed out", async () => {
    const server = idleServer();
    try {
      const result = await bindUiServer(server, HOST, 0);
      expect(result.fallback).toBe(false);
      expect(result.port).toBeGreaterThan(0);
      expect(result.port).toBe((server.address() as { port: number }).port);
    } finally { await close(server); }
  });

  test("a non-collision failure is not retried", async () => {
    const server = idleServer();
    try {
      // Port 1 only fails for non-root processes; binding a TEST-NET-3 address fails with
      // EADDRNOTAVAIL for any user, so the non-collision path is exercised as root too.
      await expect(bindUiServer(server, "203.0.113.1", undefined, 1)).rejects.toThrow(/EACCES|EADDRNOTAVAIL|EPERM/);
    } finally { await close(server); }
  });
});
