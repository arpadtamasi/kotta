import { existsSync } from "node:fs";
import { WORKSPACE_DIRECTORY_LABEL, findRepositoryRoot, workspacePath } from "../filesystem/workspace.js";
import { readFormRegistry, readSpecNodes, validateSpecWorkspace, type ValidationIssue } from "../spec/registry.js";

export interface ValidateResult {
  ok: boolean;
  command: "validate";
  data: { forms: number; specNodes: number };
  errors: ValidationIssue[];
}

/**
 * Validate the technical specification: every form in the registry, every node against its form,
 * every edge against the node it names. The root is a parameter because `migrate` reports the
 * validity of what it just produced against the root it migrated.
 */
export function validateWorkspace(repositoryRoot?: string): ValidateResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  if (!existsSync(workspacePath(root))) {
    return { ok: false, command: "validate", data: { forms: 0, specNodes: 0 }, errors: [{ code: "WORKSPACE_NOT_FOUND", message: `No ${WORKSPACE_DIRECTORY_LABEL} workspace exists at ${root}. Run kotta init first.`, path: root }] };
  }
  const errors = validateSpecWorkspace(root);
  const { forms } = readFormRegistry(root);
  const specNodes = readSpecNodes(root, forms).nodes.length;
  return { ok: errors.length === 0, command: "validate", data: { forms: forms.length, specNodes }, errors };
}
