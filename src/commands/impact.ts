import { displayId } from "../core/identity.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { USE_CASE_FORM, dropImpact } from "../spec/hierarchy.js";
import { readFormRegistry, readSpecNodes, type SpecNode } from "../spec/registry.js";

/**
 * `kotta spec impact <use case>` — what falls out of the accepted specification if a use case is
 * dropped, and what stays because another use case still relies on it (BR-01m4ee23h66jzr4wzd0a3grf02,
 * EX-01m4ee25302x5t30r2h67hcxk8). Reads only.
 */

interface Named { id: string; title: string; form: string }

export interface ImpactResult {
  ok: true;
  command: "spec impact";
  data: { useCase: Named; branch: Named[]; out: Named[]; stays: Named[] };
}

const named = (node: SpecNode): Named => ({ id: node.id, title: String(node.data.title ?? node.id), form: node.form });

export function specImpact(useCase: string, repositoryRoot?: string): ImpactResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const { forms } = readFormRegistry(root);
  const { nodes } = readSpecNodes(root, forms);
  const wanted = useCase.trim();
  const useCases = nodes.filter((node) => node.form === USE_CASE_FORM);
  const match = useCases.find((node) => node.id === wanted || node.id.endsWith(wanted)) ?? useCases.find((node) => String(node.data.title ?? "").toLowerCase() === wanted.toLowerCase());
  if (!match) throw new Error(`No accepted use case is named '${wanted}'. Give its id, the last characters of it, or its exact title.`);
  const impact = dropImpact(nodes, match.id);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const list = (ids: string[]) => ids.map((id) => named(byId.get(id)!)).sort((left, right) => left.title.localeCompare(right.title));
  return { ok: true, command: "spec impact", data: { useCase: named(match), branch: list(impact.branch.filter((id) => id !== match.id)), out: list(impact.out), stays: list(impact.stays) } };
}

export function formatImpact(result: ImpactResult): string {
  const { data } = result;
  const line = (node: Named) => `  ${node.title} (${node.form}, ${displayId(node.id)})`;
  const lines = [`If ${data.useCase.title} is dropped:`];
  if (data.branch.length) lines.push(`it takes with it the use cases it includes or that extend it:`, ...data.branch.map(line));
  lines.push(data.out.length ? `${data.out.length} requirement${data.out.length === 1 ? " falls" : "s fall"} out — no other use case relies on ${data.out.length === 1 ? "it" : "them"}:` : "No requirement falls out.");
  lines.push(...data.out.map(line));
  if (data.stays.length) lines.push(`${data.stays.length} stay${data.stays.length === 1 ? "s" : ""}, because another use case relies on ${data.stays.length === 1 ? "it" : "them"} too, or ${data.stays.length === 1 ? "it is" : "they are"} overall:`, ...data.stays.map(line));
  return lines.join("\n");
}
