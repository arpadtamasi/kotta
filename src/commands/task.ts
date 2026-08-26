import { mkdirSync, readdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { parse as parseYaml, stringify } from "yaml";
import { findRepositoryRoot, regenerateIndex, workspaceDirectoryName, processPath } from "../filesystem/workspace.js";
import { canonicalEntityId, findTask, listEntities } from "../filesystem/entities.js";
import { batchSubtreeComplete, batchTree, subtreeTasks } from "../filesystem/batches.js";
import { entityFilename, mintId } from "../core/identity.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { assertValid, validateTaskDefinitionFile, validateTaskFile } from "../core/validation.js";
import { BRANCH_PREFIXES } from "../core/profiles.js";
import { invocationLine } from "../core/invocation.js";
import { assertClean, assertSafeWorktreePath, git } from "../git/git.js";
import { commitControlState, controlPlaneRoot, resolveControlPlane, withControlPlaneMutation } from "../git/control-plane.js";
import { findSpecNode, readSpecNodeText } from "../spec/registry.js";
import { readWorkspaceConfig } from "../core/config.js";
import { appendCliApprovalAudit, appendLifecycleEvent } from "../core/events.js";
import { cliApprovalReceipt, stampReceipt, type ApprovalReceipt } from "../core/approval-receipt.js";
import { readEnv } from "../core/env.js";
import { assertDistinctReviewEvidence, declaredCommand, prepareReviewEvidence, type ReviewEvidenceInput } from "../core/review-evidence.js";
import { taskCoverage, validateTaskCoverage, type CoverageEntry } from "../core/coverage.js";

export function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

/** Git's own rules for a ref name, checked before Kotta hands Git a name it chose. */
const INVALID_BRANCH = /(^[-./])|([./]$)|(\.\.)|(@\{)|([\s~^:?*[\\])|(\/\/)|(\.lock$)/;

/**
 * The name Kotta gives a branch it creates. `git.branch_pattern` shapes it; the shipped default
 * `{prefix}/{id}-{slug}` reproduces the names this produced when the pattern was hardcoded.
 */
export function branchName(type: string, id: string, title: string, pattern = "{prefix}/{id}-{slug}"): string {
  const rendered = pattern
    .replaceAll("{prefix}", BRANCH_PREFIXES[type] ?? "feat")
    .replaceAll("{id}", id)
    .replaceAll("{slug}", slugify(title));
  if (!rendered.trim() || INVALID_BRANCH.test(rendered)) {
    throw new Error(`git.branch_pattern '${pattern}' produced '${rendered}', which Git will not accept as a branch name.`);
  }
  return rendered;
}

export function newTask(options: { title: string; type: string; profiles: string[] }, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const id = mintId("T");
  const filename = entityFilename(id, slugify(options.title));
  const directory = processPath(root, "tasks");
  // An empty directory is not carried into a fresh worktree by Git; intake must still work there.
  mkdirSync(directory, { recursive: true });
  const path = join(directory, filename);
  const now = new Date().toISOString().slice(0, 10);
  const data = { id, title: options.title, status: "backlog", origin: "human", types: [options.type], profiles: options.profiles, priority: "medium", risk: "medium", batch: null, depends_on: [], blocks: [], spec: [], branch: null, pull_request: null, created_at: now, updated_at: now };
  const profileSections = options.profiles.flatMap((profile) => profileHeadings(profile)).map((heading) => `## ${heading}\n\nDescribe ${heading.toLowerCase()}.`).join("\n\n");
  const content = `# ${id} — ${options.title}\n\n## Outcome\n\nDescribe the observable outcome.\n\n${profileSections ? `${profileSections}\n\n` : ""}## Scope\n\nDescribe what is included.\n\n## Non-goals\n\nDescribe what is excluded.\n\n## Acceptance\n\n- Define an observable condition.\n\n## Verification\n\n- Explain how acceptance will be checked.\n\n## Constraints\n\nNone.\n\n## Open decisions\n\nNone.\n\n## Execution notes\n\nNone.\n`;
  writeFileSync(path, renderMarkdown(data, content));
  regenerateIndex(root);
  return { ok: true, command: "task new", data: { id, path } };
}

const DEFINITION_FIELDS = new Set(["id", "title", "types", "profiles", "priority", "risk", "depends_on", "blocks", "spec", "coverage"]);

/** A title changes only through the explicit definition field; body headings are prose. */
function definitionTitle(draft: ReturnType<typeof parseMarkdown>, current: unknown): string {
  if (draft.data.title === undefined) return String(current ?? "").trim();
  const explicit = String(draft.data.title).trim();
  if (!explicit) throw new Error("Task title is required.");
  return explicit;
}

/** The `spec` entries a task carries, normalised; absent and empty are the same thing. */
export function specReferences(data: Record<string, unknown>): string[] {
  return Array.isArray(data.spec) ? data.spec.map(String).map((value) => value.trim()).filter(Boolean) : [];
}

/**
 * A task may name the specification it rests on; the specification never names the task, so
 * this is the only place the two meet. Storing an id that resolves to nothing would make the
 * reference decoration, so an unresolvable one is refused by name.
 */
function assertSpecReferences(root: string, id: string, value: unknown): void {
  const missing = specReferences({ spec: value }).filter((reference) => !findSpecNode(root, reference));
  if (missing.length) {
    throw new Error(`Task ${id} references specification ${missing.length === 1 ? "node" : "nodes"} that ${missing.length === 1 ? "does" : "do"} not exist: ${missing.join(", ")}.`);
  }
}

export function defineTask(id: string, definition: string, repositoryRoot?: string, options: { draft?: boolean } = {}) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const task = findTask(root, id);
  if (!["backlog", "defined"].includes(task.state)) {
    throw new Error(`Task ${id} can only be defined before execution, while it is in backlog or defined; it is ${task.state}.`);
  }
  // A draft iterates a capture in place (SM-01m0f0wn89gjy6dbk1j6fjpv6j): structure validated,
  // no coverage demanded, the task stays in backlog. Anything that already left backlog is
  // amended only at full definition strength — the coverage gate guards the defined boundary.
  if (options.draft && task.state !== "backlog") {
    throw new Error(`--draft amends a captured task; ${id} is ${task.state}. Amend it with a full definition instead.`);
  }
  const original = readFileSync(task.path, "utf8");
  const current = parseMarkdown(original);
  const draft = parseMarkdown(definition);
  const unknown = Object.keys(draft.data).filter((field) => !DEFINITION_FIELDS.has(field));
  if (unknown.length) throw new Error(`Unsupported definition fields: ${unknown.join(", ")}.`);
  if (draft.data.id !== undefined && String(draft.data.id) !== id) throw new Error(`Definition id '${String(draft.data.id)}' does not match ${id}.`);
  if (!draft.content.trim()) throw new Error("Task definition body is required.");

  current.data.title = definitionTitle(draft, current.data.title);
  for (const field of ["types", "profiles", "priority", "risk", "depends_on", "blocks", "spec", "coverage"] as const) {
    if (draft.data[field] !== undefined) current.data[field] = draft.data[field];
  }
  for (const field of ["depends_on", "blocks"] as const) {
    const references = Array.isArray(current.data[field]) ? current.data[field].map(String) : [];
    if (references.includes(id)) throw new Error(`Task ${id} cannot reference itself in ${field}.`);
    for (const reference of references) findTask(root, reference);
  }
  assertSpecReferences(root, id, current.data.spec);
  const targetState = options.draft ? "backlog" : "defined";
  current.data.status = targetState;
  current.data.updated_at = new Date().toISOString().slice(0, 10);
  const filename = entityFilename(id, slugify(String(current.data.title)));
  const destination = join(processPath(root, "tasks"), filename);
  if (destination !== task.path && existsSync(destination)) {
    throw new Error(`Task ${id} cannot be retitled because ${destination} already exists.`);
  }
  const candidate = `${destination}.define-${process.pid}.tmp`;
  writeFileSync(candidate, renderMarkdown(current.data, draft.content));
  try {
    assertValid(targetState === "backlog"
      ? validateTaskDefinitionFile(candidate)
      : validateTaskFile(candidate, targetState));
    if (!options.draft) {
      const coverageErrors = validateTaskCoverage(root, current.data, draft.content, candidate);
      assertValid({ valid: coverageErrors.length === 0, errors: coverageErrors });
    }
    renameSync(candidate, destination);
    if (destination !== task.path) unlinkSync(task.path);
  } catch (error) {
    if (existsSync(candidate)) unlinkSync(candidate);
    throw error;
  }
  appendLifecycleEvent(root, id, targetState, options.draft
    ? "Task draft amended in backlog; coverage is checked when it is defined."
    : task.state === "defined"
      ? "Task definition amended before execution."
      : "Task definition validated for accepted-spec coverage; the task is defined.");
  regenerateIndex(root);
  return {
    ok: true,
    command: "task define",
    data: {
      id,
      path: destination,
      state: targetState,
      // A definition that validates is defined; there is no gate between here and starting.
      nextStep: options.draft ? `kotta task define ${id} --from <file>` : `kotta task start ${id} --agent <agent>`,
    },
  };
}

function profileHeadings(profile: string): string[] {
  const requirements: Record<string, string[]> = {
    workflow: ["Actors", "Initial state", "States", "Transitions", "Triggers", "Permissions", "Error paths", "Cancellation path", "Retry and duplicate-action behaviour", "Audit and notification expectations"],
    ui: ["User goal", "Entry point", "Default state", "Loading state", "Empty state", "Error state", "Success state", "Disabled state", "Responsive behaviour", "Keyboard and focus behaviour", "Accessibility expectations", "Visual reference"],
    performance: ["Measured baseline", "Target value", "Measurement environment", "Workload and data volume", "Aggregation or percentile", "Permitted variance", "Regression limits", "Before/after verification"],
    metric: ["Decision supported by the metric", "Exact semantic definition", "Numerator and denominator", "Unit of analysis", "Time window", "Segmentation", "Source events or tables", "Exclusions", "Validation cases"],
    bug: ["Actual behaviour", "Expected behaviour", "Reproduction steps", "Environment", "Frequency", "Impact", "Regression-test expectation"],
    refactor: ["Current structural problem", "Demonstrated cost or risk", "Behavioural invariants", "Target structural property", "Excluded redesign", "Behaviour-preserving verification"],
    discovery: ["Decision to be supported", "Research question", "Hypotheses", "Method", "Time or depth limit", "Expected output", "Decision criterion"],
  };
  return requirements[profile] ?? [];
}

export function validateTask(id: string, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const task = findTask(root, id);
  const report = validateTaskFile(task.path);
  const errors = [...report.errors];
  const entity = parseMarkdown(readFileSync(task.path, "utf8"));
  for (const reference of specReferences(entity.data)) {
    if (!findSpecNode(root, reference)) {
      errors.push({ code: "SPEC_NOT_FOUND", message: `References specification node '${reference}', which does not exist in this workspace.`, path: task.path });
    }
  }
  const cancelled = task.state === "done" && ["cancelled", "duplicate", "obsolete"].includes(String(entity.data.resolution));
  // Backlog capture and terminal retirement are not executable promises; everything between them is.
  if (task.state !== "backlog" && !cancelled) {
    errors.push(...validateTaskCoverage(root, entity.data, entity.content, task.path));
  }
  return { ok: errors.length === 0, command: "task validate", data: { id, state: task.state }, errors };
}

export interface StartTaskOptions {
  /** Symbolic Git ref whose current commit becomes the new execution branch's baseline. */
  startRef?: string;
  /** Batch coordinator ref used to prove reviewed same-batch dependencies are already integrated. */
  dependencyIntegrationTarget?: string;
}

function resolveCommit(root: string, ref: string, label: string): string {
  if (!ref.trim()) throw new Error(`${label} is required.`);
  try { return git(root, ["rev-parse", "--verify", `${ref}^{commit}`]); }
  catch { throw new Error(`${label} '${ref}' does not resolve to a Git commit.`); }
}

/**
 * Human acceptance and technical wave readiness are deliberately different predicates. A reviewed
 * dependency unlocks only another member of its own batch, and only when Git proves the feature
 * branch is already contained in the coordinator commit being used for this dispatch.
 */
export function batchDependencySatisfied(root: string, dependencyId: string, batchId: string, integrationTarget: string): boolean {
  const dependency = findTask(root, dependencyId);
  if (dependency.state === "done") return true;
  if (dependency.state !== "review") return false;
  const entity = parseMarkdown(readFileSync(dependency.path, "utf8"));
  if (entity.data.batch !== batchId) return false;
  const branch = typeof entity.data.branch === "string" ? entity.data.branch.trim() : "";
  if (!branch) return false;
  try {
    git(root, ["merge-base", "--is-ancestor", branch, integrationTarget]);
    return true;
  } catch { return false; }
}

export function startTask(
  id: string,
  agent: string,
  executionMode: "fresh" | "inherited" = "fresh",
  repositoryRoot?: string,
  options: StartTaskOptions = {},
) {
  const callerRoot = repositoryRoot ?? findRepositoryRoot();
  return withControlPlaneMutation(callerRoot, (root) => {
    const task = findTask(root, id);
    if (task.state !== "defined") throw new Error(`Task ${id} must be defined before start.`);
    assertValid(validateTaskFile(task.path, "defined"));
    const claimInControl = processPath(root, "claims", `${id}.yaml`);
    if (existsSync(claimInControl)) throw new Error(`Task ${id} already has a claim.`);
    const definedSnapshot = readFileSync(task.path, "utf8");
    const entity = parseMarkdown(definedSnapshot);
    const config = readWorkspaceConfig(root);
    const coverageErrors = validateTaskCoverage(root, entity.data, entity.content, task.path);
    assertValid({ valid: coverageErrors.length === 0, errors: coverageErrors });
    const dependencies = Array.isArray(entity.data.depends_on) ? entity.data.depends_on.map(String) : [];
    const startRef = options.startRef ?? "HEAD";
    const startCommit = resolveCommit(root, startRef, "Start ref");
    const dependencyIntegrationTarget = options.dependencyIntegrationTarget;
    const integrationCommit = dependencyIntegrationTarget
      ? dependencyIntegrationTarget === startRef
        ? startCommit
        : resolveCommit(root, dependencyIntegrationTarget, "Dependency integration target")
      : null;
    const batchId = typeof entity.data.batch === "string" ? entity.data.batch : null;
    if (integrationCommit && !batchId) throw new Error(`Task ${id} has no batch for dependency integration target '${dependencyIntegrationTarget}'.`);
    const incomplete = dependencies.filter((dependency) => integrationCommit && batchId
      ? !batchDependencySatisfied(root, dependency, batchId, integrationCommit)
      : findTask(root, dependency).state !== "done");
    if (incomplete.length) throw new Error(`Unresolved dependencies: ${incomplete.join(", ")}. Complete them before starting ${id}.`);
    const title = String(entity.data.title);
    const type = Array.isArray(entity.data.types) ? String(entity.data.types[0]) : String(entity.data.type ?? "feature");
    const controlPlane = resolveControlPlane(callerRoot);

    // One checkout on a branch of the environment's choosing means the branch was already named and
    // there is nowhere to put a second worktree: Kotta takes what it was given and records that it
    // created neither, so nothing later deletes a checkout that was never ours
    // (D-01kztv9ysf77134nbqnw28mwg5).
    //
    // A single checkout sitting on a protected branch is the ordinary local case, not a host-chosen
    // work branch. There Kotta names and creates as it always has — which is also how it keeps
    // execution off the protected branch instead of refusing to start at all.
    const adopting = controlPlane.mode === "single" && controlPlane.branch !== null && !config.protectedBranches.includes(controlPlane.branch);

    const branch = adopting ? controlPlane.branch! : branchName(type, id, title, config.branchPattern);
    const worktreeRelative = adopting ? "." : `.worktrees/${id}`;
    const worktree = adopting ? root : join(root, worktreeRelative);
    if (adopting && git(root, ["rev-parse", "HEAD"]) !== startCommit) {
      throw new Error(`The adopted checkout is not at start ref '${startRef}' commit ${startCommit}; Kotta cannot move an environment-owned checkout.`);
    }
    // Releasing a claim returns the task to defined and preserves its branch and worktree on
    // purpose, so a start that finds exactly the pair this task records is resuming that work
    // rather than colliding with it. Any other existing branch of the same name still refuses.
    const resuming = !adopting && entity.data.branch === branch && Boolean(git(root, ["branch", "--list", branch]));
    if (!adopting && !resuming) {
      assertSafeWorktreePath(worktree);
      if (git(root, ["branch", "--list", branch])) throw new Error(`Branch already exists: ${branch}`);
    }

    let createdWorktree = false;
    let lifecyclePath: string | null = null;
    try {
      if (!adopting && !resuming) {
        git(root, ["worktree", "add", worktree, "-b", branch, startCommit]);
        createdWorktree = true;
      } else if (resuming && !existsSync(worktree)) {
        git(root, ["worktree", "add", worktree, branch]);
        createdWorktree = true;
      }
      if (readEnv("TEST_FAIL_START_AT") === "after-worktree") throw new Error("Injected start failure after worktree creation.");
      mkdirSync(processPath(root, "claims"), { recursive: true });
      entity.data.status = "active";
      entity.data.branch = branch;
      entity.data.assigned_agent = agent;
      entity.data.worktree = worktreeRelative;
      entity.data.execution_mode = executionMode;
      entity.data.branch_origin = adopting ? "adopted" : "created";
      entity.data.start_ref = startRef;
      entity.data.start_commit = startCommit;
      if (dependencyIntegrationTarget) entity.data.dependency_integration_target = dependencyIntegrationTarget;
      entity.data.updated_at = new Date().toISOString().slice(0, 10);
      writeFileSync(task.path, renderMarkdown(entity.data, entity.content));
      if (readEnv("TEST_FAIL_START_AT") === "after-active") throw new Error("Injected start failure after control-plane activation.");
      const claim = {
        task: id, agent, branch, worktree: worktreeRelative, execution_mode: executionMode,
        origin: adopting ? "adopted" : "created", start_ref: startRef, start_commit: startCommit,
        ...(dependencyIntegrationTarget ? { dependency_integration_target: dependencyIntegrationTarget } : {}),
        started_at: new Date().toISOString(),
      };
      writeFileSync(claimInControl, stringify(claim));
      if (readEnv("TEST_FAIL_START_AT") === "after-claim") throw new Error("Injected start failure after claim creation.");
      assertValid(validateTaskFile(task.path, "active"));
      regenerateIndex(root);
      lifecyclePath = appendLifecycleEvent(root, id, "active", `Execution started on ${branch} with ${agent} from ${startRef} at ${startCommit}${adopting ? ", adopting the only checkout; Kotta created no branch and no worktree." : resuming ? ", resuming the branch and worktree a released claim left behind." : "."}`).path;
      commitControlState(root, `chore(kotta): start ${id}`);
    } catch (error) {
      if (lifecyclePath && existsSync(lifecyclePath)) unlinkSync(lifecyclePath);
      if (existsSync(claimInControl)) unlinkSync(claimInControl);
      writeFileSync(task.path, definedSnapshot);
      regenerateIndex(root);
      if (createdWorktree) {
        try { git(root, ["worktree", "remove", worktree]); } catch { /* preserve the original failure */ }
        // A batch baseline can be ahead of the control checkout, so `branch -d` would mistake an
        // untouched just-created branch for unmerged work. Delete only if it still points at the
        // exact commit Kotta created it from; any unexpected movement is preserved for inspection.
        try { git(root, ["update-ref", "-d", `refs/heads/${branch}`, startCommit]); } catch { /* preserve the original failure */ }
      }
      throw error;
    }
    return {
      ok: true,
      command: "task start",
      data: {
        id, branch, worktree, startRef, startCommit,
        dependencyIntegrationTarget: dependencyIntegrationTarget ?? null,
        executionMode,
        origin: adopting ? "adopted" : "created",
        nextStep: executionMode === "fresh" ? `kotta task execute ${id} --resume` : `Continue execution in ${worktree}.`,
        callerStep: `Continue in ${worktree}; this is the explicit inherited-context mode.`,
      },
    };
  });
}

export interface ReviewDeclarations {
  deviations?: string;
  observationsCreated?: string;
  knownConcerns?: string;
}

const NOT_DECLARED = "Not declared.";

export function reviewTask(id: string, evidence: ReviewEvidenceInput, pullRequest?: string, declarations: ReviewDeclarations = {}, repositoryRoot?: string) {
  const callerRoot = repositoryRoot ?? findRepositoryRoot();
  return withControlPlaneMutation(callerRoot, (root) => {
  const canonical = findTask(root, id);
  // An adopted task has no `.worktrees/` entry: the environment's own checkout is where the
  // work happened, and it is the tree whose cleanliness matters here.
  const adopted = parseMarkdown(readFileSync(canonical.path, "utf8")).data.branch_origin === "adopted";
  const executionRoot = adopted ? root : join(root, ".worktrees", id);
  const canonicalClaim = processPath(root, "claims", `${id}.yaml`);
  const legacyClaim = processPath(executionRoot, "claims", `${id}.yaml`);
  let task = canonical;
  let legacy = false;
  if (canonical.state !== "active" && existsSync(executionRoot)) {
    const candidate = findTask(executionRoot, id);
    if (canonical.state === "defined" && candidate.state === "active" && existsSync(legacyClaim)) {
      task = candidate;
      legacy = true;
    }
  }
  if (task.state !== "active") throw new Error(`Task ${id} must be active before review; the control plane reports ${canonical.state}.`);
  assertClean(executionRoot);
  const canonicalSnapshot = readFileSync(canonical.path, "utf8");
  const entity = parseMarkdown(readFileSync(task.path, "utf8"));
  entity.data.status = "review";
  entity.data.pull_request = pullRequest ?? null;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const acceptance = sections(entity.content).get("acceptance")?.split(/\r?\n/).map((line) => /^\s*[-*]\s+(.+)/.exec(line)?.[1]).filter((line): line is string => Boolean(line)) ?? [];
  const profileChecks = (Array.isArray(entity.data.profiles) ? entity.data.profiles.map(String) : []).flatMap((profile) => {
    const path = processPath(root, "profiles", `${profile}.yaml`);
    if (!existsSync(path)) return [];
    const definition = parseYaml(readFileSync(path, "utf8")) as { done_checks?: unknown[] };
    return (definition.done_checks ?? []).map((check) => `${profile}: ${String(check)}`);
  });
  const checks = [...acceptance, ...profileChecks];
  const preparedEvidence = prepareReviewEvidence(checks, evidence);
  assertDistinctReviewEvidence(preparedEvidence.entries);
  // A declared check is run, not transcribed (BR-01m0m33yxt2vqxb3jvqc186ssy): every `run:` entry
  // executes in the execution checkout before anything is written, so a failing check refuses the
  // whole submission and a recorded one is the receipt of a real run.
  const runnable = preparedEvidence.entries
    .map((entry) => ({ check: entry.check, command: declaredCommand(entry.evidence) }))
    .filter((entry): entry is { check: string; command: string } => entry.command !== null);
  const verifiedAt = runnable.length ? git(executionRoot, ["rev-parse", "HEAD"]).slice(0, 7) : null;
  for (const entry of runnable) {
    const outcome = spawnSync(entry.command, { cwd: executionRoot, shell: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (outcome.status !== 0) {
      throw new Error(`Declared check for '${entry.check}' failed: '${entry.command}' exited with ${outcome.status ?? `signal ${outcome.signal ?? "unknown"}`}. The submission was refused; ${id} stays active.`);
    }
  }
  const verified = new Set(runnable.map((entry) => entry.check));
  const evidenceRows = preparedEvidence.entries.map(({ check, evidence: answer }) =>
    `| ${check.replaceAll("|", "\\|")} | ${answer.replaceAll("|", "\\|").replaceAll("\n", " ")}${verified.has(check) ? ` — verified: exit 0 at ${verifiedAt}` : ""} |`).join("\n");
  const declared = (value: string | undefined) => (value !== undefined && value.trim() ? value.trim() : NOT_DECLARED);
  const reviewEvidence = `\n\n## Review evidence\n\n| Acceptance condition | Evidence |\n|---|---|\n${evidenceRows}\n\n### Verification performed\n\n${preparedEvidence.verification}\n\n### Deviations\n\n${declared(declarations.deviations)}\n\n### Observations created\n\n${declared(declarations.observationsCreated)}\n\n### Known concerns\n\n${declared(declarations.knownConcerns)}\n`;
  const destination = join(processPath(root, "tasks"), task.filename);
  writeFileSync(destination, renderMarkdown(entity.data, `${entity.content.trimEnd()}${reviewEvidence}`));
  if (canonical.path !== destination) unlinkSync(canonical.path);
  if (legacy && !existsSync(canonicalClaim)) writeFileSync(canonicalClaim, readFileSync(legacyClaim, "utf8"));
  regenerateIndex(root);
  const verificationNote = runnable.length ? ` ${runnable.length} declared check${runnable.length === 1 ? "" : "s"} verified at ${verifiedAt}.` : "";
  appendLifecycleEvent(root, id, "review", `${pullRequest ? `Submitted for review in ${pullRequest}.` : "Submitted for review."}${verificationNote}`);
  commitControlState(root, `chore(kotta): submit ${id} for review`);

  // One-time adoption path for executions started before the control-plane model existed.
  // Restore the feature branch's original defined snapshot so its net diff contains code, not lifecycle state.
  if (legacy) {
    const legacyDirectory = processPath(executionRoot, "tasks");
    mkdirSync(legacyDirectory, { recursive: true });
    const restored = join(legacyDirectory, canonical.filename);
    writeFileSync(restored, canonicalSnapshot);
    if (task.path !== restored && existsSync(task.path)) unlinkSync(task.path);
    if (existsSync(legacyClaim)) unlinkSync(legacyClaim);
    regenerateIndex(executionRoot);
    git(executionRoot, ["add", workspaceDirectoryName(executionRoot)]);
    git(executionRoot, ["commit", "-m", `chore(kotta): move ${id} lifecycle to control plane`]);
  }
  return { ok: true, command: "task review", data: { id, pullRequest: pullRequest ?? null, controlRoot: root, adoptedLegacyState: legacy } };
  });
}

export function closeTask(id: string, approved: boolean, repositoryRoot?: string, options: { locked?: boolean; commit?: boolean; approvalRecorded?: boolean; receipt?: ApprovalReceipt } = {}) {
  const callerRoot = repositoryRoot ?? findRepositoryRoot();
  const close = (root: string) => {
  const task = findTask(root, id);
  if (task.state !== "review") throw new Error(`Task ${id} must be in review before close.`);
  if (!approved) throw new Error("Human done approval is required. Re-run with --approve after acceptance verification.");
  const entity = parseMarkdown(readFileSync(task.path, "utf8"));
  const branch = String(entity.data.branch ?? "");
  if (!branch) throw new Error(`Task ${id} has no execution branch.`);
  const batch = typeof entity.data.batch === "string" ? entity.data.batch : null;
  const coordinator = batch ? `coord/${batch}` : null;
  const integrationTarget = coordinator && git(root, ["branch", "--list", coordinator]) ? coordinator : "HEAD";
  const merged = git(root, ["branch", "--merged", integrationTarget]).split(/\r?\n/).map((line) => line.replace(/^[*+]?\s*/, "")).includes(branch);
  if (!merged) throw new Error(`Branch ${branch} is not merged into ${integrationTarget === "HEAD" ? "the control branch" : `batch coordinator ${integrationTarget}`}.`);
  const adopted = entity.data.branch_origin === "adopted";
  const worktree = adopted ? root : join(root, ".worktrees", id);
  if (existsSync(worktree) && git(worktree, ["status", "--porcelain"])) throw new Error(`Worktree ${worktree} contains uncommitted changes; refusing cleanup.`);
  entity.data.status = "done";
  entity.data.resolution = "completed";
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  stampReceipt(entity.data, options.receipt ?? cliApprovalReceipt("task.close"));
  writeFileSync(task.path, renderMarkdown(entity.data, entity.content));
  const claimPath = processPath(root, "claims", `${id}.yaml`);
  if (existsSync(claimPath)) unlinkSync(claimPath);
  updateContainingBatch(root, id);
  regenerateIndex(root);
  appendLifecycleEvent(root, id, "done", "Review accepted and task closed.");
  if (!options.approvalRecorded) appendCliApprovalAudit(root, id, "task.close");
  // Kotta removes only what Kotta created. An adopted branch and checkout belong to the environment
  // that provided them, and deleting either would take the session's own working copy with it.
  if (!adopted) {
    if (existsSync(worktree)) {
      git(root, ["worktree", "remove", worktree]);
    }
    if (integrationTarget === "HEAD") git(root, ["branch", "-d", branch]);
    else {
      const expected = git(root, ["rev-parse", `refs/heads/${branch}`]);
      git(root, ["update-ref", "-d", `refs/heads/${branch}`, expected]);
    }
  }
  if (options.commit !== false) commitControlState(root, `chore(kotta): close ${id}`);
  return { ok: true, command: "task close", data: { id, resolution: "completed", controlRoot: root, adopted, preserved: adopted ? { branch, worktree } : null } };
  };
  return options.locked ? close(callerRoot) : withControlPlaneMutation(callerRoot, close);
}

const CANCEL_RESOLUTIONS = ["duplicate", "obsolete", "cancelled"] as const;
/**
 * Every resolution a task can end with. `close` writes `completed`; the rest are cancel's, and the
 * published task schema states the union — so the union lives here rather than only in the schema.
 */
export const TASK_RESOLUTIONS = ["completed", ...CANCEL_RESOLUTIONS] as const;
/** Every live state. A retirement must reach the work wherever it got to, or it is not a retirement. */
const CANCELLABLE_STATES = ["backlog", "defined", "active", "review"];
/** Resolutions that assert something else took this work's place. The something else gets named. */
const SUPERSEDING_RESOLUTIONS = ["duplicate", "obsolete"];

/**
 * The task or decision a cancellation points at, resolved to its canonical id.
 * A dangling link is worse than no link, because it reads as an answer.
 */
function supersedingEntity(root: string, value: string, cancelled: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("--superseded-by requires the id of the task or decision that took this work's place.");
  for (const kind of ["task", "decision"] as const) {
    const canonical = canonicalEntityId(root, kind, trimmed);
    if (!listEntities(root, kind).some((found) => found.id === canonical)) continue;
    if (canonical === cancelled) throw new Error(`Task ${cancelled} cannot supersede itself.`);
    return canonical;
  }
  throw new Error(`--superseded-by '${trimmed}' names no task or decision in this workspace.`);
}

/** Tasks that declared a dependency on the one being retired. Reported, never cascaded. */
function dependentTasks(root: string, id: string): string[] {
  return listEntities(root, "task")
    .filter(({ state }) => state !== "done")
    .filter((found) => {
      const depends = parseMarkdown(readFileSync(found.path, "utf8")).data.depends_on;
      return Array.isArray(depends) && depends.map(String).includes(id);
    })
    .map(({ id: dependent }) => dependent);
}

/**
 * Retire work that should not continue, from any state it can be sitting in.
 *
 * `close` is for work that was finished and merged; this is for work whose purpose is gone —
 * superseded by a decision, duplicated by another task, or abandoned. Both end at `done`;
 * only this one has to say why, and only this one keeps the branch, because a cancelled branch
 * was never merged and its commits are the single copy of whatever was built.
 */
export function cancelTask(
  id: string,
  resolution: string,
  reason: string,
  approved: boolean,
  repositoryRoot?: string,
  options: { supersededBy?: string; locked?: boolean; commit?: boolean; approvalRecorded?: boolean; receipt?: ApprovalReceipt } = {},
) {
  const callerRoot = repositoryRoot ?? findRepositoryRoot();
  const cancel = (root: string) => {
  if (!CANCEL_RESOLUTIONS.includes(resolution as (typeof CANCEL_RESOLUTIONS)[number])) throw new Error(`Cancel resolution must be one of ${CANCEL_RESOLUTIONS.join(", ")}; got '${resolution}'.`);
  const stated = reason.trim();
  if (!stated) throw new Error("A cancellation requires --reason \"…\". A retirement with no stated cause is the fact this command exists to keep.");
  // The claim and worktree paths are keyed by the full id; resolving the short form the
  // listings print keeps a `cancel T-rf5d4tfp` from quietly leaving both behind.
  const canonicalId = canonicalEntityId(root, "task", id);
  const task = findTask(root, canonicalId);
  if (task.state === "done") throw new Error(`Task ${canonicalId} is already done; a retired or completed task returns through reopen, not through a second cancel.`);
  if (!CANCELLABLE_STATES.includes(task.state)) throw new Error(`Task ${canonicalId} cannot be cancelled from ${task.state}.`);
  if (!approved) throw new Error("Human cancel approval is required. Re-run with --approve after confirming the task should be retired.");
  const superseding = options.supersededBy ? supersedingEntity(root, options.supersededBy, canonicalId) : null;
  if (!superseding && SUPERSEDING_RESOLUTIONS.includes(resolution)) {
    throw new Error(`Resolution '${resolution}' says other work took this task's place; name it with --superseded-by, or retire the task with --resolution cancelled.`);
  }
  const entity = parseMarkdown(readFileSync(task.path, "utf8"));
  const branch = typeof entity.data.branch === "string" ? entity.data.branch : null;
  const adopted = entity.data.branch_origin === "adopted";
  // Mirrors close: an absent worktree is not an obstacle, only an unclean one. Reusing the
  // claim-release guard instead would refuse a missing worktree and trap the very task
  // this command exists to free.
  const worktree = adopted ? root : join(root, ".worktrees", canonicalId);
  if (existsSync(worktree) && git(worktree, ["status", "--porcelain"])) throw new Error(`Worktree ${worktree} contains uncommitted changes; ${canonicalId} was not cancelled.`);
  entity.data.status = "done";
  entity.data.resolution = resolution;
  entity.data.cancellation_reason = stated;
  if (superseding) entity.data.superseded_by = superseding;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  stampReceipt(entity.data, options.receipt ?? cliApprovalReceipt("task.cancel"));
  const candidate = `${task.path}.cancel-${process.pid}.tmp`;
  writeFileSync(candidate, renderMarkdown(entity.data, entity.content));
  try {
    assertValid(validateTaskFile(candidate, "done"));
    renameSync(candidate, task.path);
  } catch (error) {
    if (existsSync(candidate)) unlinkSync(candidate);
    throw error;
  }
  const claimPath = processPath(root, "claims", `${canonicalId}.yaml`);
  const claimReleased = existsSync(claimPath);
  if (claimReleased) unlinkSync(claimPath);
  const dependents = dependentTasks(root, canonicalId);
  updateContainingBatch(root, canonicalId);
  regenerateIndex(root);
  const summary = [
    `Task cancelled from ${task.state} with resolution ${resolution}.`,
    `Reason: ${stated}`,
    superseding ? `Superseded by ${superseding}.` : null,
    claimReleased ? "The claim was released." : null,
    branch ? `Branch ${branch} was preserved.` : null,
    adopted ? "The checkout was adopted, not created, and was left in place." : null,
  ].filter(Boolean).join(" ");
  appendLifecycleEvent(root, canonicalId, "done", summary);
  if (!options.approvalRecorded) appendCliApprovalAudit(root, canonicalId, "task.cancel", { resolution, reason: stated, superseded_by: superseding });
  if (!adopted && existsSync(worktree)) git(root, ["worktree", "remove", worktree]);
  if (options.commit !== false) commitControlState(root, `chore(kotta): cancel ${canonicalId} (${resolution})`);
  return { ok: true, command: "task cancel", data: { id: canonicalId, resolution, reason: stated, supersededBy: superseding, path: task.path, claimReleased, branch, adopted, dependents } };
  };
  return options.locked ? cancel(callerRoot) : withControlPlaneMutation(callerRoot, cancel);
}

export function reopenTask(id: string, approved: boolean, repositoryRoot?: string, options: { locked?: boolean; commit?: boolean; approvalRecorded?: boolean; receipt?: ApprovalReceipt } = {}) {
  const requestedRoot = repositoryRoot ?? findRepositoryRoot();
  const reopen = (root: string) => {
  const task = findTask(root, id);
  if (!["review", "done"].includes(task.state)) throw new Error(`Task ${id} can only reopen from review or done.`);
  if (!approved) throw new Error("Human approval is required to reopen terminal or reviewed work.");
  const entity = parseMarkdown(readFileSync(task.path, "utf8"));
  const changesRequested = task.state === "review";
  if (changesRequested && !existsSync(processPath(root, "claims", `${id}.yaml`))) throw new Error(`Review changes cannot resume because ${id} has no claim.`);
  entity.data.status = changesRequested ? "active" : "backlog";
  if (!changesRequested) {
    entity.data.resolution = null;
    entity.data.branch = null;
    delete entity.data.worktree;
    delete entity.data.execution_mode;
  }
  entity.data.pull_request = null;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  stampReceipt(entity.data, options.receipt ?? cliApprovalReceipt(changesRequested ? "task.request-changes" : "task.reopen"));
  const content = changesRequested ? entity.content.replace(/\n\n## Review evidence[\s\S]*$/, "\n") : entity.content;
  writeFileSync(task.path, renderMarkdown(entity.data, content));
  regenerateIndex(root);
  appendLifecycleEvent(root, id, changesRequested ? "active" : "backlog", changesRequested ? "Review changes requested; execution resumed." : "Terminal task reopened in backlog.");
  if (!options.approvalRecorded) appendCliApprovalAudit(root, id, changesRequested ? "task.request-changes" : "task.reopen");
  if (options.commit !== false) commitControlState(root, `chore(kotta): reopen ${id} for changes`);
  return { ok: true, command: "task reopen", data: { id, state: changesRequested ? "active" : "backlog" } };
  };
  return options.locked ? reopen(requestedRoot) : withControlPlaneMutation(requestedRoot, reopen);
}

export interface BriefSection {
  name: string;
  characters: number;
}

export interface BriefResult {
  ok: boolean;
  command: "task brief";
  data: {
    id: string;
    state: string;
    tokens: number;
    warnTokens: number;
    warning: string | null;
    largestSection: string;
    sections: BriefSection[];
    decisions: string[];
    missingDecisions: string[];
    spec: string[];
    missingSpec: string[];
    coverage: CoverageEntry[];
    path: string | null;
    brief: string;
  };
}

/** Approximate token count: stable, documented heuristic (chars / 4, rounded up). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Assemble the minimal execution context for one task (D-009 / T-026):
 * the task body, the decisions it references, its profile requirements and
 * its claim — and nothing else. Deterministic: same workspace, same bytes.
 */
export function briefTask(id: string, options: { out?: string; warnTokens?: number } = {}, repositoryRoot?: string): BriefResult {
  const requestedRoot = repositoryRoot ?? findRepositoryRoot();
  const controlRoot = controlPlaneRoot(requestedRoot);
  let root = controlRoot;
  // Compatibility for a run started by Kotta before lifecycle state moved to the control plane.
  if (resolve(requestedRoot) !== resolve(controlRoot)) {
    try {
      const canonical = findTask(controlRoot, id);
      const local = findTask(requestedRoot, id);
      if (canonical.state === "defined" && local.state === "active" && existsSync(processPath(requestedRoot, "claims", `${id}.yaml`))) root = requestedRoot;
    } catch { /* normal control-plane path below reports the useful error */ }
  }
  const task = findTask(root, id);
  const entity = parseMarkdown(readFileSync(task.path, "utf8"));

  const referenced = [...new Set([...entity.content.matchAll(/\bD-\d{3,}\b/g)].map((match) => match[0]))].sort();
  const decisionsDirectory = processPath(root, "decisions");
  const decisions: { id: string; content: string }[] = [];
  const missingDecisions: string[] = [];
  for (const decisionId of referenced) {
    const path = join(decisionsDirectory, `${decisionId}.md`);
    if (existsSync(path)) decisions.push({ id: decisionId, content: readFileSync(path, "utf8").trim() });
    else missingDecisions.push(decisionId);
  }

  const profiles = Array.isArray(entity.data.profiles) ? entity.data.profiles.map(String) : [];
  const profileBlocks = profiles.flatMap((profile) => {
    const path = processPath(root, "profiles", `${profile}.yaml`);
    return existsSync(path) ? [{ profile, content: readFileSync(path, "utf8").trim() }] : [];
  });

  const claimPath = processPath(root, "claims", `${id}.yaml`);
  const claim = existsSync(claimPath) ? readFileSync(claimPath, "utf8").trim() : null;

  // Rule 8 makes the brief the executor's whole world, so a referenced node that stays outside it
  // governs nothing. Missing ones are named rather than dropped: silence would read as "none".
  const specIds = specReferences(entity.data);
  const coverage = taskCoverage(entity.data, entity.content);
  const specNodes: { id: string; form: string; content: string }[] = [];
  const missingSpec: string[] = [];
  for (const specId of specIds) {
    const node = findSpecNode(root, specId);
    if (node) specNodes.push({ id: specId, form: node.form, content: readSpecNodeText(node) });
    else missingSpec.push(specId);
  }

  const dependsOn = Array.isArray(entity.data.depends_on) ? entity.data.depends_on.map(String) : [];
  const header = [
    `# Execution brief — ${id}`,
    "",
    `- id: ${id}`,
    `- title: ${String(entity.data.title ?? "")}`,
    `- state: ${task.state}`,
    `- profiles: ${profiles.length ? profiles.join(", ") : "none"}`,
    `- depends_on: ${dependsOn.length ? dependsOn.join(", ") : "none"}`,
    `- spec: ${specIds.length ? specIds.join(", ") : "none"}`,
    `- branch: ${entity.data.branch ? String(entity.data.branch) : "none"}`,
    // The brief claims to be the complete execution context, and every rule in it routes state
    // changes through Kotta — so it cannot leave how to reach Kotta to a PATH nobody checked
    // (BR-01m0r52vex4j22266nepm5yq8s). Proved from the process assembling the brief.
    `- kotta: ${invocationLine()}`,
    "",
    "This brief is the complete intent context for executing this task (D-009).",
    "It deliberately EXCLUDES: other tasks' bodies, observations, chat history and the",
    "coordinator's context. If the work cannot start from this brief plus the code in",
    "the worktree, that gap is a task defect — record it, do not silently widen",
    "the context.",
    // A rule stated without its means is a rule the agent cannot keep
    // (BR-01m0r52vex4j22266nepm5yq8s, BR-01m0fp2hdkqz08arp5ebt122r9): the header says work outside
    // this task's scope is recorded, so it names the call that records it, in the invocation that
    // was just proved to reach Kotta from here.
    "Anything you notice outside this task's scope is recorded, never silently fixed:",
    `${invocationLine()} observation new --title "…" --type <type> --evidence "…"`,
  ].join("\n");

  const parts: { name: string; text: string }[] = [
    { name: "header", text: header },
    { name: `task ${id}`, text: `## Task\n\n${entity.content.trim()}` },
    {
      name: "coverage",
      text: `## Acceptance coverage\n\n${coverage.map((entry) => `- ${entry.acceptance} → ${entry.spec.length ? entry.spec.join(", ") : "UNCOVERED"}`).join("\n") || "No acceptance conditions."}`,
    },
  ];
  for (const node of specNodes) parts.push({ name: `spec ${node.id}`, text: `## Specification ${node.id} (${node.form})\n\n${node.content}` });
  if (missingSpec.length) parts.push({ name: "missing specification", text: `## Missing specification\n\nReferenced but not found under the workspace spec root: ${missingSpec.join(", ")}` });
  for (const decision of decisions) parts.push({ name: `decision ${decision.id}`, text: `## Decision ${decision.id}\n\n${decision.content}` });
  if (missingDecisions.length) parts.push({ name: "missing decisions", text: `## Missing decisions\n\nReferenced but not found in the workspace decisions directory: ${missingDecisions.join(", ")}` });
  for (const block of profileBlocks) parts.push({ name: `profile ${block.profile}`, text: `## Profile: ${block.profile}\n\n\`\`\`yaml\n${block.content}\n\`\`\`` });
  if (claim) parts.push({ name: "claim", text: `## Claim\n\n\`\`\`yaml\n${claim}\n\`\`\`` });

  const brief = parts.map((part) => part.text).join("\n\n") + "\n";
  const sectionSizes: BriefSection[] = parts.map((part) => ({ name: part.name, characters: part.text.length }));
  // The warning's advice is "split it or sharpen it", which is advice about task content. The
  // header is fixed text the CLI owns and grows with Kotta, not with the task, so naming it as the
  // largest section would answer a question the reader cannot act on. It stays in `sections`, where
  // its size is visible, and out of the one number that carries advice.
  const measured = sectionSizes.filter((section) => section.name !== "header");
  const largestSection = [...measured].sort((a, b) => b.characters - a.characters)[0]?.name ?? "header";
  const tokens = estimateTokens(brief);
  const warnTokens = options.warnTokens ?? 12000;
  const warning = tokens > warnTokens
    ? `Brief is ${tokens} tokens (limit ${warnTokens}). Largest section: ${largestSection}. The task is probably too large or under-referenced — split it or sharpen it.`
    : null;

  let outPath: string | null = null;
  if (options.out) {
    outPath = resolve(options.out);
    writeFileSync(outPath, brief);
  }

  return {
    ok: true,
    command: "task brief",
    data: { id, state: task.state, tokens, warnTokens, warning, largestSection, sections: sectionSizes, decisions: decisions.map((decision) => decision.id), missingDecisions, spec: specNodes.map((node) => node.id), missingSpec, coverage, path: outPath, brief },
  };
}

/**
 * Every unfinished batch state, not just `active`: tasks executed one by one never take their
 * batch through `batch start`, so a batch that only ever sat in `backlog` must complete too.
 */
const OPEN_BATCH_STATES = ["backlog", "defined", "active"] as const;

/**
 * A task reaching a terminal state can finish the batch that holds it, and finishing that batch
 * can in turn finish the parent grouping it. So every open batch carrying this task anywhere in
 * its subtree is reconsidered, and reconsidered again until a pass changes nothing: a batch reads
 * its children's frontmatter status, so a parent can only be judged after its child's status has
 * been written. The completeness test is the one `batch close` asks, so the automatic path and the
 * explicit path cannot drift apart (F-01m0f1mqaydrtkx3x2nbck58ke).
 */
function updateContainingBatch(root: string, taskId: string): void {
  let changed = true;
  while (changed) {
    changed = false;
    const directory = processPath(root, "batches");
    if (!existsSync(directory)) return;
    for (const filename of readdirSync(directory).filter((name) => name.endsWith(".md"))) {
      const path = join(directory, filename);
      const entity = parseMarkdown(readFileSync(path, "utf8"));
      if (!OPEN_BATCH_STATES.includes(String(entity.data.status) as (typeof OPEN_BATCH_STATES)[number])) continue;
      const id = String(entity.data.id);
      if (!subtreeTasks(batchTree(root, id)).includes(taskId)) continue;
      entity.data.updated_at = new Date().toISOString().slice(0, 10);
      if (batchSubtreeComplete(root, id)) {
        entity.data.status = "done";
        writeFileSync(path, renderMarkdown(entity.data, entity.content));
        appendLifecycleEvent(root, id, "done", "Every task and child batch underneath completed; batch closed.", null);
        changed = true;
      } else {
        writeFileSync(path, renderMarkdown(entity.data, entity.content));
      }
    }
  }
}
