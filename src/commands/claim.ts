import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { parse } from "yaml";
import { findRepositoryRoot, regenerateIndex, workspacePath } from "../filesystem/workspace.js";
import { git } from "../git/git.js";
import { validateClaim } from "../core/claim.js";
import { findContract } from "../filesystem/entities.js";
import { parseMarkdown, renderMarkdown } from "../core/markdown.js";
import { appendLifecycleEvent } from "../core/events.js";
import { commitControlState, controlPlaneRoot, withControlPlaneMutation } from "../git/control-plane.js";

interface LocatedClaim { path: string; worktree: string; data: Record<string, unknown> }

function allWorktrees(root: string): string[] {
  return git(root, ["worktree", "list", "--porcelain"]).split(/\r?\n/).filter((line) => line.startsWith("worktree ")).map((line) => line.slice(9));
}

function claims(root: string): LocatedClaim[] {
  return allWorktrees(root).flatMap((worktree) => {
    const directory = workspacePath(worktree, "claims");
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

export function releaseClaim(id: string, force: boolean) {
  if (!force) throw new Error("Claim release is a recovery operation. Re-run with --force after checking the worktree.");
  const callerRoot = findRepositoryRoot();
  return withControlPlaneMutation(callerRoot, (controlRoot) => {
    const path = workspacePath(controlRoot, "claims", `${id}.yaml`);
    if (!existsSync(path)) throw new Error(`Claim for ${id} was not found on the control plane.`);
    const data = parse(readFileSync(path, "utf8")) as Record<string, unknown>;
    const errors = validateClaim(data);
    if (errors.length) throw new Error(`Claim for ${id} is invalid: ${errors.join(", ")}. Repair it before release.`);
    const recorded = String(data.worktree);
    const executionWorktree = isAbsolute(recorded) ? recorded : resolve(controlRoot, recorded);
    if (!existsSync(executionWorktree)) throw new Error(`Execution worktree ${executionWorktree} is missing; restore or inspect it before releasing the claim.`);
    if (git(executionWorktree, ["status", "--porcelain"])) throw new Error(`Execution worktree ${executionWorktree} has uncommitted changes; the claim was not released.`);
    unlinkSync(path);
    // Release is the inverse of start, and start moved the contract from `defined` to
    // `active`. Undoing only the claim left the contract at `active` with no claim,
    // where no command accepted it — start and execute want `defined`, reopen wants
    // review or done, cancel wants backlog or defined. It now goes back where it came
    // from, and the branch and worktree it kept are what start reuses.
    let contractState: string | null = null;
    try {
      const contract = findContract(controlRoot, id);
      if (contract.state === "active") {
        const entity = parseMarkdown(readFileSync(contract.path, "utf8"));
        entity.data.status = "defined";
        delete entity.data.worktree;
        delete entity.data.execution_mode;
        delete entity.data.assigned_agent;
        entity.data.updated_at = new Date().toISOString().slice(0, 10);
        const destination = workspacePath(controlRoot, "defined", contract.filename);
        mkdirSync(workspacePath(controlRoot, "defined"), { recursive: true });
        writeFileSync(destination, renderMarkdown(entity.data, entity.content));
        unlinkSync(contract.path);
        regenerateIndex(controlRoot);
        appendLifecycleEvent(controlRoot, id, "defined", "Claim released; the contract returned to defined with its branch and worktree preserved.");
        contractState = "defined";
      } else contractState = contract.state;
    } catch { /* an orphaned claim with no contract is still worth releasing */ }
    commitControlState(controlRoot, `chore(kotta): release claim ${id}`);
    return { ok: true, command: "claim release", data: { id, worktree: executionWorktree, contractState, warning: "The branch and worktree were preserved for manual recovery." } };
  });
}
