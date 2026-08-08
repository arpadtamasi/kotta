import { mkdirSync, readdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse as parseYaml, stringify } from "yaml";
import { findRepositoryRoot, regenerateIndex, workspaceDirectoryName, workspacePath } from "../filesystem/workspace.js";
import { findContract } from "../filesystem/entities.js";
import { entityFilename, mintId } from "../core/identity.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { assertValid, validateContractDefinitionFile, validateContractFile } from "../core/validation.js";
import { BRANCH_PREFIXES } from "../core/profiles.js";
import { assertClean, assertSafeWorktreePath, git } from "../git/git.js";
import { commitControlState, controlPlaneRoot, withControlPlaneMutation } from "../git/control-plane.js";
import { appendCliApprovalAudit, appendLifecycleEvent } from "../core/events.js";
import { readEnv } from "../core/env.js";

export function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function branchName(type: string, id: string, title: string): string {
  return `${BRANCH_PREFIXES[type] ?? "feat"}/${id}-${slugify(title)}`;
}

export function newContract(options: { title: string; type: string; profiles: string[] }, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const id = mintId("T");
  const filename = entityFilename(id, slugify(options.title));
  const directory = workspacePath(root, "backlog");
  // An empty state directory is not carried into a fresh worktree by Git; intake must still work there.
  mkdirSync(directory, { recursive: true });
  const path = join(directory, filename);
  const now = new Date().toISOString().slice(0, 10);
  const data = { id, title: options.title, status: "backlog", origin: "human", types: [options.type], profiles: options.profiles, priority: "medium", risk: "medium", batch: null, depends_on: [], blocks: [], branch: null, pull_request: null, created_at: now, updated_at: now };
  const profileSections = options.profiles.flatMap((profile) => profileHeadings(profile)).map((heading) => `## ${heading}\n\nDescribe ${heading.toLowerCase()}.`).join("\n\n");
  const content = `# ${id} — ${options.title}\n\n## Outcome\n\nDescribe the observable outcome.\n\n${profileSections ? `${profileSections}\n\n` : ""}## Scope\n\nDescribe what is included.\n\n## Non-goals\n\nDescribe what is excluded.\n\n## Acceptance\n\n- Define an observable condition.\n\n## Verification\n\n- Explain how acceptance will be checked.\n\n## Constraints\n\nNone.\n\n## Open decisions\n\nNone.\n\n## Execution notes\n\nNone.\n`;
  writeFileSync(path, renderMarkdown(data, content));
  regenerateIndex(root);
  return { ok: true, command: "contract new", data: { id, path } };
}

const DEFINITION_FIELDS = new Set(["id", "types", "profiles", "priority", "risk", "depends_on", "blocks"]);

export function defineContract(id: string, definition: string, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const contract = findContract(root, id);
  if (contract.state !== "backlog") throw new Error(`Contract ${id} can only be defined while it is in backlog.`);
  const current = parseMarkdown(readFileSync(contract.path, "utf8"));
  const draft = parseMarkdown(definition);
  const unknown = Object.keys(draft.data).filter((field) => !DEFINITION_FIELDS.has(field));
  if (unknown.length) throw new Error(`Unsupported definition fields: ${unknown.join(", ")}.`);
  if (draft.data.id !== undefined && String(draft.data.id) !== id) throw new Error(`Definition id '${String(draft.data.id)}' does not match ${id}.`);
  if (!draft.content.trim()) throw new Error("Contract definition body is required.");

  for (const field of ["types", "profiles", "priority", "risk", "depends_on", "blocks"] as const) {
    if (draft.data[field] !== undefined) current.data[field] = draft.data[field];
  }
  for (const field of ["depends_on", "blocks"] as const) {
    const references = Array.isArray(current.data[field]) ? current.data[field].map(String) : [];
    if (references.includes(id)) throw new Error(`Contract ${id} cannot reference itself in ${field}.`);
    for (const reference of references) findContract(root, reference);
  }
  current.data.updated_at = new Date().toISOString().slice(0, 10);
  const candidate = `${contract.path}.define-${process.pid}.tmp`;
  writeFileSync(candidate, renderMarkdown(current.data, draft.content));
  try {
    assertValid(validateContractDefinitionFile(candidate));
    renameSync(candidate, contract.path);
  } catch (error) {
    if (existsSync(candidate)) unlinkSync(candidate);
    throw error;
  }
  regenerateIndex(root);
  return { ok: true, command: "contract define", data: { id, path: contract.path } };
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

export function validateContract(id: string, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const contract = findContract(root, id);
  const report = validateContractFile(contract.path);
  return { ok: report.valid, command: "contract validate", data: { id, state: contract.state }, errors: report.errors };
}

export function signContract(id: string, approved: boolean, repositoryRoot?: string, options: { approvalRecorded?: boolean; locked?: boolean; commit?: boolean } = {}) {
  const requestedRoot = repositoryRoot ?? findRepositoryRoot();
  const sign = (root: string) => {
    const contract = findContract(root, id);
    if (contract.state !== "backlog") throw new Error(`Contract ${id} must be in backlog before it can be signed.`);
    if (!approved) throw new Error("Human sign-off is required. Re-run with --approve after reviewing intent and trade-offs.");
    const entity = parseMarkdown(readFileSync(contract.path, "utf8"));
    const dependencies = Array.isArray(entity.data.depends_on) ? entity.data.depends_on.map(String) : [];
    for (const dependency of dependencies) findContract(root, dependency);
    entity.data.status = "defined";
    entity.data.updated_at = new Date().toISOString().slice(0, 10);
    mkdirSync(workspacePath(root, "defined"), { recursive: true });
    const destination = workspacePath(root, "defined", contract.filename);
    writeFileSync(destination, renderMarkdown(entity.data, entity.content));
    try {
      assertValid(validateContractFile(destination, "defined"));
    } catch (error) {
      unlinkSync(destination);
      throw error;
    }
    unlinkSync(contract.path);
    regenerateIndex(root);
    appendLifecycleEvent(root, id, "defined", "Contract approved for execution.");
    if (!options.approvalRecorded) appendCliApprovalAudit(root, id, "contract.sign");
    if (options.commit !== false) commitControlState(root, `chore(kotta): sign ${id}`);
    return { ok: true, command: "contract sign", data: { id, path: destination } };
  };
  return options.locked ? sign(requestedRoot) : withControlPlaneMutation(requestedRoot, sign, { requireClean: false });
}

export function startContract(id: string, agent: string, executionMode: "fresh" | "inherited" = "fresh", repositoryRoot?: string) {
  const callerRoot = repositoryRoot ?? findRepositoryRoot();
  return withControlPlaneMutation(callerRoot, (root) => {
    const contract = findContract(root, id);
    if (contract.state !== "defined") throw new Error(`Contract ${id} must be defined before start.`);
    assertValid(validateContractFile(contract.path, "defined"));
    const claimInControl = workspacePath(root, "claims", `${id}.yaml`);
    if (existsSync(claimInControl)) throw new Error(`Contract ${id} already has a claim.`);
    const definedSnapshot = readFileSync(contract.path, "utf8");
    const entity = parseMarkdown(definedSnapshot);
    const dependencies = Array.isArray(entity.data.depends_on) ? entity.data.depends_on.map(String) : [];
    const incomplete = dependencies.filter((dependency) => findContract(root, dependency).state !== "done");
    if (incomplete.length) throw new Error(`Unresolved dependencies: ${incomplete.join(", ")}. Complete them before starting ${id}.`);
    const title = String(entity.data.title);
    const type = Array.isArray(entity.data.types) ? String(entity.data.types[0]) : String(entity.data.type ?? "feature");
    const branch = branchName(type, id, title);
    const worktreeRelative = `.worktrees/${id}`;
    const worktree = join(root, worktreeRelative);
    assertSafeWorktreePath(worktree);
    if (git(root, ["branch", "--list", branch])) throw new Error(`Branch already exists: ${branch}`);

    let createdWorktree = false;
    let lifecyclePath: string | null = null;
    const active = workspacePath(root, "active", contract.filename);
    try {
      git(root, ["worktree", "add", worktree, "-b", branch, "HEAD"]);
      createdWorktree = true;
      if (readEnv("TEST_FAIL_START_AT") === "after-worktree") throw new Error("Injected start failure after worktree creation.");
      mkdirSync(workspacePath(root, "active"), { recursive: true });
      mkdirSync(workspacePath(root, "claims"), { recursive: true });
      entity.data.status = "active";
      entity.data.branch = branch;
      entity.data.assigned_agent = agent;
      entity.data.worktree = worktreeRelative;
      entity.data.execution_mode = executionMode;
      entity.data.updated_at = new Date().toISOString().slice(0, 10);
      writeFileSync(active, renderMarkdown(entity.data, entity.content));
      unlinkSync(contract.path);
      if (readEnv("TEST_FAIL_START_AT") === "after-active") throw new Error("Injected start failure after control-plane activation.");
      const claim = { contract: id, agent, branch, worktree: worktreeRelative, execution_mode: executionMode, started_at: new Date().toISOString() };
      writeFileSync(claimInControl, stringify(claim));
      if (readEnv("TEST_FAIL_START_AT") === "after-claim") throw new Error("Injected start failure after claim creation.");
      assertValid(validateContractFile(active, "active"));
      regenerateIndex(root);
      lifecyclePath = appendLifecycleEvent(root, id, "active", `Execution started on ${branch} with ${agent}.`).path;
      commitControlState(root, `chore(kotta): start ${id}`);
    } catch (error) {
      if (lifecyclePath && existsSync(lifecyclePath)) unlinkSync(lifecyclePath);
      if (existsSync(active)) unlinkSync(active);
      if (existsSync(claimInControl)) unlinkSync(claimInControl);
      if (!existsSync(contract.path)) writeFileSync(contract.path, definedSnapshot);
      regenerateIndex(root);
      if (createdWorktree) {
        try { git(root, ["worktree", "remove", worktree]); } catch { /* preserve the original failure */ }
        try { git(root, ["branch", "-d", branch]); } catch { /* preserve the original failure */ }
      }
      throw error;
    }
    return {
      ok: true,
      command: "contract start",
      data: {
        id, branch, worktree,
        executionMode,
        nextStep: executionMode === "fresh" ? `kotta contract execute ${id} --resume` : `Continue execution in ${worktree}.`,
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

export function reviewContract(id: string, evidence: string, pullRequest?: string, declarations: ReviewDeclarations = {}, repositoryRoot?: string) {
  const callerRoot = repositoryRoot ?? findRepositoryRoot();
  return withControlPlaneMutation(callerRoot, (root) => {
  const canonical = findContract(root, id);
  const executionRoot = join(root, ".worktrees", id);
  const canonicalClaim = workspacePath(root, "claims", `${id}.yaml`);
  const legacyClaim = workspacePath(executionRoot, "claims", `${id}.yaml`);
  let contract = canonical;
  let legacy = false;
  if (canonical.state !== "active" && existsSync(executionRoot)) {
    const candidate = findContract(executionRoot, id);
    if (canonical.state === "defined" && candidate.state === "active" && existsSync(legacyClaim)) {
      contract = candidate;
      legacy = true;
    }
  }
  if (contract.state !== "active") throw new Error(`Contract ${id} must be active before review; the control plane reports ${canonical.state}.`);
  assertClean(executionRoot);
  const canonicalSnapshot = readFileSync(canonical.path, "utf8");
  const entity = parseMarkdown(readFileSync(contract.path, "utf8"));
  entity.data.status = "review";
  entity.data.pull_request = pullRequest ?? null;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const acceptance = sections(entity.content).get("acceptance")?.split(/\r?\n/).map((line) => /^\s*[-*]\s+(.+)/.exec(line)?.[1]).filter((line): line is string => Boolean(line)) ?? [];
  const profileChecks = (Array.isArray(entity.data.profiles) ? entity.data.profiles.map(String) : []).flatMap((profile) => {
    const path = workspacePath(root, "profiles", `${profile}.yaml`);
    if (!existsSync(path)) return [];
    const definition = parseYaml(readFileSync(path, "utf8")) as { done_checks?: unknown[] };
    return (definition.done_checks ?? []).map((check) => `${profile}: ${String(check)}`);
  });
  const checks = [...acceptance, ...profileChecks];
  const safeEvidence = evidence.replaceAll("|", "\\|").replaceAll("\n", " ");
  const evidenceRows = (checks.length ? checks : ["Contract acceptance criteria"]).map((check) => `| ${check.replaceAll("|", "\\|")} | ${safeEvidence} |`).join("\n");
  const declared = (value: string | undefined) => (value !== undefined && value.trim() ? value.trim() : NOT_DECLARED);
  const reviewEvidence = `\n\n## Review evidence\n\n| Acceptance condition | Evidence |\n|---|---|\n${evidenceRows}\n\n### Verification performed\n\n${evidence}\n\n### Deviations\n\n${declared(declarations.deviations)}\n\n### Observations created\n\n${declared(declarations.observationsCreated)}\n\n### Known concerns\n\n${declared(declarations.knownConcerns)}\n`;
  const destinationDirectory = workspacePath(root, "review");
  mkdirSync(destinationDirectory, { recursive: true });
  const destination = join(destinationDirectory, contract.filename);
  writeFileSync(destination, renderMarkdown(entity.data, `${entity.content.trimEnd()}${reviewEvidence}`));
  unlinkSync(canonical.path);
  if (legacy && !existsSync(canonicalClaim)) writeFileSync(canonicalClaim, readFileSync(legacyClaim, "utf8"));
  regenerateIndex(root);
  appendLifecycleEvent(root, id, "review", pullRequest ? `Submitted for review in ${pullRequest}.` : "Submitted for review.");
  commitControlState(root, `chore(kotta): submit ${id} for review`);

  // One-time adoption path for executions started before the control-plane model existed.
  // Restore the feature branch's original defined snapshot so its net diff contains code, not lifecycle state.
  if (legacy) {
    const legacyDefinedDirectory = workspacePath(executionRoot, "defined");
    mkdirSync(legacyDefinedDirectory, { recursive: true });
    writeFileSync(join(legacyDefinedDirectory, canonical.filename), canonicalSnapshot);
    if (existsSync(contract.path)) unlinkSync(contract.path);
    if (existsSync(legacyClaim)) unlinkSync(legacyClaim);
    regenerateIndex(executionRoot);
    git(executionRoot, ["add", workspaceDirectoryName(executionRoot)]);
    git(executionRoot, ["commit", "-m", `chore(kotta): move ${id} lifecycle to control plane`]);
  }
  return { ok: true, command: "contract review", data: { id, pullRequest: pullRequest ?? null, controlRoot: root, adoptedLegacyState: legacy } };
  });
}

export function closeContract(id: string, approved: boolean, repositoryRoot?: string, options: { locked?: boolean; commit?: boolean; approvalRecorded?: boolean } = {}) {
  const callerRoot = repositoryRoot ?? findRepositoryRoot();
  const close = (root: string) => {
  const contract = findContract(root, id);
  if (contract.state !== "review") throw new Error(`Contract ${id} must be in review before close.`);
  if (!approved) throw new Error("Human done approval is required. Re-run with --approve after acceptance verification.");
  const entity = parseMarkdown(readFileSync(contract.path, "utf8"));
  const branch = String(entity.data.branch ?? "");
  if (!branch) throw new Error(`Contract ${id} has no execution branch.`);
  const batch = typeof entity.data.batch === "string" ? entity.data.batch : null;
  const coordinator = batch ? `coord/${batch}` : null;
  const integrationTarget = coordinator && git(root, ["branch", "--list", coordinator]) ? coordinator : "HEAD";
  const merged = git(root, ["branch", "--merged", integrationTarget]).split(/\r?\n/).map((line) => line.replace(/^[*+]?\s*/, "")).includes(branch);
  if (!merged) throw new Error(`Branch ${branch} is not merged into ${integrationTarget === "HEAD" ? "the control branch" : `batch coordinator ${integrationTarget}`}.`);
  const worktree = join(root, ".worktrees", id);
  if (existsSync(worktree) && git(worktree, ["status", "--porcelain"])) throw new Error(`Worktree ${worktree} contains uncommitted changes; refusing cleanup.`);
  entity.data.status = "done";
  entity.data.resolution = "completed";
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const doneDirectory = workspacePath(root, "done");
  mkdirSync(doneDirectory, { recursive: true });
  const destination = join(doneDirectory, contract.filename);
  writeFileSync(destination, renderMarkdown(entity.data, entity.content));
  unlinkSync(contract.path);
  const claimPath = workspacePath(root, "claims", `${id}.yaml`);
  if (existsSync(claimPath)) unlinkSync(claimPath);
  updateContainingBatch(root, id);
  regenerateIndex(root);
  appendLifecycleEvent(root, id, "done", "Review accepted and contract closed.");
  if (!options.approvalRecorded) appendCliApprovalAudit(root, id, "contract.close");
  if (existsSync(worktree)) {
    git(root, ["worktree", "remove", worktree]);
  }
  if (integrationTarget === "HEAD") git(root, ["branch", "-d", branch]);
  else {
    const expected = git(root, ["rev-parse", `refs/heads/${branch}`]);
    git(root, ["update-ref", "-d", `refs/heads/${branch}`, expected]);
  }
  if (options.commit !== false) commitControlState(root, `chore(kotta): close ${id}`);
  return { ok: true, command: "contract close", data: { id, resolution: "completed", controlRoot: root } };
  };
  return options.locked ? close(callerRoot) : withControlPlaneMutation(callerRoot, close);
}

const CANCEL_RESOLUTIONS = ["duplicate", "obsolete", "cancelled"] as const;

export function cancelContract(id: string, resolution: string, approved: boolean, repositoryRoot?: string) {
  const requestedRoot = repositoryRoot ?? findRepositoryRoot();
  return withControlPlaneMutation(requestedRoot, (root) => {
  if (!CANCEL_RESOLUTIONS.includes(resolution as (typeof CANCEL_RESOLUTIONS)[number])) throw new Error(`Cancel resolution must be one of ${CANCEL_RESOLUTIONS.join(", ")}; got '${resolution}'.`);
  const contract = findContract(root, id);
  if (!["backlog", "defined"].includes(contract.state)) throw new Error(`Contract ${id} can only be cancelled from backlog or defined; ${contract.state} contracts exit through reopen/close.`);
  if (!approved) throw new Error("Human cancel approval is required. Re-run with --approve after confirming the contract should be retired.");
  const claimPath = workspacePath(root, "claims", `${id}.yaml`);
  if (existsSync(claimPath)) throw new Error(`Contract ${id} has a claim; a claimed contract cannot be cancelled.`);
  assertClean(root);
  const entity = parseMarkdown(readFileSync(contract.path, "utf8"));
  entity.data.status = "done";
  entity.data.resolution = resolution;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const doneDirectory = workspacePath(root, "done");
  mkdirSync(doneDirectory, { recursive: true });
  const destination = join(doneDirectory, contract.filename);
  const candidate = `${destination}.cancel-${process.pid}.tmp`;
  writeFileSync(candidate, renderMarkdown(entity.data, entity.content));
  try {
    assertValid(validateContractFile(candidate, "done"));
    renameSync(candidate, destination);
  } catch (error) {
    if (existsSync(candidate)) unlinkSync(candidate);
    throw error;
  }
  unlinkSync(contract.path);
  updateContainingBatch(root, id);
  regenerateIndex(root);
  appendLifecycleEvent(root, id, "done", `Contract cancelled with resolution ${resolution}.`);
  git(root, ["add", workspaceDirectoryName(root)]);
  git(root, ["commit", "-m", `chore(kotta): cancel ${id} (${resolution})`]);
  return { ok: true, command: "contract cancel", data: { id, resolution, path: destination } };
  });
}

export function reopenContract(id: string, approved: boolean, repositoryRoot?: string, options: { locked?: boolean; commit?: boolean; approvalRecorded?: boolean } = {}) {
  const requestedRoot = repositoryRoot ?? findRepositoryRoot();
  const reopen = (root: string) => {
  const contract = findContract(root, id);
  if (!["review", "done"].includes(contract.state)) throw new Error(`Contract ${id} can only reopen from review or done.`);
  if (!approved) throw new Error("Human approval is required to reopen terminal or reviewed work.");
  const entity = parseMarkdown(readFileSync(contract.path, "utf8"));
  const changesRequested = contract.state === "review";
  if (changesRequested && !existsSync(workspacePath(root, "claims", `${id}.yaml`))) throw new Error(`Review changes cannot resume because ${id} has no claim.`);
  entity.data.status = changesRequested ? "active" : "backlog";
  if (!changesRequested) {
    entity.data.resolution = null;
    entity.data.branch = null;
    delete entity.data.worktree;
    delete entity.data.execution_mode;
  }
  entity.data.pull_request = null;
  entity.data.updated_at = new Date().toISOString().slice(0, 10);
  const directory = workspacePath(root, changesRequested ? "active" : "backlog");
  mkdirSync(directory, { recursive: true });
  const destination = join(directory, contract.filename);
  const content = changesRequested ? entity.content.replace(/\n\n## Review evidence[\s\S]*$/, "\n") : entity.content;
  writeFileSync(destination, renderMarkdown(entity.data, content));
  unlinkSync(contract.path);
  regenerateIndex(root);
  appendLifecycleEvent(root, id, changesRequested ? "active" : "backlog", changesRequested ? "Review changes requested; execution resumed." : "Terminal contract reopened in backlog.");
  if (!options.approvalRecorded) appendCliApprovalAudit(root, id, changesRequested ? "contract.request-changes" : "contract.reopen");
  if (options.commit !== false) commitControlState(root, `chore(kotta): reopen ${id} for changes`);
  return { ok: true, command: "contract reopen", data: { id, state: changesRequested ? "active" : "backlog" } };
  };
  return options.locked ? reopen(requestedRoot) : withControlPlaneMutation(requestedRoot, reopen);
}

export interface BriefSection {
  name: string;
  characters: number;
}

export interface BriefResult {
  ok: boolean;
  command: "contract brief";
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
    path: string | null;
    brief: string;
  };
}

/** Approximate token count: stable, documented heuristic (chars / 4, rounded up). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Assemble the minimal execution context for one contract (D-009 / T-026):
 * the contract body, the decisions it references, its profile requirements and
 * its claim — and nothing else. Deterministic: same workspace, same bytes.
 */
export function briefContract(id: string, options: { out?: string; warnTokens?: number } = {}, repositoryRoot?: string): BriefResult {
  const requestedRoot = repositoryRoot ?? findRepositoryRoot();
  const controlRoot = controlPlaneRoot(requestedRoot);
  let root = controlRoot;
  // Compatibility for a run started by Kotta before lifecycle state moved to the control plane.
  if (resolve(requestedRoot) !== resolve(controlRoot)) {
    try {
      const canonical = findContract(controlRoot, id);
      const local = findContract(requestedRoot, id);
      if (canonical.state === "defined" && local.state === "active" && existsSync(workspacePath(requestedRoot, "claims", `${id}.yaml`))) root = requestedRoot;
    } catch { /* normal control-plane path below reports the useful error */ }
  }
  const contract = findContract(root, id);
  const entity = parseMarkdown(readFileSync(contract.path, "utf8"));

  const referenced = [...new Set([...entity.content.matchAll(/\bD-\d{3,}\b/g)].map((match) => match[0]))].sort();
  const decisionsDirectory = workspacePath(root, "decisions");
  const decisions: { id: string; content: string }[] = [];
  const missingDecisions: string[] = [];
  for (const decisionId of referenced) {
    const path = join(decisionsDirectory, `${decisionId}.md`);
    if (existsSync(path)) decisions.push({ id: decisionId, content: readFileSync(path, "utf8").trim() });
    else missingDecisions.push(decisionId);
  }

  const profiles = Array.isArray(entity.data.profiles) ? entity.data.profiles.map(String) : [];
  const profileBlocks = profiles.flatMap((profile) => {
    const path = workspacePath(root, "profiles", `${profile}.yaml`);
    return existsSync(path) ? [{ profile, content: readFileSync(path, "utf8").trim() }] : [];
  });

  const claimPath = workspacePath(root, "claims", `${id}.yaml`);
  const claim = existsSync(claimPath) ? readFileSync(claimPath, "utf8").trim() : null;

  const dependsOn = Array.isArray(entity.data.depends_on) ? entity.data.depends_on.map(String) : [];
  const header = [
    `# Execution brief — ${id}`,
    "",
    `- id: ${id}`,
    `- title: ${String(entity.data.title ?? "")}`,
    `- state: ${contract.state}`,
    `- profiles: ${profiles.length ? profiles.join(", ") : "none"}`,
    `- depends_on: ${dependsOn.length ? dependsOn.join(", ") : "none"}`,
    `- branch: ${entity.data.branch ? String(entity.data.branch) : "none"}`,
    "",
    "This brief is the complete intent context for executing this contract (D-009).",
    "It deliberately EXCLUDES: other contracts' bodies, observations, chat history and the",
    "coordinator's context. If the work cannot start from this brief plus the code in",
    "the worktree, that gap is a contract defect — record it, do not silently widen",
    "the context.",
  ].join("\n");

  const parts: { name: string; text: string }[] = [
    { name: "header", text: header },
    { name: `contract ${id}`, text: `## Contract\n\n${entity.content.trim()}` },
  ];
  for (const decision of decisions) parts.push({ name: `decision ${decision.id}`, text: `## Decision ${decision.id}\n\n${decision.content}` });
  if (missingDecisions.length) parts.push({ name: "missing decisions", text: `## Missing decisions\n\nReferenced but not found in the workspace decisions directory: ${missingDecisions.join(", ")}` });
  for (const block of profileBlocks) parts.push({ name: `profile ${block.profile}`, text: `## Profile: ${block.profile}\n\n\`\`\`yaml\n${block.content}\n\`\`\`` });
  if (claim) parts.push({ name: "claim", text: `## Claim\n\n\`\`\`yaml\n${claim}\n\`\`\`` });

  const brief = parts.map((part) => part.text).join("\n\n") + "\n";
  const sectionSizes: BriefSection[] = parts.map((part) => ({ name: part.name, characters: part.text.length }));
  const largestSection = [...sectionSizes].sort((a, b) => b.characters - a.characters)[0]?.name ?? "header";
  const tokens = estimateTokens(brief);
  const warnTokens = options.warnTokens ?? 12000;
  const warning = tokens > warnTokens
    ? `Brief is ${tokens} tokens (limit ${warnTokens}). Largest section: ${largestSection}. The contract is probably too large or under-referenced — split it or sharpen it.`
    : null;

  let outPath: string | null = null;
  if (options.out) {
    outPath = resolve(options.out);
    writeFileSync(outPath, brief);
  }

  return {
    ok: true,
    command: "contract brief",
    data: { id, state: contract.state, tokens, warnTokens, warning, largestSection, sections: sectionSizes, decisions: decisions.map((decision) => decision.id), missingDecisions, path: outPath, brief },
  };
}

/**
 * Every unfinished batch state, not just `active`: contracts executed one by one never take their
 * batch through `batch start`, so a batch that only ever sat in `backlog` must complete too.
 */
const OPEN_BATCH_STATES = ["backlog", "defined", "active"] as const;

function updateContainingBatch(root: string, contractId: string): void {
  for (const state of OPEN_BATCH_STATES) {
    const directory = workspacePath(root, "batches", state);
    if (!existsSync(directory)) continue;
    for (const filename of readdirSync(directory).filter((name) => name.endsWith(".md"))) {
      const path = join(directory, filename);
      const entity = parseMarkdown(readFileSync(path, "utf8"));
      const contracts = Array.isArray(entity.data.contracts) ? entity.data.contracts.map(String) : [];
      if (!contracts.includes(contractId)) continue;
      entity.data.updated_at = new Date().toISOString().slice(0, 10);
      if (contracts.every((id) => findContract(root, id).state === "done")) {
        entity.data.status = "done";
        const done = workspacePath(root, "batches/done");
        mkdirSync(done, { recursive: true });
        writeFileSync(join(done, filename), renderMarkdown(entity.data, entity.content));
        unlinkSync(path);
        appendLifecycleEvent(root, String(entity.data.id), "done", "All member contracts completed; batch closed.", null);
      } else {
        writeFileSync(path, renderMarkdown(entity.data, entity.content));
      }
    }
  }
}
