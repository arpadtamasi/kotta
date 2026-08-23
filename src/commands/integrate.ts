import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { findRepositoryRoot } from "../filesystem/workspace.js";

/**
 * A written invocation is proved, not hoped (BR-01m0qyxvz954ay2rbm00bazrd5).
 *
 * The interpreter running Kotta and the absolute path of Kotta's own entry point — both facts the
 * running process already holds. `command = "kotta"` was a hope about a PATH Kotta cannot see, and
 * it fails in exactly the shells Kotta sends work into: a non-interactive shell loads no version
 * manager, so a binary installed through one is simply absent. Naming `dist/cli/index.js` alone
 * would not fix it either — its shebang defers the same hope to `env`.
 */
export function kottaInvocation(): { command: string; entry: string } {
  return { command: process.execPath, entry: fileURLToPath(new URL("../cli/index.js", import.meta.url)) };
}

/** TOML basic strings escape a backslash and a quote; Windows paths carry the first. */
function toml(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

export function codexMcpConfig(invocation = kottaInvocation()): string {
  return `[mcp_servers.kotta]
command = ${toml(invocation.command)}
args = [${toml(invocation.entry)}, "mcp", "--workspace", "."]
enabled = true
required = false
startup_timeout_sec = 10
tool_timeout_sec = 120
default_tools_approval_mode = "auto"

[mcp_servers.kotta.tools.approval_request]
approval_mode = "approve"
`;
}

const BLOCK = /^\s*\[mcp_servers\.kotta\]\s*$/m;
/** The command line of an already-recorded block, so a stale invocation can be named. */
const RECORDED = /^\s*\[mcp_servers\.kotta\]\s*$[\s\S]*?^\s*command\s*=\s*"((?:[^"\\]|\\.)*)"/m;

export function integrateCodex(repositoryRoot?: string) {
  const root = findRepositoryRoot(repositoryRoot);
  const directory = join(root, ".codex");
  const path = join(directory, "config.toml");
  mkdirSync(directory, { recursive: true });
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";

  if (BLOCK.test(existing)) {
    // A configuration a human may have edited is never rewritten from under them. But reporting it
    // as complete when the command it names has gone is the failure this rule removes, so the
    // stale invocation is named and the caller is told what would replace it.
    const recorded = RECORDED.exec(existing)?.[1].replaceAll('\\"', '"').replaceAll("\\\\", "\\") ?? null;
    const resolves = recorded !== null && (existsSync(recorded) || !recorded.includes("/"));
    const stale = recorded !== null && !existsSync(recorded);
    return {
      ok: true,
      command: "integrate codex",
      data: { path, changed: false, recorded, resolves: resolves && !stale, replacement: stale ? kottaInvocation().command : null },
    };
  }

  const prefix = existing && !existing.endsWith("\n") ? `${existing}\n` : existing;
  const separator = prefix.trim() ? "\n# Kotta caller-chat control plane\n" : "";
  writeFileSync(path, `${prefix}${separator}${codexMcpConfig()}`);
  return { ok: true, command: "integrate codex", data: { path, changed: true, recorded: kottaInvocation().command, resolves: true, replacement: null } };
}
