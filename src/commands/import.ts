import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, sep } from "node:path";
import { parseMarkdown, renderMarkdown } from "../core/markdown.js";
import { mintSpecId, specFilename } from "../core/identity.js";
import { slugify } from "../core/naming.js";
import { findRepositoryRoot, specPath } from "../filesystem/workspace.js";
import { ARCHIVE_DIRECTORY, MODEL_DIRECTORY, OPENSPEC_DIRECTORY, changesPath } from "../spec/change.js";
import { INFORMATIVE_FORMS, PURPOSE_FORM, REQUIREMENT_FORMS, SCENARIO_FORM, markdownFiles, normalizeProse, stripMarkdownComments } from "../spec/narrative.js";
import { QUOTE_WORD_LIMIT, type Provenance } from "../spec/provenance.js";
import { readFormRegistry, readSpecNodes, referencesIn, type SpecForm, type SpecNode } from "../spec/registry.js";
import type { NodeRef } from "./plan.js";

/**
 * `kotta import openspec` — take an existing OpenSpec project into the technical model through the
 * planning phase, not by translation.
 *
 * The mechanical half only: it opens a change, writes a proposal saying what was imported and from
 * where, and drafts into the change's `model/` exactly what the narrative states — every requirement
 * a business rule, every scenario an example proving it, every capability's Purpose a goal — each
 * marked `stated`, `agent-decided`, with the requirement it came from. Text is copied, never
 * written: a section the narrative has nothing for stays empty, with a comment saying so, for the
 * planning phase to ask about. It invents no actor, use case, entity or state machine; the
 * `plan-change` skill derives those from the proposal and the narrative, asking, and `kotta plan`
 * measures the result. The narrative itself is only read.
 *
 * A requirement bound to an accepted node (`<!-- kotta: ID -->` under its heading), or carrying the
 * title of exactly one accepted node of its kind, changes that node under its own id instead of
 * drafting a duplicate.
 */

/** Written into every section the narrative has no text for. A comment is not an answer. */
export const NOT_DERIVABLE = "<!-- kotta import: not derivable from the narrative spec; the planning phase asks for it. -->";
/** What the import leaves for the planning phase to derive, by form id. */
/** A requirement may be bound to a use case or story by a narrative generated before they became informative. */
const BINDABLE_FORMS = [...REQUIREMENT_FORMS, ...INFORMATIVE_FORMS.map((entry) => entry.form)];

export const NOT_DERIVED = ["actor", "use-case", "entity", "state-machine"] as const;
const RULE_FORM = "business-rule";

const BINDING = /^\s*<!--\s*kotta:\s*([A-Za-z]{1,4}-[0-9a-hjkmnp-tv-z]{26})\s*-->\s*$/;
const STEP = /^\s*[-*+]\s+\*\*(GIVEN|WHEN|THEN|AND|BUT)\*\*:?\s*(.*)$/i;

export interface ParsedScenario { title: string; binding?: string; given: string[]; when: string[]; then: string[]; line: number }
export interface ParsedRequirement { title: string; binding?: string; text: string; line: number; scenarios: ParsedScenario[] }
export interface ParsedCapabilitySpec { purpose: string; purposeBinding?: string; requirements: ParsedRequirement[] }

/**
 * One OpenSpec capability spec, read the way OpenSpec writes it: `## Purpose`, then `### Requirement:`
 * blocks, each followed by `#### Scenario:` blocks of `- **WHEN** …` steps. A `<!-- kotta: ID -->`
 * line directly under a heading is the binding, not text. Headings inside a fence are text.
 */
export function parseCapabilitySpec(content: string): ParsedCapabilitySpec {
  const lines = content.split(/\r?\n/);
  const purpose: string[] = [];
  let purposeBinding: string | undefined;
  const requirements: ParsedRequirement[] = [];
  let section: "purpose" | "other" | undefined;
  let requirement: (ParsedRequirement & { lines: string[] }) | undefined;
  let scenario: ParsedScenario | undefined;
  let step: string[] | undefined;
  let fenced = false;
  let expectBinding = false;

  const closeRequirement = () => {
    if (requirement) requirements.push({ title: requirement.title, binding: requirement.binding, text: stripMarkdownComments(requirement.lines.join("\n")), line: requirement.line, scenarios: requirement.scenarios });
    requirement = undefined;
    scenario = undefined;
    step = undefined;
  };

  lines.forEach((line, index) => {
    const heading = fenced ? null : /^(#{1,4})\s+(.*?)\s*$/.exec(line);
    if (/^\s*```/.test(line)) fenced = !fenced;
    if (heading) {
      expectBinding = true;
      const [, hashes, text] = heading;
      const requirementHeading = /^Requirement:\s*(.+)$/i.exec(text);
      const scenarioHeading = /^Scenario:\s*(.+)$/i.exec(text);
      if (hashes.length === 3 && requirementHeading) {
        closeRequirement();
        requirement = { title: requirementHeading[1].trim(), text: "", line: index + 1, scenarios: [], lines: [] };
        section = "other";
      } else if (hashes.length === 4 && scenarioHeading && requirement) {
        scenario = { title: scenarioHeading[1].trim(), given: [], when: [], then: [], line: index + 1 };
        requirement.scenarios.push(scenario);
        step = undefined;
      } else if (hashes.length <= 2) {
        closeRequirement();
        section = hashes.length === 2 && text.trim().toLowerCase() === "purpose" ? "purpose" : "other";
      } else if (requirement && !scenario) {
        requirement.lines.push(line);
        expectBinding = false;
      }
      return;
    }
    if (expectBinding && !line.trim()) return;
    const binding = expectBinding ? BINDING.exec(line) : null;
    expectBinding = false;
    if (binding) {
      if (scenario) scenario.binding = binding[1];
      else if (requirement) requirement.binding = binding[1];
      else if (section === "purpose") purposeBinding = binding[1];
      return;
    }
    if (scenario) {
      const match = fenced ? null : STEP.exec(line);
      if (match) {
        const keyword = match[1].toUpperCase();
        step = keyword === "GIVEN" ? scenario.given : keyword === "WHEN" ? scenario.when : keyword === "THEN" ? scenario.then : step ?? scenario.then;
        step.push(match[2].trim());
      } else if (line.trim()) {
        // A continuation of the step above, or a line the scenario states outside any step.
        const target = step ?? scenario.then;
        if (target.length) target[target.length - 1] = `${target[target.length - 1]} ${line.trim()}`;
        else target.push(line.trim());
      }
      return;
    }
    if (requirement) requirement.lines.push(line);
    else if (section === "purpose") purpose.push(line);
  });
  closeRequirement();
  // Every section is measured without its comments (BR-01m3cqmtnnwxz7fkyr6d5ch9e6): the generator's
  // "no goal node names this capability" comment is not a purpose, and a step that is only a comment
  // is not a step.
  const uncommented = (items: string[]) => items.map(stripMarkdownComments).filter(Boolean);
  for (const each of requirements) {
    for (const entry of each.scenarios) {
      entry.given = uncommented(entry.given);
      entry.when = uncommented(entry.when);
      entry.then = uncommented(entry.then);
    }
  }
  return { purpose: stripMarkdownComments(purpose.join("\n")), purposeBinding, requirements };
}

/** The first sentence of a text, whitespace-normalized and cut to the quote limit: a witness, not a copy. */
export function firstSentence(text: string): string {
  const prose = normalizeProse(text);
  const sentence = /^(.+?[.!?])(?:\s|$)/.exec(prose)?.[1] ?? prose;
  const words = sentence.split(/\s+/).filter(Boolean);
  return words.slice(0, QUOTE_WORD_LIMIT).join(" ");
}

function steps(items: string[]): string {
  return items.length <= 1 ? (items[0] ?? "") : items.map((item) => `- ${item}`).join("\n");
}

function normalizedTitle(text: string): string {
  return normalizeProse(text).toLowerCase();
}

/** The body with one `## heading` section's text replaced, or appended when the section is absent. */
function replaceSection(body: string, heading: string, text: string): string {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^##\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i").test(line));
  if (start < 0) return `${body.trimEnd()}\n\n## ${heading}\n\n${text}\n`;
  let end = start + 1;
  while (end < lines.length && !/^#{1,2}\s/.test(lines[end])) end += 1;
  return [...lines.slice(0, start + 1), "", text, "", ...lines.slice(end)].join("\n");
}

function nodeTitle(node: SpecNode): string {
  return typeof node.data.title === "string" && node.data.title.trim() ? node.data.title.trim() : node.id;
}

export interface ImportedCapability {
  capability: string;
  /** The narrative file, relative to the repository root. */
  file: string;
  requirements: number;
  scenarios: number;
  purpose: boolean;
}

export interface ImportResult {
  ok: true;
  command: "import openspec";
  data: {
    change: string;
    directory: string;
    proposal: string;
    capabilities: ImportedCapability[];
    /** Changes archived under openspec/changes/archive/: named in the proposal as history, not imported. */
    archived: string[];
    drafted: { rules: number; examples: number; goals: number };
    added: NodeRef[];
    /** Accepted nodes the import changes under their own id instead of duplicating. */
    modified: NodeRef[];
    /** Every draft is the agent's reading until the gate: one decider for all of them. */
    decidedBy: "agent-decided";
    notDerived: string[];
    warnings: string[];
    next: string[];
  };
}

interface Draft { form: SpecForm; id: string; path: string; data: Record<string, unknown>; body: string; existing?: SpecNode }

function formNamed(forms: SpecForm[], id: string): SpecForm {
  const form = forms.find((candidate) => candidate.id === id);
  if (!form) throw new Error(`The import drafts ${id} nodes, and this workspace registers no '${id}' form. Run 'kotta sync' to add the shipped forms.`);
  return form;
}

function provenance(source: string, quote: string): Provenance {
  return { level: "stated", decided_by: "agent-decided", sources: [source], ...(quote ? { quote } : {}) };
}

function freshFrontmatter(form: SpecForm, id: string, title: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const known: Record<string, unknown> = { id, form: form.id, title };
  for (const field of form.frontmatter) data[field] = field in known ? known[field] : null;
  for (const edge of form.edges) {
    if (edge.direction !== "outgoing") continue;
    for (const field of edge.fields) if (!(field in data)) data[field] = [];
  }
  return data;
}

/** A fresh body: the form's headings in order, each with the narrative's text or the not-derivable note. */
function freshBody(form: SpecForm, title: string, texts: Record<string, string>): string {
  const lines = [`# ${title}`, ""];
  for (const heading of form.headings) {
    const text = (texts[heading.toLowerCase()] ?? "").trim();
    lines.push(`## ${heading}`, "", text || NOT_DERIVABLE, "");
  }
  return lines.join("\n");
}

export function importOpenSpec(options: { change?: string } = {}, repositoryRoot?: string, now: Date = new Date()): ImportResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const { forms } = readFormRegistry(root);
  if (!forms.length) throw new Error(`No form registry is installed at ${specPath(root, "forms")}. Run 'kotta init' or 'kotta migrate' first.`);
  const ruleForm = formNamed(forms, RULE_FORM);
  const exampleForm = formNamed(forms, SCENARIO_FORM);
  const goalForm = formNamed(forms, PURPOSE_FORM);

  const specsRoot = join(root, OPENSPEC_DIRECTORY, "specs");
  const narratives = markdownFiles(specsRoot).filter((file) => basename(file) === "spec.md" && relative(specsRoot, file).includes(sep));
  if (!narratives.length) throw new Error(`No OpenSpec capability spec was found under ${relative(root, specsRoot)}/: the import reads ${OPENSPEC_DIRECTORY}/specs/<capability>/spec.md.`);

  const name = (options.change ?? `import-openspec-${now.toISOString().slice(0, 10)}`).trim();
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name) || name === ARCHIVE_DIRECTORY) {
    throw new Error(`'${name}' is not a change name; use lowercase letters, digits, '.', '_' and '-', and not '${ARCHIVE_DIRECTORY}'.`);
  }
  const directory = changesPath(root, name);
  if (existsSync(directory)) throw new Error(`${relative(root, directory)}/ already exists. Nothing was written; name another change with --change, or plan the one that is there.`);

  const { nodes: accepted } = readSpecNodes(root, forms);
  const acceptedById = new Map(accepted.map((node) => [node.id, node]));
  const claimed = new Set<string>();
  const warnings: string[] = [];

  /** The accepted node a narrative item is bound to, or the one accepted node of its kind carrying its title. */
  const match = (kind: readonly string[], title: string, binding: string | undefined, where: string, scope: (node: SpecNode) => boolean = () => true, alsoMatches: (node: SpecNode) => boolean = () => false): SpecNode | undefined => {
    if (binding) {
      const bound = acceptedById.get(binding);
      if (bound && kind.includes(bound.form) && !claimed.has(bound.id)) { claimed.add(bound.id); return bound; }
      warnings.push(bound ? `${where} is bound to ${nodeTitle(bound)} (${binding}), a ${bound.form}${claimed.has(bound.id) ? " already matched by another item" : ""}; drafted as a new node instead.` : `${where} is bound to ${binding}, which is not an accepted node; drafted as a new node.`);
      return undefined;
    }
    const wanted = normalizedTitle(title);
    const candidates = accepted.filter((node) => kind.includes(node.form) && !claimed.has(node.id) && scope(node) && (normalizedTitle(nodeTitle(node)) === wanted || alsoMatches(node)));
    if (candidates.length === 1) { claimed.add(candidates[0].id); return candidates[0]; }
    if (candidates.length > 1) warnings.push(`${where} matches ${candidates.length} accepted nodes by title (${candidates.map((node) => node.id).join(", ")}); drafted as a new node, for the planning phase to decide which it is.`);
    return undefined;
  };

  const modelDirectory = join(directory, MODEL_DIRECTORY);
  const drafts: Draft[] = [];
  const fresh = (form: SpecForm, title: string, texts: Record<string, string>, extra: Record<string, unknown>): Draft => {
    const id = mintSpecId(form.prefix, now.getTime());
    const data = { ...freshFrontmatter(form, id, title), ...extra };
    const draft = { form, id, path: join(modelDirectory, form.directory, specFilename(id, slugify(title))), data, body: freshBody(form, title, texts) };
    drafts.push(draft);
    return draft;
  };
  /** An accepted node changed under its own id: what the narrative states replaces its sections; the rest stays. */
  const changed = (node: SpecNode, texts: Record<string, string>, extra: Record<string, unknown>): Draft => {
    const form = formNamed(forms, node.form);
    const parsed = parseMarkdown(readFileSync(node.path, "utf8"));
    let body = parsed.content;
    for (const [heading, text] of Object.entries(texts)) {
      const declared = form.headings.find((candidate) => candidate.toLowerCase() === heading);
      if (declared && text.trim()) body = replaceSection(body, declared, text.trim());
    }
    const data: Record<string, unknown> = { ...parsed.data, ...extra };
    if (typeof parsed.data.capability === "string" && parsed.data.capability.trim()) data.capability = parsed.data.capability;
    const draft = { form, id: node.id, path: join(modelDirectory, form.directory, basename(node.path)), data, body, existing: node };
    drafts.push(draft);
    return draft;
  };

  const capabilities: ImportedCapability[] = [];
  const drafted = { rules: 0, examples: 0, goals: 0 };
  for (const file of narratives) {
    const capability = relative(specsRoot, file).split(sep).slice(0, -1).join("/");
    const source = relative(root, file).split(sep).join("/");
    const parsed = parseCapabilitySpec(readFileSync(file, "utf8"));

    // A Purpose with no text once its comments are gone drafts no goal, and says so: the planning
    // phase asks for a purpose nobody stated (BR-01m3cqmtnnwxz7fkyr6d5ch9e6, EX-01m3cqmvz6thtctkdd760f1n2b).
    if (!parsed.purpose) warnings.push(`${capability}: the purpose is not stated — ${source} · Purpose has no text once its comments are removed, so no goal was drafted; the planning phase asks for it.`);
    if (parsed.purpose) {
      const title = `Purpose of ${capability}`;
      const texts = { [goalForm.headings[0].toLowerCase()]: parsed.purpose };
      const extra = { capability, provenance: provenance(`${source} · Purpose`, firstSentence(parsed.purpose)) };
      const existing = match([PURPOSE_FORM], title, parsed.purposeBinding, `${source} · Purpose`, undefined, (node) => node.data.capability === capability);
      if (existing) changed(existing, texts, extra); else fresh(goalForm, title, texts, extra);
      drafted.goals += 1;
    }

    let scenarios = 0;
    for (const requirement of parsed.requirements) {
      const where = `${source} · Requirement: ${requirement.title}`;
      // An empty section yields no draft, and is named rather than skipped in silence. A scenario
      // proves its requirement's rule, so with no rule drafted its scenarios have nothing to prove.
      if (!requirement.text) {
        warnings.push(`${capability}: ${where} has no text once its comments are removed, so no rule was drafted${requirement.scenarios.length ? `, nor an example for its ${requirement.scenarios.length} scenario${requirement.scenarios.length === 1 ? "" : "s"}` : ""}.`);
        continue;
      }
      const texts = { [ruleForm.headings[0].toLowerCase()]: requirement.text };
      const extra = { capability, provenance: provenance(where, firstSentence(requirement.text)) };
      const existing = match(BINDABLE_FORMS, requirement.title, requirement.binding, where);
      const rule = existing ? changed(existing, texts, extra) : fresh(ruleForm, requirement.title, texts, extra);
      drafted.rules += 1;

      for (const scenario of requirement.scenarios) {
        const at = `${where} / Scenario: ${scenario.title}`;
        // A scenario holding only a comment drafts no example (EX-01m3f1eax7v7xsq6zfsk087v74).
        if (!scenario.given.length && !scenario.when.length && !scenario.then.length) {
          warnings.push(`${capability}: ${at} has no text once its comments are removed, so no example was drafted.`);
          continue;
        }
        const stepTexts = { given: steps(scenario.given), when: steps(scenario.when), then: steps(scenario.then) };
        const quote = firstSentence(scenario.when[0] ?? scenario.given[0] ?? scenario.then[0] ?? "");
        // By title, an example matches only among the ones already proving this rule: a same-titled
        // example elsewhere is another case. A binding matches wherever it points.
        const same = match([SCENARIO_FORM], scenario.title, scenario.binding, at, (node) => Boolean(existing) && referencesIn(node.data.subjects).includes(rule.id));
        if (same) changed(same, stepTexts, { provenance: provenance(at, quote), subjects: [...new Set([...referencesIn(same.data.subjects), rule.id])] });
        else fresh(exampleForm, scenario.title, stepTexts, { subjects: [rule.id], provenance: provenance(at, quote) });
        drafted.examples += 1;
        scenarios += 1;
      }
    }
    capabilities.push({ capability, file: source, requirements: parsed.requirements.length, scenarios, purpose: Boolean(parsed.purpose) });
  }

  const archiveRoot = changesPath(root, ARCHIVE_DIRECTORY);
  const archived = existsSync(archiveRoot)
    ? readdirSync(archiveRoot).filter((entry) => statSync(join(archiveRoot, entry)).isDirectory()).sort().map((entry) => relative(root, join(archiveRoot, entry)).split(sep).join("/"))
    : [];

  const reference = (draft: Draft): NodeRef => ({ id: draft.id, title: String(draft.data.title ?? draft.id), form: draft.form.id, path: relative(root, draft.path).split(sep).join("/") });
  const added = drafts.filter((draft) => !draft.existing).map(reference);
  const modified = drafts.filter((draft) => draft.existing).map(reference);

  const next = [
    `Run the plan-change skill on ${name}: it derives the actors, use cases, entities and state machines from proposal.md and the narrative, asking where neither says, and answers the sections marked not derivable.`,
    `Then 'kotta plan ${name}' measures the delta, and the human decides it at the gate ('kotta approve', then 'kotta archive').`,
  ];

  const proposal = renderProposal({ name, capabilities, archived, drafted, added: added.length, modified, warnings, source: relative(root, specsRoot).split(sep).join("/") });
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, "proposal.md"), proposal);
  for (const draft of drafts) {
    mkdirSync(join(modelDirectory, draft.form.directory), { recursive: true });
    writeFileSync(draft.path, renderMarkdown(draft.data, draft.body));
  }

  return {
    ok: true,
    command: "import openspec",
    data: {
      change: name,
      directory: relative(root, directory).split(sep).join("/"),
      proposal: relative(root, join(directory, "proposal.md")).split(sep).join("/"),
      capabilities,
      archived,
      drafted,
      added,
      modified,
      decidedBy: "agent-decided",
      notDerived: [...NOT_DERIVED],
      warnings,
      next,
    },
  };
}

function renderProposal(input: { name: string; capabilities: ImportedCapability[]; archived: string[]; drafted: ImportResult["data"]["drafted"]; added: number; modified: NodeRef[]; warnings: string[]; source: string }): string {
  const { capabilities, drafted } = input;
  const requirements = capabilities.reduce((sum, item) => sum + item.requirements, 0);
  const scenarios = capabilities.reduce((sum, item) => sum + item.scenarios, 0);
  const lines = [
    `# Import the OpenSpec narrative into the technical model`,
    "",
    "## Why",
    "",
    `The project's narrative specification under \`${input.source}/\` is taken into the technical model through the planning phase, so that every node says whether its content was stated or inferred, and who decided it. The narrative is read, not changed.`,
    "",
    "## What",
    "",
    `- Source: ${capabilities.length} capabilities, ${requirements} requirements, ${scenarios} scenarios in \`${input.source}/\`.`,
    `- Drafted by \`kotta import openspec\` into \`model/\`: ${drafted.rules} business rules (one per requirement), ${drafted.examples} examples (one per scenario, each proving its requirement's rule), ${drafted.goals} goals (one per capability Purpose). Every draft is \`level: stated\`, \`decided_by: agent-decided\`, its source naming the requirement it came from.`,
    `- ${input.modified.length ? `${input.modified.length} of them change an accepted node under its own id instead of duplicating it (bound by \`<!-- kotta: ID -->\` or by the same title).` : "No accepted node was matched; every draft is new."} ${input.added} drafts are new nodes.`,
    "- Copied, not written: the requirement text is the rule, the scenario steps are the example, the Purpose is the goal's outcome. Every section the narrative has no text for — a rule's rationale and scope, a goal's context, baseline and measure, an example's precondition where the scenario states none — is left empty with a note, for the planning phase to ask about.",
    "- Not drafted: actors, use cases, entities and state machines. The narrative describes them only in passing; the planning phase derives them, and asks where it cannot.",
    "",
    "## Capabilities",
    "",
    "| Capability | Requirements | Scenarios | Purpose |",
    "| --- | ---: | ---: | --- |",
    ...capabilities.map((item) => `| \`${item.capability}\` | ${item.requirements} | ${item.scenarios} | ${item.purpose ? "yes" : "none"} |`),
    "",
  ];
  if (input.archived.length) {
    lines.push("## History", "", `${input.archived.length} archived changes record why the narrative says what it says. They are not imported; the planning phase reads them for the rationale a rule's text does not carry:`, "");
    for (const path of input.archived) lines.push(`- \`${path}/\``);
    lines.push("");
  }
  if (input.warnings.length) {
    lines.push("## Matching notes", "");
    for (const warning of input.warnings) lines.push(`- ${warning}`);
    lines.push("");
  }
  lines.push(
    "## Next",
    "",
    `1. The \`plan-change\` skill: derive actors, use cases, entities and state machines from this proposal and the narrative; answer the sections marked not derivable from the sources, or ask.`,
    `2. \`kotta plan ${input.name}\`, then the one human gate.`,
    "",
  );
  return lines.join("\n");
}

export function formatImport(result: ImportResult): string {
  const { data } = result;
  const requirements = data.capabilities.reduce((sum, item) => sum + item.requirements, 0);
  const scenarios = data.capabilities.reduce((sum, item) => sum + item.scenarios, 0);
  const lines = [
    `Imported ${data.capabilities.length} capabilities (${requirements} requirements, ${scenarios} scenarios) into the change ${data.change}: ${data.drafted.rules} rule, ${data.drafted.examples} example and ${data.drafted.goals} goal drafts under ${data.directory}/model/, all ${data.decidedBy}.`,
    `${data.added.length} new, ${data.modified.length} changing an accepted node under its own id. Proposal: ${data.proposal}.${data.archived.length ? ` ${data.archived.length} archived changes are named there as history, not imported.` : ""}`,
    `Not drafted: ${data.notDerived.join(", ")} — the planning phase derives them. The narrative was only read.`,
  ];
  for (const warning of data.warnings) lines.push(`Note: ${warning}`);
  lines.push(...data.next, "Nothing was committed.");
  return lines.join("\n");
}
