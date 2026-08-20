import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { parse } from "yaml";
import { findRepositoryRoot, processPath, regenerateIndex } from "../filesystem/workspace.js";
import { findContract } from "../filesystem/entities.js";
import { parseMarkdown, renderMarkdown } from "../core/markdown.js";
import { appendLifecycleEvent } from "../core/events.js";
import { git } from "../git/git.js";
import { validateClaim } from "../core/claim.js";
import { commitControlState, controlPlaneRoot, withControlPlaneMutation } from "../git/control-plane.js";

interface LocatedClaim { path: string; worktree: string; data: Record<string, unknown> }

function allWorktrees(root: string): string[] {
  return git(root, ["worktree", "list", "--porcelain"]).split(/\r?\n/).filter((line) => line.startsWith("worktree ")).map((line) => line.slice(9));
}

function claims(root: string): LocatedClaim[] {
  return allWorktrees(root).flatMap((worktree) => {
    const directory = processPath(worktree, "claims");
    if (!existsSync(directory)) return [];
    return readdirSync(directory).filter((name) => name.endsWith(".yaml")).map((name) => ({ path: join(directory, name), worktree, data: parse(readFileSync(join(directory, name), "utf8")) as Record<string, unknown> }));
  });
}

export function listClaims() {
  const root = findRepositoryRoot();
  const controlRoot = controlPlaneRoot(root);
  const canonical = claims(root).filter(({ worktree }) => resolve(worktree) === controlRoot);
  return { ok: true, command: "claim list", data: { claims: canonical.map(({ data, worktree }) => ({ ...data, located_in: worktree, valid: validateClaim(data).length === 0 })) } };
}

/**
 * `contract start` moves a contract from defined to active and writes the claim. Release is its
 * documented inverse, so deleting the claim without returning the contract left it active with no
 * claim, which no command accepts. The branch and the worktree stay on the record because release
 * preserves them on disk, and start reuses them by name.
 */
function returnContractToDefined(root: string, id: string): void {
  const contract = findContract(root, id);
  if (contract.state !== "active") return;
  const entity = parseMarkdown(readFileSync(contract.path, "utf8"));
  entity.data.status = "defined";
  delete entity.data.assigned_agent;
  delete entity.data.execution_mode;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const directory = processPath(root, "defined");
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, contract.filename), renderMarkdown(entity.data, entity.content));
  unlinkSync(contract.path);
  regenerateIndex(root);
  appendLifecycleEvent(root, id, "defined", "Claim released; the contract returned to defined with its branch and worktree preserved.");
}

export function releaseClaim(id: string, force: boolean) {
  if (!force) throw new Error("Claim release is a recovery operation. Re-run with --force after checking the worktree.");
  const callerRoot = findRepositoryRoot();
  return withControlPlaneMutation(callerRoot, (controlRoot) => {
    const path = processPath(controlRoot, "claims", `${id}.yaml`);
    if (!existsSync(path)) throw new Error(`Claim for ${id} was not found on the control plane.`);
    const data = parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const errors = validateClaim(data);
    if (errors.length) throw new Error(`Claim for ${id} is invalid: ${errors.join(", ")}. Repair it before release.`);
    const recorded = String(data.worktree);
    const executionWorktree = isAbsolute(recorded) ? recorded : resolve(controlRoot, recorded);
    if (!existsSync(executionWorktree)) throw new Error(`Execution worktree ${executionWorktree} is missing; restore or inspect it before releasing the claim.`);
    if (git(executionWorktree, ["status", "--porcelain"])) throw new Error(`Execution worktree ${executionWorktree} has uncommitted changes; the claim was not released.`);
    unlinkSync(path);
    returnContractToDefined(controlRoot, id);
    commitControlState(controlRoot, `chore(kotta): release claim ${id}`);
    return { ok: true, command: "claim release", data: { id, worktree: executionWorktree, warning: "The branch and worktree were preserved for manual recovery." } };
  });
}
