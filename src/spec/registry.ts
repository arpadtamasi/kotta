import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";
import { CONTRACT_ID } from "../core/identity.js";
import { parseMarkdown, sections } from "../core/markdown.js";
import type { ValidationIssue } from "../core/validation.js";
import { specPath, validateSpecDirectory } from "../filesystem/workspace.js";

/**
 * The specification layer's schema has always existed — every form declares its required fields and
 * its required edges — but nothing in Kotta read it. Checking a node against its form was delegated
 * to a skill, in prose, which states that it never gates anything. This module is the mechanical
 * half moved into code: the registry is still the only source of form-specific knowledge, so a
 * project-added form participates without a TypeScript change.
 */

export interface SpecFormEdge {
  name: string;
  direction: "incoming" | "outgoing";
  fields: string[];
  source_forms: string[];
  target_forms: string[];
  minimum: number;
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

/** Every frontmatter value a node offers, flattened, so a reference can be looked for in all of them. */
function frontmatterValues(data: Record<string, unknown>): Array<{ field: string; value: string }> {
  const found: Array<{ field: string; value: string }> = [];
  for (const [field, value] of Object.entries(data)) {
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (typeof entry === "string" || typeof entry === "number") found.push({ field, value: String(entry) });
    }
  }
  return found;
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
      // The direction rule is structural, not a convention to remember: a form that could name a
      // contract as an edge target would give the specification a way to point at execution.
      const targets = strings(edge.target_forms);
      if (targets.some((target) => target === "contract")) {
        issues.push({ code: "SPEC_REFERENCES_CONTRACT", message: `Form '${id}' edge '${String(edge.name ?? "")}' targets 'contract'. Specification never references contracts; contracts reference specification.`, path });
        continue;
      }
      edges.push({
        name: String(edge.name ?? ""),
        direction,
        fields: strings(edge.fields),
        source_forms: strings(edge.source_forms),
        target_forms: targets,
        minimum: Number(edge.minimum ?? 0),
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
  const nodes: SpecNode[] = [];
  const issues: ValidationIssue[] = [];
  for (const form of forms) {
    const directory = specPath(root, form.directory);
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

/** Read a node's full text, for the execution brief. */
export function readSpecNodeText(node: SpecNode): string {
  return readFileSync(node.path, "utf8").trim();
}

export function validateSpecWorkspace(root: string): ValidationIssue[] {
  const { forms, issues } = readFormRegistry(root);
  const known = new Map(forms.map((form) => [form.id, form]));
  for (const form of forms) {
    for (const edge of form.edges) {
      for (const target of edge.target_forms) {
        if (!known.has(target)) issues.push({ code: "SPEC_FORM_UNKNOWN_TARGET", message: `Form '${form.id}' edge '${edge.name}' targets unregistered form '${target}'.`, path: form.path });
      }
    }
  }

  const { nodes, issues: nodeIssues } = readSpecNodes(root, forms);
  issues.push(...nodeIssues);
  const ids = new Map<string, string>();
  for (const node of nodes) {
    const previous = ids.get(node.id);
    if (previous) issues.push({ code: "SPEC_NODE_DUPLICATE", message: `Specification id '${node.id}' appears in ${basename(previous)} and ${basename(node.path)}.`, path: node.path });
    else ids.set(node.id, node.path);
  }

  for (const node of nodes) {
    const form = known.get(node.form);
    if (!form) continue;
    for (const field of form.frontmatter) {
      const value = node.data[field];
      const empty = value === undefined || value === null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length);
      if (empty) issues.push({ code: "SPEC_NODE_MISSING_FIELD", message: `${basename(node.path)} (${form.id}) is missing required frontmatter field '${field}'.`, path: node.path });
    }

    const body = sections(parseMarkdown(readFileSync(node.path, "utf8")).content);
    for (const heading of form.headings) {
      const text = body.get(heading.toLowerCase());
      if (text === undefined || !text.trim()) issues.push({ code: "SPEC_NODE_MISSING_SECTION", message: `${basename(node.path)} (${form.id}) is missing or leaves empty the required section '${heading}'.`, path: node.path });
    }

    // A node naming a contract is the direction rule broken in data rather than in schema; it is
    // refused wherever it appears, under any field name.
    for (const { field, value } of frontmatterValues(node.data)) {
      if (CONTRACT_ID.test(value)) {
        issues.push({ code: "SPEC_REFERENCES_CONTRACT", message: `${basename(node.path)} names contract '${value}' in field '${field}'. Specification never references contracts; contracts reference specification.`, path: node.path });
      }
    }

    for (const edge of form.edges) {
      if (edge.direction !== "outgoing") continue;
      const referenced = edge.fields.flatMap((field) => {
        const value = node.data[field];
        return Array.isArray(value) ? value.map(String) : value === undefined || value === null || value === "" ? [] : [String(value)];
      });
      if (referenced.length < edge.minimum) {
        issues.push({ code: "SPEC_NODE_MISSING_EDGE", message: `${basename(node.path)} (${form.id}) answers edge '${edge.name}' ${referenced.length} time(s); its form requires at least ${edge.minimum} via ${edge.fields.join(", ")}.`, path: node.path });
        continue;
      }
      for (const reference of referenced) {
        const target = ids.has(reference) ? nodes.find((candidate) => candidate.id === reference) : undefined;
        if (!target) issues.push({ code: "SPEC_NODE_DANGLING_EDGE", message: `${basename(node.path)} (${form.id}) edge '${edge.name}' references '${reference}', which is not a specification node in this workspace.`, path: node.path });
        else if (edge.target_forms.length && !edge.target_forms.includes(target.form)) {
          issues.push({ code: "SPEC_NODE_WRONG_TARGET", message: `${basename(node.path)} (${form.id}) edge '${edge.name}' references '${reference}', which is a ${target.form}; the form allows ${edge.target_forms.join(", ")}.`, path: node.path });
        }
      }
    }
  }
  return issues;
}
