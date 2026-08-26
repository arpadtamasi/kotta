import { existsSync, linkSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { decisionDraftFromSource, renderDecision, validateDecision, validateDecisionFile } from "../core/decision.js";
import { cliApprovalReceipt, type ApprovalReceipt } from "../core/approval-receipt.js";
import { mintId } from "../core/identity.js";
import { WORKSPACE_DIRECTORY_LABEL, findRepositoryRoot, processPath, workspacePath } from "../filesystem/workspace.js";
import { readEnv } from "../core/env.js";
import { controlPlaneRoot } from "../git/control-plane.js";

/** The stored file for a decision id, if one exists: the canonical name, or a legacy titled one. */
function decisionFilename(directory: string, id: string): string | undefined {
  if (!existsSync(directory)) return undefined;
  return readdirSync(directory).find((name) => name === `${id}.md` || (name.startsWith(`${id}-`) && name.endsWith(".md")));
}

/**
 * Whether a decision id is already taken. The calling chat asks this before putting a proposal to
 * the human, so a duplicate is refused instead of spending a yes on a record that cannot land.
 */
export function findDecision(root: string, id: string): string | null {
  const directory = processPath(root, "decisions");
  const name = decisionFilename(directory, id);
  return name ? join(directory, name) : null;
}

export interface CreateDecisionOptions {
  from: string;
  id?: string;
  approved: boolean;
}

export interface RecordDecisionOptions {
  /** The decision's Markdown, as its author wrote it. */
  source: string;
  id?: string;
  approved: boolean;
  /** The approval this record is the receipt for; the CLI's own when omitted. */
  receipt?: ApprovalReceipt;
}

/** Where a decision may be recorded from, once the source is in hand. */
function decisionRoot(repositoryRoot: string | undefined, approved: boolean): string {
  if (!approved) {
    throw new Error("Human approval is required to record a durable decision. Re-run with --approve after confirming the decision and consequences.");
  }
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  if (!existsSync(workspacePath(root))) throw new Error(`No ${WORKSPACE_DIRECTORY_LABEL} workspace exists at ${root}. Run kotta init first.`);
  return root;
}

export function createDecision(options: CreateDecisionOptions, repositoryRoot?: string) {
  const root = decisionRoot(repositoryRoot, options.approved);
  const sourcePath = resolve(options.from);
  if (!existsSync(sourcePath)) throw new Error(`Decision source was not found: ${sourcePath}`);
  return publishDecision(root, readFileSync(sourcePath, "utf8"), options.id, cliApprovalReceipt("decision.create"));
}

/**
 * The same publication from a source the caller already holds. The calling chat carries the
 * decision's text in its approval proposal, so there is no file to name and no temporary one to
 * write inside the control-plane lock.
 */
export function recordDecision(options: RecordDecisionOptions, repositoryRoot?: string) {
  const root = decisionRoot(repositoryRoot, options.approved);
  return publishDecision(root, options.source, options.id, options.receipt ?? cliApprovalReceipt("decision.create"));
}

function publishDecision(root: string, source: string, requestedId: string | undefined, receipt: ApprovalReceipt) {
  const id = requestedId ?? mintId("D");
  const parsed = decisionDraftFromSource(source, id, new Date().toISOString().slice(0, 10));
  const errors = validateDecision(parsed);
  if (errors.length) throw new Error(errors.map((error) => error.message).join("\n"));
  // Creating a decision is a human gate; the record it lands carries the receipt for that approval.
  const draft = { ...parsed, receipt };

  // Git does not carry empty directories into a linked worktree, so `<workspace>/decisions`
  // can be absent there even though the workspace exists.
  const directory = processPath(root, "decisions");
  mkdirSync(directory, { recursive: true });
  const duplicate = decisionFilename(directory, id);
  if (duplicate) throw new Error(`Decision ${id} already exists at ${join(directory, duplicate)}. Choose a different id or inspect the existing record.`);
  const path = join(directory, `${id}.md`);
  const candidate = join(directory, `.${id}-${process.pid}-${Date.now()}.tmp`);
  try {
    writeFileSync(candidate, renderDecision(draft), { flag: "wx" });
    const candidateErrors = validateDecisionFile(candidate).filter((error) => error.code !== "DECISION_FILENAME_MISMATCH");
    if (candidateErrors.length) throw new Error(candidateErrors.map((error) => error.message).join("\n"));
    const publishDelay = Number(readEnv("TEST_DECISION_PUBLISH_DELAY_MS") ?? 0);
    if (publishDelay > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, publishDelay);
    if (readEnv("TEST_FAIL_DECISION_BEFORE_PUBLISH") === "1") {
      throw new Error("Injected decision write failure before atomic publication.");
    }
    try {
      linkSync(candidate, path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new Error(`Decision ${id} already exists at ${path}. Choose a different id or inspect the existing record.`);
      }
      throw error;
    }
    unlinkSync(candidate);
  } catch (error) {
    if (existsSync(candidate)) unlinkSync(candidate);
    throw error;
  }
  return { ok: true, command: "decision create", data: { id, title: draft.title, path } };
}
