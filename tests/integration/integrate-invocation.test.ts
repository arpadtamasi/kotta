import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

/**
 * A written invocation is proved, not hoped (BR-01m0qyxvz954ay2rbm00bazrd5,
 * EX-01m0qyxvz926gdbvzm4bfxzn2w).
 *
 * `command = "kotta"` was a hope about a PATH Kotta cannot see. It fails in exactly the shells
 * Kotta sends work into — a non-interactive shell loads no version manager — and it fails in this
 * repository's own session, where `which kotta` finds nothing while Kotta is running. The decisive
 * test here spawns the recorded invocation with an empty environment: no PATH at all.
 */

const cli = resolve("dist/cli/index.js");
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const say = (result: { stdout: string; stderr: string }) => `${result.stdout}${result.stderr}`;

function fixture(label: string) {
  const root = mkdtempSync(join(tmpdir(), `kotta-invocation-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Kotta Test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", "initial"], { cwd: root });
  const init = attempt(root, ["init", "--json"]);
  if (init.status !== 0) throw new Error(say(init));
  return { root, config: join(root, ".codex", "config.toml") };
}

/** The command and arguments the written block records, read back the way a host would. */
function recorded(config: string): { command: string; args: string[] } {
  const text = readFileSync(config, "utf8");
  const command = /^command = "((?:[^"\\]|\\.)*)"/m.exec(text)?.[1] ?? "";
  const args = [...(/^args = \[(.*)\]$/m.exec(text)?.[1] ?? "").matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((match) => match[1]);
  return { command, args };
}

describe("a written invocation is proved, not hoped", () => {
  test("the recorded invocation starts Kotta with no PATH at all", () => {
    const { root, config } = fixture("empty-env");
    expect(attempt(root, ["integrate", "codex"]).status).toBe(0);

    const { command, args } = recorded(config);
    expect(command, "the interpreter is named by absolute path").toMatch(/^\//);
    expect(existsSync(command), `${command} exists`).toBe(true);
    expect(args[0], "and so is Kotta's own entry point").toMatch(/^\/.*index\.js$/);
    expect(existsSync(args[0])).toBe(true);
    expect(command, "the bare name is gone").not.toBe("kotta");

    // env -i in one call: no PATH, no HOME, nothing a version manager could have set.
    const handshake = JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "probe", version: "0" } },
    });
    const server = spawnSync(command, args, { cwd: root, input: `${handshake}\n`, encoding: "utf8", env: {} });
    expect(server.error, "the host can spawn it").toBeUndefined();
    expect(server.stdout, "and it answers as the Kotta server").toContain('"serverInfo"');
    expect(server.stdout).toContain('"name":"kotta"');
  }, 60_000);

  test("a second run changes no bytes", () => {
    const { root, config } = fixture("idempotent");
    attempt(root, ["integrate", "codex"]);
    const first = readFileSync(config, "utf8");

    const again = attempt(root, ["integrate", "codex"]);
    expect(again.status).toBe(0);
    expect(say(again)).toContain("already configured");
    expect(readFileSync(config, "utf8")).toBe(first);
  }, 60_000);

  test("a recorded command that is gone is named, not passed over", () => {
    const { root, config } = fixture("stale");
    attempt(root, ["integrate", "codex"]);
    const gone = join(root, "removed", "node");
    writeFileSync(config, readFileSync(config, "utf8").replace(/^command = ".*"$/m, `command = "${gone}"`));

    const result = attempt(root, ["integrate", "codex"]);
    const said = say(result);
    expect(said, "the vanished command is named").toContain(gone);
    expect(said, "and so is the one that would work").toContain(process.execPath);
    expect(said, "the host is not reported as configured and done").not.toMatch(/are already configured/);
    expect(readFileSync(config, "utf8"), "a human's edits are not overwritten").toContain(gone);

    const json = JSON.parse(say(attempt(root, ["integrate", "codex", "--json"]))) as { data: { resolves: boolean; recorded: string; replacement: string } };
    expect(json.data.resolves).toBe(false);
    expect(json.data.recorded).toBe(gone);
    expect(json.data.replacement).toBe(process.execPath);
  }, 60_000);
});
