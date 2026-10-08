import { useMemo, useState } from "react";
import { dropMarks, readHierarchy, type SpecNode } from "./model";
import type { Board } from "./App";

/* ══ The hierarchy ═════════════════════════════════════
   The specification as a tree (BR-01m4ee23zg0wx6hyvpkyj9qcr1, EX-01m4ee25ey0g2x0bmj6v6rzrpq): overall
   requirements on top, each actor with its use cases, included and extending use cases nested, and
   under each the requirements it refines. One use case can be marked as dropped: the board then marks
   what falls out with it and what stays because another use case relies on it. */

function RequirementRow({ node, examples, mark, alsoBy, onOpen }: {
  node: SpecNode; examples: number; mark?: "out" | "stays"; alsoBy: SpecNode[]; onOpen: (id: string) => void;
}) {
  return <div className={`tree-req ${mark ? `tree-req--${mark}` : ""}`}>
    <button type="button" className="tree-req__title" onClick={() => onOpen(node.id)}>{node.title}</button>
    <span className="tree-req__meta">{node.form} · {examples} example{examples === 1 ? "" : "s"}{node.capability ? ` · ${node.capability}` : ""}</span>
    {mark && <span className={`tree-mark tree-mark--${mark}`}>{mark === "out" ? "falls out" : "stays"}</span>}
    {alsoBy.length > 0 && <span className="tree-req__also">also refined by {alsoBy.map((useCase) => useCase.title).join(", ")}</span>}
  </div>;
}

export function TreeView({ board, onOpen }: { board: Board; onOpen: (id: string) => void }) {
  const [dropped, setDropped] = useState<string | null>(null);
  const [capability, setCapability] = useState<string | null>(null);
  const spec = board.spec;
  const byId = useMemo(() => new Map(spec.map((node) => [node.id, node])), [spec]);
  const hierarchy = useMemo(() => readHierarchy(spec, capability), [spec, capability]);
  const marks = useMemo(() => dropMarks(spec, hierarchy, dropped), [spec, hierarchy, dropped]);
  const capabilities = useMemo(() => [...new Set(spec.map((node) => node.capability).filter((value): value is string => Boolean(value)))].sort(), [spec]);
  const out = [...marks.values()].filter((mark) => mark === "out").length;
  const stays = [...marks.values()].filter((mark) => mark === "stays").length;

  const useCase = (id: string, depth: number, how: string | null, seen: Set<string>): JSX.Element | null => {
    const node = byId.get(id);
    if (!node || seen.has(id)) return null;
    const path = new Set(seen).add(id);
    const requirements = hierarchy.refines.get(id) ?? [];
    const children = hierarchy.children.get(id) ?? [];
    return <details key={`${id}-${depth}`} className="tree-uc" open={depth === 0 ? undefined : true}>
      <summary>
        {how && <span className="tree-how">«{how}»</span>}
        <button type="button" className="tree-uc__title" onClick={(event) => { event.preventDefault(); onOpen(id); }}>{node.title}</button>
        {node.level && <span className="tag tag-outline">{node.level}</span>}
        <span className="tree-count">{requirements.length} requirement{requirements.length === 1 ? "" : "s"}</span>
        <button type="button" className={`tree-drop ${dropped === id ? "is-active" : ""}`} aria-pressed={dropped === id}
          onClick={(event) => { event.preventDefault(); setDropped(dropped === id ? null : id); }}>{dropped === id ? "Keep it" : "If dropped"}</button>
      </summary>
      <div className="tree-uc__body">
        {requirements.map((requirement) => <RequirementRow key={requirement.id} node={requirement} examples={hierarchy.examples.get(requirement.id) ?? 0}
          mark={marks.get(requirement.id)} alsoBy={(hierarchy.refiners.get(requirement.id) ?? []).filter((other) => other !== id).map((other) => byId.get(other)!).filter(Boolean)} onOpen={onOpen} />)}
        {children.map((child) => useCase(child.id, depth + 1, child.how, path))}
      </div>
    </details>;
  };

  return <div className="view tree">
    <div className="view__head">
      <div>
        <h2>Hierarchy</h2>
        <p>Overall requirements, then each actor's use cases with the requirements they refine. Mark a use case as dropped to see what falls out with it.</p>
      </div>
    </div>
    <div className="filters">
      <span className="filters__label">capability</span>
      <button type="button" className={`filter ${capability === null ? "is-active" : ""}`} aria-pressed={capability === null} onClick={() => setCapability(null)}>all</button>
      {capabilities.map((name) => <button key={name} type="button" className={`filter ${capability === name ? "is-active" : ""}`} aria-pressed={capability === name} onClick={() => setCapability(name)}>{name}</button>)}
    </div>
    {dropped && <p className="tree-impact" role="status">If <b>{byId.get(dropped)?.title}</b> is dropped: {out} requirement{out === 1 ? " falls" : "s fall"} out, {stays} stay{stays === 1 ? "s" : ""} because another use case relies on {stays === 1 ? "it" : "them"}.</p>}
    <section className="spec-group">
      <div className="spec-group__head">Overall<span>{hierarchy.overall.length}</span></div>
      {hierarchy.overall.length === 0 && <p className="view__empty">No requirement is marked overall.</p>}
      {hierarchy.overall.map((node) => <RequirementRow key={node.id} node={node} examples={hierarchy.examples.get(node.id) ?? 0} alsoBy={[]} onOpen={onOpen} />)}
    </section>
    {hierarchy.actors.map(({ actor, roots }) => <section key={actor?.id ?? "none"} className="spec-group">
      <div className="spec-group__head">{actor ? actor.title : "Use cases with no actor"}<span>{roots.length}</span></div>
      {roots.map((id) => useCase(id, 0, null, new Set()))}
    </section>)}
    <section className="spec-group">
      <div className="spec-group__head">No place yet<span>{hierarchy.unplaced.length}</span></div>
      {hierarchy.unplaced.length === 0 && <p className="view__empty">Every requirement is refined by a use case or marked overall.</p>}
      {hierarchy.unplaced.map((node) => <RequirementRow key={node.id} node={node} examples={hierarchy.examples.get(node.id) ?? 0} alsoBy={[]} onOpen={onOpen} />)}
    </section>
  </div>;
}
