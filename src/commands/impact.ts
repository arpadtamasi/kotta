import { displayId } from "../core/identity.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { USE_CASE_FORM, dropImpact } from "../spec/hierarchy.js";
import { FORMS_DIRECTORY, MODEL_DIRECTORY, readChangeModel, resolveChange } from "../spec/change.js";
import { readFormRegistry, readSpecNodes, type SpecNode } from "../spec/registry.js";
import { join } from "node:path";

/**
 * `kotta spec impact <use case>` — what falls out of the accepted specification if a use case is
 * dropped, and what stays because another use case still relies on it (BR-01m4ee23h66jzr4wzd0a3grf02,
 * EX-01m4ee25302x5t30r2h67hcxk8). Reads only. With a change, the change's model laid over the accepted
 * one, as planning sees it (EX-01m4ej5pndmcaajrrvz6vwhc7r).
 */

interface Named { id: string; title: string; form: string }

export interface ImpactResult {
  ok: true;
  command: "spec impact";
  data: { useCase: Named; change: string | null; branch: Named[]; out: Named[]; stays: Named[] };
}

const named = (node: SpecNode): Named => ({ id: node.id, title: String(node.data.title ?? node.id), form: node.form });

export function specImpact(useCase: string, repositoryRoot?: string, change?: string): ImpactResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const { forms } = change ? readFormRegistry(root, join(resolveChange(root, change), MODEL_DIRECTORY, FORMS_DIRECTORY)) : readFormRegistry(root);
  const accepted = readSpecNodes(root, forms).nodes;
  let nodes = accepted;
  if (change) {
    const model = readChangeModel(root, change, forms);
    const replaced = new Set([...model.nodes.map((node) => node.id), ...model.removed]);
    nodes = [...accepted.filter((node) => !replaced.has(node.id)), ...model.nodes];
  }
  const wanted = useCase.trim();
  const useCases = nodes.filter((node) => node.form === USE_CASE_FORM);
  const match = useCases.find((node) => node.id === wanted || node.id.endsWith(wanted)) ?? useCases.find((node) => String(node.data.title ?? "").toLowerCase() === wanted.toLowerCase());
  if (!match) throw new Error(change
    ? `No use case of the accepted specification or of change '${change}' is named '${wanted}'. Give its id, the last characters of it, or its exact title.`
    : `No accepted use case is named '${wanted}'. Give its id, the last characters of it, or its exact title; for a use case still in a change, add --change <name>.`);
  const impact = dropImpact(nodes, match.id);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const list = (ids: string[]) => ids.map((id) => named(byId.get(id)!)).sort((left, right) => left.title.localeCompare(right.title));
  return { ok: true, command: "spec impact", data: { useCase: named(match), change: change ?? null, branch: list(impact.branch.filter((id) => id !== match.id)), out: list(impact.out), stays: list(impact.stays) } };
}

export function formatImpact(result: ImpactResult): string {
  const { data } = result;
  const line = (node: Named) => `  ${node.title} (${node.form}, ${displayId(node.id)})`;
  const lines = [`If ${data.useCase.title} is dropped${data.change ? ` (measured on change ${data.change} over the accepted specification)` : ""}:`];
  if (data.branch.length) lines.push(`it takes with it the use cases it includes or that extend it:`, ...data.branch.map(line));
  lines.push(data.out.length ? `${data.out.length} requirement${data.out.length === 1 ? " falls" : "s fall"} out — no other use case relies on ${data.out.length === 1 ? "it" : "them"}:` : "No requirement falls out.");
  lines.push(...data.out.map(line));
  if (data.stays.length) lines.push(`${data.stays.length} stay${data.stays.length === 1 ? "s" : ""}, because another use case relies on ${data.stays.length === 1 ? "it" : "them"} too, or ${data.stays.length === 1 ? "it is" : "they are"} overall:`, ...data.stays.map(line));
  return lines.join("\n");
}
