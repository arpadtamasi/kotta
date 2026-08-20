import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { findRepositoryRoot, regenerateIndex, workspaceDirectoryName, processPath } from "../filesystem/workspace.js";
import { findContract, resolveEffectiveContract } from "../filesystem/entities.js";
import { batchTree, findBatch, openSubtreeMembers, subtreeContracts, type BatchTree } from "../filesystem/batches.js";
import { BATCH_ID, entityFilename, filenameMatchesId, mintId } from "../core/identity.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { readWorkspaceConfig } from "../core/config.js";
import { assertClean, git } from "../git/git.js";
import { branchExists, classifyBaseUpdate, classifyIntegration, coordinatorBranchName, linkedWorktrees, type CleanupState, type CoordinatorMetadata } from "../git/coordinator.js";
import { batchDependencySatisfied, slugify, startContract } from "./contract.js";
import { appendCliApprovalAudit, appendLifecycleEvent } from "../core/events.js";
import { commitControlState, controlPlaneRoot } from "../git/control-plane.js";

interface BatchData {
  id: string;
  status: string;
  contracts: string[];
  execution: { mode: string; parallelism: number; stop_on_failure: boolean };
  [key: string]: unknown;
}

/**
 * The whole subtree as one work list, dependencies before the contracts that declare them. Derived
 * on every read rather than stored: membership is already answered by `.kotta/`, and a cached copy
 * would be a second source of truth for it.
 */
export function flattenBatch(root: string, id: string): { contracts: string[]; waves: string[][] } {
  const ids = [...new Set(subtreeContracts(batchTree(root, id)))];
  const waves = ids.length ? planBatchWaves(ids, contractDependencies(root, ids)) : [];
  return { contracts: waves.flat(), waves };
}

/** A short id the listings print resolves to a batch, so `batch add` routes it as one. */
function isKnownBatch(root: string, id: string): boolean {
  try { findBatch(root, id); return true; } catch { return false; }
}

/** Every batch that names this one. More than one is the invariant that makes flattening ambiguous. */
function parentsOf(root: string, childId: string): string[] {
  const parents: string[] = [];
  for (const state of ["backlog", "defined", "active", "done"]) {
    const directory = processPath(root, "batches", state);
    if (!existsSync(directory)) continue;
    for (const name of readdirSync(directory).filter((file) => file.endsWith(".md"))) {
      const data = parseMarkdown(readFileSync(join(directory, name), "utf8")).data;
      const children = Array.isArray(data.batches) ? data.batches.map(String) : [];
      if (children.includes(childId) && typeof data.id === "string") parents.push(data.id);
    }
  }
  return parents;
}

function contractDependencies(root: string, ids: string[]): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const id of ids) {
    const contract = findContract(root, id);
    const entity = parseMarkdown(readFileSync(contract.path, "utf8"));
    const dependencies = Array.isArray(entity.data.depends_on) ? entity.data.depends_on.map(String) : [];
    for (const dependency of dependencies) findContract(root, dependency);
    result.set(id, dependencies);
  }
  return result;
}

export function planBatchWaves(ids: string[], dependencies: Map<string, string[]>): string[][] {
  const remaining = new Set(ids);
  const completed = new Set<string>();
  const waves: string[][] = [];
  while (remaining.size) {
    const wave = [...remaining].filter((id) => (dependencies.get(id) ?? []).filter((dependency) => remaining.has(dependency) || completed.has(dependency)).every((dependency) => completed.has(dependency)));
    if (!wave.length) throw new Error(`Dependency cycle detected among: ${[...remaining].join(", ")}.`);
    waves.push(wave);
    for (const id of wave) { remaining.delete(id); completed.add(id); }
  }
  return waves;
}

/**
 * `kind` was removed with the vocabulary (D-01kz240dn155hb97h6px6n2p85): once the entity is called a
 * batch, `kind: batch` is a tautology, and `sprint`/`milestone`/`mission` never carried meaning. A file
 * that still has it loads — the field is simply ignored — but the reader says so once, and names the fix.
 */
export const REMOVED_BATCH_KIND = "kind";

export function batchKindWarning(id: string, data: Record<string, unknown>): string | undefined {
  if (data[REMOVED_BATCH_KIND] === undefined) return undefined;
  return `Warning: batch ${id} still carries the removed '${REMOVED_BATCH_KIND}' field (${String(data[REMOVED_BATCH_KIND])}); it is ignored. Run 'kotta migrate' to drop it.`;
}

const warnedKinds = new Set<string>();

function warnOnBatchKind(id: string, data: Record<string, unknown>): void {
  const warning = batchKindWarning(id, data);
  if (!warning || warnedKinds.has(id)) return;
  warnedKinds.add(id);
  process.stderr.write(`${warning}\n`);
}

export function newBatch(options: { title: string; goal?: string; parallelism?: number }, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const title = options.title.trim();
  if (!title) throw new Error("Batch title is required.");
  const parallelism = options.parallelism ?? 2;
  if (!Number.isInteger(parallelism) || parallelism < 1) throw new Error("Batch parallelism must be a positive integer.");
  const id = mintId("P");
  const filename = entityFilename(id, slugify(title));
  const directory = processPath(root, "batches/backlog");
  mkdirSync(directory, { recursive: true });
  const now = new Date().toISOString().slice(0, 10);
  const data = {
    id, title, status: "backlog", contracts: [],
    execution: { mode: "dependency-aware", parallelism, stop_on_failure: true },
    authority: { create_observations: true, create_subcontracts: false, reorder_independent_contracts: false, change_scope: false },
    created_at: now, updated_at: now,
  };
  const content = `# ${id} — ${title}\n\n## Goal\n\n${options.goal?.trim() || "Describe the shared outcome."}\n\n## Completion\n\nAll member contracts satisfy their acceptance conditions.\n\n## Execution notes\n\nMembership and ordering are coordinated by a human.\n`;
  const path = join(directory, filename);
  writeFileSync(path, renderMarkdown(data, content));
  regenerateIndex(root);
  return { ok: true, command: "batch new", data: { id, path } };
}

/**
 * One command for both member kinds, routed by the id it is given. A child batch is recorded on the
 * parent alone: the child keeps its own members, state and history, and knows nothing about being
 * grouped — which is what makes `batch remove` a complete undo.
 */
function updateChildBatches(root: string, id: string, childId: string, action: "add" | "remove") {
  const batch = findBatch(root, id);
  if (batch.state !== "backlog") throw new Error(`Batch ${id} membership can only change while it is in backlog.`);
  const canonicalChild = String(parseMarkdown(readFileSync(findBatch(root, childId).path, "utf8")).data.id);
  if (canonicalChild === id) throw new Error(`Batch ${id} cannot contain itself.`);
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const children = Array.isArray(entity.data.batches) ? entity.data.batches.map(String) : [];

  if (action === "add") {
    const otherParent = parentsOf(root, canonicalChild).find((parent) => parent !== id);
    if (otherParent) throw new Error(`Batch ${canonicalChild} already belongs to ${otherParent}. Remove it there first.`);
    // Walking the child's own subtree is what catches a loop at any depth, not just the direct one.
    const descendants = new Set([canonicalChild, ...collectBatchIds(batchTree(root, canonicalChild))]);
    if (descendants.has(id)) throw new Error(`Adding ${canonicalChild} to ${id} would make the nesting cyclic: ${id} is already inside it.`);
    if (!children.includes(canonicalChild)) children.push(canonicalChild);
  } else {
    const index = children.indexOf(canonicalChild);
    if (index < 0) throw new Error(`Batch ${canonicalChild} is not in batch ${id}.`);
    children.splice(index, 1);
  }

  entity.data.batches = children;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  writeFileSync(batch.path, renderMarkdown(entity.data, entity.content));
  regenerateIndex(root);
  return { ok: true, command: `batch ${action}`, data: { id, batchId: canonicalChild, batches: children } };
}

function collectBatchIds(tree: BatchTree): string[] {
  return tree.children.flatMap((child) => [child.id, ...collectBatchIds(child)]);
}

export function updateBatchContracts(id: string, contractId: string, action: "add" | "remove", repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  if (BATCH_ID.test(contractId.trim()) || isKnownBatch(root, contractId)) return updateChildBatches(root, id, contractId, action);
  const batch = findBatch(root, id);
  if (batch.state !== "backlog") throw new Error(`Batch ${id} membership can only change while it is in backlog.`);
  const contract = findContract(root, contractId);
  const contractEntity = parseMarkdown(readFileSync(contract.path, "utf8"));
  const currentBatch = typeof contractEntity.data.batch === "string" ? contractEntity.data.batch : null;
  if (action === "add" && currentBatch && currentBatch !== id) throw new Error(`Contract ${contractId} already belongs to ${currentBatch}. Remove it there first.`);
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const contracts = Array.isArray(entity.data.contracts) ? entity.data.contracts.map(String) : [];
  if (action === "add" && !contracts.includes(contractId)) contracts.push(contractId);
  if (action === "remove") {
    const index = contracts.indexOf(contractId);
    if (index < 0) throw new Error(`Contract ${contractId} is not in batch ${id}.`);
    contracts.splice(index, 1);
  }
  entity.data.contracts = contracts;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  contractEntity.data.batch = action === "add" ? id : null;
  contractEntity.data.updated_at = new Date().toISOString().slice(0, 10);
  writeFileSync(batch.path, renderMarkdown(entity.data, entity.content));
  writeFileSync(contract.path, renderMarkdown(contractEntity.data, contractEntity.content));
  regenerateIndex(root);
  return { ok: true, command: `batch ${action}`, data: { id, contractId, contracts } };
}

export function validateBatch(id: string, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const batch = findBatch(root, id);
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const data = entity.data as BatchData;
  const errors: Array<{ code: string; message: string }> = [];
  const warnings = [batchKindWarning(id, entity.data)].filter((warning): warning is string => warning !== undefined);
  warnOnBatchKind(id, entity.data);
  if (String(data.id) !== id) errors.push({ code: "ID_MISMATCH", message: "Batch identifier does not match the requested id." });
  if (String(data.status) !== batch.state) errors.push({ code: "STATE_MISMATCH", message: `Batch status must match directory '${batch.state}'.` });
  const body = sections(entity.content);
  for (const heading of ["Goal", "Completion", "Execution notes"]) if (!body.get(heading.toLowerCase())?.trim()) errors.push({ code: "MISSING_SECTION", message: `Missing or empty section: ${heading}.` });
  let waves: string[][] = [];
  let children: string[] = [];
  try {
    // The subtree, not the direct members: a parent that groups only children still has work in it,
    // and its ordering has to hold across the children rather than inside each one.
    children = Array.isArray(data.batches) ? data.batches.map(String) : [];
    for (const child of children) {
      const otherParents = parentsOf(root, child).filter((parent) => parent !== id);
      if (otherParents.length) errors.push({ code: "SHARED_CHILD_BATCH", message: `Batch ${child} is named by ${[id, ...otherParents].join(" and ")}; a batch has at most one parent.` });
    }
    const ids = [...new Set(subtreeContracts(batchTree(root, id)))];
    if (!ids.length) throw new Error("Batch must contain at least one contract, directly or in a child batch.");
    waves = planBatchWaves(ids, contractDependencies(root, ids));
  } catch (error) {
    errors.push({ code: "DEPENDENCY_ERROR", message: error instanceof Error ? error.message : String(error) });
  }
  return { ok: errors.length === 0, command: "batch validate", data: { id, state: batch.state, waves, children, warnings }, errors };
}

export function signBatch(id: string, approved: boolean, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const batch = findBatch(root, id);
  if (batch.state !== "backlog") throw new Error(`Batch ${id} must be in backlog before it can be signed.`);
  if (!approved) throw new Error("Human sign-off is required. Re-run with --approve after reviewing batch scope and ordering.");
  const validation = validateBatch(id, root);
  if (!validation.ok) throw new Error(validation.errors.map((error) => error.message).join("\n"));
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const contractIds = Array.isArray(entity.data.contracts) ? entity.data.contracts.map(String) : [];
  const dependencies = contractDependencies(root, contractIds);
  const invalidStates = contractIds.filter((contractId) => !["backlog", "defined", "done"].includes(findContract(root, contractId).state));
  if (invalidStates.length) throw new Error(`Batch contracts must be backlog, defined, or done before batch readiness: ${invalidStates.join(", ")}.`);
  const unsignedFrontier = contractIds.filter((contractId) => {
    if (findContract(root, contractId).state !== "backlog") return false;
    return (dependencies.get(contractId) ?? []).every((dependency) => findContract(root, dependency).state === "done");
  });
  if (unsignedFrontier.length) throw new Error(`Every currently executable batch contract must be signed: ${unsignedFrontier.join(", ")}.`);
  entity.data.status = "defined";
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const directory = processPath(root, "batches/defined");
  mkdirSync(directory, { recursive: true });
  const destination = join(directory, batch.filename);
  writeFileSync(destination, renderMarkdown(entity.data, entity.content));
  unlinkSync(batch.path);
  regenerateIndex(root);
  return { ok: true, command: "batch sign", data: { id, path: destination } };
}

/** Resolves the coordinator branch the batch must run on, creating or adopting it when safe. */
function establishCoordinator(root: string, id: string, data: BatchData): { action: "created" | "resumed" | "adopted"; coordinator: CoordinatorMetadata } {
  const config = readWorkspaceConfig(root);
  const branch = coordinatorBranchName(id);
  const currentBranch = git(root, ["branch", "--show-current"]);
  const recorded = (data.coordinator ?? null) as CoordinatorMetadata | null;
  if (recorded?.branch) {
    const linked = linkedWorktrees(root).find((entry) => entry.branch === recorded.branch);
    if (!linked && currentBranch !== recorded.branch) throw new Error(`Batch ${id} coordinates on '${recorded.branch}', but its worktree is missing. Restore '${recorded.worktree ?? `.worktrees/batches/${id}`}' or recover the batch before resuming.`);
    return { action: "resumed", coordinator: recorded };
  }
  if (currentBranch === branch) {
    const baseCommit = branchExists(root, config.baseBranch) ? git(root, ["merge-base", branch, config.baseBranch]) : git(root, ["rev-parse", "HEAD"]);
    return { action: "adopted", coordinator: { branch, base_branch: config.baseBranch, base_commit: baseCommit, worktree: root, cleaned_at: null } };
  }
  if (currentBranch !== config.baseBranch) throw new Error(`Batch ${id} must start from the configured base branch '${config.baseBranch}'; the checkout is on '${currentBranch || "a detached HEAD"}'.`);
  if (branchExists(root, branch)) throw new Error(`Branch '${branch}' already exists while batch ${id} records no coordinator. Switch to it to adopt it, or delete it first; start never overwrites an existing branch.`);
  const baseCommit = git(root, ["rev-parse", "HEAD"]);
  const worktree = join(root, ".worktrees", "batches", id);
  git(root, ["worktree", "add", worktree, "-b", branch, "HEAD"]);
  return { action: "created", coordinator: { branch, base_branch: config.baseBranch, base_commit: baseCommit, worktree: `.worktrees/batches/${id}`, cleaned_at: null } };
}

export function startBatch(id: string, agent: string) {
  const requestedRoot = findRepositoryRoot();
  const root = controlPlaneRoot(requestedRoot);
  const validation = validateBatch(id, root);
  if (!validation.ok) throw new Error(validation.errors.map((error) => error.message).join("\n"));
  assertClean(root);
  const batch = findBatch(root, id);
  if (!['defined', 'active'].includes(batch.state)) throw new Error(`Batch ${id} must be defined or active before start.`);
  // Execution is a leaf operation. A parent is a name, and giving it a coordinator branch would
  // invent the semantics nesting was deliberately kept clear of (D-01kztxvppd40r77cq7kw9b8wzr).
  const tree = batchTree(root, id);
  if (tree.children.length) {
    throw new Error(`Batch ${id} groups other batches and is not run directly. Start the batches inside it: ${tree.children.map((child) => child.id).join(", ")}.`);
  }
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const data = entity.data as BatchData;
  const { action: coordinatorAction, coordinator } = establishCoordinator(root, id, data);
  const coordinatorCommit = git(root, ["rev-parse", "--verify", `${coordinator.branch}^{commit}`]);
  const ids = data.contracts.map(String);
  const dependencies = contractDependencies(root, ids);
  const done = new Set(ids.filter((contractId) => findContract(root, contractId).state === "done"));
  // A started contract lives in its own worktree; the root checkout still shows it as defined, so ask the effective state.
  const defined = ids.filter((contractId) => resolveEffectiveContract(root, contractId, (contract) => contract.state).value === "defined");
  let executable = defined.filter((contractId) => (dependencies.get(contractId) ?? [])
    .every((dependency) => batchDependencySatisfied(root, dependency, id, coordinatorCommit)));
  if (data.execution.mode === "sequential") executable = executable.slice(0, 1);
  executable = executable.slice(0, Math.max(1, Number(data.execution.parallelism ?? 1)));
  const started: string[] = [];
  const starts: Array<{ id: string; startRef: string; startCommit: string }> = [];
  const failures: Array<{ id: string; message: string }> = [];
  for (const contractId of executable) {
    try {
      const result = startContract(contractId, agent, "fresh", root, {
        startRef: coordinator.branch,
        dependencyIntegrationTarget: coordinator.branch,
      });
      started.push(contractId);
      starts.push({ id: contractId, startRef: result.data.startRef, startCommit: result.data.startCommit });
    }
    catch (error) {
      failures.push({ id: contractId, message: error instanceof Error ? error.message : String(error) });
      if (data.execution.stop_on_failure !== false) throw error;
    }
  }
  if (coordinatorAction !== "resumed") data.coordinator = { ...coordinator };
  if (batch.state === "defined" || coordinatorAction !== "resumed") {
    const activating = batch.state === "defined";
    if (activating) data.status = "active";
    data.updated_at = new Date().toISOString().slice(0, 10);
    const directory = processPath(root, "batches", activating ? "active" : batch.state);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, batch.filename), renderMarkdown(data as Record<string, unknown>, entity.content));
    if (activating) unlinkSync(batch.path);
    regenerateIndex(root);
    appendLifecycleEvent(root, id, "active", `Batch execution started on ${coordinator.branch}.`);
    commitControlState(root, `chore(kotta): start batch ${id}`);
  }
  return {
    ok: failures.length === 0,
    command: "batch start",
    data: {
      id, started, starts,
      waiting: ids.filter((contractId) => !started.includes(contractId) && !done.has(contractId)),
      failures,
      coordinator: { branch: coordinator.branch, commit: coordinatorCommit, base_branch: coordinator.base_branch, worktree: coordinator.worktree, action: coordinatorAction },
    },
  };
}

interface CoordinatorInspection {
  state: CleanupState;
  branch: string | null;
  baseBranch: string;
  currentBranch: string;
  legacy: boolean;
  integration: ReturnType<typeof classifyIntegration> | null;
  baseUpdate: ReturnType<typeof classifyBaseUpdate> | null;
  coordinatorWorktree: string | null;
  blockers: string[];
}

/** Single source of truth for coordinator lifecycle: Git and the worktree decide, metadata only records. */
function inspectCoordinator(root: string, id: string, batchState: string, data: BatchData): CoordinatorInspection {
  const config = readWorkspaceConfig(root);
  const currentBranch = git(root, ["branch", "--show-current"]);
  const recorded = (data.coordinator ?? null) as CoordinatorMetadata | null;
  const conventional = coordinatorBranchName(id);
  const legacy = !recorded?.branch && branchExists(root, conventional);
  const branch = recorded?.branch ?? (legacy ? conventional : null);
  const baseBranch = recorded?.base_branch ?? config.baseBranch;
  const linked = linkedWorktrees(root);
  const coordinatorEntry = branch ? linked.find((entry) => entry.branch === branch) : undefined;
  const coordinatorWorktree = coordinatorEntry?.path ?? (currentBranch === branch ? root : null);
  const base = { state: "unstarted" as CleanupState, branch, baseBranch, currentBranch, legacy, integration: null, baseUpdate: null, coordinatorWorktree, blockers: [] as string[] };
  if (recorded?.cleaned_at) return { ...base, state: "cleaned" };
  if (!branch) return base;
  if (!branchExists(root, branch)) return { ...base, state: "cleaned" };
  if (batchState !== "done") return { ...base, state: "active" };

  const integration = classifyIntegration(root, branch, baseBranch);
  if (!integration.integrated) return { ...base, integration, state: "done-unintegrated" };

  const blockers: string[] = [];
  if (git(root, ["status", "--porcelain"])) blockers.push(`The working tree at ${root} has pending changes; commit or remove them before cleanup.`);
  const contractIds = Array.isArray(data.contracts) ? data.contracts.map(String) : [];
  // Claims are written inside the contract's worktree, so check there as well as in the coordinator checkout.
  const claimed = contractIds.filter((contractId) => [processPath(root, "claims", `${contractId}.yaml`), processPath(join(root, ".worktrees", contractId), "claims", `${contractId}.yaml`)].some((path) => existsSync(path)));
  if (claimed.length) blockers.push(`Active claims remain for ${claimed.join(", ")}; close or release them before cleanup.`);
  const contractWorktrees = linked.filter((entry) => contractIds.some((contractId) => entry.path.endsWith(`/${contractId}`)));
  if (contractWorktrees.length) blockers.push(`Contract worktrees are still linked: ${contractWorktrees.map((entry) => entry.path).join(", ")}.`);
  if (coordinatorWorktree && git(coordinatorWorktree, ["status", "--porcelain"])) blockers.push(`The coordinator worktree at ${coordinatorWorktree} has pending changes; commit or remove them before cleanup.`);
  const expectedCoordinator = typeof recorded?.worktree === "string" ? resolve(root, recorded.worktree) : coordinatorWorktree;
  const elsewhere = linked.filter((entry) => entry.branch === baseBranch || (entry.branch === branch && expectedCoordinator && resolve(entry.path) !== expectedCoordinator));
  if (elsewhere.length) blockers.push(`Another worktree holds ${elsewhere.map((entry) => `${entry.branch} (${entry.path})`).join(", ")}; cleanup would fight it.`);
  const baseUpdate = branchExists(root, baseBranch) ? classifyBaseUpdate(root, baseBranch) : null;
  if (!baseUpdate) blockers.push(`The configured base branch '${baseBranch}' does not exist locally.`);
  if (baseUpdate?.kind === "diverged") blockers.push(`Local '${baseBranch}' (${baseUpdate.local.slice(0, 7)}) and its remote (${baseUpdate.remote.slice(0, 7)}) have diverged; reconcile them manually — cleanup never resets or rebases.`);

  if (blockers.length) {
    const state: CleanupState = baseUpdate?.kind === "diverged" ? "blocked-diverged" : blockers[0].includes("pending changes") ? "blocked-dirty" : "blocked-in-use";
    return { ...base, integration, baseUpdate, blockers, state };
  }
  return { ...base, integration, baseUpdate, state: "cleanup-pending" };
}

export function batchStatus(id: string) {
  const root = controlPlaneRoot(findRepositoryRoot());
  const batch = findBatch(root, id);
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const data = entity.data as BatchData;
  const tree = batchTree(root, id);
  const ids = [...new Set(subtreeContracts(tree))];
  const contracts = ids.map((contractId) => {
    const effective = resolveEffectiveContract(root, contractId, (contract) => contract.state);
    const contract = findContract(root, contractId);
    const entity = parseMarkdown(readFileSync(contract.path, "utf8"));
    const recordedWorktree = typeof entity.data.worktree === "string" ? resolve(root, entity.data.worktree) : null;
    return { id: contractId, state: effective.value, ...(recordedWorktree || effective.worktree ? { worktree: recordedWorktree ?? effective.worktree } : {}) };
  });
  const inspection = inspectCoordinator(root, id, batch.state, data);
  return {
    ok: true,
    command: "batch status",
    data: {
      id, status: batch.state, contracts,
      children: tree.children.map((child) => ({ id: child.id, title: child.title, state: child.state })),
      coordinator: {
        state: inspection.state, branch: inspection.branch, base_branch: inspection.baseBranch, current_branch: inspection.currentBranch,
        legacy: inspection.legacy, cleanup_pending: inspection.state === "cleanup-pending",
        integration: inspection.integration, base_update: inspection.baseUpdate, blockers: inspection.blockers,
      },
    },
  };
}

/**
 * Complete a batch whose member contracts all reached a terminal state, from any batch state.
 * `contract close`/`cancel` already complete a containing batch on their own; this is the explicit
 * path for a batch whose contracts finished outside the batch flow. It never touches a contract.
 */
export function closeBatch(id: string, approved: boolean, repositoryRoot?: string, options: { skipClean?: boolean; commit?: boolean; approvalRecorded?: boolean } = {}) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const batch = findBatch(root, id);
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const data = entity.data as BatchData;
  // Re-running on a finished batch is a no-op, so a retried coordinator never has to guess.
  if (batch.state === "done") return { ok: true, command: "batch close", data: { id, status: "done", path: batch.path, changed: false } };
  if (!approved) throw new Error(`Human close approval is required. Re-run with --approve after verifying every contract of ${id} is complete.`);
  // A parent is finished when its whole subtree is. The automatic completion a closing contract
  // triggers asks the same question, so the two paths cannot drift apart.
  const open = openSubtreeMembers(root, id);
  if (open.children.length) throw new Error(`Batch ${id} cannot close while ${open.children.map((child) => `${child.id} is ${child.state}`).join(", ")}. Every child batch must reach done first.`);
  if (!open.contractCount) throw new Error(`Batch ${id} has no member contracts; there is nothing to close.`);
  if (open.contracts.length) throw new Error(`Batch ${id} cannot close while ${open.contracts.map((member) => `${member.id} is ${member.state}`).join(", ")}. Every member contract must reach done first.`);
  if (!options.skipClean) assertClean(root);
  data.status = "done";
  data.updated_at = new Date().toISOString().slice(0, 10);
  const directory = processPath(root, "batches/done");
  mkdirSync(directory, { recursive: true });
  const destination = join(directory, batch.filename);
  writeFileSync(destination, renderMarkdown(data as Record<string, unknown>, entity.content));
  unlinkSync(batch.path);
  regenerateIndex(root);
  appendLifecycleEvent(root, id, "done", "All member contracts completed; batch closed.");
  if (!options.approvalRecorded) appendCliApprovalAudit(root, id, "batch.close", {}, null);
  if (options.commit !== false) {
    git(root, ["add", workspaceDirectoryName(root)]);
    git(root, ["commit", "-m", `chore(kotta): close batch ${id}`]);
  }
  return { ok: true, command: "batch close", data: { id, status: "done", path: destination, changed: true } };
}

/** Opt-in, post-integration cleanup. Every precondition is recomputed here; nothing is forced. */
export function finalizeBatch(id: string, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const batch = findBatch(root, id);
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const data = entity.data as BatchData;
  if (batch.state !== "done") throw new Error(`Batch ${id} is ${batch.state}; coordinator cleanup runs only after the batch is done.`);
  const inspection = inspectCoordinator(root, id, batch.state, data);
  const actions: string[] = [];

  if (inspection.state === "cleaned" || inspection.state === "unstarted") {
    // Re-running after success, or a batch that never had a branch to clean: both are no-ops.
    if (!(data.coordinator as CoordinatorMetadata | null)?.cleaned_at && inspection.branch) recordCleaned(root, batch.path, entity, data, id);
    return { ok: true, command: "batch finalize", data: { id, state: "cleaned" as CleanupState, branch: inspection.branch, actions, evidence: inspection.integration } };
  }
  if (inspection.state === "done-unintegrated") {
    const checked = inspection.integration?.integrated === false ? inspection.integration.checked : [];
    throw new Error(`Coordinator branch '${inspection.branch}' is not an ancestor of ${checked.length ? checked.join(" or ") : `'${inspection.baseBranch}'`}. Merge it first; cleanup never deletes unmerged work.`);
  }
  if (inspection.blockers.length) throw new Error([`Coordinator cleanup for ${id} is blocked (${inspection.state}):`, ...inspection.blockers.map((blocker) => `- ${blocker}`)].join("\n"));
  if (inspection.legacy) actions.push(`adopted-legacy-branch:${inspection.branch}`);

  const branch = inspection.branch as string;
  if (inspection.baseUpdate?.kind === "fast-forward") {
    git(root, ["merge", "--ff-only", inspection.baseUpdate.remote]);
    actions.push(`fast-forwarded:${inspection.baseBranch}`);
  }
  if (inspection.coordinatorWorktree && resolve(inspection.coordinatorWorktree) !== resolve(root)) {
    git(root, ["worktree", "remove", inspection.coordinatorWorktree]);
    actions.push(`removed-worktree:${inspection.coordinatorWorktree}`);
  }
  // -d refuses an unmerged branch on its own; it is the second proof after the ancestry check.
  git(root, ["branch", "-d", branch]);
  actions.push(`deleted-local-branch:${branch}`);
  recordCleaned(root, batch.path, entity, data, id);
  return { ok: true, command: "batch finalize", data: { id, state: "cleaned" as CleanupState, branch, actions, evidence: inspection.integration } };
}

function recordCleaned(root: string, path: string, entity: { content: string }, data: BatchData, id: string) {
  const existing = (data.coordinator ?? null) as CoordinatorMetadata | null;
  data.coordinator = { branch: existing?.branch ?? coordinatorBranchName(id), base_branch: existing?.base_branch ?? readWorkspaceConfig(root).baseBranch, base_commit: existing?.base_commit ?? "", worktree: existing?.worktree ?? null, cleaned_at: new Date().toISOString().slice(0, 10) };
  data.updated_at = new Date().toISOString().slice(0, 10);
  writeFileSync(path, renderMarkdown(data as Record<string, unknown>, entity.content));
  regenerateIndex(root);
  git(root, ["add", workspaceDirectoryName(root)]);
  git(root, ["commit", "-m", `chore(kotta): finalize batch ${id}`]);
}
