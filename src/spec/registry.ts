import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";
import { parseMarkdown, sections } from "../core/markdown.js";
import { specPath, validateSpecDirectory } from "../filesystem/workspace.js";
import { provenanceProblems } from "./provenance.js";

/**
 * The technical specification's schema is the form registry: every form declares its required
 * fields and its required edges, and this module is the mechanical half that measures a node
 * against them. The registry is the only source of form-specific knowledge, so a project-added
 * form participates without a TypeScript change.
 */

export interface ValidationIssue { code: string; message: string; path?: string }

export interface SpecFormEdge {
  name: string;
  direction: "incoming" | "outgoing";
  fields: string[];
  source_forms: string[];
  target_forms: string[];
  minimum: number;
  question: string;
}

export interface SpecForm {
  id: string;
  directory: string;
  prefix: string;
  frontmatter: string[];
  headings: string[];
  edges: SpecFormEdge[];
  path: string;
}

export interface SpecNode {
  id: string;
  form: string;
  path: string;
  data: Record<string, unknown>;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export function readFormRegistry(root: string): { forms: SpecForm[]; issues: ValidationIssue[] } {
  const directory = specPath(root, "forms");
  const issues: ValidationIssue[] = [];
  const forms: SpecForm[] = [];
  if (!existsSync(directory)) return { forms, issues };

  for (const filename of readdirSync(directory).filter((name) => name.endsWith(".yaml")).sort()) {
    const path = join(directory, filename);
    let data: Record<string, unknown> | null;
    try { data = parse(readFileSync(path, "utf8")) as Record<string, unknown> | null; }
    catch (error) { issues.push({ code: "SPEC_FORM_UNREADABLE", message: `${basename(path)} is not valid YAML: ${String(error)}`, path }); continue; }
    if (!data || typeof data !== "object") { issues.push({ code: "SPEC_FORM_EMPTY", message: `${basename(path)} defines no form.`, path }); continue; }

    const id = String(data.id ?? "").trim();
    if (!id) { issues.push({ code: "SPEC_FORM_INVALID", message: `${basename(path)} has no id.`, path }); continue; }
    let formDirectory: string;
    try { formDirectory = validateSpecDirectory(data.directory, basename(path)); }
    catch (error) { issues.push({ code: "SPEC_FORM_INVALID", message: String(error instanceof Error ? error.message : error), path }); continue; }

    const identity = (data.identity ?? {}) as Record<string, unknown>;
    const prefix = String(identity.prefix ?? "").trim();
    if (!prefix) issues.push({ code: "SPEC_FORM_INVALID", message: `Form '${id}' declares no identity.prefix, so its nodes cannot be resolved by id.`, path });

    const required = (data.required_fields ?? {}) as Record<string, unknown>;
    const edges: SpecFormEdge[] = [];
    for (const raw of Array.isArray(data.required_edges) ? data.required_edges : []) {
      const edge = raw as Record<string, unknown>;
      const direction = String(edge.direction ?? "");
      if (direction !== "incoming" && direction !== "outgoing") {
        issues.push({ code: "SPEC_FORM_INVALID", message: `Form '${id}' edge '${String(edge.name ?? "")}' has direction '${direction}'; only 'incoming' and 'outgoing' exist.`, path });
        continue;
      }
      const targets = strings(edge.target_forms);
      edges.push({
        name: String(edge.name ?? ""),
        direction,
        fields: strings(edge.fields),
        source_forms: strings(edge.source_forms),
        target_forms: targets,
        minimum: Number(edge.minimum ?? 0),
        question: String(edge.question ?? "").trim(),
      });
    }

    forms.push({
      id,
      directory: formDirectory,
      prefix,
      frontmatter: strings(required.frontmatter),
      headings: strings(required.body_headings),
      edges,
      path,
    });
  }

  const seen = new Map<string, string>();
  for (const form of forms) {
    const previous = seen.get(form.id);
    if (previous) issues.push({ code: "SPEC_FORM_DUPLICATE", message: `Form id '${form.id}' is declared by both ${basename(previous)} and ${basename(form.path)}.`, path: form.path });
    else seen.set(form.id, form.path);
  }
  return { forms, issues };
}

export function readSpecNodes(root: string, forms: SpecForm[]): { nodes: SpecNode[]; issues: ValidationIssue[] } {
  return readNodesUnder(specPath(root), forms);
}

/**
 * Every node stored in a form-declared directory under `base`. The accepted specification is one such
 * base (`.kotta/spec/`); a change's model delta is another (`openspec/changes/<name>/model/`).
 */
export function readNodesUnder(base: string, forms: SpecForm[]): { nodes: SpecNode[]; issues: ValidationIssue[] } {
  const nodes: SpecNode[] = [];
  const issues: ValidationIssue[] = [];
  for (const form of forms) {
    const directory = join(base, form.directory);
    if (!existsSync(directory)) continue;
    for (const filename of readdirSync(directory).filter((name) => name.endsWith(".md")).sort()) {
      const path = join(directory, filename);
      let entity;
      try { entity = parseMarkdown(readFileSync(path, "utf8")); }
      catch (error) { issues.push({ code: "SPEC_NODE_UNREADABLE", message: `${filename} has unreadable frontmatter: ${String(error)}`, path }); continue; }
      const id = String(entity.data.id ?? "").trim();
      if (!id) { issues.push({ code: "SPEC_NODE_INVALID", message: `${filename} declares no id.`, path }); continue; }
      nodes.push({ id, form: form.id, path, data: entity.data });
    }
  }
  return { nodes, issues };
}

/**
 * Resolve one node by id. The prefix picks the form and therefore the single directory to read, so
 * a workspace with many nodes still costs one directory listing per lookup.
 */
export function findSpecNode(root: string, id: string): SpecNode | undefined {
  const trimmed = id.trim();
  const { forms } = readFormRegistry(root);
  const prefix = trimmed.split("-")[0];
  const candidates = forms.filter((form) => form.prefix && form.prefix === prefix);
  for (const form of candidates.length ? candidates : forms) {
    const directory = specPath(root, form.directory);
    if (!existsSync(directory)) continue;
    for (const filename of readdirSync(directory).filter((name) => name.endsWith(".md"))) {
      const path = join(directory, filename);
      try {
        const entity = parseMarkdown(readFileSync(path, "utf8"));
        if (String(entity.data.id ?? "").trim() === trimmed) return { id: trimmed, form: form.id, path, data: entity.data };
      } catch { /* a malformed node is reported by validation, not by every lookup */ }
    }
  }
  return undefined;
}

/** Form-level consistency: every edge targets a form the registry declares. */
export function formIssues(forms: SpecForm[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const known = new Set(forms.map((form) => form.id));
  for (const form of forms) {
    for (const edge of form.edges) {
      for (const target of edge.target_forms) {
        if (!known.has(target)) issues.push({ code: "SPEC_FORM_UNKNOWN_TARGET", message: `Form '${form.id}' edge '${edge.name}' targets unregistered form '${target}'.`, path: form.path });
      }
    }
  }
  return issues;
}

/** The values a frontmatter field names, as strings, whether it holds one reference or a list. */
export function referencesIn(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : value === undefined || value === null || value === "" ? [] : [String(value)];
}

/** A capability is a relative path of lowercase segments: `identity/user-auth`. */
const CAPABILITY = /^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*$/;

/**
 * The frontmatter rules every form shares, whatever the registry declares: `provenance` (measured
 * when present, demanded when `requireProvenance`) and the optional `capability` a narrative spec is
 * generated under.
 */
export function commonFrontmatterIssues(node: SpecNode, requireProvenance: boolean): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const file = basename(node.path);
  for (const problem of provenanceProblems(node.data.provenance, requireProvenance)) {
    issues.push({ code: "SPEC_NODE_PROVENANCE", message: `${file} (${node.form}) ${problem}`, path: node.path });
  }
  const capability = node.data.capability;
  if (capability !== undefined && capability !== null && (typeof capability !== "string" || !CAPABILITY.test(capability))) {
    issues.push({ code: "SPEC_NODE_INVALID_CAPABILITY", message: `${file} (${node.form}) has capability '${String(capability)}'; use a relative path of lowercase segments such as 'identity/user-auth'.`, path: node.path });
  }
  return issues;
}

export interface NodeSetOptions {
  /** Which nodes are measured; the rest are only there to be referenced. Default: all of them. */
  subject?: (node: SpecNode) => boolean;
  /** Which measured nodes must carry a provenance block. Default: none. */
  requireProvenance?: (node: SpecNode) => boolean;
  /** Measure edges. Off for a change's delta read alone, whose edges resolve only in the merged view. */
  edges?: boolean;
}

/**
 * Measure a set of nodes against their forms: ids, form, required fields and sections, the common
 * frontmatter rules, and every edge against the node it names within `nodes`. The set is a parameter
 * so the planning phase can measure a merged view (accepted plus delta) that exists only in memory.
 */
export function validateNodeSet(forms: SpecForm[], nodes: SpecNode[], options: NodeSetOptions = {}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const known = new Map(forms.map((form) => [form.id, form]));
  const subject = options.subject ?? (() => true);
  const requireProvenance = options.requireProvenance ?? (() => false);
  const measureEdges = options.edges ?? true;
  const ids = new Map<string, SpecNode>();
  for (const node of nodes) {
    const previous = ids.get(node.id);
    if (previous) {
      if (subject(node) || subject(previous)) issues.push({ code: "SPEC_NODE_DUPLICATE", message: `Specification id '${node.id}' appears in ${basename(previous.path)} and ${basename(node.path)}.`, path: node.path });
    } else ids.set(node.id, node);
  }

  for (const node of nodes) {
    if (!subject(node)) continue;
    const form = known.get(node.form);
    if (!form) continue;
    const expectedId = new RegExp(`^${form.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-[0-9a-hjkmnp-tv-z]{26}$`);
    if (!expectedId.test(node.id)) {
      issues.push({
        code: "SPEC_NODE_INVALID_ID",
        message: `${basename(node.path)} (${form.id}) has id '${node.id}'; use ${form.prefix}- followed by a 26-character lowercase Crockford id.`,
        path: node.path,
      });
    }
    if (String(node.data.form ?? "").trim() !== form.id) {
      issues.push({
        code: "SPEC_NODE_FORM_MISMATCH",
        message: `${basename(node.path)} is stored in the '${form.id}' directory but declares form '${String(node.data.form ?? "")}'. Set 'form: ${form.id}' or move it to the registered directory for its declared form.`,
        path: node.path,
      });
    }
    for (const field of form.frontmatter) {
      const value = node.data[field];
      const empty = value === undefined || value === null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length);
      if (empty) issues.push({ code: "SPEC_NODE_MISSING_FIELD", message: `${basename(node.path)} (${form.id}) is missing required frontmatter field '${field}'.`, path: node.path });
    }
    issues.push(...commonFrontmatterIssues(node, requireProvenance(node)));

    const body = sections(parseMarkdown(readFileSync(node.path, "utf8")).content);
    for (const heading of form.headings) {
      const text = body.get(heading.toLowerCase());
      if (text === undefined || !text.trim()) issues.push({ code: "SPEC_NODE_MISSING_SECTION", message: `${basename(node.path)} (${form.id}) is missing or leaves empty the required section '${heading}'.`, path: node.path });
    }

    if (!measureEdges) continue;
    for (const edge of form.edges) {
      if (edge.direction === "incoming") {
        const incoming = nodes.filter((candidate) => edge.source_forms.includes(candidate.form)).flatMap((candidate) =>
          edge.fields.flatMap((field) => referencesIn(candidate.data[field]).filter((reference) => reference === node.id).map(() => ({ candidate, field }))));
        if (incoming.length < edge.minimum) {
          issues.push({
            code: "SPEC_NODE_MISSING_EDGE",
            message: `${basename(node.path)} (${form.id}) answers incoming edge '${edge.name}' ${incoming.length} time(s); its form requires at least ${edge.minimum}. ${edge.question ? `${edge.question} ` : ""}Add a reference from ${edge.source_forms.join(" or ")} via ${edge.fields.join(", ")}.`,
            path: node.path,
          });
        }
        continue;
      }
      const referenced = edge.fields.flatMap((field) => referencesIn(node.data[field]).map((reference) => ({ field, reference })));
      if (referenced.length < edge.minimum) {
        issues.push({ code: "SPEC_NODE_MISSING_EDGE", message: `${basename(node.path)} (${form.id}) answers edge '${edge.name}' ${referenced.length} time(s); its form requires at least ${edge.minimum} via ${edge.fields.join(", ")}. ${edge.question ? `${edge.question} ` : ""}Add the missing reference.`, path: node.path });
        continue;
      }
      for (const { field, reference } of referenced) {
        const target = ids.get(reference);
        if (!target) issues.push({ code: "SPEC_NODE_DANGLING_EDGE", message: `${basename(node.path)} (${form.id}) edge '${edge.name}' field '${field}' references '${reference}', which is not a specification node in this workspace. Add that node or correct/remove the '${field}' reference.`, path: node.path });
        else if (edge.target_forms.length && !edge.target_forms.includes(target.form)) {
          issues.push({ code: "SPEC_NODE_WRONG_TARGET", message: `${basename(node.path)} (${form.id}) edge '${edge.name}' field '${field}' references '${reference}', which is a ${target.form}; point '${field}' at ${edge.target_forms.join(" or ")}.`, path: node.path });
        }
      }
    }
  }
  return issues;
}

export function validateSpecWorkspace(root: string): ValidationIssue[] {
  const { forms, issues } = readFormRegistry(root);
  issues.push(...formIssues(forms));
  const { nodes, issues: nodeIssues } = readSpecNodes(root, forms);
  issues.push(...nodeIssues);
  issues.push(...validateNodeSet(forms, nodes));
  return issues;
}
