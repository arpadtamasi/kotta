import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { renderMarkdown } from "../core/markdown.js";
import { mintSpecId, specFilename } from "../core/identity.js";
import { findRepositoryRoot, specPath } from "../filesystem/workspace.js";
import { controlPlaneRoot } from "../git/control-plane.js";
import { readFormRegistry, type SpecForm } from "../spec/registry.js";
import { slugify } from "./task.js";

/**
 * `kotta spec new` — the one command that hands an author a node instead of asking them to type one.
 *
 * The accepted use case is explicit: identifiers are minted by Kotta, not written by hand, and an
 * author asking for a node gets one already carrying its id and its form's skeleton
 * (UC-01m0f0wn89ny7vx515ke3ksnra). Everything the scaffold contains comes from the form's own
 * registry entry — prefix, directory, required frontmatter, required headings, required edges — so
 * a project that registers its own form gets the same service with no change here.
 *
 * It writes a draft and stops. A shaped node becomes the agreement when it lands on the base branch
 * on a human yes, which is a different act; and the parts the author has yet to answer are reported
 * by `kotta validate` as the form's own registered questions, which is where they belong.
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
}

export interface SpecNewResult {
  ok: true;
  command: "spec new";
  data: SpecNewData;
}

/** The frontmatter a node of this form must carry, with the three the scaffold can answer filled in. */
function scaffoldFrontmatter(form: SpecForm, id: string, title: string): { data: Record<string, unknown>; unanswered: string[] } {
  const data: Record<string, unknown> = {};
  const unanswered: string[] = [];
  const known: Record<string, unknown> = { id, form: form.id, title };
  for (const field of form.frontmatter) {
    if (field in known) { data[field] = known[field]; continue; }
    data[field] = null;
    unanswered.push(field);
  }
  // An outgoing edge is answered in a frontmatter field, so the field is laid out empty with the
  // form's own question beside it — the author reads what to answer, not which key to invent.
  for (const edge of form.edges) {
    if (edge.direction !== "outgoing") continue;
    for (const field of edge.fields) {
      if (field in data) continue;
      data[field] = [];
      unanswered.push(field);
    }
  }
  return { data, unanswered };
}

/** One `## Heading` per required section, each carrying what the form says the section is for. */
function scaffoldBody(form: SpecForm, title: string): string {
  const lines = [`# ${title}`, ""];
  for (const heading of form.headings) lines.push(`## ${heading}`, "", "", "");
  // An outgoing edge is answered here, in this node's own frontmatter; an incoming one is answered
  // by another node pointing at this one. Saying which is which is the difference between a
  // question an author can act on and a list they have to decode.
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

export function newSpecNode(options: { form: string; title: string }, repositoryRoot?: string): SpecNewResult {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const { forms } = readFormRegistry(root);
  if (!forms.length) throw new Error(`No form registry is installed at ${specPath(root, "forms")}. Run 'kotta init' or 'kotta migrate' first.`);

  const requested = options.form.trim();
  const form = forms.find((candidate) => candidate.id === requested);
  // Describing the registry on demand is the same promise as minting from it: an author who names a
  // form that is not there learns what is, rather than being told only that they were wrong.
  if (!form) {
    throw new Error(`No form '${requested}' is registered. This workspace registers: ${forms.map((candidate) => candidate.id).join(", ")}.`);
  }
  const title = options.title.trim();
  if (!title) throw new Error("A node title is required; it is what names the node everywhere a human reads it.");

  const id = mintSpecId(form.prefix);
  const directory = specPath(root, form.directory);
  const path = join(directory, specFilename(id, slugify(title)));
  if (existsSync(path)) throw new Error(`${path} already exists. Nothing was written; a scaffold never overwrites a node.`);

  const { data, unanswered } = scaffoldFrontmatter(form, id, title);
  mkdirSync(directory, { recursive: true });
  writeFileSync(path, renderMarkdown(data, scaffoldBody(form, title)));

  return {
    ok: true,
    command: "spec new",
    data: { id, form: form.id, title, path: relative(root, path), unanswered, sections: [...form.headings] },
  };
}

export function formatSpecNew(result: SpecNewResult): string {
  const { data } = result;
  const lines = [`Drafted ${data.title} (${data.id}) as a ${data.form} at ${data.path}.`];
  if (data.sections.length) lines.push(`Sections to fill: ${data.sections.join(", ")}.`);
  if (data.unanswered.length) lines.push(`Frontmatter to answer: ${data.unanswered.join(", ")}.`);
  lines.push(
    "This is a draft, and nothing was committed: a shaped node becomes the agreement when it lands on the base branch on a human yes.",
    "Until it is filled in, 'kotta validate' names each unanswered part with its form's own question.",
  );
  return lines.join("\n");
}
