import { existsSync } from "node:fs";
import { analyzeWorkingTree, boundaryFindings, type ModuleFinding } from "../core/modules.js";
import { WORKSPACE_DIRECTORY_LABEL, findRepositoryRoot, workspacePath } from "../filesystem/workspace.js";
import { changesFolder, listChanges, openSpecChangesPath, readChangeModel, strandedChanges } from "../spec/change.js";
import { readNarrativeSetting, requiresNormativeKeyword } from "../core/config.js";
import { markdownFiles } from "../spec/narrative.js";
import { join } from "node:path";
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
  const normative = requiresNormativeKeyword(root);
  let changes = 0;
  let changeNodes = 0;
  for (const name of listChanges(root)) {
    const model = readChangeModel(root, name, forms);
    if (!model.files.length) continue;
    changes += 1;
    changeNodes += model.nodes.length;
    errors.push(...model.issues, ...validateNodeSet(forms, model.nodes, { requireProvenance: () => true, edges: false }), ...(normative ? normativeIssues(forms, model.nodes) : []));
  }
  const findings = boundaryFindings(analyzeWorkingTree(root));
  errors.push(...findings.filter((finding) => finding.severity === "error").map(issue));
  // An accepted node without SHALL or MUST is reported, not refused: it was agreed before the rule.
  // A change's node is new writing, so there it refuses (above). Both only where an OpenSpec narrative is kept.
  const warnings = [...(normative ? normativeIssues(forms, accepted) : []), ...findings.filter((finding) => finding.severity === "warning").map(issue)];
  // Before 1.0.0-alpha.3 an unset narrative meant `generated`; a project with OpenSpec specs and no setting now gets none of it.
  const setting = readNarrativeSetting(root);
  if (setting.source === null && markdownFiles(join(root, "openspec", "specs")).length) {
    warnings.push({ code: "NARRATIVE_UNSET", message: `openspec/specs/ holds narrative specs, but no config sets 'narrative:', so Kotta keeps none: archive will neither regenerate nor check them. To keep them, set narrative: generated (Kotta writes them from the model) or narrative: authored (people write them, Kotta reports drift) in ${changesFolder(root).split("/")[0]}/config.yaml; to drop them, set narrative: none.`, path: join(root, "openspec", "specs") });
  }
  // A change an earlier release kept in OpenSpec's folder is read by nothing now; say where it belongs.
  for (const name of strandedChanges(root)) {
    warnings.push({ code: "CHANGE_STRANDED", message: `openspec/changes/${name}/ is a change in OpenSpec's folder, where nothing reads it: a change lives at ${changesFolder(root)}/${name}/. 'kotta migrate' moves every such change, or move this one: git mv openspec/changes/${name} ${changesFolder(root)}/${name}`, path: openSpecChangesPath(root, name) });
  }
  return { ok: errors.length === 0, command: "validate", data: { forms: forms.length, specNodes, changes, changeNodes }, errors, warnings };
}
