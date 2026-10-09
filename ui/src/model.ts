/* ══ The model behind the diagrams ═════════════════════
   Pure derivations from the workspace payload: provenance, capability groups, and the Mermaid
   source of each diagram. Nothing here touches the DOM, so every rule is testable as data. The
   four diagram views read the standard form ids (actor, goal, use-case, user-story, entity,
   state-machine); a project's own form still appears in the specification list. */

import { goalPositions, journeys as journeysOf, onJourney, structureGaps, type StructureGap, type StructureNode } from "../../src/spec/structure.js";

/* ── Types ───────────────────────────────────────────── */
export const PROVENANCE_LEVELS = ["stated", "partly-inferred", "inferred"] as const;
export type ProvenanceLevel = typeof PROVENANCE_LEVELS[number];
export const PROVENANCE_DECIDERS = ["human", "agent-proposed-human-approved", "agent-decided"] as const;
export type ProvenanceDecider = typeof PROVENANCE_DECIDERS[number];

/** Where a node came from and who settled it, as its frontmatter records it. */
export type Provenance = {
  level?: ProvenanceLevel; decided_by?: ProvenanceDecider;
  sources: string[]; quote?: string; inferred?: string;
};

/** One accepted specification node, as its form declares it. */
export type SpecNode = {
  id: string; form: string; title: string; path: string; accepted: string[]; sections: Record<string, string>;
  /** The edges this node answers, by the field its form names them in. */
  edges?: Record<string, string[]>;
  provenance?: Provenance;
  /** The optional capability path the diagrams group by. */
  capability?: string;
  /** A requirement that holds for the whole product. */
  overall?: boolean;
  /** A use case's goal level: summary, user-goal or subfunction. */
  level?: string;
  /** Inside an open change: what the change does to this node. Absent in the accepted view. */
  mark?: ChangeMark;
  /** For a changed node, its accepted sections — what the change replaces. */
  before?: Record<string, string>;
  /** Inside an open change: the node's file is not committed as it is on disk. */
  uncommitted?: boolean;
};

export type ChangeMark = "added" | "changed" | "removed";

/* ── Provenance ──────────────────────────────────────── */
/* Plain words for every mark (QA-01m4ghr8bn64wazxnap80vhvhe): never a field's raw name or value. */
export const LEVEL_LABEL: Record<ProvenanceLevel, string> = {
  stated: "said in a source", "partly-inferred": "partly filled in", inferred: "filled in by the agent",
};
export const LEVEL_WORD: Record<string, string> = { summary: "journey", "user-goal": "user goal", subfunction: "part of a step" };
export const DECIDER_LABEL: Record<ProvenanceDecider, string> = {
  human: "you said it", "agent-proposed-human-approved": "agent proposed, you approved", "agent-decided": "the agent decided",
};

/** The review list: what the agent settled on its own. */
export function agentDecided(node: SpecNode): boolean {
  return node.provenance?.decided_by === "agent-decided";
}

export type ProvenanceCounts = {
  levels: Record<ProvenanceLevel, number>; deciders: Record<ProvenanceDecider, number>; unmarked: number;
};
export function provenanceCounts(nodes: SpecNode[]): ProvenanceCounts {
  const levels = { stated: 0, "partly-inferred": 0, inferred: 0 } as Record<ProvenanceLevel, number>;
  const deciders = { human: 0, "agent-proposed-human-approved": 0, "agent-decided": 0 } as Record<ProvenanceDecider, number>;
  let unmarked = 0;
  for (const node of nodes) {
    if (!node.provenance) { unmarked += 1; continue; }
    if (node.provenance.level) levels[node.provenance.level] += 1;
    if (node.provenance.decided_by) deciders[node.provenance.decided_by] += 1;
  }
  return { levels, deciders, unmarked };
}

/** A source is `<file> · <requirement or section>`, or `<file>.md#<section>`; the section is optional. */
export function parseSource(source: string): { file: string; section: string | null; narrative: boolean } {
  const [file, ...rest] = source.split(/\s+·\s+/);
  const anchor = rest.length ? null : /^([^#\s]+\.md)#(.+)$/i.exec(file.trim());
  const section = (anchor ? anchor[2] : rest.join(" · ")).trim() || null;
  const trimmed = anchor ? anchor[1] : file.trim();
  // Only a change folder's narrative is fetched — Kotta's own, or OpenSpec's where older provenance cites it;
  // any other file is shown as the text it is.
  const narrative = /^(?:\.kotta|openspec)\/changes\/(?:[^/]+\/)+[^/]+\.md$/i.test(trimmed) && !trimmed.split("/").some((part) => part === ".." || part === ".");
  return { file: trimmed, section, narrative };
}

/**
 * The part of a Markdown file a source cites: the first heading whose text contains the section
 * name, down to the next heading of the same or a higher level. Null when no heading matches.
 */
export function narrativeSection(content: string, section: string | null): string | null {
  if (!section) return null;
  const wanted = section.toLowerCase().trim();
  const lines = content.split(/\r?\n/);
  let fenced = false;
  let start = -1, depth = 0;
  for (let index = 0; index < lines.length; index += 1) {
    if (/^\s*```/.test(lines[index])) fenced = !fenced;
    if (fenced) continue;
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(lines[index]);
    if (!heading) continue;
    if (start >= 0 && heading[1].length <= depth) return lines.slice(start, index).join("\n").trim();
    if (start < 0 && heading[2].toLowerCase().includes(wanted)) { start = index; depth = heading[1].length; }
  }
  return start >= 0 ? lines.slice(start).join("\n").trim() : null;
}

/* ── Mermaid ─────────────────────────────────────────── */
/**
 * A node label Mermaid reads as text and nothing else: every character its grammar gives a meaning
 * inside a label is written as an entity code, and the whole is quoted.
 */
export function mermaidLabel(text: string): string {
  const codes: Record<string, string> = {
    "#": "#35;", "\"": "#quot;", "(": "#40;", ")": "#41;", "[": "#91;", "]": "#93;",
    "{": "#123;", "}": "#125;", "<": "#lt;", ">": "#gt;", "|": "#124;", "`": "#96;", "$": "#36;",
  };
  return `"${text.replace(/[\r\n]+/g, " ").replace(/[#"()[\]{}<>|`$]/g, (char) => codes[char])}"`;
}

/** Stroke colours for the three levels, resolved from the board's tokens where a page exists. */
export type Palette = { stated: string; partly: string; inferred: string; muted: string };
export const DEFAULT_PALETTE: Palette = { stated: "#201e1d", partly: "#a35f00", inferred: "#ae1800", muted: "#9b9797" };

const LEVEL_CLASS: Record<ProvenanceLevel, string> = { stated: "stated", "partly-inferred": "partly", inferred: "inferred" };

function classDefs(palette: Palette): string[] {
  return [
    `  classDef stated stroke:${palette.stated},stroke-width:2px`,
    `  classDef partly stroke:${palette.partly},stroke-width:2px,stroke-dasharray:6 4`,
    `  classDef inferred stroke:${palette.inferred},stroke-width:2px,stroke-dasharray:6 4`,
    `  classDef dimmed opacity:0.35`,
  ];
}

/** `class` lines for the nodes that carry a level, and the dimming of what a filter leaves out. */
function classLines(entries: Array<{ short: string; node: SpecNode }>, dim: (node: SpecNode) => boolean): string[] {
  const lines: string[] = [];
  for (const level of PROVENANCE_LEVELS) {
    const shorts = entries.filter(({ node }) => node.provenance?.level === level).map(({ short }) => short);
    if (shorts.length) lines.push(`  class ${shorts.join(",")} ${LEVEL_CLASS[level]}`);
  }
  const dimmed = entries.filter(({ node }) => dim(node)).map(({ short }) => short);
  if (dimmed.length) lines.push(`  class ${dimmed.join(",")} dimmed`);
  return lines;
}

/** A drawn diagram: its Mermaid source, and the short ids it uses mapped back to the nodes. */
export type Diagram = { source: string; nodes: Map<string, string> };
export type DiagramOptions = { palette?: Palette; dim?: (node: SpecNode) => boolean };

/** Capability groups in a stable order; one unnamed group when no node carries one. */
export function byCapability(nodes: SpecNode[]): Array<{ capability: string | null; nodes: SpecNode[] }> {
  if (!nodes.some((node) => node.capability)) return [{ capability: null, nodes }];
  const names = [...new Set(nodes.map((node) => node.capability ?? ""))].sort((a, b) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)));
  return names.map((name) => ({ capability: name || null, nodes: nodes.filter((node) => (node.capability ?? "") === name) }));
}
export const NO_CAPABILITY = "no capability";

/**
 * The use-case diagram in UML notation where UML has one (BR-01m4gg8wd62m9h75yczmmzphs7): goals,
 * which UML does not draw, stand apart on the left, joined to the use cases that serve them by dotted
 * lines; the use cases sit inside the system boundary; actors stand outside it, joined by plain
 * lines; «include» and «extend» are dotted links with their label. Mermaid has no UML shapes, so a
 * use case is a rounded node and an actor a labelled node.
 */
export function useCaseDiagram(spec: SpecNode[], options: DiagramOptions = {}): Diagram {
  const palette = options.palette ?? DEFAULT_PALETTE;
  const dim = options.dim ?? (() => false);
  const actors = spec.filter((node) => node.form === "actor");
  const cases = spec.filter((node) => node.form === "use-case");
  const goals = spec.filter((node) => node.form === "goal");
  const short = new Map<string, string>();
  actors.forEach((node, index) => short.set(node.id, `A${index}`));
  cases.forEach((node, index) => short.set(node.id, `U${index}`));
  goals.forEach((node, index) => short.set(node.id, `G${index}`));

  const lines = ["flowchart LR"];
  lines.push(`  subgraph goals[${mermaidLabel("Goals")}]`, "    direction TB");
  for (const node of goals) lines.push(`    ${short.get(node.id)}{{${mermaidLabel(node.title)}}}`);
  lines.push("  end");
  lines.push(`  subgraph system[${mermaidLabel("System")}]`, "    direction TB");
  for (const node of cases) lines.push(`    ${short.get(node.id)}([${mermaidLabel(node.title)}])`);
  lines.push("  end");
  for (const node of actors) lines.push(`  ${short.get(node.id)}[${mermaidLabel(`actor: ${node.title}`)}]`);
  const known = new Set(spec.map((node) => node.id));
  const caseIds = new Set(cases.map((node) => node.id));
  for (const node of cases) {
    for (const goal of node.edges?.goal ?? []) if (short.has(goal) && goals.some((candidate) => candidate.id === goal)) lines.push(`  ${short.get(goal)} -.- ${short.get(node.id)}`);
    for (const actor of node.edges?.actor ?? []) if (known.has(actor) && actors.some((candidate) => candidate.id === actor)) lines.push(`  ${short.get(node.id)} --- ${short.get(actor)}`);
    for (const included of node.edges?.includes ?? []) if (caseIds.has(included)) lines.push(`  ${short.get(node.id)} -.->|${mermaidLabel("«include»")}| ${short.get(included)}`);
    for (const extended of node.edges?.extends ?? []) if (caseIds.has(extended)) lines.push(`  ${short.get(node.id)} -.->|${mermaidLabel("«extend»")}| ${short.get(extended)}`);
  }
  const entries = [...goals, ...cases, ...actors].map((node) => ({ short: short.get(node.id)!, node }));
  lines.push(...classDefs(palette), ...classLines(entries, dim));
  return { source: lines.join("\n"), nodes: new Map(entries.map(({ short: s, node }) => [s, node.id])) };
}

/* ── Stories ─────────────────────────────────────────── */
/** User stories in one column per actor, in actor order; a story without an actor has its own column. */
export function storyMap(spec: SpecNode[]): Array<{ actor: SpecNode | null; stories: SpecNode[] }> {
  const stories = spec.filter((node) => node.form === "user-story");
  const actors = spec.filter((node) => node.form === "actor");
  const columns = actors
    .map((actor) => ({ actor: actor as SpecNode | null, stories: stories.filter((story) => story.edges?.actor?.includes(actor.id)) }))
    .filter((column) => column.stories.length);
  const known = new Set(actors.map((actor) => actor.id));
  const orphans = stories.filter((story) => !(story.edges?.actor ?? []).some((id) => known.has(id)));
  if (orphans.length) columns.push({ actor: null, stories: orphans });
  return columns;
}

/* ── Entities ────────────────────────────────────────── */
/** The stem a title is recognised by in prose: lower case, a plural `s` dropped. */
export function titleStem(title: string): string {
  const lower = title.toLowerCase().trim();
  return lower.length > 3 && lower.endsWith("s") && !lower.endsWith("ss") ? lower.slice(0, -1) : lower;
}
const ENTITY_PROSE = ["meaning", "attributes", "invariants"];

/**
 * Which entity's prose names which other entity. Read from the text, not from typed edges: an edge
 * means "A's Meaning, Attributes or Invariants mention B's title", nothing stronger.
 */
export function entityMentions(spec: SpecNode[]): Array<{ from: string; to: string }> {
  const entities = spec.filter((node) => node.form === "entity");
  const found: Array<{ from: string; to: string }> = [];
  for (const source of entities) {
    const prose = ENTITY_PROSE.map((key) => source.sections[key] ?? "").join("\n").toLowerCase();
    for (const target of entities) {
      if (target.id === source.id) continue;
      const stem = titleStem(target.title);
      if (stem.length < 3) continue;
      const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}`, "u").test(prose)) found.push({ from: source.id, to: target.id });
    }
  }
  return found;
}

export function entityDiagram(spec: SpecNode[], options: DiagramOptions = {}): Diagram {
  const palette = options.palette ?? DEFAULT_PALETTE;
  const dim = options.dim ?? (() => false);
  const entities = spec.filter((node) => node.form === "entity");
  const short = new Map(entities.map((node, index) => [node.id, `E${index}`]));
  const lines = ["flowchart LR"];
  const groups = byCapability(entities);
  groups.forEach((group, index) => {
    const grouped = group.capability !== null || groups.length > 1;
    if (grouped) lines.push(`  subgraph cap${index}[${mermaidLabel(group.capability ?? NO_CAPABILITY)}]`);
    for (const node of group.nodes) lines.push(`${grouped ? "    " : "  "}${short.get(node.id)}[${mermaidLabel(node.title)}]`);
    if (grouped) lines.push("  end");
  });
  for (const { from, to } of entityMentions(spec)) lines.push(`  ${short.get(from)} --> ${short.get(to)}`);
  const entries = entities.map((node) => ({ short: short.get(node.id)!, node }));
  lines.push(...classDefs(palette), ...classLines(entries, dim));
  return { source: lines.join("\n"), nodes: new Map(entries.map(({ short: s, node }) => [s, node.id])) };
}

/* ── State machines ──────────────────────────────────── */
export type Transition = { from: string | null; to: string; why: string };
export type StateMachine = {
  /** False when no line of the Transitions section reads as a transition. */
  drawable: boolean;
  transitions: Transition[];
  terminal: string[];
  /** Lines of the Transitions section that were not read as a transition, kept as written. */
  prose: string[];
  /**
   * Transition ends the States section does not name, when it names the others: a condition the
   * prose wrote where a state would stand (`last member done → done`), drawn as such.
   */
  conditions: string[];
};

const ARROW = /\s*(?:→|->|⟶)\s*/;
const START = /^\(?(?:none|nincs|start|\[\*\])\)?$/i;
const MAX_STATE = 48;

function stateNames(part: string): string[] {
  return part.split(/\s*[|/]\s*/).map((name) => name.replace(/^[`*_]+|[`*_]+$/g, "").trim()).filter(Boolean);
}

/** One `A → B: why` line, bold or plain, listed or not; null when the line is prose. */
export function parseTransitionLine(raw: string): Transition[] | null {
  const line = raw.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, "").trim();
  const shape = /^\*\*(.+?)\*\*\s*(?::\s*(.*))?$/.exec(line) ?? /^([^:]+?)(?::\s*(.*))?$/.exec(line);
  if (!shape) return null;
  const pair = shape[1].split(ARROW);
  if (pair.length !== 2) return null;
  const why = (shape[2] ?? "").trim();
  // A reason that carries its own arrow is a paragraph describing several transitions at once.
  if (ARROW.test(why)) return null;
  const sources = stateNames(pair[0]);
  const targets = stateNames(pair[1]);
  if (!sources.length || !targets.length) return null;
  if ([...sources, ...targets].some((name) => name.length > MAX_STATE || /[.!?]\s/.test(name))) return null;
  return sources.flatMap((from) => targets.map((to) => ({ from: START.test(from) ? null : from, to, why })));
}

/**
 * Where a paragraph holds several transitions one after another, the boundary before each: the end
 * of a sentence, followed by `A → B:`. A paragraph that only mentions an arrow mid-sentence is not
 * cut, and stays prose. Keeps BR-01m414skt0pcqb668azj7czkeq.
 */
const INLINE_TRANSITION = /(?<=[.!?;])\s+(?=[^.!?:;\n]{1,48}?\s*(?:→|->|⟶)\s*[^.!?:;\n]{1,48}?:\s)/;

export function parseStateMachine(sections: Record<string, string>): StateMachine {
  const transitions: Transition[] = [];
  const prose: string[] = [];
  for (const line of (sections.transitions ?? "").split(/\r?\n/).flatMap((line) => line.split(INLINE_TRANSITION))) {
    if (!line.trim()) continue;
    const read = parseTransitionLine(line);
    if (read) transitions.push(...read); else prose.push(line.trim());
  }
  const names = [...new Set(transitions.flatMap(({ from, to }) => (from ? [from, to] : [to])))];
  // A terminal state is one a sentence calls terminal (or végállapot), outside the transition lines.
  const sentences = [sections.states ?? "", ...prose].join("\n").split(/(?<=[.;!?])\s+|\n/).filter((sentence) => /terminal|végállapot/i.test(sentence));
  const terminal = names.filter((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, "iu");
    return sentences.some((sentence) => pattern.test(sentence));
  });
  const named = (name: string) => new RegExp(`(?:^|[^\\p{L}\\p{N}])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^\\p{L}\\p{N}])`, "iu").test(sections.states ?? "");
  const listed = names.filter(named);
  const conditions = listed.length >= 2 ? names.filter((name) => !listed.includes(name)) : [];
  return { drawable: transitions.length > 0, transitions, terminal, prose, conditions };
}

/** A transition label Mermaid's state grammar keeps as text: no separators, bounded length. */
function stateLabel(why: string): string {
  const flat = why.replace(/[\r\n]+/g, " ").replace(/[:;#{}<>"`]/g, " ").replace(/\s+/g, " ").trim();
  return flat.length > 60 ? `${flat.slice(0, 59).trimEnd()}…` : flat;
}

export function stateDiagram(machine: StateMachine): string {
  const names = [...new Set(machine.transitions.flatMap(({ from, to }) => (from ? [from, to] : [to])))];
  const short = new Map(names.map((name, index) => [name, `S${index}`]));
  const lines = ["stateDiagram-v2", "  direction LR"];
  for (const name of names) lines.push(`  state "${name.replace(/"/g, "'")}" as ${short.get(name)}`);
  for (const { from, to, why } of machine.transitions) {
    const label = stateLabel(why);
    lines.push(`  ${from ? short.get(from) : "[*]"} --> ${short.get(to)}${label ? ` : ${label}` : ""}`);
  }
  for (const name of machine.terminal) lines.push(`  ${short.get(name)} --> [*]`);
  return lines.join("\n");
}

/* ══ Graphs for the drawn renderer ══════════════════════
   The same three readings as the Mermaid sources above, as plain nodes and edges: the React Flow
   renderer lays them out with ELK and draws every node as the board's own markup. */
export type FlowShape = "card" | "actor" | "use-case" | "goal" | "state" | "condition" | "start" | "end";
export type FlowNode = {
  id: string; label: string; shape: FlowShape;
  /** A small second line under the label: the kind, the provenance level, or both. */
  caption?: string;
  level?: ProvenanceLevel; dimmed?: boolean; terminal?: boolean;
  /** The capability group the node sits in, by group id. */
  group?: string;
  /** The specification node a click opens. */
  opens?: string;
};
export type FlowEdge = {
  from: string; to: string; dashed?: boolean; both?: boolean; label?: string; title?: string;
  /** A UML association: a plain line, no arrowhead. */
  plain?: boolean;
  /** A dotted line with no arrowhead: a goal joined to the use cases that serve it. */
  dotted?: boolean;
  /** An open arrowhead, as UML draws «include» and «extend». */
  open?: boolean;
};
export type FlowGraph = { direction: "DOWN" | "RIGHT"; nodes: FlowNode[]; edges: FlowEdge[]; groups: Array<{ id: string; label: string; boundary?: boolean }> };

function caption(...parts: Array<string | undefined>): string | undefined {
  const kept = parts.filter(Boolean);
  return kept.length ? kept.join(" · ") : undefined;
}
function flowNode(node: SpecNode, shape: FlowShape, dim: (node: SpecNode) => boolean, kind?: string): FlowNode {
  const level = node.provenance?.level;
  return { id: node.id, label: node.title, shape, caption: caption(kind, level && LEVEL_LABEL[level]), level, dimmed: dim(node), opens: node.id };
}
/** Capability groups as flow groups; none when no node carries a capability. */
function flowGroups(nodes: SpecNode[], prefix: string): { groups: FlowGraph["groups"]; groupOf: Map<string, string> } {
  const split = byCapability(nodes);
  const groupOf = new Map<string, string>();
  if (split.length === 1 && split[0].capability === null) return { groups: [], groupOf };
  const groups = split.map((group, index) => {
    const id = `${prefix}:${index}`;
    for (const node of group.nodes) groupOf.set(node.id, id);
    return { id, label: group.capability ?? NO_CAPABILITY };
  });
  return { groups, groupOf };
}

/** Entities top-down; two entities that mention each other share one two-headed edge. */
export function entityGraph(spec: SpecNode[], options: DiagramOptions = {}): FlowGraph {
  const dim = options.dim ?? (() => false);
  const entities = spec.filter((node) => node.form === "entity");
  const { groups, groupOf } = flowGroups(entities, "cap");
  const mentions = entityMentions(spec);
  const pairs = new Set(mentions.map(({ from, to }) => `${from}\u0000${to}`));
  const edges: FlowEdge[] = [];
  for (const { from, to } of mentions) {
    const both = pairs.has(`${to}\u0000${from}`);
    if (both && from > to) continue;
    edges.push({ from, to, both });
  }
  return { direction: "DOWN", groups, edges, nodes: entities.map((node) => ({ ...flowNode(node, "card", dim), group: groupOf.get(node.id) })) };
}

/**
 * The use-case diagram for the drawn renderer, in UML notation (BR-01m4gg8wd62m9h75yczmmzphs7): goals
 * first, outside the boundary, dotted to the use cases that serve them; use cases as ellipses inside
 * the system boundary; actors as stick figures outside it, on plain association lines; «include» and
 * «extend» as dashed open arrows with their label.
 */
export function useCaseGraph(spec: SpecNode[], options: DiagramOptions = {}): FlowGraph {
  const dim = options.dim ?? (() => false);
  const actors = spec.filter((node) => node.form === "actor");
  const cases = spec.filter((node) => node.form === "use-case");
  const goals = spec.filter((node) => node.form === "goal");
  const actorIds = new Set(actors.map((node) => node.id));
  const goalIds = new Set(goals.map((node) => node.id));
  const caseIds = new Set(cases.map((node) => node.id));
  const edges: FlowEdge[] = [];
  for (const node of cases) {
    for (const goal of node.edges?.goal ?? []) if (goalIds.has(goal)) edges.push({ from: goal, to: node.id, dotted: true });
    for (const actor of node.edges?.actor ?? []) if (actorIds.has(actor)) edges.push({ from: node.id, to: actor, plain: true });
    for (const included of node.edges?.includes ?? []) if (caseIds.has(included)) edges.push({ from: node.id, to: included, dashed: true, open: true, label: "«include»" });
    for (const extended of node.edges?.extends ?? []) if (caseIds.has(extended)) edges.push({ from: node.id, to: extended, dashed: true, open: true, label: "«extend»" });
  }
  const groups = cases.length ? [{ id: "system", label: "System", boundary: true }] : [];
  return {
    direction: "RIGHT", groups, edges,
    nodes: [
      ...goals.map((node) => flowNode(node, "goal", dim, "goal")),
      ...cases.map((node) => ({ ...flowNode(node, "use-case", dim), group: "system" })),
      ...actors.map((node) => flowNode(node, "actor", dim, "actor")),
    ],
  };
}

const FLOW_LABEL = 40;
/** One machine's states top-down, each transition labelled with the start of its reason. */
export function stateGraph(machine: StateMachine): FlowGraph {
  const names = [...new Set(machine.transitions.flatMap(({ from, to }) => (from ? [from, to] : [to])))];
  const id = (name: string) => `state:${name}`;
  const terminal = new Set(machine.terminal);
  const conditions = new Set(machine.conditions);
  const nodes: FlowNode[] = names.map((name) => conditions.has(name)
    ? { id: id(name), label: `when ${name}`, shape: "condition" }
    : { id: id(name), label: name, shape: "state", terminal: terminal.has(name) });
  const edges: FlowEdge[] = machine.transitions.map(({ from, to, why }) => {
    const flat = why.replace(/\s+/g, " ").trim();
    const label = flat.length > FLOW_LABEL ? `${flat.slice(0, FLOW_LABEL - 1).trimEnd()}…` : flat;
    return { from: from ? id(from) : "start", to: id(to), label: label || undefined, title: flat || undefined };
  });
  if (machine.transitions.some(({ from }) => from === null)) nodes.unshift({ id: "start", label: "start", shape: "start" });
  if (terminal.size) {
    nodes.push({ id: "end", label: "end", shape: "end" });
    for (const name of machine.terminal) edges.push({ from: id(name), to: "end" });
  }
  return { direction: "DOWN", groups: [], nodes, edges };
}

/* ── The use-case hierarchy ────────────────────────────
   The tree the board draws (BR-01m4ee23zg0wx6hyvpkyj9qcr1): overall requirements on top, each actor
   with its use cases, included and extending use cases nested, and under each use case the
   requirements it refines (BR-01m4ee234nxva765r3jq5vmw01). Dropping a use case marks what falls out
   and what stays (BR-01m4ee23h66jzr4wzd0a3grf02); the same rule the CLI's `spec impact` applies. */
export const REQUIREMENT_FORMS = ["business-rule", "interface", "quality-attribute"];
const refinedIn = (node: SpecNode) => [...(node.edges?.refines ?? []), ...(node.edges?.interfaces ?? [])];

export type Hierarchy = {
  overall: SpecNode[];
  actors: Array<{ actor: SpecNode | null; roots: string[] }>;
  /** A use case's children: what it includes, then what extends it. */
  children: Map<string, Array<{ id: string; how: "includes" | "extends" }>>;
  /** For each use case, the requirements it refines. */
  refines: Map<string, SpecNode[]>;
  /** For each requirement, the use cases that refine it. */
  refiners: Map<string, string[]>;
  /** Requirements nothing refines and that are not overall. */
  unplaced: SpecNode[];
  /** Examples per node, from the example form's subjects. */
  examples: Map<string, number>;
};

export function readHierarchy(spec: SpecNode[], capability: string | null = null): Hierarchy {
  const byId = new Map(spec.map((node) => [node.id, node]));
  const useCases = spec.filter((node) => node.form === "use-case");
  const requirements = spec.filter((node) => REQUIREMENT_FORMS.includes(node.form) && (!capability || node.capability === capability));
  const refiners = new Map<string, string[]>();
  const refines = new Map<string, SpecNode[]>();
  for (const useCase of useCases) {
    const list = refinedIn(useCase).map((id) => byId.get(id)).filter((node): node is SpecNode => Boolean(node) && requirements.includes(node!));
    refines.set(useCase.id, list.sort((a, b) => a.title.localeCompare(b.title)));
    for (const node of list) refiners.set(node.id, [...(refiners.get(node.id) ?? []), useCase.id]);
  }
  const children = new Map<string, Array<{ id: string; how: "includes" | "extends" }>>();
  const nested = new Set<string>();
  for (const useCase of useCases) {
    for (const id of useCase.edges?.includes ?? []) if (byId.get(id)?.form === "use-case") {
      children.set(useCase.id, [...(children.get(useCase.id) ?? []), { id, how: "includes" }]); nested.add(id);
    }
    for (const id of useCase.edges?.extends ?? []) if (byId.get(id)?.form === "use-case") {
      children.set(id, [...(children.get(id) ?? []), { id: useCase.id, how: "extends" }]); nested.add(useCase.id);
    }
  }
  const roots = useCases.filter((node) => !nested.has(node.id)).sort((a, b) => a.title.localeCompare(b.title));
  const actorIds = [...new Set(roots.flatMap((node) => node.edges?.actor ?? []))];
  const actors = actorIds.map((id) => ({ actor: byId.get(id) ?? null, roots: roots.filter((node) => (node.edges?.actor ?? []).includes(id)).map((node) => node.id) }))
    .sort((a, b) => (a.actor?.title ?? "").localeCompare(b.actor?.title ?? ""));
  const noActor = roots.filter((node) => !(node.edges?.actor ?? []).length).map((node) => node.id);
  if (noActor.length) actors.push({ actor: null, roots: noActor });
  const examples = new Map<string, number>();
  for (const node of spec.filter((candidate) => candidate.form === "example")) {
    for (const id of node.edges?.subjects ?? []) examples.set(id, (examples.get(id) ?? 0) + 1);
  }
  return {
    overall: requirements.filter((node) => node.overall).sort((a, b) => a.title.localeCompare(b.title)),
    actors, children, refines, refiners,
    unplaced: requirements.filter((node) => !node.overall && !(refiners.get(node.id) ?? []).length).sort((a, b) => a.title.localeCompare(b.title)),
    examples,
  };
}

/** What goes with a dropped use case: it, what it includes, what extends these — unless included from outside. */
export function dropBranch(spec: SpecNode[], useCase: string): Set<string> {
  const useCases = spec.filter((node) => node.form === "use-case");
  const branch = new Set([useCase]);
  for (let grew = true; grew;) {
    grew = false;
    for (const node of useCases) {
      if (branch.has(node.id)) continue;
      const included = [...branch].some((id) => (spec.find((candidate) => candidate.id === id)?.edges?.includes ?? []).includes(node.id));
      const extending = (node.edges?.extends ?? []).some((id) => branch.has(id));
      if (included || extending) { branch.add(node.id); grew = true; }
    }
  }
  for (let shrank = true; shrank;) {
    shrank = false;
    for (const id of [...branch]) {
      if (id === useCase) continue;
      if (useCases.some((node) => !branch.has(node.id) && (node.edges?.includes ?? []).includes(id))) { branch.delete(id); shrank = true; }
    }
  }
  return branch;
}

export function dropMarks(spec: SpecNode[], hierarchy: Hierarchy, useCase: string | null): Map<string, "out" | "stays"> {
  const marks = new Map<string, "out" | "stays">();
  if (!useCase) return marks;
  const branch = dropBranch(spec, useCase);
  for (const [id, by] of hierarchy.refiners) {
    if (!by.some((candidate) => branch.has(candidate))) continue;
    const node = spec.find((candidate) => candidate.id === id);
    marks.set(id, !node?.overall && by.every((candidate) => branch.has(candidate)) ? "out" : "stays");
  }
  return marks;
}


/* ── The goal tree ─────────────────────────────────────
   The tree from its purpose (BR-01m4ee23zg0wx6hyvpkyj9qcr1): the journeys above it
   (BR-01m4ggqbayfx5szaspsvpc7apt), each goal that serves no other at the root with the goals serving
   it nested, goals in the order the journeys reach them, the goals no journey reaches apart, and the
   structure's gaps named above everything (BR-01m4gg8w19p98hafy5m1q4g452). The journeys and the gaps
   are computed by the same module the CLI's `validate` uses. */

export function structureNodes(spec: SpecNode[]): StructureNode[] {
  return spec.map((node) => ({ id: node.id, form: node.form, title: node.title, ...(node.level ? { level: node.level } : {}), edges: node.edges ?? {} }));
}

export type GoalBranch = { goal: SpecNode; useCases: string[]; subGoals: GoalBranch[] };
export type GoalTree = {
  journeys: Array<{ summary: SpecNode; steps: Array<{ node: SpecNode; journey: boolean }> }>;
  /** Root goals some journey reaches, in journey order. */
  roots: GoalBranch[];
  /** Root goals no journey reaches, by title, keeping their own nesting. */
  apart: GoalBranch[];
  /** True when some journey is told; otherwise `apart` is simply every root goal. */
  told: boolean;
  /** Use cases that serve no goal the tree holds. */
  homeless: string[];
  gaps: StructureGap[];
  /** Use case positions along the journeys, for ordering under a goal. */
  position: Map<string, number>;
};

export function readGoalTree(spec: SpecNode[]): GoalTree {
  const byId = new Map(spec.map((node) => [node.id, node]));
  const structure = structureNodes(spec);
  const goals = spec.filter((node) => node.form === "goal");
  const goalIds = new Set(goals.map((node) => node.id));
  const useCases = spec.filter((node) => node.form === "use-case");
  const positions = goalPositions(structure);
  const told = journeysOf(structure);
  const position = new Map<string, number>();
  let index = 0;
  for (const journey of told) for (const step of journey.steps) {
    index += 1;
    if (!position.has(step)) position.set(step, index);
    for (const variant of useCases.filter((node) => (node.edges?.extends ?? []).includes(step))) if (!position.has(variant.id)) position.set(variant.id, index + 0.5);
  }
  const order = (left: SpecNode, right: SpecNode, at: Map<string, number>) =>
    (at.get(left.id) ?? Infinity) - (at.get(right.id) ?? Infinity) || left.title.localeCompare(right.title);
  const branch = (goal: SpecNode, seen: Set<string>): GoalBranch => {
    const path = new Set(seen).add(goal.id);
    const serving = useCases.filter((node) => (node.edges?.goal ?? []).includes(goal.id)).sort((l, r) => order(l, r, position)).map((node) => node.id);
    const subGoals = goals.filter((node) => (node.edges?.serves ?? []).includes(goal.id) && !path.has(node.id)).sort((l, r) => order(l, r, positions)).map((node) => branch(node, path));
    return { goal, useCases: serving, subGoals };
  };
  const rootGoals = goals.filter((goal) => !(goal.edges?.serves ?? []).some((id) => goalIds.has(id)));
  const reached = (goal: SpecNode): boolean => positions.has(goal.id) || goals.some((node) => (node.edges?.serves ?? []).includes(goal.id) && reached(node));
  const roots = rootGoals.filter((goal) => told.length > 0 && reached(goal)).sort((l, r) => order(l, r, positions)).map((goal) => branch(goal, new Set()));
  const apart = rootGoals.filter((goal) => !(told.length > 0 && reached(goal))).sort((l, r) => l.title.localeCompare(r.title)).map((goal) => branch(goal, new Set()));
  return {
    journeys: told.map((journey) => ({
      summary: byId.get(journey.summary)!,
      steps: journey.steps.map((id) => byId.get(id)!).filter(Boolean).map((node) => ({ node, journey: (node.level ?? "user-goal") === "summary" })),
    })),
    roots, apart, told: told.length > 0,
    homeless: useCases.filter((node) => !(node.edges?.goal ?? []).some((id) => goalIds.has(id))).sort((l, r) => l.title.localeCompare(r.title)).map((node) => node.id),
    gaps: structureGaps(structure),
    position,
  };
}

/** Examples per node, as nodes, from the example form's subjects. */
export function examplesOf(spec: SpecNode[]): Map<string, SpecNode[]> {
  const examples = new Map<string, SpecNode[]>();
  for (const node of spec.filter((candidate) => candidate.form === "example")) {
    for (const id of node.edges?.subjects ?? []) examples.set(id, [...(examples.get(id) ?? []), node]);
  }
  return examples;
}

/** Goals left with no use case when a branch of use cases is dropped. */
export function goalsLeftBare(spec: SpecNode[], branch: Set<string>): Set<string> {
  const bare = new Set<string>();
  for (const goal of spec.filter((node) => node.form === "goal")) {
    const serving = spec.filter((node) => node.form === "use-case" && (node.edges?.goal ?? []).includes(goal.id));
    if (serving.length && serving.every((node) => branch.has(node.id))) bare.add(goal.id);
  }
  return bare;
}

export { onJourney };
export type { StructureGap };

/* ── A node's place, and its relations in words ─────────
   Where a node stands in the tree (purpose › goal › use case), and every relation named by a phrase
   that reads in its own direction from the node shown (BR-01m4gg8w74b37208tgnb4w6cvj). An edge of a
   project's own form keeps its field's name. */
const OUTGOING_PHRASE: Record<string, string> = {
  serves: "Serves", goal: "For goal", actor: "Performed by", includes: "Includes", extends: "Extends",
  refines: "Relies on", interfaces: "Uses interface", subjects: "Proves", measured_by: "Measured by",
};
const INCOMING_PHRASE: Record<string, string> = {
  serves: "Served by", goal: "Pursued by", actor: "Performs", includes: "Included in", extends: "Extended by",
  refines: "Part of", interfaces: "Used by", subjects: "Proven by", measured_by: "Measures",
};
export function relationPhrase(field: string, direction: "out" | "in"): string {
  return (direction === "out" ? OUTGOING_PHRASE : INCOMING_PHRASE)[field] ?? field;
}

/** The chain from the purpose down to the node: its goals, then its use case, by first parent. */
export function placeOf(spec: SpecNode[], id: string): SpecNode[] {
  const byId = new Map(spec.map((node) => [node.id, node]));
  const node = byId.get(id);
  if (!node) return [];
  const goalChain = (goal: SpecNode, seen = new Set<string>()): SpecNode[] => {
    if (seen.has(goal.id)) return [];
    const wider = (goal.edges?.serves ?? []).map((other) => byId.get(other)).find((other): other is SpecNode => other?.form === "goal");
    return wider ? [...goalChain(wider, new Set(seen).add(goal.id)), goal] : [goal];
  };
  const useCaseChain = (useCase: SpecNode): SpecNode[] => {
    const goal = (useCase.edges?.goal ?? []).map((other) => byId.get(other)).find((other): other is SpecNode => other?.form === "goal");
    return [...(goal ? goalChain(goal) : []), useCase];
  };
  if (node.form === "goal") return goalChain(node).slice(0, -1);
  if (node.form === "use-case") return useCaseChain(node).slice(0, -1);
  const refiner = spec.find((other) => other.form === "use-case" && [...(other.edges?.refines ?? []), ...(other.edges?.interfaces ?? [])].includes(id));
  if (refiner) return useCaseChain(refiner);
  const subject = (node.edges?.subjects ?? []).map((other) => byId.get(other)).find(Boolean);
  if (subject) return [...placeOf(spec, subject.id), subject];
  return [];
}
