import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { agentDecided, type SpecNode } from "./model";
import { EntityMapView, ProvenanceBadges, ProvenancePanel, ProvenanceSummary, StateMachineView, StoryMapView, UseCaseView, VIEWS, type ViewKey } from "./views";

/* ══ Kotta board ═══════════════════════════════════════
   A read-only projection of the technical specification: every node of every registered form,
   grouped by form, with its admission and its place in the graph, and four diagrams of the same
   model (views.tsx). Nothing here writes; there is no process to drive. Every colour, space and
   radius comes from the tokens in styles.css. */

/* ── Types ───────────────────────────────────────────── */
export type { Provenance, SpecNode } from "./model";
export type SpecForm = { id: string; directory: string; title: string };
export type Workspace = {
  project: string; workspace?: string;
  spec?: SpecNode[];
  specForms?: SpecForm[];
  /* What the reader has to say about itself before the page is believed — see WorkspaceNotices. */
  notices?: string[];
};

/* Reporting leaves the workspace: the board never writes a report, it hands off to GitHub. */
const BUG_REPORT_URL = "https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml";
/* The canonical workspace read endpoint. */
export const WORKSPACE_ENDPOINT = "/api/workspace";

/* A specification prefix is declared by its form, which the project owns, so no list of them is
   written here: any minted id is recognised by shape and resolved by lookup. */
const MINTED_BODY = "[0-9a-hjkmnp-tv-z]{26}";
const ENTITY_SOURCE = `(?:[A-Za-z]{1,4}-${MINTED_BODY})`;
const ENTITY_PATTERN = new RegExp(`\\b${ENTITY_SOURCE}\\b`, "g");
const MINTED_ID = new RegExp(`^${ENTITY_SOURCE}$`);

/** The short tail of a minted id — the part a human can still recognise. */
export function displayId(id: string): string {
  return MINTED_ID.test(id) ? `${id.slice(0, id.indexOf("-") + 1)}${id.slice(-8)}` : id;
}
const entityTitles = new Map<string, string>();
/** Human reference is the title; the raw id rides along for recall. */
function entityLabel(id: string): string {
  const title = entityTitles.get(id);
  return title ? `${title} · ${id}` : id;
}
export function titleOf(id: string): string | null {
  return entityTitles.get(id) ?? null;
}

/* ── Markdown + node links ───────────────────────────── */
type MarkdownNode = { type: string; value?: string; url?: string; children?: MarkdownNode[] };
function remarkEntityLinks() {
  return (tree: MarkdownNode) => {
    const visit = (node: MarkdownNode) => {
      if (!node.children || node.type === "link" || node.type === "code" || node.type === "inlineCode") return;
      node.children = node.children.flatMap((child) => {
        if (child.type !== "text" || !child.value) { visit(child); return [child]; }
        const pieces: MarkdownNode[] = [];
        let cursor = 0;
        for (const match of child.value.matchAll(ENTITY_PATTERN)) {
          const index = match.index ?? 0;
          if (index > cursor) pieces.push({ type: "text", value: child.value.slice(cursor, index) });
          pieces.push({ type: "link", url: `entity:${match[0]}`, children: [{ type: "text", value: match[0] }] });
          cursor = index + match[0].length;
        }
        if (!pieces.length) return [child];
        if (cursor < child.value.length) pieces.push({ type: "text", value: child.value.slice(cursor) });
        return pieces;
      });
    };
    visit(tree);
  };
}
function normalizeMarkdown(value: string): string {
  return value.replace(/([^\n])(?=#{2,4}\s)/g, "$1\n\n");
}
/** In prose a node reads as its title, with the id kept for recall. */
export function MarkdownContent({ value, onEntity }: { value: string; onEntity: (id: string) => void }) {
  return <div className="prose"><ReactMarkdown
    remarkPlugins={[remarkGfm, remarkEntityLinks]}
    urlTransform={(url) => (/^(?:https?:|mailto:|#|entity:)/.test(url) ? url : "#")}
    components={{ a: ({ href = "", children }) => {
      const label = String(children);
      const entityId = href.startsWith("entity:") ? href.slice(7) : label.match(ENTITY_PATTERN)?.[0];
      if (entityId) {
        const known = titleOf(entityId);
        return <button type="button" className="ref ref-s" title={entityLabel(entityId)} onClick={() => onEntity(entityId)}>
          {known ?? entityId}{known ? <span className="ref__tail">{displayId(entityId)}</span> : null}
        </button>;
      }
      if (/^https?:|^mailto:/.test(href)) return <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>;
      return <span>{children}</span>;
    } }}
  >{normalizeMarkdown(value)}</ReactMarkdown></div>;
}

/* ── Derivation of everything the board shows ────────── */
/** Which of the three situations an admission records, or none. */
export const ADMISSION_KINDS = ["structural", "unexamined", "unimplemented"] as const;
export type AdmissionKind = typeof ADMISSION_KINDS[number];
export type SpecFilter = "all" | AdmissionKind | "kept";

/** The kind an admission names, read from its own text; an unkinded admission is not one of them. */
export function admissionKind(node: { accepted: string[] }): AdmissionKind | null {
  for (const line of node.accepted) {
    const named = ADMISSION_KINDS.find((kind) => line.trim().toLowerCase().startsWith(`${kind}:`));
    if (named) return named;
  }
  return null;
}

export type Board = {
  spec: SpecNode[];
  specById: Map<string, SpecNode>;
  /** Every form present, from the nodes themselves: the registry is the project's, none is named here. */
  forms: string[];
  /** For each node, the nodes that name it and the field they name it in. */
  incoming: Map<string, Array<{ from: string; field: string }>>;
  kinds: Map<string, AdmissionKind | null>;
};

export function readBoard(workspace: Workspace): Board {
  const spec = workspace.spec ?? [];
  entityTitles.clear();
  for (const node of spec) entityTitles.set(node.id, node.title);
  const specById = new Map(spec.map((node) => [node.id, node]));
  const forms = [...new Set(spec.map((node) => node.form))].sort();
  const incoming = new Map<string, Array<{ from: string; field: string }>>();
  for (const node of spec) {
    for (const [field, ids] of Object.entries(node.edges ?? {})) {
      for (const id of ids) incoming.set(id, [...(incoming.get(id) ?? []), { from: node.id, field }]);
    }
  }
  const kinds = new Map(spec.map((node) => [node.id, admissionKind(node)]));
  return { spec, specById, forms, incoming, kinds };
}

/* ── Small presentational bits ───────────────────────── */
/** The small monospace id marker the design puts beside a title. Never the label on its own. */
export function Tail({ id }: { id: string }) {
  return <span className="tail tail-s">{displayId(id)}</span>;
}
/** A row that opens a node: the title is the accessible name, the id rides in `title`. */
export function EntityButton({ id, className, children, onOpen }: { id: string; className: string; children: ReactNode; onOpen: (id: string) => void }) {
  return <button type="button" className={className} title={entityLabel(id)} onClick={() => onOpen(id)}>{children}</button>;
}
function Placeholder({ rows = 3, label }: { rows?: number; label: string }) {
  return <div className="ph" role="status" aria-live="polite">
    <span className="visually-hidden">{label}</span>
    {Array.from({ length: rows }, (_, i) => <span key={i} className="ph__row" aria-hidden="true" />)}
  </div>;
}

/* ══ The mark ══════════════════════════════════════════
   A staff: three rules with the red note-head standing ON the middle one, never
   between two. Four rules above 24px, three below, two below 18px. */
export function BrandMark({ size = 22 }: { size?: number }) {
  const rules = size >= 24 ? 4 : size >= 18 ? 3 : 2;
  const step = 6, top = (30 - (rules - 1) * step) / 2 - 1;
  const lines = Array.from({ length: rules }, (_, i) => top + i * step);
  const head = lines[Math.min(rules - 1, Math.floor((rules - 1) / 2) + (rules % 2 === 0 ? 1 : 0))];
  return <svg className="mark" width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" focusable="false">
    <rect width="30" height="30" className="mark__ground" />
    {lines.map((y) => <rect key={y} y={y} width="30" height="2" className="mark__rule" />)}
    <rect x="16" y={head - 2} width="6" height="6" className="mark__head" />
  </svg>;
}

/* ══ The rail ══════════════════════════════════════════
   The specification list, and the four diagrams of the same model beside it. */
export function Rail({ board, refreshed, view = "spec", onView = () => {} }: { board: Board | null; refreshed: number; view?: ViewKey; onView?: (view: ViewKey) => void }) {
  return <nav className="rail" aria-label="Board sections">
    <div className="rail__brand"><BrandMark size={22} /><span>Kotta</span></div>
    <div className="rail__group">
      <div className="rail__head">the model</div>
      {VIEWS.map((entry) => <button key={entry.key} type="button" className={`rail__item ${view === entry.key ? "is-active" : ""}`}
        aria-current={view === entry.key ? "page" : undefined} onClick={() => onView(entry.key)}>
        <span className="rail__label">{entry.label}</span>
        <span className="rail__count">{board ? (entry.forms.length ? board.spec.filter((node) => (entry.forms as readonly string[]).includes(node.form)).length : board.spec.length) : "—"}</span>
      </button>)}
    </div>
    <div className="rail__foot">
      <a className="rail__report" href={BUG_REPORT_URL} target="_blank" rel="noreferrer noopener" aria-label="Report a bug in Kotta (opens the GitHub issue form in a new tab)">Report a bug</a>
      <div className="rail__report-note">Nothing from this workspace is sent; the form opens on GitHub and you write the report there.</div>
      <div className="rail__meta rail__version">read-only · refreshed {refreshed}s ago</div>
    </div>
  </nav>;
}

/* ══ Header ════════════════════════════════════════════ */
function initials(project: string): string {
  const words = project.split(/[\s\-_/]+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 2).map((w) => w[0]).join("") : project.slice(0, 2)).toUpperCase();
}
export function TopBar({ workspace, board, onRefresh, refreshed }: {
  workspace: Workspace | null; board: Board | null; onRefresh: () => void; refreshed: number;
}) {
  const project = workspace?.project ?? "workspace";
  const admitted = board ? board.spec.filter((node) => board.kinds.get(node.id) !== null).length : 0;
  const unimplemented = board ? board.spec.filter((node) => board.kinds.get(node.id) === "unimplemented").length : 0;
  const stats: Array<{ label: string; value: string; hot?: boolean }> = [
    { label: "nodes", value: board ? String(board.spec.length) : "—" },
    { label: "forms", value: board ? String(board.forms.length) : "—" },
    { label: "admitted gaps", value: board ? String(admitted) : "—" },
    { label: "unimplemented", value: board ? String(unimplemented) : "—", hot: unimplemented > 0 },
  ];
  return <header className="top">
    <div className="top__ws">
      <span className="top__mark">{initials(project)}</span>
      <span className="top__ws-text">
        <span className="top__ws-name">{project}</span>
        <span className="top__ws-path">{workspace?.workspace ?? ".kotta/"}{typeof window !== "undefined" && window.location.port ? ` · port ${window.location.port}` : ""}</span>
      </span>
    </div>
    <div className="top__stats">
      {stats.map((stat) => <div key={stat.label} className="top__stat">
        <span className="top__stat-label">{stat.label}</span>
        <span className={`top__stat-value ${stat.hot ? "is-hot" : ""}`}>{stat.value}</span>
      </div>)}
    </div>
    <button type="button" className="top__action" onClick={onRefresh}>
      <span className="top__key" aria-hidden="true">↻</span> Refresh <span className="top__ago">{refreshed}s</span>
    </button>
  </header>;
}

/* ══ The specification view ════════════════════════════ */
export function SpecView({ board, filter, form, query, agentOnly = false, onFilter, onForm, onQuery, onOpen }: {
  board: Board; filter: SpecFilter; form: string; query: string; agentOnly?: boolean;
  onFilter: (f: SpecFilter) => void; onForm: (form: string) => void; onQuery: (query: string) => void; onOpen: (id: string) => void;
}) {
  const term = query.trim().toLowerCase();
  const kindOf = board.kinds;
  const rows = board.spec
    .filter((node) => form === "all" || node.form === form)
    .filter((node) => filter === "all" || (filter === "kept" ? kindOf.get(node.id) === null : kindOf.get(node.id) === filter))
    .filter((node) => !term || node.title.toLowerCase().includes(term) || node.id.toLowerCase().includes(term))
    .filter((node) => !agentOnly || agentDecided(node));

  // Counted apart, never as one total: the three ask for opposite work, and "nobody looked" is not
  // the same debt as "many sites realise this and none can name it".
  const counts = (predicate: (node: SpecNode) => boolean) => board.spec.filter(predicate).length;
  const filters: Array<{ key: SpecFilter; label: string; count: number }> = [
    { key: "all", label: "all", count: board.spec.length },
    { key: "kept", label: "no admission", count: counts((node) => kindOf.get(node.id) === null) },
    ...ADMISSION_KINDS.map((kind) => ({ key: kind as SpecFilter, label: kind, count: counts((node) => kindOf.get(node.id) === kind) })),
  ];
  const grouped = board.forms
    .filter((name) => rows.some((node) => node.form === name))
    .map((name) => ({ form: name, nodes: rows.filter((node) => node.form === name) }));

  return <div className="view">
    <div className="view__head">
      <div>
        <h2>Specification</h2>
        <p>The accepted technical model — {board.spec.length} nodes across {board.forms.length} forms. Read-only: a node changes when it lands on the base branch.</p>
      </div>
    </div>
    <div className="filters">
      <span className="filters__label">admission</span>
      {filters.map((f) => <button key={f.key} type="button" className={`filter ${filter === f.key ? "is-active" : ""}`}
        aria-pressed={filter === f.key} onClick={() => onFilter(f.key)}>{f.label}<span>{f.count}</span></button>)}
    </div>
    <div className="filters">
      <span className="filters__label">form</span>
      <button type="button" className={`filter ${form === "all" ? "is-active" : ""}`} aria-pressed={form === "all"} onClick={() => onForm("all")}>all<span>{board.spec.length}</span></button>
      {board.forms.map((name) => <button key={name} type="button" className={`filter ${form === name ? "is-active" : ""}`}
        aria-pressed={form === name} onClick={() => onForm(name)}>{name}<span>{board.spec.filter((node) => node.form === name).length}</span></button>)}
      <input type="search" className="filters__search" value={query} placeholder="find by title" aria-label="Find a specification node by title"
        onChange={(event) => onQuery(event.target.value)} />
    </div>
    {agentOnly && <p className="view__filtered" role="status">Only what the agent decided on its own — the list to read through first.</p>}
    {rows.length === 0 && <p className="view__empty">No node matches. {board.spec.length === 0
      ? "This workspace has no specification yet. A node is drafted from the registered forms in the calling chat, or with the CLI's spec command."
      : "Widen the filters, or clear the search."}</p>}
    {grouped.map((group) => <section key={group.form} className="spec-group">
      <div className="spec-group__head">{group.form}<span>{group.nodes.length}</span></div>
      {group.nodes.map((node) => {
        const kind = kindOf.get(node.id);
        const named = board.incoming.get(node.id)?.length ?? 0;
        return <EntityButton key={node.id} id={node.id} className="spec-row" onOpen={onOpen}>
          <span className="spec-row__title">{node.title}</span>
          <span className="spec-row__meta">
            <Tail id={node.id} />
            <ProvenanceBadges provenance={node.provenance} />
            {kind
              ? <span className={`tag admission admission-${kind}`}>{kind}</span>
              : <span className="tag tag-neutral">no admission</span>}
            <span className="spec-row__leaning">{named ? `${named} node${named === 1 ? "" : "s"} name${named === 1 ? "s" : ""} it` : "nothing names it"}</span>
          </span>
        </EntityButton>;
      })}
    </section>)}
  </div>;
}

/* ══ The drawer ════════════════════════════════════════ */
function useDialog(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const invoker = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      invoker?.focus?.();
    };
  }, []);
  return ref;
}
function titleCase(value: string): string {
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function Dangling({ field, id }: { field: string; id: string }) {
  return <div className="dangling">
    <div className="dangling__kind">dangling reference</div>
    <div className="dangling__text"><code>{field}: {id}</code> — no such node on the base branch. The reference is recorded but the file is not there.</div>
  </div>;
}

/**
 * A node's place in the graph: the edges it answers and the nodes that answer it. Edge names come
 * from the node's own frontmatter, so a project's own form is traversed with nothing added.
 */
function SpecNeighbours({ node, board, onOpen }: { node: SpecNode; board: Board; onOpen: (id: string) => void }) {
  const outgoing = Object.entries(node.edges ?? {}).filter(([, ids]) => ids.length);
  const incoming = board.incoming.get(node.id) ?? [];
  if (!outgoing.length && !incoming.length) return null;

  const ref = (id: string) => <EntityButton key={id} id={id} className="spec-ref" onOpen={onOpen}>
    {titleOf(id) ?? id}<Tail id={id} />
  </EntityButton>;

  return <>
    {outgoing.length > 0 && <section className="drawer__section">
      <div className="drawer__section-head">Answers</div>
      {outgoing.map(([field, ids]) => <div key={field} className="spec-edge">
        <span className="spec-edge__field">{field}</span>
        <span className="spec-panel__refs">{ids.map(ref)}</span>
      </div>)}
    </section>}
    {incoming.length > 0 && <section className="drawer__section">
      <div className="drawer__section-head">Answered by</div>
      {incoming.map(({ from, field }) => <div key={`${from}-${field}`} className="spec-edge">
        <span className="spec-edge__field">{field}</span>
        <span className="spec-panel__refs">{ref(from)}</span>
      </div>)}
    </section>}
  </>;
}

export function EntityDrawer({ id, board, onClose, onOpen }: {
  id: string; board: Board; onClose: () => void; onOpen: (id: string) => void;
}) {
  const ref = useDialog(onClose);
  const node = board.specById.get(id);
  const fields: Array<[string, string]> = [];
  if (node) {
    // An admission is a statement about the evidence, not about the agreement, so it is shown as
    // what it is: which kind of gap this node records, and why.
    fields.push(["form", node.form], ["file", node.path]);
    if (node.capability) fields.push(["capability", node.capability]);
    for (const admission of node.accepted) fields.push(["admitted", admission]);
  }

  return <div className="scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="drawer scroll" role="dialog" aria-modal="true" aria-label={`${node?.form ?? "node"}: ${node?.title ?? id}`} tabIndex={-1} ref={ref}>
      <div className="drawer__bar">
        <span className="tag tag-outline">{node?.form ?? "node"}</span>
        <Tail id={id} />
        <button type="button" className="drawer__close" onClick={onClose}>Close · esc</button>
      </div>
      {!node
        ? <div className="drawer__gone"><Dangling field="reference" id={id} /></div>
        : <>
          <h2 className="drawer__title">{node.title}</h2>
          <ProvenancePanel node={node} onOpen={onOpen} />
          <SpecNeighbours node={node} board={board} onOpen={onOpen} />
          <dl className="drawer__fields">
            {fields.map(([key, value], index) => <div key={`${key}-${index}`}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>)}
          </dl>
          {Object.entries(node.sections ?? {}).map(([name, body]) => body && body.trim()
            ? <section key={name} className="drawer__section">
              <div className="drawer__section-head">{titleCase(name)}</div>
              <MarkdownContent value={body} onEntity={onOpen} />
            </section>
            : null)}
        </>}
    </div>
  </div>;
}

/* ══ What the reader says about itself ═══════════
   An empty board is ambiguous: it can mean an empty workspace, or a workspace whose
   files have not reached the ref this board reads. The server distinguishes the two
   and the page prints the answer above everything else. */
export function WorkspaceNotices({ notices }: { notices: string[] }) {
  return <div className="banner banner--notice" role="status">
    <b>The board is not reading what you are editing.</b>
    {notices.map((notice, index) => <p key={index}>{notice}</p>)}
  </div>;
}

/* ══ App ═══════════════════════════════════════════════ */
export function App() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [refreshed, setRefreshed] = useState(0);
  const [specFilter, setSpecFilter] = useState<SpecFilter>("all");
  const [specForm, setSpecForm] = useState<string>("all");
  const [specQuery, setSpecQuery] = useState<string>("");
  const [view, setView] = useState<ViewKey>("spec");
  const [agentOnly, setAgentOnly] = useState(false);

  /* One request, always the same one: the board never posts. A failed read keeps the last
     good data on screen and says what failed — a refresh preserves the filters and the drawer. */
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(WORKSPACE_ENDPOINT);
      if (!response.ok) throw new Error(`the server answered HTTP ${response.status}`);
      setWorkspace(await response.json() as Workspace);
      setRefreshed(0);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }, []);
  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 1_500); return () => window.clearInterval(timer); }, [refresh]);
  useEffect(() => { const t = window.setInterval(() => setRefreshed((r) => (r + 1) % 600), 1_000); return () => window.clearInterval(t); }, []);

  const board = useMemo(() => (workspace ? readBoard(workspace) : null), [workspace]);

  return <div className="app">
    <Rail board={board} refreshed={refreshed} view={view} onView={setView} />
    <div className="content">
      <TopBar workspace={workspace} board={board} onRefresh={() => void refresh()} refreshed={refreshed} />
      {workspace?.notices?.length ? <WorkspaceNotices notices={workspace.notices} /> : null}
      {board && <ProvenanceSummary board={board} agentOnly={agentOnly} onAgentOnly={setAgentOnly} />}
      {workspace && error && <div className="banner" role="alert">
        <b>Last read failed.</b> Tried <code>GET {WORKSPACE_ENDPOINT}</code> — {error}. Showing the last good read.
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>Retry</button>
      </div>}
      <main className="stage scroll">
        {!board && <div className="view"><Placeholder rows={6} label="Reading the workspace…" />
          {error && <div className="banner" role="alert"><b>The workspace could not be read.</b> {error}. <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>Retry</button></div>}</div>}
        {board && view === "spec" && <SpecView board={board} filter={specFilter} form={specForm} query={specQuery} agentOnly={agentOnly}
          onFilter={setSpecFilter} onForm={setSpecForm} onQuery={setSpecQuery} onOpen={setDetailId} />}
        {board && view === "use-cases" && <UseCaseView board={board} agentOnly={agentOnly} onOpen={setDetailId} />}
        {board && view === "stories" && <StoryMapView board={board} agentOnly={agentOnly} onOpen={setDetailId} />}
        {board && view === "entities" && <EntityMapView board={board} agentOnly={agentOnly} onOpen={setDetailId} />}
        {board && view === "states" && <StateMachineView board={board} agentOnly={agentOnly} onOpen={setDetailId} />}
      </main>
    </div>
    {detailId && board && <EntityDrawer id={detailId} board={board} onClose={() => setDetailId(null)} onOpen={setDetailId} />}
  </div>;
}
