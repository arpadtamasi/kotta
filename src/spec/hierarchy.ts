import { referencesIn, type SpecNode } from "./registry.js";

/**
 * The use-case hierarchy, read from the shipped forms' vocabulary: a use case `includes` and
 * `extends` other use cases (BR-01m4ee22ypyq06n7vkk4ycnz9v) and `refines` the requirements it relies
 * on (BR-01m4ee234nxva765r3jq5vmw01); a requirement may be `overall` (BR-01m4ee23baq19gd87ez4m9zxdw).
 * A use case also names the interfaces it uses under `interfaces`, which places an interface the same
 * way. Pure functions over a node set, shared by the CLI and the board.
 */

export const USE_CASE_FORM = "use-case";
export const REQUIREMENT_FORMS = ["business-rule", "interface", "quality-attribute"] as const;
const REFINING_FIELDS = ["refines", "interfaces"];

export interface DropImpact {
  /** The use case dropped, and every use case that goes with it. */
  branch: string[];
  /** Requirements every refining use case of which is in the branch. */
  out: string[];
  /** Requirements the branch refines that a use case outside it also refines. */
  stays: string[];
}

export function isRequirement(node: SpecNode): boolean {
  return (REQUIREMENT_FORMS as readonly string[]).includes(node.form);
}

export function isOverall(node: SpecNode): boolean {
  return node.data.overall === true;
}

/** For each requirement id, the use cases that refine it. */
export function refiningUseCases(nodes: SpecNode[]): Map<string, string[]> {
  const refiners = new Map<string, string[]>();
  for (const node of nodes.filter((candidate) => candidate.form === USE_CASE_FORM)) {
    for (const field of REFINING_FIELDS) {
      for (const id of referencesIn(node.data[field])) {
        const list = refiners.get(id) ?? [];
        if (!list.includes(node.id)) refiners.set(id, [...list, node.id]);
      }
    }
  }
  return refiners;
}

/**
 * What goes when a use case is dropped: it, the use cases it includes, and the use cases that extend
 * any of these — except a use case that something outside the branch also includes.
 */
export function dropBranch(nodes: SpecNode[], useCase: string): string[] {
  const useCases = nodes.filter((node) => node.form === USE_CASE_FORM);
  const includes = new Map(useCases.map((node) => [node.id, referencesIn(node.data.includes)]));
  const extendsOf = new Map(useCases.map((node) => [node.id, referencesIn(node.data.extends)]));
  const branch = new Set([useCase]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const node of useCases) {
      if (branch.has(node.id)) continue;
      const includedByBranch = [...branch].some((id) => (includes.get(id) ?? []).includes(node.id));
      const extendsBranch = (extendsOf.get(node.id) ?? []).some((id) => branch.has(id));
      if (includedByBranch || extendsBranch) { branch.add(node.id); grew = true; }
    }
  }
  // An included use case something outside also includes stays, and so does what hangs on it.
  let shrank = true;
  while (shrank) {
    shrank = false;
    for (const id of [...branch]) {
      if (id === useCase) continue;
      const keptBy = useCases.some((node) => !branch.has(node.id) && (includes.get(node.id) ?? []).includes(id));
      if (keptBy) { branch.delete(id); shrank = true; }
    }
  }
  return [...branch];
}

/** Dropping a use case: which requirements fall out with it, and which stay (BR-01m4ee23h66jzr4wzd0a3grf02). */
export function dropImpact(nodes: SpecNode[], useCase: string): DropImpact {
  const branch = new Set(dropBranch(nodes, useCase));
  const refiners = refiningUseCases(nodes);
  const out: string[] = [];
  const stays: string[] = [];
  for (const node of nodes.filter(isRequirement)) {
    const by = refiners.get(node.id) ?? [];
    if (!by.some((id) => branch.has(id))) continue;
    if (!isOverall(node) && by.every((id) => branch.has(id))) out.push(node.id);
    else stays.push(node.id);
  }
  return { branch: [...branch], out, stays };
}
