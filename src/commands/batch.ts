import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { findRepositoryRoot, regenerateIndex, workspaceDirectoryName, processPath } from "../filesystem/workspace.js";
import { entityTitle, findTask, listEntities, resolveEffectiveTask } from "../filesystem/entities.js";
import { batchTree, findBatch, openSubtreeMembers, subtreeTasks, type BatchTree } from "../filesystem/batches.js";
import { BATCH_ID, entityFilename, mintId } from "../core/identity.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { readWorkspaceConfig } from "../core/config.js";
import { assertClean, git } from "../git/git.js";
import { branchExists, classifyBaseUpdate, classifyIntegration, coordinatorBranchName, linkedWorktrees, type CleanupState, type CoordinatorMetadata } from "../git/coordinator.js";
import { batchDependencySatisfied, slugify, startTask } from "./task.js";
import { appendCliApprovalAudit, appendLifecycleEvent } from "../core/events.js";
import { cliApprovalReceipt, receiptErrors, stampReceipt, type ApprovalReceipt } from "../core/approval-receipt.js";
import { commitControlState, controlPlaneRoot } from "../git/control-plane.js";

interface BatchData {
  id: string;
  status: string;
  tasks: string[];
  execution: { mode: string; parallelism: number; stop_on_failure: boolean };
  [key: string]: unknown;
}

/** A short id the listings print resolves to a batch, so `batch add` routes it as one. */
function isKnownBatch(root: string, id: string): boolean {
  try { findBatch(root, id); return true; } catch { return false; }
}

/** Every batch that names this one. More than one is the invariant that makes flattening ambiguous. */
function parentsOf(root: string, childId: string): string[] {
  const parents: string[] = [];
  for (const found of listEntities(root, "batch")) {
    const data = parseMarkdown(readFileSync(found.path, "utf8")).data;
    const children = Array.isArray(data.batches) ? data.batches.map(String) : [];
    if (children.includes(childId) && typeof data.id === "string") parents.push(data.id);
  }
  return parents;
}

function taskDependencies(root: string, ids: string[]): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const id of ids) {
    const task = findTask(root, id);
    const entity = parseMarkdown(readFileSync(task.path, "utf8"));
    const dependencies = Array.isArray(entity.data.depends_on) ? entity.data.depends_on.map(String) : [];
    for (const dependency of dependencies) findTask(root, dependency);
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

export function newBatch(options: { title: string; goal?: string; parallelism?: number }, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const title = options.title.trim();
  if (!title) throw new Error("Batch title is required.");
  const parallelism = options.parallelism ?? 2;
  if (!Number.isInteger(parallelism) || parallelism < 1) throw new Error("Batch parallelism must be a positive integer.");
  const id = mintId("P");
  const filename = entityFilename(id, slugify(title));
  const directory = processPath(root, "batches");
  mkdirSync(directory, { recursive: true });
  const now = new Date().toISOString().slice(0, 10);
  const data = {
    id, title, status: "backlog", tasks: [],
    execution: { mode: "dependency-aware", parallelism, stop_on_failure: true },
    authority: { create_observations: true, create_subtasks: false, reorder_independent_tasks: false, change_scope: false },
    created_at: now, updated_at: now,
  };
  const content = `# ${id} — ${title}\n\n## Goal\n\n${options.goal?.trim() || "Describe the shared outcome."}\n\n## Completion\n\nAll member tasks satisfy their acceptance conditions.\n\n## Execution notes\n\nMembership and ordering are coordinated by a human.\n`;
  const path = join(directory, filename);
  writeFileSync(path, renderMarkdown(data, content));
  regenerateIndex(root);
  // A service that writes canonical state commits it (BR-01m0f0wn89r5np2yce79y2pctq): leaving the
  // write uncommitted turns the workspace dirty behind the operator, and the next command refuses
  // work they did not cause.
  commitControlState(root, `chore(kotta): capture batch ${id}`);
  return { ok: true, command: "batch new", data: { id, title, path } };
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
  commitControlState(root, `chore(kotta): ${action} child batch ${canonicalChild} ${action === "add" ? "to" : "from"} ${id}`);
  return { ok: true, command: `batch ${action}`, data: { id, batchId: canonicalChild, batches: children } };
}

function collectBatchIds(tree: BatchTree): string[] {
  return tree.children.flatMap((child) => [child.id, ...collectBatchIds(child)]);
}

export function updateBatchTasks(id: string, taskId: string, action: "add" | "remove", repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  if (BATCH_ID.test(taskId.trim()) || isKnownBatch(root, taskId)) return updateChildBatches(root, id, taskId, action);
  const batch = findBatch(root, id);
  if (batch.state !== "backlog") throw new Error(`Batch ${id} membership can only change while it is in backlog.`);
  const task = findTask(root, taskId);
  const taskEntity = parseMarkdown(readFileSync(task.path, "utf8"));
  const currentBatch = typeof taskEntity.data.batch === "string" ? taskEntity.data.batch : null;
  if (action === "add" && currentBatch && currentBatch !== id) throw new Error(`Task ${taskId} already belongs to ${currentBatch}. Remove it there first.`);
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const tasks = Array.isArray(entity.data.tasks) ? entity.data.tasks.map(String) : [];
  if (action === "add" && !tasks.includes(taskId)) tasks.push(taskId);
  if (action === "remove") {
    const index = tasks.indexOf(taskId);
    if (index < 0) throw new Error(`Task ${taskId} is not in batch ${id}.`);
    tasks.splice(index, 1);
  }
  entity.data.tasks = tasks;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  taskEntity.data.batch = action === "add" ? id : null;
  taskEntity.data.updated_at = new Date().toISOString().slice(0, 10);
  writeFileSync(batch.path, renderMarkdown(entity.data, entity.content));
  writeFileSync(task.path, renderMarkdown(taskEntity.data, taskEntity.content));
  regenerateIndex(root);
  commitControlState(root, `chore(kotta): ${action} ${taskId} ${action === "add" ? "to" : "from"} batch ${id}`);
  return { ok: true, command: `batch ${action}`, data: { id, taskId, tasks } };
}

/**
 * Validation is the transition for a batch (SM-01m0f0wn89m2xwd4z4mk9p71d5), so validating one
 * ordinarily promotes and commits it. `transition: false` asks for the report alone: `migrate`
 * says whether the workspace it produced holds (UC-01m0f0wn89x00jkpqpqc2esx9h), and a migration
 * that advanced an entity's lifecycle and committed on its way past would be doing something else
 * entirely.
 */
export function validateBatch(id: string, repositoryRoot?: string, options: { transition?: boolean } = {}) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const transition = options.transition !== false;
  const batch = findBatch(root, id);
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const data = entity.data as BatchData;
  const errors: Array<{ code: string; message: string }> = [];
  if (String(data.id) !== id) errors.push({ code: "ID_MISMATCH", message: "Batch identifier does not match the requested id." });
  errors.push(...receiptErrors(entity.data));
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
    const ids = [...new Set(subtreeTasks(batchTree(root, id)))];
    if (!ids.length) throw new Error("Batch must contain at least one task, directly or in a child batch.");
    waves = planBatchWaves(ids, taskDependencies(root, ids));
  } catch (error) {
    errors.push({ code: "DEPENDENCY_ERROR", message: error instanceof Error ? error.message : String(error) });
  }
  // Validation is the transition (SM-01m0f0wn89m2xwd4z4mk9p71d5). A batch expresses the agreement
  // its members already carry, so grouping approves nothing and there is nothing here for a human
  // to approve; a batch that validates is defined, exactly as a covered task is.
  let state = batch.state;
  if (!errors.length && state === "backlog" && transition) {
    const open = subtreeTasks(batchTree(root, id))
      .map((taskId) => ({ id: taskId, state: findTask(root, taskId).state }))
      .filter((member) => !["backlog", "defined", "done"].includes(member.state));
    if (open.length) {
      errors.push({ code: "MEMBER_NOT_READY", message: `Batch ${id} cannot become defined while ${open.map((member) => `${member.id} is ${member.state}`).join(", ")}.` });
    } else {
      entity.data.status = "defined";
      entity.data.updated_at = new Date().toISOString().slice(0, 10);
      writeFileSync(batch.path, renderMarkdown(entity.data, entity.content));
      regenerateIndex(root);
      appendLifecycleEvent(root, id, "defined", "Batch validated; grouping carries no approval of its own.");
      // startBatch validates before it checks the checkout, so an uncommitted promotion here is
      // what the operator was blamed for (F-01m0zn0d24hjbva47xdp1kb6m1).
      commitControlState(root, `chore(kotta): define batch ${id}`);
      state = "defined";
    }
  }
  return { ok: errors.length === 0, command: "batch validate", data: { id, title: entityTitle(batch.path), state, waves, children }, errors };
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
  const ids = data.tasks.map(String);
  const dependencies = taskDependencies(root, ids);
  const done = new Set(ids.filter((taskId) => findTask(root, taskId).state === "done"));
  // A started task lives in its own worktree; the root checkout still shows it as defined, so ask the effective state.
  const defined = ids.filter((taskId) => resolveEffectiveTask(root, taskId, (task) => task.state).value === "defined");
  const eligible = defined.filter((taskId) => (dependencies.get(taskId) ?? [])
    .every((dependency) => batchDependencySatisfied(root, dependency, id, coordinatorCommit)));
  // Parallelism bounds how many members the batch holds at once, not how many one release may
  // start (D-01m0zhkpw7v7pq322pg5nycf1d, UC-01m0f0wn89jebbfp6rjr0fxqh1). Members already running
  // are read from the same effective state the eligibility filter above reads, so a member cannot
  // be invisible to one and visible to the other.
  const running = ids.filter((taskId) => resolveEffectiveTask(root, taskId, (task) => task.state).value === "active");
  const configured = Math.max(1, Number(data.execution.parallelism ?? 1));
  const budget = Math.max(0, (data.execution.mode === "sequential" ? 1 : configured) - running.length);
  const executable = eligible.slice(0, budget);
  const started: string[] = [];
  const starts: Array<{ id: string; startRef: string; startCommit: string }> = [];
  const failures: Array<{ id: string; message: string }> = [];
  for (const taskId of executable) {
    try {
      const result = startTask(taskId, agent, "fresh", root, {
        startRef: coordinator.branch,
        dependencyIntegrationTarget: coordinator.branch,
      });
      started.push(taskId);
      starts.push({ id: taskId, startRef: result.data.startRef, startCommit: result.data.startCommit });
    }
    catch (error) {
      failures.push({ id: taskId, message: error instanceof Error ? error.message : String(error) });
      if (data.execution.stop_on_failure !== false) throw error;
    }
  }
  if (coordinatorAction !== "resumed") data.coordinator = { ...coordinator };
  if (batch.state === "defined" || coordinatorAction !== "resumed") {
    if (batch.state === "defined") data.status = "active";
    data.updated_at = new Date().toISOString().slice(0, 10);
    writeFileSync(batch.path, renderMarkdown(data as Record<string, unknown>, entity.content));
    regenerateIndex(root);
    appendLifecycleEvent(root, id, "active", `Batch execution started on ${coordinator.branch}.`);
    commitControlState(root, `chore(kotta): start batch ${id}`);
  }
  return {
    ok: failures.length === 0,
    command: "batch start",
    data: {
      id, title: entityTitle(batch.path), started, starts,
      // A rendering never claims more than the result carries (BR-01m0pw5bc7b1rkg5dct5qgdkmb):
      // work the batch is already carrying is running, and only what it has not released waits.
      running,
      waiting: ids.filter((taskId) => !started.includes(taskId) && !done.has(taskId) && !running.includes(taskId)),
      // Named so a reader can tell "nothing was eligible" from "the batch is already full".
      budget: { configured, running: running.length, released: started.length, held: Math.max(0, eligible.length - executable.length) },
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
  const taskIds = Array.isArray(data.tasks) ? data.tasks.map(String) : [];
  // Claims are written inside the task's worktree, so check there as well as in the coordinator checkout.
  const claimed = taskIds.filter((taskId) => [processPath(root, "claims", `${taskId}.yaml`), processPath(join(root, ".worktrees", taskId), "claims", `${taskId}.yaml`)].some((path) => existsSync(path)));
  if (claimed.length) blockers.push(`Active claims remain for ${claimed.join(", ")}; close or release them before cleanup.`);
  const taskWorktrees = linked.filter((entry) => taskIds.some((taskId) => entry.path.endsWith(`/${taskId}`)));
  if (taskWorktrees.length) blockers.push(`Task worktrees are still linked: ${taskWorktrees.map((entry) => entry.path).join(", ")}.`);
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
  const ids = [...new Set(subtreeTasks(tree))];
  const tasks = ids.map((taskId) => {
    const effective = resolveEffectiveTask(root, taskId, (task) => task.state);
    const task = findTask(root, taskId);
    const entity = parseMarkdown(readFileSync(task.path, "utf8"));
    const recordedWorktree = typeof entity.data.worktree === "string" ? resolve(root, entity.data.worktree) : null;
    // `done` alone would report a batch of retired tasks as a batch that was built
    // (BR-01m0pw5bc7b1rkg5dct5qgdkmb), so how each member ended travels with its state.
    const resolution = typeof entity.data.resolution === "string" ? entity.data.resolution.trim() || null : null;
    return { id: taskId, state: effective.value, resolution, ...(recordedWorktree || effective.worktree ? { worktree: recordedWorktree ?? effective.worktree } : {}) };
  });
  const inspection = inspectCoordinator(root, id, batch.state, data);
  return {
    ok: true,
    command: "batch status",
    data: {
      id, status: batch.state, tasks,
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
 * Complete a batch whose member tasks all reached a terminal state, from any batch state.
 * `task close`/`cancel` already complete a containing batch on their own; this is the explicit
 * path for a batch whose tasks finished outside the batch flow. It never touches a task.
 */
export function closeBatch(id: string, approved: boolean, repositoryRoot?: string, options: { skipClean?: boolean; commit?: boolean; approvalRecorded?: boolean; receipt?: ApprovalReceipt } = {}) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const batch = findBatch(root, id);
  const entity = parseMarkdown(readFileSync(batch.path, "utf8"));
  const data = entity.data as BatchData;
  // Re-running on a finished batch is a no-op, so a retried coordinator never has to guess.
  if (batch.state === "done") return { ok: true, command: "batch close", data: { id, title: entityTitle(batch.path), status: "done", path: batch.path, changed: false } };
  if (!approved) throw new Error(`Human close approval is required. Re-run with --approve after verifying every task of ${id} is complete.`);
  // A parent is finished when its whole subtree is. The automatic completion a closing task
  // triggers asks the same question, so the two paths cannot drift apart.
  const open = openSubtreeMembers(root, id);
  if (open.children.length) throw new Error(`Batch ${id} cannot close while ${open.children.map((child) => `${child.id} is ${child.state}`).join(", ")}. Every child batch must reach done first.`);
  if (!open.taskCount) throw new Error(`Batch ${id} has no member tasks; there is nothing to close.`);
  if (open.tasks.length) throw new Error(`Batch ${id} cannot close while ${open.tasks.map((member) => `${member.id} is ${member.state}`).join(", ")}. Every member task must reach done first.`);
  if (!options.skipClean) assertClean(root);
  data.status = "done";
  data.updated_at = new Date().toISOString().slice(0, 10);
  stampReceipt(data, options.receipt ?? cliApprovalReceipt("batch.close"));
  writeFileSync(batch.path, renderMarkdown(data as Record<string, unknown>, entity.content));
  regenerateIndex(root);
  appendLifecycleEvent(root, id, "done", "All member tasks completed; batch closed.");
  if (!options.approvalRecorded) appendCliApprovalAudit(root, id, "batch.close", {}, null);
  if (options.commit !== false) {
    git(root, ["add", workspaceDirectoryName(root)]);
    git(root, ["commit", "-m", `chore(kotta): close batch ${id}`]);
  }
  return { ok: true, command: "batch close", data: { id, title: entityTitle(batch.path), status: "done", path: batch.path, changed: true } };
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
