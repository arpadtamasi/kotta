import { TASK_ID } from "./identity.js";

export interface ClaimData {
  task?: unknown;
  agent?: unknown;
  branch?: unknown;
  worktree?: unknown;
  /** Whether Kotta made the branch and worktree, or adopted what the environment provided. */
  origin?: unknown;
  /** Symbolic baseline ref and exact commit used when the execution branch was created. */
  start_ref?: unknown;
  start_commit?: unknown;
  /** Batch coordinator ref that proved reviewed dependencies were technically integrated. */
  dependency_integration_target?: unknown;
  started_at?: unknown;
}

export function validateClaim(data: ClaimData): string[] {
  const errors: string[] = [];
  if (!TASK_ID.test(String(data.task ?? ""))) errors.push("task must be a minted id, T-001, or an imported O-1 identifier");
  if (!String(data.agent ?? "").trim()) errors.push("agent is required");
  if (!String(data.branch ?? "").trim()) errors.push("branch is required");
  if (!String(data.worktree ?? "").trim()) errors.push("worktree is required");
  if (data.origin !== undefined && !["created", "adopted"].includes(String(data.origin))) errors.push("origin must be created or adopted");
  if ((data.start_ref === undefined) !== (data.start_commit === undefined)) errors.push("start_ref and start_commit must be recorded together");
  if (data.start_ref !== undefined && !String(data.start_ref).trim()) errors.push("start_ref must be non-empty");
  if (data.start_commit !== undefined && !/^[0-9a-f]{40,64}$/.test(String(data.start_commit))) errors.push("start_commit must be a full Git object id");
  if (data.dependency_integration_target !== undefined && !String(data.dependency_integration_target).trim()) errors.push("dependency_integration_target must be non-empty");
  if (Number.isNaN(Date.parse(String(data.started_at ?? "")))) errors.push("started_at must be an ISO timestamp");
  return errors;
}
