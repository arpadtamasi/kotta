/**
 * The model's structure above the requirements: the goals a goal serves (BR-01m4gg8vnq75d4rkw1e0x1b734),
 * the journeys summary use cases tell (BR-01m4ggqbayfx5szaspsvpc7apt), and the gaps in both
 * (BR-01m4gg8w19p98hafy5m1q4g452, BR-01m4ggqbgh250jcn09w3t5sxqq). Pure functions over a plain shape,
 * with no Node import, so the CLI's `validate` and the board compute the same structure from one source.
 */

export interface StructureNode {
  id: string;
  form: string;
  title: string;
  /** A use case's Cockburn level; none counts as `user-goal`. */
  level?: string;
  edges: Record<string, string[]>;
}

export interface Journey {
  /** The summary use case that tells the journey. */
  summary: string;
  /** Its steps, in the order its `includes` list names them. */
  steps: string[];
}

export type StructureGap =
  | { kind: "root-goals"; goals: string[] }
  | { kind: "no-journey"; actor: string | null; useCases: string[] }
  | { kind: "off-journey"; useCase: string; goal: string }
  | { kind: "goal-unserved"; goal: string };

const byTitle = (byId: Map<string, StructureNode>) => (left: string, right: string) =>
  (byId.get(left)?.title ?? left).localeCompare(byId.get(right)?.title ?? right) || left.localeCompare(right);

export function levelOf(node: StructureNode): string {
  return node.level || "user-goal";
}

function useCases(nodes: StructureNode[]): StructureNode[] {
  return nodes.filter((node) => node.form === "use-case");
}

/** Goals that serve no other goal, by title. */
export function rootGoals(nodes: StructureNode[]): string[] {
  const goals = nodes.filter((node) => node.form === "goal");
  const ids = new Set(goals.map((node) => node.id));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return goals.filter((goal) => !(goal.edges.serves ?? []).some((id) => ids.has(id))).map((goal) => goal.id).sort(byTitle(byId));
}

/** Every journey, in title order of its summary. */
export function journeys(nodes: StructureNode[]): Journey[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return useCases(nodes)
    .filter((node) => levelOf(node) === "summary")
    .map((node) => ({ summary: node.id, steps: (node.edges.includes ?? []).filter((id) => byId.get(id)?.form === "use-case") }))
    .sort((left, right) => byTitle(byId)(left.summary, right.summary));
}

/**
 * The use cases on some journey: every step, directly or through a step that is itself included or a
 * journey, and every use case that extends one of them, as a variant of that step.
 */
export function onJourney(nodes: StructureNode[]): Set<string> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const on = new Set<string>();
  const visit = (id: string) => {
    if (on.has(id) || byId.get(id)?.form !== "use-case") return;
    on.add(id);
    for (const next of byId.get(id)!.edges.includes ?? []) visit(next);
  };
  for (const journey of journeys(nodes)) for (const step of journey.steps) visit(step);
  for (let grew = true; grew;) {
    grew = false;
    for (const node of useCases(nodes)) {
      if (on.has(node.id) || !(node.edges.extends ?? []).some((id) => on.has(id))) continue;
      visit(node.id);
      grew = true;
    }
  }
  return on;
}

/**
 * Position of each goal along the journeys: the first step, in the first journey in title order, that
 * serves it. A goal served only by a variant takes its varied step's position, just after it.
 */
export function goalPositions(nodes: StructureNode[]): Map<string, number> {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const positions = new Map<string, number>();
  let index = 0;
  const place = (useCase: string, at: number) => {
    for (const goal of byId.get(useCase)?.edges.goal ?? []) if (!positions.has(goal)) positions.set(goal, at);
  };
  const variants = (step: string) => useCases(nodes).filter((node) => (node.edges.extends ?? []).includes(step)).map((node) => node.id).sort(byTitle(byId));
  for (const journey of journeys(nodes)) {
    for (const step of journey.steps) {
      index += 1;
      place(step, index);
      for (const variant of variants(step)) place(variant, index + 0.5);
    }
  }
  // A goal that serves a placed goal sits where the earliest goal it serves sits, when nothing placed it.
  for (let grew = true; grew;) {
    grew = false;
    for (const goal of nodes.filter((node) => node.form === "goal")) {
      if (positions.has(goal.id)) continue;
      const served = nodes.filter((node) => node.form === "goal" && (node.edges.serves ?? []).includes(goal.id) && positions.has(node.id)).map((node) => positions.get(node.id)!);
      if (served.length) { positions.set(goal.id, Math.min(...served)); grew = true; }
    }
  }
  return positions;
}

/** The gaps in the structure, in a stable order. A use case with no level counts as `user-goal`. */
export function structureGaps(nodes: StructureNode[]): StructureGap[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const gaps: StructureGap[] = [];
  const roots = rootGoals(nodes);
  if (roots.length > 1) gaps.push({ kind: "root-goals", goals: roots });
  const userGoal = useCases(nodes).filter((node) => levelOf(node) === "user-goal");
  const summaries = useCases(nodes).filter((node) => levelOf(node) === "summary");
  const on = onJourney(nodes);
  const actors = [...new Set(userGoal.flatMap((node) => (node.edges.actor ?? []).length ? node.edges.actor : [null as unknown as string]))];
  for (const actor of actors.sort((left, right) => byTitle(byId)(left ?? "", right ?? ""))) {
    const own = userGoal.filter((node) => actor === null ? !(node.edges.actor ?? []).length : (node.edges.actor ?? []).includes(actor));
    if (own.length < 2) continue;
    const told = own.some((node) => on.has(node.id)) || summaries.some((summary) => actor !== null && (summary.edges.actor ?? []).includes(actor));
    if (!told) gaps.push({ kind: "no-journey", actor, useCases: own.map((node) => node.id).sort(byTitle(byId)) });
  }
  const journeyGoals = new Set([...on].flatMap((id) => byId.get(id)?.edges.goal ?? []));
  for (const node of userGoal.filter((candidate) => !on.has(candidate.id)).sort((left, right) => byTitle(byId)(left.id, right.id))) {
    const goal = (node.edges.goal ?? []).find((id) => journeyGoals.has(id));
    if (goal) gaps.push({ kind: "off-journey", useCase: node.id, goal });
  }
  const served = new Set(useCases(nodes).flatMap((node) => node.edges.goal ?? []));
  for (const goal of nodes.filter((node) => node.form === "goal").map((node) => node.id).sort(byTitle(byId))) {
    // A goal another goal serves is served through it; only a goal at the bottom of the tree needs a use case.
    const hasSubGoal = nodes.some((node) => node.form === "goal" && (node.edges.serves ?? []).includes(goal));
    if (!served.has(goal) && !hasSubGoal) gaps.push({ kind: "goal-unserved", goal });
  }
  return gaps;
}

/** One sentence per gap: what is missing, and what would close it, in a change. */
export function describeGap(gap: StructureGap, title: (id: string) => string): string {
  switch (gap.kind) {
    case "root-goals":
      return `${gap.goals.length} goals serve no other goal (${gap.goals.map(title).join(", ")}). Name the purpose they serve under 'serves', in a change.`;
    case "no-journey":
      return `${gap.actor ? title(gap.actor) : "Use cases with no actor"} — ${gap.useCases.length} use cases and no journey. Add a summary use case that includes the steps in order, in a change.`;
    case "off-journey":
      return `${title(gap.useCase)} is on no journey, though its goal ${title(gap.goal)} is served by a journey step. Include it in the journey, or mark it as a subfunction, in a change.`;
    case "goal-unserved":
      return `${title(gap.goal)} — no use case serves it. Add the use case that pursues it, or let a narrower goal serve it, in a change.`;
  }
}
