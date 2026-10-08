import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { analyzeWorkingTree, boundaryFindings, type ModuleFinding } from "../core/modules.js";
import { WORKSPACE_DIRECTORY_LABEL, bundledFormsDirectory, findRepositoryRoot, specPath, workspacePath } from "../filesystem/workspace.js";
import { changesFolder, listChanges, openSpecChangesPath, readChangeModel, strandedChanges, FORMS_DIRECTORY, MODEL_DIRECTORY, changesPath } from "../spec/change.js";
import { readNarrativeSetting, requiresNormativeKeyword } from "../core/config.js";
import { markdownFiles } from "../spec/narrative.js";
import { join, relative, sep } from "node:path";
import { ACCEPTED_WARNING_CODES, normativeIssues, readFormRegistry, readSpecNodes, validateNodeSet, validateSpecWorkspace, type ValidationIssue } from "../spec/registry.js";

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
  // An accepted node without a place in the hierarchy is a warning (BR-01m4ee23pwf0sg22vta05bc2hz).
  const workspaceIssues = validateSpecWorkspace(root);
  const errors = workspaceIssues.filter((issue) => !ACCEPTED_WARNING_CODES.has(issue.code));
  const placeWarnings = workspaceIssues.filter((issue) => ACCEPTED_WARNING_CODES.has(issue.code));
  const { forms } = readFormRegistry(root);
  const accepted = readSpecNodes(root, forms).nodes;
  const specNodes = accepted.length;
  const normative = requiresNormativeKeyword(root);
  let changes = 0;
  let changeNodes = 0;
  for (const name of listChanges(root)) {
    // A change's nodes are measured against the forms it carries (BR-01m4ee245pe1wb8x8n7wxyvxwh).
    const changeForms = readFormRegistry(root, join(changesPath(root, name), MODEL_DIRECTORY, FORMS_DIRECTORY)).forms;
    const model = readChangeModel(root, name, changeForms);
    if (!model.files.length) continue;
    changes += 1;
    changeNodes += model.nodes.length;
    errors.push(...model.issues, ...validateNodeSet(changeForms, model.nodes, { requireProvenance: () => true, edges: false }), ...(normative ? normativeIssues(changeForms, model.nodes) : []));
  }
  const findings = boundaryFindings(analyzeWorkingTree(root));
  errors.push(...findings.filter((finding) => finding.severity === "error").map(issue));
  // An accepted node without SHALL or MUST is reported, not refused: it was agreed before the rule.
  // A change's node is new writing, so there it refuses (above). Both only where an OpenSpec narrative is kept.
  const warnings = [...placeWarnings, ...(normative ? normativeIssues(forms, accepted) : []), ...findings.filter((finding) => finding.severity === "warning").map(issue)];
  // Before 1.0.0-alpha.3 an unset narrative meant `generated`; a project with OpenSpec specs and no setting now gets none of it.
  const setting = readNarrativeSetting(root);
  if (setting.source === null && markdownFiles(join(root, "openspec", "specs")).length) {
    warnings.push({ code: "NARRATIVE_UNSET", message: `openspec/specs/ holds narrative specs, but no config sets 'narrative:', so Kotta keeps none: archive will neither regenerate nor check them. To keep them, set narrative: generated (Kotta writes them from the model) or narrative: authored (people write them, Kotta reports drift) in ${changesFolder(root).split("/")[0]}/config.yaml; to drop them, set narrative: none.`, path: join(root, "openspec", "specs") });
  }
  warnings.push(...formsEditedOutsideAChange(root));
  // A change an earlier release kept in OpenSpec's folder is read by nothing now; say where it belongs.
  for (const name of strandedChanges(root)) {
    warnings.push({ code: "CHANGE_STRANDED", message: `openspec/changes/${name}/ is a change in OpenSpec's folder, where nothing reads it: a change lives at ${changesFolder(root)}/${name}/. 'kotta migrate' moves every such change, or move this one: git mv openspec/changes/${name} ${changesFolder(root)}/${name}`, path: openSpecChangesPath(root, name) });
  }
  return { ok: errors.length === 0, command: "validate", data: { forms: forms.length, specNodes, changes, changeNodes }, errors, warnings };
}

/**
 * A form changes only through a change (BR-01m4ee245pe1wb8x8n7wxyvxwh): a registry form that differs
 * from the last commit, and that no change — open or archived — carries byte for byte, was edited by
 * hand. What a commit already holds is history and is not judged here.
 */
function formsEditedOutsideAChange(root: string): ValidationIssue[] {
  const registry = specPath(root, "forms");
  if (!existsSync(registry)) return [];
  const carried = new Set<string>();
  const collect = (changeDirectory: string) => {
    const forms = join(changeDirectory, MODEL_DIRECTORY, FORMS_DIRECTORY);
    if (!existsSync(forms)) return;
    for (const file of readdirSync(forms).filter((name) => name.endsWith(".yaml"))) carried.add(`${file}\0${readFileSync(join(forms, file), "utf8")}`);
  };
  for (const name of listChanges(root)) collect(changesPath(root, name));
  const archive = changesPath(root, "archive");
  if (existsSync(archive)) for (const entry of readdirSync(archive)) collect(join(archive, entry));
  const issues: ValidationIssue[] = [];
  for (const file of readdirSync(registry).filter((name) => name.endsWith(".yaml"))) {
    const path = join(registry, file);
    const current = readFileSync(path, "utf8");
    const committed = spawnSync("git", ["show", `HEAD:${relative(root, path).split(sep).join("/")}`], { cwd: root, encoding: "utf8" });
    if (committed.status === 0 && committed.stdout === current) continue;
    // What `init` or `sync` installed from the running package is not a hand edit.
    const shipped = join(bundledFormsDirectory(), file);
    if (existsSync(shipped) && readFileSync(shipped, "utf8") === current) continue;
    if (carried.has(`${file}\0${current}`)) continue;
    issues.push({ code: "SPEC_FORM_EDITED_OUTSIDE_CHANGE", message: `${relative(root, path)} differs from the last commit, and no change carries it. A form changes only through a change: put it under a change's model/forms/, plan it and take it to the gate.`, path });
  }
  return issues;
}
