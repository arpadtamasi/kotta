import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { renderMarkdown } from "../core/markdown.js";
import { mintSpecId, specFilename } from "../core/identity.js";
import { slugify } from "../core/naming.js";
import { findRepositoryRoot, specPath } from "../filesystem/workspace.js";
import { readFormRegistry, type SpecForm } from "../spec/registry.js";
import { MODEL_DIRECTORY, resolveChange } from "../spec/change.js";
import { provenanceScaffold } from "../spec/provenance.js";

/**
 * `kotta spec new` — the one command that hands an author a node instead of asking them to type one.
 *
 * Identifiers are minted by Kotta, not written by hand, and an author asking for a node gets one
 * already carrying its id and its form's skeleton. Everything the scaffold contains comes from the
 * form's own registry entry — prefix, directory, required frontmatter, required headings, required
 * edges — so a project that registers its own form gets the same service with no change here.
 *
 * It writes a draft and stops. A shaped node becomes the agreement when it lands on the base branch
 * on a human yes, which is a different act; the parts the author has yet to answer are reported by
 * `kotta validate` as the form's own registered questions.
 */

export interface SpecNewData {
  id: string;
  form: string;
  title: string;
  path: string;
  /** Frontmatter fields the form requires that the scaffold left for the author to answer. */
  unanswered: string[];
  /** Body headings the scaffold laid out empty. */
  sections: string[];
  /** The sections of those that must state the obligation with SHALL or MUST. */
  normative: string[];
  /** The change whose model delta the node was drafted into; null for the accepted specification. */
  change: string | null;
}

export interface SpecNewResult {
  ok: true;
  command: "spec new";
  data: SpecNewData;
}

function scaffoldFrontmatter(form: SpecForm, id: string, title: string): { data: Record<string, unknown>; unanswered: string[] } {
  const data: Record<string, unknown> = {};
  const unanswered: string[] = [];
  const known: Record<string, unknown> = { id, form: form.id, title };
  for (const field of form.frontmatter) {
    if (field in known) { data[field] = known[field]; continue; }
    data[field] = null;
    unanswered.push(field);
  }
  for (const edge of form.edges) {
    if (edge.direction !== "outgoing") continue;
    for (const field of edge.fields) {
      if (field in data) continue;
      data[field] = [];
      unanswered.push(field);
    }
  }
  // Where the content came from travels with the node. A node in a change must answer it; an
  // accepted node may drop the block, but a present one is measured in full.
  data.provenance = provenanceScaffold();
  unanswered.push("provenance");
  return { data, unanswered };
}

const NORMATIVE_HINT = "<!-- State the obligation with SHALL or MUST, in English whatever the language around it: \"The system SHALL …\", „A rendszer SHALL …\". A change's node without one is refused. -->";

function scaffoldBody(form: SpecForm, title: string): string {
  const lines = [`# ${title}`, ""];
  const normative = new Set(form.normative.map((heading) => heading.toLowerCase()));
  for (const heading of form.headings) {
    // The obligation is written with its keyword from the first draft; the comment does not count as content.
    if (normative.has(heading.toLowerCase())) lines.push(`## ${heading}`, "", NORMATIVE_HINT, "", "");
    else lines.push(`## ${heading}`, "", "", "");
  }
  const outgoing = form.edges.filter((edge) => edge.direction === "outgoing" && edge.question);
  const incoming = form.edges.filter((edge) => edge.direction === "incoming" && edge.question);
  if (outgoing.length || incoming.length) {
    lines.push("## Open edges", "");
    for (const edge of outgoing) lines.push(`- ${edge.question} Answer in frontmatter '${edge.fields.join("' or '")}'.`);
    for (const edge of incoming) lines.push(`- ${edge.question} Answered by a ${edge.source_forms.join(" or ")} node naming this one.`);
    lines.push("", "Delete this section once they are answered.", "");
  }
  return lines.join("\n");
}

export function newSpecNode(options: { form: string; title: string; into?: string }, repositoryRoot?: string): SpecNewResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const { forms } = readFormRegistry(root);
  if (!forms.length) throw new Error(`No form registry is installed at ${specPath(root, "forms")}. Run 'kotta init' or 'kotta migrate' first.`);

  const requested = options.form.trim();
  const form = forms.find((candidate) => candidate.id === requested);
  if (!form) {
    throw new Error(`No form '${requested}' is registered. This workspace registers: ${forms.map((candidate) => candidate.id).join(", ")}.`);
  }
  const title = options.title.trim();
  if (!title) throw new Error("A node title is required; it is what names the node everywhere a human reads it.");

  // Into a change, the node is part of that change's model delta; the accepted specification is untouched.
  const change = options.into === undefined ? null : options.into.trim();
  const id = mintSpecId(form.prefix);
  const directory = change === null ? specPath(root, form.directory) : join(resolveChange(root, change), MODEL_DIRECTORY, form.directory);
  const path = join(directory, specFilename(id, slugify(title)));
  if (existsSync(path)) throw new Error(`${path} already exists. Nothing was written; a scaffold never overwrites a node.`);

  const { data, unanswered } = scaffoldFrontmatter(form, id, title);
  mkdirSync(directory, { recursive: true });
  writeFileSync(path, renderMarkdown(data, scaffoldBody(form, title)));

  return {
    ok: true,
    command: "spec new",
    data: { id, form: form.id, title, path: relative(root, path), unanswered, sections: [...form.headings], normative: [...form.normative], change },
  };
}

export function formatSpecNew(result: SpecNewResult): string {
  const { data } = result;
  const lines = [`Drafted ${data.title} (${data.id}) as a ${data.form} at ${data.path}${data.change ? `, in the model delta of ${data.change}` : ""}.`];
  if (data.sections.length) lines.push(`Sections to fill: ${data.sections.join(", ")}.`);
  if (data.unanswered.length) lines.push(`Frontmatter to answer: ${data.unanswered.join(", ")}.`);
  if (data.normative.length) lines.push(`State the obligation in ${data.normative.join(" or ")} with SHALL or MUST ("The system SHALL …", also in Hungarian text).`);
  lines.push(
    data.change
      ? `This is a draft in the change, and nothing was committed: 'kotta plan ${data.change}' measures the delta, and it lands through the gate ('kotta approve', then 'kotta archive').`
      : "This is a draft, and nothing was committed: a shaped node becomes the agreement when it lands on the base branch on a human yes.",
    "Until it is filled in, 'kotta validate' names each unanswered part with its form's own question.",
  );
  return lines.join("\n");
}
