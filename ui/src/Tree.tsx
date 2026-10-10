import { useMemo, useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { LEVEL_WORD, dropBranch, dropMarks, examplesOf, goalsLeftBare, readGoalTree, readHierarchy, type GoalBranch, type SpecNode } from "./model";
import { describeGap, type StructureGap } from "../../src/spec/structure.js";
import { ChangeHeader, type Board } from "./App";

/* ══ The hierarchy ═════════════════════════════════════
   The specification as a tree that starts from its purpose (BR-01m4ee23zg0wx6hyvpkyj9qcr1): the
   journeys above it (BR-01m4ggqbayfx5szaspsvpc7apt), overall requirements, then the goals in the
   order the journeys reach them, each with the use cases that serve it, their requirements and the
   examples that prove those; the goals no journey reaches apart. The gaps in the structure are named
   in the header (BR-01m4gg8w19p98hafy5m1q4g452). The arrangement by actor stays one switch away. One
   use case can be marked as dropped — a simulation that changes nothing (QA-01m4ghr8bn64wazxnap80vhvhe). */

export type Arrangement = "goal" | "actor";

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const anchor = (id: string) => `tree-${id}`;

function RequirementRow({ node, examples, mark, alsoBy, onOpen }: {
  node: SpecNode; examples: SpecNode[]; mark?: "out" | "stays"; alsoBy: SpecNode[]; onOpen: (id: string) => void;
}) {
  return <div className={`tree-req ${mark ? `tree-req--${mark}` : ""}`}>
    <button type="button" className="tree-req__title" data-tree-item onClick={() => onOpen(node.id)}>{node.title}</button>
    {mark && <span className={`tree-mark tree-mark--${mark}`}>{mark === "out" ? "falls out" : "stays"}</span>}
    {alsoBy.length > 0 && <span className="tree-req__also">also part of {alsoBy.map((useCase) => useCase.title).join(", ")}</span>}
    {examples.length > 0 && <details className="tree-examples">
      <summary data-tree-item>{plural(examples.length, "example")} prove{examples.length === 1 ? "s" : ""} it</summary>
      <ul>{examples.map((example) => <li key={example.id}><button type="button" className="tree-example" data-tree-item onClick={() => onOpen(example.id)}>{example.title}</button></li>)}</ul>
    </details>}
    {examples.length === 0 && <span className="tree-req__meta">no example proves it</span>}
  </div>;
}

/** A row is reachable when every branch around it is open, or it is the head of the closed one. */
function reachable(item: HTMLElement): boolean {
  for (let details = item.parentElement?.closest("details"); details; details = details.parentElement?.closest("details")) {
    const head = details.querySelector(":scope > summary");
    if (!details.open && !(head && (head === item || head.contains(item)))) return false;
  }
  return true;
}

/** Arrow keys walk the tree: up and down between rows, right opens a branch, left closes it. */
function walk(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(event.key)) return;
  const active = document.activeElement as HTMLElement | null;
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-tree-item]")].filter(reachable);
  const current = active ? items.findIndex((item) => item === active || item.contains(active)) : -1;
  if (current < 0) return;
  const head = items[current].tagName === "SUMMARY" ? items[current].parentElement as HTMLDetailsElement : null;
  if (event.key === "ArrowDown" && items[current + 1]) { event.preventDefault(); items[current + 1].focus(); }
  if (event.key === "ArrowUp" && items[current - 1]) { event.preventDefault(); items[current - 1].focus(); }
  if (event.key === "ArrowRight" && head && !head.open) { event.preventDefault(); head.open = true; }
  if (event.key === "ArrowLeft") {
    const around = head?.open ? head : items[current].closest("details");
    if (around?.open) { event.preventDefault(); around.open = false; (around.querySelector(":scope > summary") as HTMLElement | null)?.focus(); }
  }
}

export type Expansion = { open: boolean; round: number };

export function TreeView({ board, onOpen, arrangement = "goal", onArrangement = () => {}, expansion: heldExpansion, onExpansion }: {
  board: Board; onOpen: (id: string) => void; arrangement?: Arrangement; onArrangement?: (arrangement: Arrangement) => void;
  /** Held by the page when given, so a view the reader returns to keeps its branches (QA-01m4ghr8h4345h3tt86nb28eqx). */
  expansion?: Expansion; onExpansion?: (expansion: Expansion) => void;
}) {
  const [dropped, setDropped] = useState<string | null>(null);
  const [capability, setCapability] = useState<string | null>(null);
  const [ownExpansion, setOwnExpansion] = useState<Expansion>({ open: false, round: 0 });
  const expansion = heldExpansion ?? ownExpansion;
  const setExpansion = (next: (current: Expansion) => Expansion) => (onExpansion ? onExpansion(next(expansion)) : setOwnExpansion(next));
  // The tree shows the model as it will be after the change: a node the change removes is not in it
  // (BR-01m4ee23zg0wx6hyvpkyj9qcr1, BR-01m40e522gtq49knhy51hr9e3d).
  const spec = useMemo(() => board.spec.filter((node) => node.mark !== "removed"), [board.spec]);
  const byId = useMemo(() => new Map(spec.map((node) => [node.id, node])), [spec]);
  const hierarchy = useMemo(() => readHierarchy(spec, capability), [spec, capability]);
  const tree = useMemo(() => readGoalTree(spec), [spec]);
  const examples = useMemo(() => examplesOf(spec), [spec]);
  const marks = useMemo(() => dropMarks(spec, hierarchy, dropped), [spec, hierarchy, dropped]);
  const branch = useMemo(() => (dropped ? dropBranch(spec, dropped) : new Set<string>()), [spec, dropped]);
  const bare = useMemo(() => goalsLeftBare(spec, branch), [spec, branch]);
  const capabilities = useMemo(() => [...new Set(spec.map((node) => node.capability).filter((value): value is string => Boolean(value)))].sort(), [spec]);
  const out = [...marks.values()].filter((mark) => mark === "out").length;
  const stays = [...marks.values()].filter((mark) => mark === "stays").length;
  const title = (id: string) => byId.get(id)?.title ?? id;

  // Each use case is drawn in full at its first place in reading order, and referred to everywhere
  // else; the set is filled while this render walks the tree top to bottom.
  const drawn = new Map<string, string>();

  /* Where the reader can be in two actions (QA-01m4gmdm6r7t4ajnxa3515ccvd): the outline at the top of
     the view, always one action away; a goal reached from it opens. */
  const goTo = (id: string) => {
    const target = document.getElementById(anchor(id));
    if (!target) return;
    for (let details = target.closest("details"); details; details = details.parentElement?.closest("details") ?? null) details.open = true;
    if (target instanceof HTMLDetailsElement) target.open = true;
    target.scrollIntoView?.({ block: "start" });
    (target.querySelector("summary, button") as HTMLElement | null)?.focus();
  };
  // A journey step opens its place in the tree where it is, without carrying the reader away.
  const openPlace = (id: string) => {
    const target = document.getElementById(anchor(id));
    if (!target) return;
    for (let details = target.closest("details"); details; details = details.parentElement?.closest("details") ?? null) details.open = true;
    if (target instanceof HTMLDetailsElement) target.open = true;
  };
  const useCases = useMemo(() => spec.filter((node) => node.form === "use-case").sort((left, right) => left.title.localeCompare(right.title)), [spec]);
  // Simulating a drop is one control at the top of the view, never one on every row.
  const dropControl = <div className="filters tree-drop-control">
    <label className="filters__label" htmlFor="tree-drop">simulate dropping</label>
    <select id="tree-drop" className="tree-drop-select" value={dropped ?? ""} onChange={(event) => setDropped(event.target.value || null)}>
      <option value="">— choose a use case —</option>
      {useCases.map((node) => <option key={node.id} value={node.id}>{node.title}</option>)}
    </select>
    {dropped && <button type="button" className="filter" onClick={() => setDropped(null)}>stop the simulation</button>}
  </div>;
  const fallingUnder = (entry: GoalBranch): Set<string> => new Set([
    ...entry.useCases.flatMap((id) => [id, ...(hierarchy.children.get(id) ?? []).map((child) => child.id)]).flatMap((id) => (hierarchy.refines.get(id) ?? []).map((node) => node.id)).filter((id) => marks.get(id) === "out"),
    ...entry.subGoals.flatMap((sub) => [...fallingUnder(sub)]),
  ]);
  const goalFalls = (entry: GoalBranch): number => fallingUnder(entry).size;

  const useCase = (id: string, depth: number, how: string | null, seen: Set<string>, place: string): ReactElement | null => {
    const node = byId.get(id);
    if (!node || seen.has(id)) return null;
    const first = drawn.get(id);
    if (first !== undefined) {
      return <div key={`${id}-${place}`} className="tree-ref">
        {how && <span className="tree-how">«{how}»</span>}
        <a className="tree-ref__link" data-tree-item href={`#${anchor(id)}`} onClick={(event) => { event.preventDefault(); goTo(id); }}>{node.title}</a>
        <span className="tree-req__meta">shown in full under {first}</span>
      </div>;
    }
    drawn.set(id, place);
    const path = new Set(seen).add(id);
    const requirements = hierarchy.refines.get(id) ?? [];
    const children = hierarchy.children.get(id) ?? [];
    const summary = (node.level ?? "user-goal") === "summary";
    const falls = branch.has(id);
    if (summary) {
      const steps = (node.edges?.includes ?? []).length;
      return <div key={`${id}-${place}`} id={anchor(id)} className={`tree-uc tree-uc--journey ${falls ? "is-out" : ""}`}>
        <button type="button" className="tree-uc__title" data-tree-item onClick={() => onOpen(id)}>{node.title}</button>
        <span className="tag tag-outline">journey · {plural(steps, "step")}</span>
        {falls && <span className="tree-mark tree-mark--out">falls out</span>}
      </div>;
    }
    return <details key={`${id}-${place}-${expansion.round}`} id={anchor(id)} className={`tree-uc ${falls ? "is-out" : ""}`} open={depth > 0 || expansion.open ? true : undefined}>
      <summary data-tree-item>
        {how && <span className="tree-how">«{how}»</span>}
        <button type="button" className="tree-uc__title" onClick={(event) => { event.preventDefault(); onOpen(id); }}>{node.title}</button>
        {node.level && node.level !== "user-goal" && <span className="tag tag-outline">{LEVEL_WORD[node.level] ?? node.level}</span>}
        <span className="tree-count">{plural(requirements.length, "requirement")}</span>
        {falls && <span className="tree-mark tree-mark--out">falls out</span>}
      </summary>
      <div className="tree-uc__body">
        {requirements.map((requirement) => <RequirementRow key={requirement.id} node={requirement} examples={examples.get(requirement.id) ?? []}
          mark={marks.get(requirement.id)} alsoBy={(hierarchy.refiners.get(requirement.id) ?? []).filter((other) => other !== id).map((other) => byId.get(other)!).filter(Boolean)} onOpen={onOpen} />)}
        {children.map((child) => useCase(child.id, depth + 1, child.how, path, place))}
      </div>
    </details>;
  };

  // Goals start closed with their count; a goal the simulation touches opens.
  const goal = (entry: GoalBranch, depth: number): ReactNode => {
    const falls = dropped ? goalFalls(entry) : 0;
    return <details key={`${entry.goal.id}-${depth}-${expansion.round}-${dropped ?? ""}`} id={anchor(entry.goal.id)} className={`tree-goal tree-goal--${Math.min(depth, 3)}`}
      open={expansion.open || falls > 0 || bare.has(entry.goal.id) ? true : undefined}>
      <summary className="tree-goal__head" data-tree-item>
        <button type="button" className="tree-goal__title" onClick={(event) => { event.preventDefault(); onOpen(entry.goal.id); }}>{entry.goal.title}</button>
        <span className="tree-count">{plural(entry.useCases.length, "use case")}{entry.subGoals.length ? ` · ${plural(entry.subGoals.length, "goal")} under it` : ""}</span>
        {falls > 0 && <span className="tree-mark tree-mark--out">{falls} would fall out</span>}
        {bare.has(entry.goal.id) && <span className="tree-mark tree-mark--out">left with no use case</span>}
      </summary>
      <div className="tree-goal__body">
        {entry.subGoals.map((sub) => goal(sub, depth + 1))}
        {entry.useCases.map((id) => useCase(id, 0, null, new Set(), entry.goal.title))}
      </div>
    </details>;
  };

  const outlineGoal = (entry: GoalBranch): ReactNode => {
    const falls = dropped ? goalFalls(entry) : 0;
    return <li key={entry.goal.id}>
      <button type="button" className="tree-outline__item" onClick={() => goTo(entry.goal.id)}>{entry.goal.title}</button>
      <span className="tree-count"> · {entry.useCases.length}{falls ? ` · ${falls} would fall out` : ""}</span>
      {entry.subGoals.length > 0 && <ul>{entry.subGoals.map(outlineGoal)}</ul>}
    </li>;
  };
  const toOutline = <a className="tree-to-outline" href="#tree-outline" onClick={(event) => { event.preventDefault(); const outline = document.getElementById("tree-outline"); outline?.scrollIntoView?.({ block: "start" }); (outline?.querySelector("button") as HTMLElement | null)?.focus(); }}>↑ outline</a>;

  const switcher = <div className="filters">
    <span className="filters__label">arrange by</span>
    <button type="button" className={`filter ${arrangement === "goal" ? "is-active" : ""}`} aria-pressed={arrangement === "goal"} onClick={() => onArrangement("goal")}>purpose and goals</button>
    <button type="button" className={`filter ${arrangement === "actor" ? "is-active" : ""}`} aria-pressed={arrangement === "actor"} onClick={() => onArrangement("actor")}>actor</button>
    <span className="filters__label">branches</span>
    <button type="button" className="filter" onClick={() => setExpansion(({ round }) => ({ open: true, round: round + 1 }))}>expand all</button>
    <button type="button" className="filter" onClick={() => setExpansion(({ round }) => ({ open: false, round: round + 1 }))}>collapse all</button>
  </div>;

  const gapCount = tree.gaps.length;
  const gapText = (gap: StructureGap) => gap.kind === "root-goals"
    ? `${gap.goals.length} goals serve no other goal. Name the purpose they serve under 'serves', in a change.`
    : describeGap(gap, title);
  const gaps = gapCount === 0
    ? <span className="tree-gaps process-line__part" aria-label="Gaps in the structure"><span className="tree-gaps__head">No gap in the structure: one purpose, every journey told.</span></span>
    : <details className="tree-gaps has-gaps process-line__part" aria-label="Gaps in the structure">
    <summary className="tree-gaps__head">{plural(gapCount, "gap")} in the structure</summary>
    <div className="process-line__open">
    {<ul>{tree.gaps.map((gap, index) => {
      const named = gap.kind === "root-goals" ? gap.goals : gap.kind === "no-journey" ? gap.useCases : gap.kind === "off-journey" ? [gap.useCase, gap.goal] : [gap.goal];
      return <li key={index}>
        <span>{gapText(gap)}</span>
        <span className="tree-gaps__nodes">{named.map((id) => <button key={id} type="button" className="spec-ref" onClick={() => onOpen(id)}>{title(id)}</button>)}</span>
      </li>;
    })}</ul>}
    <p className="tree-gaps__note">The board only reads: a gap is closed in a change, through the gate.</p>
    </div>
  </details>;

  const simulation = dropped && <p className="tree-impact" role="status"><b>Simulation — nothing in the specification changes.</b> If <b>{byId.get(dropped)?.title}</b> were dropped:
    {" "}{plural(branch.size, "use case")} would go, {out} requirement{out === 1 ? "" : "s"} would fall out, {stays} would stay because another use case relies on {stays === 1 ? "it" : "them"}{bare.size ? `, and ${plural(bare.size, "goal")} would be left with no use case` : ""}.</p>;

  if (arrangement === "actor") {
    return <div className="view tree" onKeyDown={walk}>
      <div className="view__head"><div>
        <h2>Hierarchy</h2>
        <p>Arranged by actor: overall requirements, then each actor's use cases with the requirements they rely on.</p>
      </div></div>
      <div className="tree-tools">{switcher}{dropControl}</div>
      <div className="filters">
        <span className="filters__label">capability</span>
        <button type="button" className={`filter ${capability === null ? "is-active" : ""}`} aria-pressed={capability === null} onClick={() => setCapability(null)}>all</button>
        {capabilities.map((name) => <button key={name} type="button" className={`filter ${capability === name ? "is-active" : ""}`} aria-pressed={capability === name} onClick={() => setCapability(name)}>{name}</button>)}
      </div>
      <nav id="tree-outline" className="tree-outline" aria-label="Outline of the actors">
        <ul>{hierarchy.actors.map(({ actor, roots }) => <li key={actor?.id ?? "none"}>
          <button type="button" className="tree-outline__item" onClick={() => goTo(actor?.id ?? "no-actor")}>{actor ? actor.title : "Use cases with no actor"}</button>
          <span className="tree-count"> · {roots.length}</span>
        </li>)}</ul>
      </nav>
      {simulation}
      {hierarchy.actors.map(({ actor, roots }) => <details key={`${actor?.id ?? "none"}-${expansion.round}`} id={anchor(actor?.id ?? "no-actor")} className="spec-group tree-actor" open={expansion.open ? true : undefined}>
        <summary className="spec-group__head" data-tree-item>{actor ? actor.title : "Use cases with no actor"}<span>{roots.length}</span></summary>
        {roots.map((id) => useCase(id, 0, null, new Set(), actor?.title ?? "no actor"))}
      </details>)}
      <Overall hierarchy={hierarchy} examples={examples} onOpen={onOpen} />
      <Unplaced hierarchy={hierarchy} examples={examples} onOpen={onOpen} />
      {toOutline}
    </div>;
  }

  return <div className="view tree" onKeyDown={walk}>
    <div className="view__head"><div>
      <h2>Hierarchy</h2>
      <p>The product from its purpose down: goals, the use cases that pursue them, their requirements and examples.</p>
    </div></div>
    <ChangeHeader change={board.change} onOpen={onOpen} extra={gaps} />
    {tree.journeys.length > 0 && <section className="tree-journeys" aria-label="Journeys">
      {tree.journeys.map((journey) => <div key={journey.summary.id} className="journey">
        <button type="button" className="journey__name" onClick={() => onOpen(journey.summary.id)}>{journey.summary.title}</button>
        <ol className="journey__steps">{journey.steps.map(({ node, journey: nested }, index) => <li key={`${node.id}-${index}`}>
          <a className="journey__step" href={`#${anchor(node.id)}`} onClick={(event) => { event.preventDefault(); if (nested) onOpen(node.id); else openPlace(node.id); }}>{node.title}{nested ? " · a journey of its own" : ""}</a>
        </li>)}</ol>
      </div>)}
    </section>}
    <nav id="tree-outline" className="tree-outline" aria-label="Outline of the goals">
      <ul>{[...tree.roots, ...tree.apart].map(outlineGoal)}</ul>
    </nav>
    <div className="tree-tools">{switcher}{dropControl}</div>
    {simulation}
    {tree.roots.map((entry) => goal(entry, 0))}
    {tree.apart.length > 0 && <section className="spec-group tree-apart">
      <div className="spec-group__head">{tree.told ? "Off every journey" : "Goals — no journey is told yet"}<span>{tree.apart.length}</span></div>
      {tree.apart.map((entry) => goal(entry, 0))}
    </section>}
    {tree.homeless.length > 0 && <section className="spec-group">
      <div className="spec-group__head">Use cases that serve no goal<span>{tree.homeless.length}</span></div>
      {tree.homeless.map((id) => useCase(id, 0, null, new Set(), "no goal"))}
    </section>}
    <Overall hierarchy={hierarchy} examples={examples} onOpen={onOpen} />
    <Unplaced hierarchy={hierarchy} examples={examples} onOpen={onOpen} />
    {toOutline}
  </div>;
}

function Overall({ hierarchy, examples, onOpen }: { hierarchy: ReturnType<typeof readHierarchy>; examples: Map<string, SpecNode[]>; onOpen: (id: string) => void }) {
  return <details className="spec-group tree-closed-group">
    <summary className="spec-group__head" data-tree-item>Holds for the whole product<span>{hierarchy.overall.length}</span></summary>
    {hierarchy.overall.length === 0 && <p className="view__empty">No requirement is marked as holding for the whole product.</p>}
    {hierarchy.overall.map((node) => <RequirementRow key={node.id} node={node} examples={examples.get(node.id) ?? []} alsoBy={[]} onOpen={onOpen} />)}
  </details>;
}

function Unplaced({ hierarchy, examples, onOpen }: { hierarchy: ReturnType<typeof readHierarchy>; examples: Map<string, SpecNode[]>; onOpen: (id: string) => void }) {
  return <details className="spec-group tree-closed-group">
    <summary className="spec-group__head" data-tree-item>No place yet<span>{hierarchy.unplaced.length}</span></summary>
    {hierarchy.unplaced.length === 0 && <p className="view__empty">Every requirement is part of a use case or holds for the whole product.</p>}
    {hierarchy.unplaced.map((node) => <RequirementRow key={node.id} node={node} examples={examples.get(node.id) ?? []} alsoBy={[]} onOpen={onOpen} />)}
  </details>;
}
