import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";
import { TASK_ID } from "../core/identity.js";
import { parseMarkdown, sections } from "../core/markdown.js";
import type { ValidationIssue } from "../core/validation.js";
import { processPath, specPath, validateSpecDirectory } from "../filesystem/workspace.js";

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
      // task as an edge target would give the specification a way to point at execution.
      const targets = strings(edge.target_forms);
      if (targets.some((target) => target === "task")) {
        issues.push({ code: "SPEC_REFERENCES_TASK", message: `Form '${id}' edge '${String(edge.name ?? "")}' targets 'task'. Specification never references tasks; tasks reference specification.`, path });
        continue;
      }
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

/** The body of a minted id: 26 lowercase Crockford characters, as `identity.ts` mints them. */
const CROCKFORD_BODY = "[0-9a-hjkmnp-tv-z]{26}";

/**
 * Ids the workspace can resolve besides its specification nodes.
 *
 * A node's prose cites decisions as well as other nodes, and a mistyped decision id reads as an
 * answer exactly as a mistyped node id does. Decisions carry both the minted and the sequential
 * form (D-010), so the id is read from the file rather than from its name.
 */
function decisionIds(root: string): Set<string> {
  const found = new Set<string>();
  const directory = processPath(root, "decisions");
  if (!existsSync(directory)) return found;
  for (const filename of readdirSync(directory).filter((name) => name.endsWith(".md"))) {
    try {
      const id = String(parseMarkdown(readFileSync(join(directory, filename), "utf8")).data.id ?? "").trim();
      if (id) found.add(id);
    } catch { /* a malformed decision is reported by its own validation, not by every lookup */ }
  }
  return found;
}

/**
 * What a citation looks like, built from the registry rather than from a list in the code
 * (UC-01m0f0wn89ny7vx515ke3ksnra). A form registered tomorrow is read tomorrow. Longer prefixes are
 * tried first so `EX-` is never read as an `E-` citation with a stray character.
 */
function citationPattern(forms: SpecForm[]): RegExp {
  const prefixes = [...new Set([...forms.map((form) => form.prefix), "D"])]
    .filter(Boolean)
    .sort((left, right) => right.length - left.length || left.localeCompare(right))
    .map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // A sequential decision id (D-003) predates minting and still stands, so both bodies are read.
  return new RegExp(`(?<![A-Za-z0-9-])(?:${prefixes.join("|")})-(?:${CROCKFORD_BODY}|[0-9]{3,})(?![0-9A-Za-z-])`, "g");
}

/** Every id cited in a node's prose, with the heading it stands under, in the order they appear. */
function proseCitations(body: string, pattern: RegExp): Array<{ id: string; heading: string }> {
  const found: Array<{ id: string; heading: string }> = [];
  let heading = "the text before the first heading";
  for (const line of body.split(/\r?\n/)) {
    const marked = /^#{1,6}\s+(.*\S)\s*$/.exec(line);
    if (marked) {
      heading = marked[1];
      continue;
    }
    for (const match of line.matchAll(pattern)) found.push({ id: match[0], heading });
  }
  return found;
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

  // A citation resolves, or it is a broken reference (UC-01m0f0wn89ny7vx515ke3ksnra). The edge
  // checks below read frontmatter; an id written into a node's prose was read by nobody, so a
  // mistyped one landed green and was only ever found by a person re-reading the sentence.
  const citations = citationPattern(forms);
  const resolvable = new Set([...ids.keys(), ...decisionIds(root)]);
  for (const node of nodes) {
    const body = parseMarkdown(readFileSync(node.path, "utf8")).content;
    for (const { id: cited, heading } of proseCitations(body, citations)) {
      if (resolvable.has(cited)) continue;
      issues.push({
        code: "SPEC_PROSE_DANGLING_CITATION",
        message: `${basename(node.path)} cites '${cited}' under '${heading}', which is neither a specification node nor a decision in this workspace. Correct the id or remove the citation; a reference that resolves to nothing reads as an answer.`,
        path: node.path,
      });
    }
  }

  for (const node of nodes) {
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

    const body = sections(parseMarkdown(readFileSync(node.path, "utf8")).content);
    for (const heading of form.headings) {
      const text = body.get(heading.toLowerCase());
      if (text === undefined || !text.trim()) issues.push({ code: "SPEC_NODE_MISSING_SECTION", message: `${basename(node.path)} (${form.id}) is missing or leaves empty the required section '${heading}'.`, path: node.path });
    }

    // A node naming a task is the direction rule broken in data rather than in schema; it is
    // refused wherever it appears, under any field name.
    for (const { field, value } of frontmatterValues(node.data)) {
      if (TASK_ID.test(value)) {
        issues.push({ code: "SPEC_REFERENCES_TASK", message: `${basename(node.path)} names task '${value}' in field '${field}'. Specification never references tasks; tasks reference specification.`, path: node.path });
      }
    }

    for (const edge of form.edges) {
      if (edge.direction === "incoming") {
        const incoming = nodes.filter((candidate) => edge.source_forms.includes(candidate.form)).flatMap((candidate) =>
          edge.fields.flatMap((field) => {
            const value = candidate.data[field];
            const references = Array.isArray(value) ? value.map(String) : value === undefined || value === null || value === "" ? [] : [String(value)];
            return references.filter((reference) => reference === node.id).map(() => ({ candidate, field }));
          }));
        if (incoming.length < edge.minimum) {
          issues.push({
            code: "SPEC_NODE_MISSING_EDGE",
            message: `${basename(node.path)} (${form.id}) answers incoming edge '${edge.name}' ${incoming.length} time(s); its form requires at least ${edge.minimum}. ${edge.question ? `${edge.question} ` : ""}Add a reference from ${edge.source_forms.join(" or ")} via ${edge.fields.join(", ")}.`,
            path: node.path,
          });
        }
        continue;
      }
      const referenced = edge.fields.flatMap((field) => {
        const value = node.data[field];
        const references = Array.isArray(value) ? value.map(String) : value === undefined || value === null || value === "" ? [] : [String(value)];
        return references.map((reference) => ({ field, reference }));
      });
      if (referenced.length < edge.minimum) {
        issues.push({ code: "SPEC_NODE_MISSING_EDGE", message: `${basename(node.path)} (${form.id}) answers edge '${edge.name}' ${referenced.length} time(s); its form requires at least ${edge.minimum} via ${edge.fields.join(", ")}. ${edge.question ? `${edge.question} ` : ""}Add the missing reference.`, path: node.path });
        continue;
      }
      for (const { field, reference } of referenced) {
        const target = ids.has(reference) ? nodes.find((candidate) => candidate.id === reference) : undefined;
        if (!target) issues.push({ code: "SPEC_NODE_DANGLING_EDGE", message: `${basename(node.path)} (${form.id}) edge '${edge.name}' field '${field}' references '${reference}', which is not a specification node in this workspace. Add that node or correct/remove the '${field}' reference.`, path: node.path });
        else if (edge.target_forms.length && !edge.target_forms.includes(target.form)) {
          issues.push({ code: "SPEC_NODE_WRONG_TARGET", message: `${basename(node.path)} (${form.id}) edge '${edge.name}' field '${field}' references '${reference}', which is a ${target.form}; point '${field}' at ${edge.target_forms.join(" or ")}.`, path: node.path });
        }
      }
    }
  }
  return issues;
}
