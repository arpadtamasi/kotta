import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { workspacePath } from "../filesystem/workspace.js";

export interface WorkspaceConfig {
  baseBranch: string;
  protectedBranches: string[];
  branchPattern: string;
}

const DEFAULTS: WorkspaceConfig = { baseBranch: "main", protectedBranches: ["main", "master", "develop"], branchPattern: "{prefix}/{id}-{slug}" };

/**
 * The permission mode a launched agent runs under, or null when the workspace has
 * not stated one. Null is not a default mode: it means Kotta passes no flag and
 * the agent's own project settings decide, which is the caller's authority rather
 * than one Kotta granted. Widening it is an operator's deliberate act, recorded in
 * `.kotta/config.yaml` where it can be read, reviewed and revoked.
 */
export function readAgentPermissionMode(root: string): string | null {
  const path = workspacePath(root, "config.yaml");
  if (!existsSync(path)) return null;
  const parsed = parse(readFileSync(path, "utf8")) as { agents?: { permission_mode?: unknown } } | null;
  const mode = parsed?.agents?.permission_mode;
  return typeof mode === "string" && mode.trim() ? mode.trim() : null;
}

/** Reads the git section of the workspace config.yaml, falling back to the values `init` writes. */
export function readWorkspaceConfig(root: string): WorkspaceConfig {
  const path = workspacePath(root, "config.yaml");
  if (!existsSync(path)) return { ...DEFAULTS };
  const parsed = parse(readFileSync(path, "utf8")) as { git?: { base_branch?: unknown; protected_branches?: unknown; branch_pattern?: unknown } } | null;
  const baseBranch = typeof parsed?.git?.base_branch === "string" && parsed.git.base_branch.trim() ? parsed.git.base_branch.trim() : DEFAULTS.baseBranch;
  const configured = Array.isArray(parsed?.git?.protected_branches) ? parsed.git.protected_branches.map(String) : DEFAULTS.protectedBranches;
  // Required by the schema and written by `init` since the beginning, and read by nothing until
  // now: an agent quoted it as the rule that named its branch, and it was not (F-01kztt3mce0yk9pm7jd9dex3w5).
  const branchPattern = typeof parsed?.git?.branch_pattern === "string" && parsed.git.branch_pattern.trim() ? parsed.git.branch_pattern.trim() : DEFAULTS.branchPattern;
  // The base branch is protected whether or not the operator listed it.
  return { baseBranch, protectedBranches: [...new Set([...configured, baseBranch])], branchPattern };
}
