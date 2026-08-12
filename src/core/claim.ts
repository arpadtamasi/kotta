import { CONTRACT_ID } from "./identity.js";

export interface ClaimData {
  contract?: unknown;
  agent?: unknown;
  branch?: unknown;
  worktree?: unknown;
  /** Whether Kotta made the branch and worktree, or adopted what the environment provided. */
  origin?: unknown;
  started_at?: unknown;
}

export function validateClaim(data: ClaimData): string[] {
  const errors: string[] = [];
  if (!CONTRACT_ID.test(String(data.contract ?? ""))) errors.push("contract must be a minted id, T-001, or an imported O-1 identifier");
  if (!String(data.agent ?? "").trim()) errors.push("agent is required");
  if (!String(data.branch ?? "").trim()) errors.push("branch is required");
  if (!String(data.worktree ?? "").trim()) errors.push("worktree is required");
  if (data.origin !== undefined && !["created", "adopted"].includes(String(data.origin))) errors.push("origin must be created or adopted");
  if (Number.isNaN(Date.parse(String(data.started_at ?? "")))) errors.push("started_at must be an ISO timestamp");
  return errors;
}
