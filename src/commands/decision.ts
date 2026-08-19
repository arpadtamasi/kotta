import { existsSync, linkSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { decisionDraftFromSource, renderDecision, validateDecision, validateDecisionFile } from "../core/decision.js";
import { mintId } from "../core/identity.js";
import { WORKSPACE_DIRECTORY_LABEL, findRepositoryRoot, processPath, workspacePath } from "../filesystem/workspace.js";
import { readEnv } from "../core/env.js";
import { controlPlaneRoot } from "../git/control-plane.js";

export interface CreateDecisionOptions {
  from: string;
  id?: string;
  approved: boolean;
}

export function createDecision(options: CreateDecisionOptions, repositoryRoot?: string) {
  if (!options.approved) {
    throw new Error("Human approval is required to record a durable decision. Re-run with --approve after confirming the decision and consequences.");
  }
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const workspace = workspacePath(root);
  if (!existsSync(workspace)) throw new Error(`No ${WORKSPACE_DIRECTORY_LABEL} workspace exists at ${root}. Run kotta init first.`);
  const sourcePath = resolve(options.from);
  if (!existsSync(sourcePath)) throw new Error(`Decision source was not found: ${sourcePath}`);
  const id = options.id ?? mintId("D");
  const draft = decisionDraftFromSource(readFileSync(sourcePath, "utf8"), id, new Date().toISOString().slice(0, 10));
  const errors = validateDecision(draft);
  if (errors.length) throw new Error(errors.map((error) => error.message).join("\n"));

  // Git does not carry empty directories into a linked worktree, so `<workspace>/decisions`
  // can be absent there even though the workspace exists.
  const directory = processPath(root, "decisions");
  mkdirSync(directory, { recursive: true });
  const duplicate = readdirSync(directory).find((name) => name === `${id}.md` || (name.startsWith(`${id}-`) && name.endsWith(".md")));
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
  return { ok: true, command: "decision create", data: { id, path } };
}
