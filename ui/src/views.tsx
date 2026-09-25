import { useEffect, useMemo, useState, type ReactNode } from "react";
import { EntityButton, MarkdownContent, Tail, titleOf, type Board } from "./App";
import { DiagramFigure, readPalette } from "./Diagram";
import {
  DECIDER_LABEL, LEVEL_LABEL, PROVENANCE_DECIDERS, PROVENANCE_LEVELS, agentDecided, entityDiagram, narrativeSection,
  parseSource, parseStateMachine, provenanceCounts, stateDiagram, storyMap, useCaseDiagram,
  type Provenance, type SpecNode,
} from "./model";

/* ══ The diagram views ═════════════════════════════════
   Four readings of the same model — use cases, stories, entities, state machines — each a drawing
   with the list of its nodes under it. Every mark of provenance is the node's own frontmatter; a
   node that records none is drawn without one, never as if it were stated. */

export const NARRATIVE_ENDPOINT = "/api/narrative";

export const VIEWS = [
  { key: "spec", label: "Specification", forms: [] as string[] },
  { key: "use-cases", label: "Use cases", forms: ["use-case"] },
  { key: "stories", label: "Stories", forms: ["user-story"] },
  { key: "entities", label: "Entities", forms: ["entity"] },
  { key: "states", label: "State machines", forms: ["state-machine"] },
] as const;
export type ViewKey = typeof VIEWS[number]["key"];

/* ── Provenance marks ────────────────────────────────── */
/** The level and the decider as two badges; nothing at all for a node that records neither. */
export function ProvenanceBadges({ provenance }: { provenance?: Provenance }) {
  if (!provenance?.level && !provenance?.decided_by) return null;
  return <span className="prov-badges">
    {provenance.level && <span className={`tag prov prov-level-${provenance.level}`} title="How much of this node was said, and how much filled in">{LEVEL_LABEL[provenance.level]}</span>}
    {provenance.decided_by && <span className={`tag prov prov-by-${provenance.decided_by}`} title="Who settled this node">{DECIDER_LABEL[provenance.decided_by]}</span>}
  </span>;
}

/**
 * The header summary: how much of the model was said and who settled it, counted apart, and the
 * one filter that turns every view into the review list — what the agent decided on its own.
 */
export function ProvenanceSummary({ board, agentOnly, onAgentOnly }: { board: Board; agentOnly: boolean; onAgentOnly: (on: boolean) => void }) {
  const counts = provenanceCounts(board.spec);
  const marked = board.spec.length - counts.unmarked;
  return <section className="prov-summary" aria-label="Provenance">
    <span className="filters__label">provenance</span>
    {marked === 0
      ? <span className="prov-summary__none">No node records where it came from.</span>
      : <>
        <span className="prov-summary__group">{PROVENANCE_LEVELS.map((level) => <span key={level} className="prov-summary__count">
          <span className={`tag prov prov-level-${level}`}>{LEVEL_LABEL[level]}</span><b>{counts.levels[level]}</b>
        </span>)}</span>
        <span className="prov-summary__group">{PROVENANCE_DECIDERS.map((decider) => <span key={decider} className="prov-summary__count">
          <span className={`tag prov prov-by-${decider}`}>{DECIDER_LABEL[decider]}</span><b>{counts.deciders[decider]}</b>
        </span>)}</span>
        {counts.unmarked > 0 && <span className="prov-summary__count prov-summary__unmarked">unmarked <b>{counts.unmarked}</b></span>}
      </>}
    <button type="button" className={`filter prov-summary__filter ${agentOnly ? "is-active" : ""}`} aria-pressed={agentOnly}
      onClick={() => onAgentOnly(!agentOnly)}>only what the agent decided<span>{counts.deciders["agent-decided"]}</span></button>
  </section>;
}

/* ── Node to narrative ───────────────────────────────── */
type Narrative = { state: "loading" } | { state: "failed"; error: string } | { state: "read"; content: string };

function useNarrative(path: string | null): Narrative | null {
  const [narrative, setNarrative] = useState<Narrative | null>(path ? { state: "loading" } : null);
  useEffect(() => {
    if (!path) return;
    let live = true;
    setNarrative({ state: "loading" });
    fetch(`${NARRATIVE_ENDPOINT}?path=${encodeURIComponent(path)}`)
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as { content?: string; error?: string };
        if (!response.ok || typeof body.content !== "string") throw new Error(body.error ?? `the server answered HTTP ${response.status}`);
        if (live) setNarrative({ state: "read", content: body.content });
      })
      .catch((reason: unknown) => { if (live) setNarrative({ state: "failed", error: reason instanceof Error ? reason.message : String(reason) }); });
    return () => { live = false; };
  }, [path]);
  return narrative;
}

/** One cited source: a change folder's narrative is read and the cited part shown in place. */
function SourceItem({ source, onOpen }: { source: string; onOpen: (id: string) => void }) {
  const { file, section, narrative } = parseSource(source);
  const read = useNarrative(narrative ? file : null);
  const excerpt = read?.state === "read" ? narrativeSection(read.content, section) : null;
  return <li className="source">
    <span className="source__cite"><code>{file}</code>{section && <span className="source__section"> · {section}</span>}</span>
    {read?.state === "loading" && <span className="source__note" role="status">Reading the narrative…</span>}
    {read?.state === "failed" && <span className="source__note">The narrative could not be read: {read.error}</span>}
    {read?.state === "read" && <>
      {excerpt
        ? <blockquote className="narrative"><MarkdownContent value={excerpt} onEntity={onOpen} /></blockquote>
        : section && <span className="source__note">No heading in this file names “{section}”; the whole file is below.</span>}
      <details className="narrative__whole" open={!excerpt}>
        <summary>The whole of {file.split("/").pop()}</summary>
        <div className="narrative"><MarkdownContent value={read.content} onEntity={onOpen} /></div>
      </details>
    </>}
  </li>;
}

/** The drawer's answer to "where does this come from": the quote, what was filled in, and the sources. */
export function ProvenancePanel({ node, onOpen }: { node: SpecNode; onOpen: (id: string) => void }) {
  const provenance = node.provenance;
  if (!provenance) return null;
  return <section className="drawer__section provenance">
    <div className="drawer__section-head">Where this comes from</div>
    <ProvenanceBadges provenance={provenance} />
    {provenance.quote && <blockquote className="provenance__quote">{provenance.quote}</blockquote>}
    {provenance.inferred && <p className="provenance__inferred"><b>Filled in:</b> {provenance.inferred}</p>}
    {provenance.sources.length > 0 && <ul className="sources">{provenance.sources.map((source) => <SourceItem key={source} source={source} onOpen={onOpen} />)}</ul>}
  </section>;
}

/* ── Shared pieces of a view ─────────────────────────── */
function titleCase(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ViewHead({ title, children }: { title: string; children: ReactNode }) {
  return <div className="view__head"><div><h2>{title}</h2><p>{children}</p></div></div>;
}

function Legend() {
  return <p className="diagram-legend">
    <span className="diagram-legend__item"><span className="swatch swatch-stated" aria-hidden="true" />stated: solid frame</span>
    <span className="diagram-legend__item"><span className="swatch swatch-partly" aria-hidden="true" />partly inferred: dashed amber</span>
    <span className="diagram-legend__item"><span className="swatch swatch-inferred" aria-hidden="true" />inferred: dashed red</span>
    <span className="diagram-legend__item">no provenance recorded: plain</span>
  </p>;
}

function FilterNote({ agentOnly, shown, total }: { agentOnly: boolean; shown: number; total: number }) {
  if (!agentOnly) return null;
  return <p className="view__filtered" role="status">Showing {shown} of {total}: only what the agent decided. The diagram dims the rest.</p>;
}

/** A node in a view's list: its title and marks, opening onto its sections and its edges. */
export function NodeDetails({ node, board, onOpen }: { node: SpecNode; board: Board; onOpen: (id: string) => void }) {
  const outgoing = Object.entries(node.edges ?? {}).filter(([, ids]) => ids.length);
  const incoming = board.incoming.get(node.id) ?? [];
  const ref = (id: string, key: string) => <EntityButton key={key} id={id} className="spec-ref" onOpen={onOpen}>{titleOf(id) ?? id}<Tail id={id} /></EntityButton>;
  return <details className={`node-detail${node.provenance?.level ? ` prov-card-${node.provenance.level}` : ""}`}>
    <summary className="node-detail__summary">
      <span className="node-detail__title">{node.title}</span>
      <span className="node-detail__meta"><Tail id={node.id} /><ProvenanceBadges provenance={node.provenance} /></span>
    </summary>
    <div className="node-detail__body">
      {outgoing.map(([field, ids]) => <div key={field} className="spec-edge">
        <span className="spec-edge__field">{field}</span>
        <span className="spec-panel__refs">{ids.map((id) => ref(id, `${field}-${id}`))}</span>
      </div>)}
      {incoming.length > 0 && <div className="spec-edge">
        <span className="spec-edge__field">named by</span>
        <span className="spec-panel__refs">{incoming.map(({ from, field }) => ref(from, `${from}-${field}`))}</span>
      </div>}
      {Object.entries(node.sections ?? {}).filter(([, body]) => body && body.trim()).map(([name, body]) => <section key={name} className="node-detail__section">
        <div className="drawer__section-head">{titleCase(name)}</div>
        <MarkdownContent value={body} onEntity={onOpen} />
      </section>)}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onOpen(node.id)}>Open “{node.title}”</button>
    </div>
  </details>;
}

function NodeList({ heading, nodes, board, agentOnly, onOpen }: { heading: string; nodes: SpecNode[]; board: Board; agentOnly: boolean; onOpen: (id: string) => void }) {
  const shown = agentOnly ? nodes.filter(agentDecided) : nodes;
  if (!nodes.length) return null;
  return <section className="spec-group node-list">
    <h3 className="spec-group__head">{heading}<span>{shown.length}</span></h3>
    {shown.map((node) => <NodeDetails key={node.id} node={node} board={board} onOpen={onOpen} />)}
  </section>;
}

type ViewProps = { board: Board; agentOnly: boolean; onOpen: (id: string) => void };
const dimmer = (agentOnly: boolean) => (agentOnly ? (node: SpecNode) => !agentDecided(node) : undefined);

function Empty({ what }: { what: string }) {
  return <p className="view__empty">This workspace has no {what} yet. A node is drafted from the registered forms in the calling chat, or with the CLI's spec command.</p>;
}

/* ══ Use cases ═════════════════════════════════════════ */
export function UseCaseView({ board, agentOnly, onOpen }: ViewProps) {
  const cases = board.spec.filter((node) => node.form === "use-case");
  const actors = board.spec.filter((node) => node.form === "actor");
  const goals = board.spec.filter((node) => node.form === "goal");
  const diagram = useMemo(() => useCaseDiagram(board.spec, { palette: readPalette(), dim: dimmer(agentOnly) }), [board, agentOnly]);
  const all = [...actors, ...cases, ...goals];
  return <div className="view">
    <ViewHead title="Use cases">Who does what, and for which goal: an actor owns a use case by its actor edge (solid arrow); a use case serves a goal by its goal edge (dashed arrow).</ViewHead>
    <Legend />
    <FilterNote agentOnly={agentOnly} shown={all.filter(agentDecided).length} total={all.length} />
    {cases.length === 0 ? <Empty what="use cases" /> : <DiagramFigure source={diagram.source} nodes={diagram.nodes} onOpen={onOpen} label="Use case diagram" />}
    <NodeList heading="use cases" nodes={cases} board={board} agentOnly={agentOnly} onOpen={onOpen} />
    <NodeList heading="actors" nodes={actors} board={board} agentOnly={agentOnly} onOpen={onOpen} />
    <NodeList heading="goals" nodes={goals} board={board} agentOnly={agentOnly} onOpen={onOpen} />
  </div>;
}

/* ══ Stories ═══════════════════════════════════════════ */
export function StoryMapView({ board, agentOnly, onOpen }: ViewProps) {
  const columns = storyMap(board.spec);
  const stories = board.spec.filter((node) => node.form === "user-story");
  return <div className="view">
    <ViewHead title="Stories">Every user story under the actor whose story it is, with what it asks for and why it is worth it.</ViewHead>
    <Legend />
    <FilterNote agentOnly={agentOnly} shown={stories.filter(agentDecided).length} total={stories.length} />
    {stories.length === 0 ? <Empty what="user stories" /> : <div className="story-map scroll" role="list" aria-label="Story map">
      {columns.map((column) => <section key={column.actor?.id ?? "none"} className="story-map__column" role="listitem" aria-label={column.actor?.title ?? "No actor"}>
        <h3 className="story-map__actor">{column.actor
          ? <EntityButton id={column.actor.id} className="story-map__actor-button" onOpen={onOpen}>{column.actor.title}</EntityButton>
          : "No actor named"}</h3>
        {column.stories.map((story) => <article key={story.id} className={`story-card${story.provenance?.level ? ` prov-card-${story.provenance.level}` : ""}${agentOnly && !agentDecided(story) ? " is-dimmed" : ""}`}>
          <h4 className="story-card__title"><EntityButton id={story.id} className="story-card__open" onOpen={onOpen}>{story.title}</EntityButton></h4>
          <ProvenanceBadges provenance={story.provenance} />
          {story.sections.story && <div className="story-card__part"><div className="drawer__section-head">Story</div><MarkdownContent value={story.sections.story} onEntity={onOpen} /></div>}
          {story.sections.value && <div className="story-card__part"><div className="drawer__section-head">Value</div><MarkdownContent value={story.sections.value} onEntity={onOpen} /></div>}
        </article>)}
      </section>)}
    </div>}
    <NodeList heading="user stories" nodes={stories} board={board} agentOnly={agentOnly} onOpen={onOpen} />
  </div>;
}

/* ══ Entities ══════════════════════════════════════════ */
export function EntityMapView({ board, agentOnly, onOpen }: ViewProps) {
  const entities = board.spec.filter((node) => node.form === "entity");
  const diagram = useMemo(() => entityDiagram(board.spec, { palette: readPalette(), dim: dimmer(agentOnly) }), [board, agentOnly]);
  return <div className="view">
    <ViewHead title="Entities">The domain concepts and how their descriptions refer to one another.</ViewHead>
    <p className="diagram-note" role="note"><b>These arrows are read from prose, not from typed edges.</b> An arrow from one entity to another means the first one's Meaning, Attributes or Invariants mention the other's title. It says nothing about cardinality or ownership.</p>
    <Legend />
    <FilterNote agentOnly={agentOnly} shown={entities.filter(agentDecided).length} total={entities.length} />
    {entities.length === 0 ? <Empty what="entities" /> : <DiagramFigure source={diagram.source} nodes={diagram.nodes} onOpen={onOpen} label="Entity map" />}
    <NodeList heading="entities" nodes={entities} board={board} agentOnly={agentOnly} onOpen={onOpen} />
  </div>;
}

/* ══ State machines ════════════════════════════════════ */
export function StateMachineView({ board, agentOnly, onOpen }: ViewProps) {
  const machines = board.spec.filter((node) => node.form === "state-machine");
  const shown = agentOnly ? machines.filter(agentDecided) : machines;
  return <div className="view">
    <ViewHead title="State machines">Each governed lifecycle, drawn from the lines of its Transitions section that read as <code>A → B: why</code>. What is written as prose stays prose.</ViewHead>
    <Legend />
    <FilterNote agentOnly={agentOnly} shown={shown.length} total={machines.length} />
    {machines.length === 0 && <Empty what="state machines" />}
    {shown.map((machine) => <StateMachineSection key={machine.id} machine={machine} board={board} onOpen={onOpen} />)}
  </div>;
}

function StateMachineSection({ machine, board, onOpen }: { machine: SpecNode; board: Board; onOpen: (id: string) => void }) {
  const parsed = useMemo(() => parseStateMachine(machine.sections), [machine]);
  const governed = machine.edges?.entity ?? [];
  return <section className={`machine${machine.provenance?.level ? ` prov-card-${machine.provenance.level}` : ""}`} aria-label={machine.title}>
    <div className="machine__head">
      <h3><EntityButton id={machine.id} className="machine__open" onOpen={onOpen}>{machine.title}</EntityButton></h3>
      <ProvenanceBadges provenance={machine.provenance} />
      {governed.length > 0 && <span className="machine__governs">governs {governed.map((id) => <EntityButton key={id} id={id} className="spec-ref" onOpen={onOpen}>{titleOf(id) ?? id}<Tail id={id} /></EntityButton>)}</span>}
    </div>
    {parsed.drawable
      ? <>
        <DiagramFigure source={stateDiagram(parsed)} label={`State machine: ${machine.title}`} />
        {parsed.prose.length > 0 && <div className="machine__prose">
          <p className="diagram-note" role="note">These lines of the Transitions section were not read as transitions and are not in the drawing:</p>
          <MarkdownContent value={parsed.prose.join("\n\n")} onEntity={onOpen} />
        </div>}
      </>
      : <div className="machine__prose">
        <p className="diagram-note" role="note"><b>The specification describes this in prose; it cannot be drawn mechanically.</b> No line of its Transitions section reads as <code>A → B: why</code>.</p>
        {machine.sections.transitions?.trim()
          ? <MarkdownContent value={machine.sections.transitions} onEntity={onOpen} />
          : <p className="view__empty">The Transitions section is empty.</p>}
      </div>}
    <NodeDetails node={machine} board={board} onOpen={onOpen} />
  </section>;
}
