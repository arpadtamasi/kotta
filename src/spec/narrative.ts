import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { parseMarkdown, sections } from "../core/markdown.js";
import { readProvenance } from "./provenance.js";
import { referencesIn, type SpecForm, type SpecNode } from "./registry.js";

/**
 * The narrative layer, as far as the model is concerned: an OpenSpec requirement bound to the node it
 * states by a `<!-- kotta: ID -->` line under its heading. The model is the accepted truth; the
 * narrative is generated from it on archive and checked against it everywhere else. A disagreement
 * is reported with both places named. Nothing here edits a narrative to make it agree.
 */

/**
 * The forms a requirement is generated for, in the order a capability's spec lists them: the forms
 * whose own text carries the normative keyword (the registry's `normative_sections`). A requirement's
 * SHALL sentence is the node's, so only a node that states one becomes a requirement.
 */
export const REQUIREMENT_FORMS = ["business-rule", "interface", "quality-attribute"] as const;
/**
 * The forms a capability's spec describes after its requirements, informatively, under their own
 * section: free-form in the model, so never a requirement — the generator would have to invent the
 * SHALL sentence. Each lists the headings it carries, as the node wrote them.
 */
export const INFORMATIVE_FORMS = [
  { form: "use-case", section: "Use cases", headings: ["Intent", "Main success scenario", "Alternatives"] },
  { form: "user-story", section: "User stories", headings: ["Story", "Value"] },
] as const;
/** The form whose nodes become scenarios, attached by their `subjects`. */
export const SCENARIO_FORM = "example";
/** The form whose node states a capability's purpose. */
export const PURPOSE_FORM = "goal";
/**
 * The form no example can prove (an example's `subjects` never name one), so its requirement would
 * carry no scenario, which OpenSpec rejects. Its own contract is the scenario: the preconditions as
 * GIVEN, the postconditions as THEN, word for word.
 */
export const CONTRACT_FORM = "interface";
/** OpenSpec's `validate --strict` calls a shorter Purpose too brief. */
export const MIN_PURPOSE_LENGTH = 50;

const BINDING = /^\s*<!--\s*kotta:\s*([A-Za-z]{1,4}-[0-9a-hjkmnp-tv-z]{26})\s*-->\s*$/;
const REQUIREMENT = /^###\s+Requirement:\s*(.+?)\s*$/;
const ANY_HEADING = /^#{1,4}\s/;

function nodeSections(node: SpecNode): Map<string, string> {
  return sections(parseMarkdown(readFileSync(node.path, "utf8")).content);
}

function title(node: SpecNode): string {
  return typeof node.data.title === "string" && node.data.title.trim() ? node.data.title.trim() : node.id;
}

/** Whitespace-insensitive, comment-free: the unit two texts are compared in. */
export function normalizeProse(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * A requirement's text, taken from the node's own sections in its form's order and nothing else: the
 * first section as the statement, every further one under its own heading in bold.
 */
export function requirementBody(node: SpecNode, form: SpecForm | undefined): string {
  const body = nodeSections(node);
  const headings = form?.headings ?? [];
  const parts: string[] = [];
  for (const heading of headings) {
    const text = (body.get(heading.toLowerCase()) ?? "").trim();
    if (!text) continue;
    parts.push(parts.length ? `**${heading}**\n\n${text}` : text);
  }
  return parts.join("\n\n");
}

/** The node's statement: its first non-empty required section, what a requirement's SHALL sentence says. */
export function requirementStatement(node: SpecNode, form: SpecForm | undefined): string {
  const body = nodeSections(node);
  for (const heading of form?.headings ?? []) {
    const text = (body.get(heading.toLowerCase()) ?? "").trim();
    if (text) return text;
  }
  return "";
}

/** A narrative requirement's statement: its text up to the first bold sub-heading a generated one carries. */
export function narrativeStatement(body: string): string {
  const lines: string[] = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^\*\*[^*]+\*\*\s*$/.test(line.trim())) break;
    lines.push(line);
  }
  return lines.join("\n");
}

function scenario(example: SpecNode, form: SpecForm | undefined): string[] {
  const body = nodeSections(example);
  const lines = [`#### Scenario: ${title(example)}`, `<!-- kotta: ${example.id} -->`];
  for (const heading of form?.headings ?? []) {
    const text = normalizeProse(body.get(heading.toLowerCase()) ?? "");
    if (text) lines.push(`- **${heading.toUpperCase()}** ${text}`);
  }
  return lines;
}

/** An informative entry: the node's chosen sections under bold labels, verbatim. */
function informativeBody(node: SpecNode, headings: readonly string[]): string {
  const body = nodeSections(node);
  return headings.flatMap((heading) => {
    const text = (body.get(heading.toLowerCase()) ?? "").trim();
    return text ? [`**${heading}**\n\n${text}`] : [];
  }).join("\n\n");
}

function contractScenario(node: SpecNode): string[] {
  const body = nodeSections(node);
  const given = normalizeProse(body.get("preconditions") ?? "");
  const then = normalizeProse(body.get("postconditions") ?? "");
  if (!then) return [];
  return [`#### Scenario: ${title(node)} keeps its contract`, `<!-- kotta: ${node.id} -->`, ...(given ? [`- **GIVEN** ${given}`] : []), `- **THEN** ${then}`];
}

/**
 * What OpenSpec's strict validation will say of a narrative's shape, said before it does: a Purpose
 * under its minimum, a requirement with no scenario. Reported, never filled in — the text a generator
 * would have to invent is the model's to state.
 */
export function narrativeShapeWarnings(file: string, content: string): Array<{ code: string; message: string; path: string }> {
  const warnings: Array<{ code: string; message: string; path: string }> = [];
  const purpose = normalizeProse(sections(content).get("purpose") ?? "");
  if (purpose.length < MIN_PURPOSE_LENGTH) {
    warnings.push({ code: "NARRATIVE_PURPOSE_BRIEF", message: `${file} ${purpose.length ? `states a Purpose of ${purpose.length} characters; OpenSpec's strict validation wants at least ${MIN_PURPOSE_LENGTH}` : "states no Purpose: no goal node names this capability"}. State the capability's outcome in a goal node that names it; the generator invents none.`, path: file });
  }
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const heading = REQUIREMENT.exec(lines[index]);
    if (!heading) continue;
    let cursor = index + 1;
    let scenarios = 0;
    for (; cursor < lines.length && !/^#{1,3}\s/.test(lines[cursor]); cursor += 1) if (/^####\s/.test(lines[cursor])) scenarios += 1;
    if (!scenarios) warnings.push({ code: "NARRATIVE_NO_SCENARIO", message: `${file}:${index + 1} requirement '${heading[1]}' has no scenario, which OpenSpec rejects. Add an example node whose subjects name it.`, path: file });
  }
  return warnings;
}

/** The `## Purpose` body of an existing narrative, kept when no goal node states one. */
function existingPurpose(existing: string | undefined): string | undefined {
  if (!existing) return undefined;
  const text = sections(existing).get("purpose");
  return text && text.trim() ? text.trim() : undefined;
}

/**
 * The OpenSpec narrative of one capability, generated from the nodes that name it. Purpose comes from
 * the goal nodes naming the capability, else from the existing file; with neither, the section says
 * the model states none rather than inventing one.
 */
export function generateCapabilitySpec(capability: string, nodes: SpecNode[], forms: SpecForm[], existing?: string): string {
  const formById = new Map(forms.map((form) => [form.id, form]));
  const members = nodes.filter((node) => node.data.capability === capability);
  const goals = members.filter((node) => node.form === PURPOSE_FORM).sort((a, b) => a.id.localeCompare(b.id));
  const lines = [`# ${capability} Specification`, "", "<!-- Generated by `kotta archive` from the technical model. The model is the accepted truth: change the nodes, not this file. -->", "", "## Purpose", ""];
  if (goals.length) {
    for (const goal of goals) {
      const first = formById.get(goal.form)?.headings[0];
      const outcome = first ? (nodeSections(goal).get(first.toLowerCase()) ?? "").trim() : "";
      lines.push(`<!-- kotta: ${goal.id} -->`, outcome || title(goal), "");
    }
  } else {
    const kept = existingPurpose(existing);
    lines.push(kept ?? "<!-- kotta: no goal node names this capability, so the model states no purpose for it. -->", "");
  }
  lines.push("## Requirements", "");
  const examples = nodes.filter((node) => node.form === SCENARIO_FORM);
  const byTitle = (a: SpecNode, b: SpecNode) => title(a).localeCompare(title(b)) || a.id.localeCompare(b.id);
  const requirementIds = new Set(nodes.filter((node) => (REQUIREMENT_FORMS as readonly string[]).includes(node.form)).map((node) => node.id));
  for (const formId of REQUIREMENT_FORMS) {
    const requirements = members.filter((node) => node.form === formId).sort((a, b) => title(a).localeCompare(title(b)) || a.id.localeCompare(b.id));
    for (const node of requirements) {
      lines.push(`### Requirement: ${title(node)}`, `<!-- kotta: ${node.id} -->`, requirementBody(node, formById.get(node.form)), "");
      const proving = examples.filter((example) => referencesIn(example.data.subjects).includes(node.id)).sort((a, b) => title(a).localeCompare(title(b)) || a.id.localeCompare(b.id));
      for (const example of proving) lines.push(...scenario(example, formById.get(example.form)), "");
      if (!proving.length && node.form === CONTRACT_FORM) lines.push(...contractScenario(node), "");
    }
  }
  // Use cases and user stories: described, not required. An example that proves a requirement is that
  // requirement's scenario; one that proves none is listed under the use case or story it names.
  for (const informative of INFORMATIVE_FORMS) {
    const entries = members.filter((node) => node.form === informative.form).sort(byTitle);
    if (!entries.length) continue;
    lines.push(`## ${informative.section}`, "");
    for (const node of entries) {
      lines.push(`### ${title(node)}`, `<!-- kotta: ${node.id} -->`, informativeBody(node, informative.headings), "");
      const proving = examples.filter((example) => {
        const subjects = referencesIn(example.data.subjects);
        return subjects.includes(node.id) && !subjects.some((subject) => requirementIds.has(subject));
      }).sort(byTitle);
      for (const example of proving) lines.push(...scenario(example, formById.get(example.form)), "");
    }
  }
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

export interface BoundRequirement {
  id: string;
  title: string;
  body: string;
  line: number;
}

/** Every requirement in a narrative file that names the node it states. */
export function boundRequirements(content: string): BoundRequirement[] {
  const lines = content.split(/\r?\n/);
  const found: BoundRequirement[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const heading = REQUIREMENT.exec(lines[index]);
    if (!heading) continue;
    let cursor = index + 1;
    while (cursor < lines.length && !lines[cursor].trim()) cursor += 1;
    const binding = BINDING.exec(lines[cursor] ?? "");
    if (!binding) continue;
    const body: string[] = [];
    for (cursor += 1; cursor < lines.length && !ANY_HEADING.test(lines[cursor]); cursor += 1) body.push(lines[cursor]);
    found.push({ id: binding[1], title: heading[1], body: body.join("\n"), line: index + 1 });
  }
  return found;
}

export interface NarrativeDrift {
  /** The narrative file, relative to the repository root. */
  file: string;
  line: number;
  requirement: string;
  id: string;
  kind: "missing-node" | "changed";
  /** The node's title, when it exists. */
  node?: string;
  nodePath?: string;
  narrative: string;
  model?: string;
}

/**
 * The bound requirements whose statement no longer agrees with the node. A requirement's statement —
 * its SHALL sentence, the text before any bold sub-heading — agrees when it is the node's own
 * statement (its first section), or when it still carries the sentence the node's provenance quotes:
 * the statement the node was derived from.
 */
export function narrativeDrift(root: string, file: string, content: string, nodes: Map<string, SpecNode>, forms: SpecForm[]): NarrativeDrift[] {
  const formById = new Map(forms.map((form) => [form.id, form]));
  const drift: NarrativeDrift[] = [];
  for (const requirement of boundRequirements(content)) {
    const narrative = normalizeProse(narrativeStatement(requirement.body));
    const node = nodes.get(requirement.id);
    const where = relative(root, file);
    if (!node) {
      drift.push({ file: where, line: requirement.line, requirement: requirement.title, id: requirement.id, kind: "missing-node", narrative });
      continue;
    }
    const model = normalizeProse(requirementStatement(node, formById.get(node.form)));
    const quote = readProvenance(node.data.provenance)?.quote;
    const quoted = typeof quote === "string" && quote.trim() && narrative.includes(normalizeProse(quote));
    if (narrative === model || quoted) continue;
    drift.push({ file: where, line: requirement.line, requirement: requirement.title, id: requirement.id, kind: "changed", node: title(node), nodePath: relative(root, node.path), narrative, model });
  }
  return drift;
}

/** Every Markdown file under `directory`, recursively, sorted. */
export function markdownFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith(".md") ? [path] : [];
  }).sort();
}
