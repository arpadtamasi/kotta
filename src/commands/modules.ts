import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { git } from "../git/git.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { readFormRegistry } from "../spec/registry.js";
import {
  INTERFACE_FORM,
  PUBLISHED_SPEC_DIRECTORY,
  PUBLISHED_SPEC_MANIFEST,
  ROOT_MODULE,
  analyzeWorkingTree,
  boundaryFindings,
  discoverModules,
  excludedLine,
  excludedMentions,
  excludedSummary,
  referenceFindings,
  workingTreeFiles,
  type ExcludedClass,
  type ExcludedSummary,
  type ModuleFinding,
  type ModuleIssue,
  type ReferenceStatus,
  type RepoModule,
} from "../core/modules.js";

export interface ModulesResult {
  ok: boolean;
  command: "modules";
  data: { modules: RepoModule[]; issues: ModuleIssue[] };
  errors: ModuleIssue[];
}

/** The modules the manifests declare, read from the working tree; nothing is kept by hand. */
export function listModules(root = findRepositoryRoot()): ModulesResult {
  const { modules, issues } = discoverModules(workingTreeFiles(root));
  return { ok: true, command: "modules", data: { modules, issues }, errors: [] };
}

export function renderModules(result: unknown): string {
  const { modules, issues } = (result as ModulesResult).data;
  const declared = modules.filter((module) => module.kind !== "root");
  const lines = [declared.length
    ? `${declared.length} module${declared.length === 1 ? "" : "s"} declared by manifests${modules.some((module) => module.kind === "root") ? `, and ${ROOT_MODULE} for the code outside them` : ""}:`
    : `No manifest declares a module; the repository is one module, ${ROOT_MODULE}.`];
  for (const module of modules) {
    if (!declared.length && module.kind === "root") continue;
    lines.push(`  ${module.name}  ${module.path}  (${module.kind}${module.version ? ` ${module.version}` : ""})`);
    if (module.surface.length) lines.push(`    surface: ${module.surface.join(", ")}`);
    for (const dependency of module.dependencies) {
      const where = dependency.external ? `external, ${dependency.resolve}${dependency.path ? ` ${dependency.path}` : dependency.url ? ` ${dependency.url}${dependency.ref ? `#${dependency.ref}` : ""}` : ""}` : "in this repository";
      lines.push(`    depends on ${dependency.name} ${dependency.spec} (${where})`);
    }
  }
  for (const issue of issues) lines.push(`Warning: ${issue.code}: ${issue.message}`);
  return lines.join("\n");
}

export interface ModulesCheckResult {
  ok: boolean;
  command: "modules check";
  data: {
    modules: Array<{ name: string; path: string; kind: string; surface: string[]; interfaces: number; nodes: number }>;
    placed: number;
    straddlers: string[];
    unplaced: string[];
    /** What was not counted as evidence, said once: files per excluded class, and the nodes without evidence each names. */
    excluded: ExcludedSummary[];
    /** Every node at level `none`, with the excluded sources that name it: why it has no module. */
    none: Array<{ id: string; title: string; excluded: ExcludedClass[] }>;
    references: ReferenceStatus[];
    warnings: ModuleFinding[];
    issues: ModuleIssue[];
  };
  errors: ModuleFinding[];
}

/**
 * The boundary checks and the cross-repository references, on the working tree. Only a name that
 * points at nothing — a module or a reference block that cannot mean anything — refuses; the rest
 * are warnings to act on.
 */
export function checkModules(root = findRepositoryRoot(), options: { cacheDirectory?: string } = {}): ModulesCheckResult {
  const analysis = analyzeWorkingTree(root);
  const boundary = boundaryFindings(analysis);
  const references = referenceFindings({ analysis, cacheDirectory: options.cacheDirectory });
  const findings = [...boundary, ...references.findings];
  // The module derivation reads through the evidence filter, so a node that only a copy of the
  // specification names has no module (EX-01m3cqmvk8vfym9tmj34zfdx6p); the report says which
  // excluded sources name it rather than leaving the reader to guess (BR-01m3cqmtfyrpdzcppvy0565652).
  const unevidenced = analysis.nodes.filter((node) => node.level === "none");
  const mentions = excludedMentions(root, analysis.workspace, unevidenced);
  const none = unevidenced.map((node) => ({ id: node.id, title: node.title, excluded: mentions.get(node.id) ?? [] }));
  return {
    ok: !findings.some((finding) => finding.severity === "error"),
    command: "modules check",
    data: {
      modules: analysis.modules.map((module) => ({
        name: module.name,
        path: module.path,
        kind: module.kind,
        surface: module.surface,
        interfaces: analysis.nodes.filter((node) => node.interface && node.declaredModule === module.name).length,
        nodes: analysis.nodes.filter((node) => node.module === module.name).length,
      })),
      placed: analysis.nodes.filter((node) => node.module !== null).length,
      straddlers: analysis.nodes.filter((node) => node.straddler).map((node) => node.id),
      unplaced: analysis.nodes.filter((node) => node.module === null && !node.straddler).map((node) => node.id),
      excluded: excludedSummary(workingTreeFiles(root).paths, analysis.workspace, none),
      none,
      references: references.references,
      warnings: findings.filter((finding) => finding.severity === "warning"),
      issues: analysis.issues,
    },
    errors: findings.filter((finding) => finding.severity === "error"),
  };
}

const HEADINGS: Record<string, string> = {
  MODULE_INTERFACE_MISSING: "Missing interface",
  MODULE_STRADDLER: "Straddling nodes",
  MODULE_CROSS_REFERENCE: "References across a module boundary",
  MODULE_UNKNOWN: "Interfaces naming no module",
  MODULE_REFERENCE_INVALID: "Malformed references",
  MODULE_REFERENCE_UNRESOLVED: "Unresolved references",
  MODULE_REFERENCE_STALE: "The core changed since the pinned version",
  MODULE_INTERFACE_COPY: "Drifted copies: switch to a reference",
};

export function renderModulesCheck(result: unknown): string {
  const { data, errors } = result as ModulesCheckResult;
  const lines = ["# Module boundary check", ""];
  for (const module of data.modules) lines.push(`- ${module.name} (${module.path}): ${module.nodes} node${module.nodes === 1 ? "" : "s"}, ${module.interfaces} interface${module.interfaces === 1 ? "" : "s"}${module.surface.length ? `; surface ${module.surface.join(", ")}` : ""}`);
  lines.push("", `Placed: ${data.placed} · straddling: ${data.straddlers.length} · no evidence: ${data.unplaced.length}`);
  const excluded = excludedLine(data.excluded);
  if (excluded) lines.push(excluded);
  const findings = [...errors, ...data.warnings];
  for (const [code, heading] of Object.entries(HEADINGS)) {
    const group = findings.filter((finding) => finding.code === code);
    if (!group.length) continue;
    lines.push("", `## ${heading}`);
    for (const finding of group) lines.push(`- ${finding.severity === "error" ? "[error] " : ""}${finding.message}${finding.path ? ` (${finding.path})` : ""}`);
  }
  for (const issue of data.issues) lines.push(`Warning: ${issue.code}: ${issue.message}`);
  if (!findings.length) lines.push("", "Every module boundary holds.");
  return lines.join("\n");
}

export interface PublishSpecResult {
  ok: boolean;
  command: "modules publish-spec";
  data: {
    module: string;
    directory: string;
    version: string | null;
    commit: string | null;
    nodes: Array<{ id: string; form: string; title: string; file: string }>;
    files: string[];
  };
  errors: Array<{ code: string; message: string; path?: string }>;
}

/**
 * Ship a module's promises beside its code, the way a package ships its type definitions: its
 * interface nodes, and the rules and examples bound to them, under `<module>/kotta-spec/`, laid out
 * like `.kotta/spec/` (a `forms/` registry and one directory per form) with a `manifest.json` that
 * records the module, its version and the commit the text was taken from.
 */
export function publishSpec(moduleName: string, root = findRepositoryRoot()): PublishSpecResult {
  const analysis = analyzeWorkingTree(root);
  const empty = (code: string, message: string, path?: string): PublishSpecResult => ({
    ok: false,
    command: "modules publish-spec",
    data: { module: moduleName, directory: "", version: null, commit: null, nodes: [], files: [] },
    errors: [{ code, message, ...(path ? { path } : {}) }],
  });
  const module = analysis.modules.find((candidate) => candidate.name === moduleName);
  if (!module || module.kind === "root") {
    return empty("MODULE_UNKNOWN", `No manifest declares a module named '${moduleName}'. Declared modules: ${analysis.modules.filter((candidate) => candidate.kind !== "root").map((candidate) => candidate.name).join(", ") || "none"}.`);
  }
  const interfaces = analysis.specNodes.filter((node) => node.form === INTERFACE_FORM && String(node.data.module ?? "").trim() === moduleName);
  if (!interfaces.length) {
    return empty("MODULE_NO_INTERFACE", `Module '${moduleName}' has no interface node saying 'module: ${moduleName}', so it has no promise to ship. Write its interface first.`);
  }

  // Bound to an interface: a rule or example naming it, and the examples naming those rules.
  const refersTo = (data: Record<string, unknown>, ids: Set<string>) => Object.entries(data).some(([field, value]) => field !== "id" && (Array.isArray(value) ? value : [value]).some((entry) => ids.has(String(entry).trim())));
  const interfaceIds = new Set(interfaces.map((node) => node.id));
  const rules = analysis.specNodes.filter((node) => (node.form === "business-rule" || node.form === "example") && refersTo(node.data, interfaceIds));
  const ruleIds = new Set(rules.map((node) => node.id));
  const examples = analysis.specNodes.filter((node) => node.form === "example" && !ruleIds.has(node.id) && refersTo(node.data, ruleIds));
  const shipped = [...interfaces, ...rules, ...examples];

  const target = join(root, module.path, PUBLISHED_SPEC_DIRECTORY);
  const relativeTarget = relative(root, target).split("\\").join("/");
  if (existsSync(target) && !existsSync(join(target, PUBLISHED_SPEC_MANIFEST))) {
    return empty("PUBLISHED_SPEC_FOREIGN", `${relativeTarget} exists and was not written by 'kotta modules publish-spec' (it has no ${PUBLISHED_SPEC_MANIFEST}). Move it aside; this command replaces only its own output.`, relativeTarget);
  }
  rmSync(target, { recursive: true, force: true });

  const { forms } = readFormRegistry(root);
  const files: string[] = [];
  const write = (path: string) => files.push(relative(root, path).split("\\").join("/"));
  mkdirSync(join(target, "forms"), { recursive: true });
  for (const formId of [...new Set(shipped.map((node) => node.form))].sort()) {
    const form = forms.find((candidate) => candidate.id === formId);
    if (!form) continue;
    const destination = join(target, "forms", basename(form.path));
    copyFileSync(form.path, destination);
    write(destination);
  }
  const nodes: PublishSpecResult["data"]["nodes"] = [];
  for (const node of shipped) {
    const form = forms.find((candidate) => candidate.id === node.form);
    const file = `${form?.directory ?? node.form}/${basename(node.path)}`;
    mkdirSync(join(target, form?.directory ?? node.form), { recursive: true });
    writeFileSync(join(target, file), readFileSync(join(root, node.path), "utf8"));
    write(join(target, file));
    nodes.push({ id: node.id, form: node.form, title: node.title, file });
  }
  let commit: string | null = null;
  try { commit = git(root, ["rev-parse", "HEAD"]) || null; }
  catch { commit = null; }
  const manifest = { format: 1, module: moduleName, version: module.version, commit, nodes };
  writeFileSync(join(target, PUBLISHED_SPEC_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  write(join(target, PUBLISHED_SPEC_MANIFEST));
  return { ok: true, command: "modules publish-spec", data: { module: moduleName, directory: relativeTarget, version: module.version, commit, nodes, files: files.sort() }, errors: [] };
}

export function renderPublishSpec(result: unknown): string {
  const { data } = result as PublishSpecResult;
  const interfaces = data.nodes.filter((node) => node.form === INTERFACE_FORM).length;
  return [
    `Published ${data.nodes.length} node${data.nodes.length === 1 ? "" : "s"} of ${data.module}${data.version ? `@${data.version}` : ""} to ${data.directory}/: ${interfaces} interface${interfaces === 1 ? "" : "s"} and ${data.nodes.length - interfaces} bound rule${data.nodes.length - interfaces === 1 ? "" : "s"} or example${data.nodes.length - interfaces === 1 ? "" : "s"}.`,
    ...data.nodes.map((node) => `  ${node.title} · ${node.id} (${node.file})`),
    `If the package lists its "files", add ${PUBLISHED_SPEC_DIRECTORY} to them, so the promises install with the code.`,
  ].join("\n");
}
