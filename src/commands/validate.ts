import { existsSync } from "node:fs";
import { analyzeWorkingTree, boundaryFindings, type ModuleFinding } from "../core/modules.js";
import { WORKSPACE_DIRECTORY_LABEL, findRepositoryRoot, workspacePath } from "../filesystem/workspace.js";
import { listChanges, readChangeModel } from "../spec/change.js";
import { normativeIssues, readFormRegistry, readSpecNodes, validateNodeSet, validateSpecWorkspace, type ValidationIssue } from "../spec/registry.js";

export interface ValidateResult {
  ok: boolean;
  command: "validate";
  data: { forms: number; specNodes: number; changes: number; changeNodes: number };
  errors: ValidationIssue[];
  /** Module-boundary findings that do not refuse: a missing interface, a straddler, a cross reference. */
  warnings: ValidationIssue[];
}

function issue(finding: ModuleFinding): ValidationIssue {
  return { code: finding.code, message: finding.message, ...(finding.path ? { path: finding.path } : {}) };
}

/**
 * Validate the technical specification: every form in the registry, every node against its form,
 * every edge against the node it names — and the module boundaries, where only an interface naming
 * a module no manifest declares refuses. The nodes an open change proposes under its `model/` are
 * measured one by one as well, with provenance required; their edges resolve only in the merged view,
 * which is `kotta plan`'s to measure. The root is a parameter because `migrate` reports the validity
 * of what it just produced against the root it migrated.
 */
export function validateWorkspace(repositoryRoot?: string): ValidateResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  if (!existsSync(workspacePath(root))) {
    return { ok: false, command: "validate", data: { forms: 0, specNodes: 0, changes: 0, changeNodes: 0 }, errors: [{ code: "WORKSPACE_NOT_FOUND", message: `No ${WORKSPACE_DIRECTORY_LABEL} workspace exists at ${root}. Run kotta init first.`, path: root }], warnings: [] };
  }
  const errors = validateSpecWorkspace(root);
  const { forms } = readFormRegistry(root);
  const accepted = readSpecNodes(root, forms).nodes;
  const specNodes = accepted.length;
  let changes = 0;
  let changeNodes = 0;
  for (const name of listChanges(root)) {
    const model = readChangeModel(root, name, forms);
    if (!model.files.length) continue;
    changes += 1;
    changeNodes += model.nodes.length;
    errors.push(...model.issues, ...validateNodeSet(forms, model.nodes, { requireProvenance: () => true, edges: false }), ...normativeIssues(forms, model.nodes));
  }
  const findings = boundaryFindings(analyzeWorkingTree(root));
  errors.push(...findings.filter((finding) => finding.severity === "error").map(issue));
  // An accepted node without SHALL or MUST is reported, not refused: it was agreed before the rule.
  // A change's node is new writing, so there it refuses (above).
  const warnings = [...normativeIssues(forms, accepted), ...findings.filter((finding) => finding.severity === "warning").map(issue)];
  return { ok: errors.length === 0, command: "validate", data: { forms: forms.length, specNodes, changes, changeNodes }, errors, warnings };
}
