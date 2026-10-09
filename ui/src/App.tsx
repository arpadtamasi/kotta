import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TreeView, type Arrangement } from "./Tree";
import { DECIDER_LABEL, LEVEL_LABEL, agentDecided, placeOf, relationPhrase, type ChangeMark, type ProvenanceDecider, type SpecNode } from "./model";
import { EntityMapView, ProvenanceBadges, ProvenancePanel, ProvenanceSummary, StateMachineView, StoryMapView, UseCaseView, VIEWS, type ViewKey } from "./views";

/* ══ Kotta board ═══════════════════════════════════════
   A read-only projection of the technical specification: every node of every registered form,
   grouped by form, with its admission and its place in the graph, and four diagrams of the same
   model (views.tsx). Nothing here writes; there is no process to drive. Every colour, space and
   radius comes from the tokens in styles.css. */

/* ── Types ───────────────────────────────────────────── */
export type { Provenance, SpecNode } from "./model";
export type SpecForm = { id: string; directory: string; title: string };
/** An open change, read from the working tree (BR-01m40e522gtq49knhy51hr9e3d). */
export type OpenChange = {
  name: string; title: string; proposal: string;
  nodes: Array<SpecNode & { mark: "added" | "changed" }>;
  removed: string[];
  openDecisions: Array<{ node: string; text: string }>;
  planned: boolean; approved: boolean;
  /** Who said yes, when, and what the gate listed as the agent's own decisions (BR-01m4gh4rxe5navrnzfz0t5a2jf). */
  approval?: Approval;
  uncommitted: string[];
  /** Model files the board could not read, and why (BR-01m4gmdmy4keq12tj73ahtskx0). */
  unreadable?: Array<{ path: string; reason: string }>;
};
export type Approval = { by: string; at: string; agentDecidedAtGate: string[] };
/** An archived change: who approved it, when, and the accepted ids it landed. */
export type Landing = Approval & { change: string; title: string; nodes: string[] };
export type Workspace = {
  project: string; workspace?: string;
  spec?: SpecNode[];
  changes?: OpenChange[];
  specForms?: SpecForm[];
  /* What the reader has to say about itself before the page is believed — see WorkspaceNotices. */
  notices?: string[];
  landings?: Landing[];
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
  /** The open change the board shows, or null for the accepted specification. */
  change: OpenChange | null;
  specById: Map<string, SpecNode>;
  /** Every form present, from the nodes themselves: the registry is the project's, none is named here. */
  forms: string[];
  /** For each node, the nodes that name it and the field they name it in. */
  incoming: Map<string, Array<{ from: string; field: string }>>;
  kinds: Map<string, AdmissionKind | null>;
  /** For an accepted node, the archived change that landed it (newest first wins). */
  landedBy: Map<string, Landing>;
};

/**
 * The model as it would be after the change: the accepted nodes with the delta applied, every node
 * the change touches marked. The accepted view is the accepted specification, untouched.
 */
export function mergeChange(accepted: SpecNode[], change: OpenChange): SpecNode[] {
  const uncommitted = new Set(change.uncommitted);
  const delta = new Map(change.nodes.map((node) => [node.id, node]));
  const removed = new Set(change.removed);
  const merged: SpecNode[] = accepted.map((node) => {
    const replacement = delta.get(node.id);
    if (replacement) return { ...replacement, before: node.sections, uncommitted: uncommitted.has(replacement.path) };
    return removed.has(node.id) ? { ...node, mark: "removed" as ChangeMark } : node;
  });
  for (const node of change.nodes) if (node.mark === "added") merged.push({ ...node, uncommitted: uncommitted.has(node.path) });
  return merged.sort((left, right) => left.title.localeCompare(right.title) || left.id.localeCompare(right.id));
}

export function readBoard(workspace: Workspace, changeName: string | null = null): Board {
  const change = workspace.changes?.find((candidate) => candidate.name === changeName) ?? null;
  const spec = change ? mergeChange(workspace.spec ?? [], change) : workspace.spec ?? [];
  entityTitles.clear();
  firstSentences.clear();
  for (const node of spec) { entityTitles.set(node.id, node.title); firstSentences.set(node.id, firstSentence(node)); }
  const specById = new Map(spec.map((node) => [node.id, node]));
  const forms = [...new Set(spec.map((node) => node.form))].sort();
  const incoming = new Map<string, Array<{ from: string; field: string }>>();
  for (const node of spec) {
    for (const [field, ids] of Object.entries(node.edges ?? {})) {
      for (const id of ids) incoming.set(id, [...(incoming.get(id) ?? []), { from: node.id, field }]);
    }
  }
  const kinds = new Map(spec.map((node) => [node.id, admissionKind(node)]));
  const landedBy = new Map<string, Landing>();
  for (const landing of workspace.landings ?? []) for (const id of landing.nodes) if (!landedBy.has(id)) landedBy.set(id, landing);
  return { spec, change, specById, forms, incoming, kinds, landedBy };
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
const firstSentences = new Map<string, string>();
/** The first sentence of a node's first written section: what a preview shows. */
export function firstSentence(node: SpecNode): string {
  const text = Object.values(node.sections ?? {}).map((body) => body.replace(/<!--[\s\S]*?-->/g, "").trim()).find(Boolean) ?? "";
  const flat = text.replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
  const end = flat.search(/[.!?](\s|$)/);
  return end >= 0 ? flat.slice(0, end + 1) : flat;
}
/**
 * A reference to a related node: pointing at it, or focusing it, shows its title and first sentence
 * beside it without replacing the node that is open (QA-01m4ghr8h4345h3tt86nb28eqx).
 */
export function RelatedRef({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  const [shown, setShown] = useState(false);
  const sentence = firstSentences.get(id);
  return <span className="ref-preview" onMouseEnter={() => setShown(true)} onMouseLeave={() => setShown(false)} onFocus={() => setShown(true)} onBlur={() => setShown(false)}>
    <EntityButton id={id} className="spec-ref" onOpen={onOpen}>{titleOf(id) ?? id}</EntityButton>
    {shown && <span className="ref-preview__card" role="tooltip"><b>{titleOf(id) ?? id}</b>{sentence ? <span>{sentence}</span> : null}</span>}
  </span>;
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

/** The number beside a view: exactly what that view lists (QA-01m4ghr8bn64wazxnap80vhvhe). */
export function viewCount(board: Board, key: ViewKey): number {
  const entry = VIEWS.find((candidate) => candidate.key === key)!;
  return entry.forms.length ? board.spec.filter((node) => (entry.forms as readonly string[]).includes(node.form)).length : board.spec.length;
}

/* ══ The rail ══════════════════════════════════════════
   The specification list, and the four diagrams of the same model beside it. */
export function Rail({ board, refreshed, view = "spec", onView = () => {}, changes = [], change = null, onChange = () => {} }: {
  board: Board | null; refreshed: number; view?: ViewKey; onView?: (view: ViewKey) => void;
  changes?: OpenChange[]; change?: string | null; onChange?: (name: string | null) => void;
}) {
  return <nav className="rail" aria-label="Board sections">
    <div className="rail__brand"><BrandMark size={22} /><span>Kotta</span></div>
    <div className="rail__group">
      <div className="rail__head">the model</div>
      {VIEWS.map((entry) => <button key={entry.key} type="button" className={`rail__item ${view === entry.key ? "is-active" : ""}`}
        aria-current={view === entry.key ? "page" : undefined} onClick={() => onView(entry.key)}>
        <span className="rail__label">{entry.label}</span>
        <span className="rail__count" aria-label={`${entry.label} lists ${board ? viewCount(board, entry.key) : 0}`}>{board ? viewCount(board, entry.key) : "—"}</span>
      </button>)}
    </div>
    <div className="rail__group">
      <div className="rail__head">open changes</div>
      <button type="button" className={`rail__item ${change === null ? "is-active" : ""}`} aria-pressed={change === null} onClick={() => onChange(null)}>
        <span className="rail__label">Accepted specification</span>
      </button>
      {changes.map((entry) => <button key={entry.name} type="button" className={`rail__item ${change === entry.name ? "is-active" : ""}`}
        aria-pressed={change === entry.name} title={entry.name} onClick={() => onChange(entry.name)}>
        <span className="rail__label">{entry.title}</span>
        <span className="rail__count">{entry.nodes.length + entry.removed.length}</span>
      </button>)}
      {changes.length === 0 && <div className="rail__meta">none open</div>}
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

/** Search reads a node's title, its id and the text of its sections (QA-01m4ghr864w6xe125fkvrdptmh). */
export function matches(node: SpecNode, term: string): boolean {
  const flat = (text: string) => text.toLowerCase().replace(/\s+/g, " ");
  return flat(node.title).includes(term) || node.id.toLowerCase().includes(term) || Object.values(node.sections ?? {}).some((body) => flat(body).includes(term));
}

/** Plain words for an admission (QA-01m4ghr8bn64wazxnap80vhvhe). */
export const ADMISSION_LABEL: Record<AdmissionKind | "none", string> = {
  structural: "gap admitted: structural", unexamined: "gap admitted: not examined", unimplemented: "gap admitted: not built", none: "no gap admitted",
};

/** The marks every row of a group shares, said once in the group's head (QA-01m4ghr80v0r92aw1d9rq9zt6f). */
export function sharedMarks(nodes: SpecNode[], kindOf: Map<string, AdmissionKind | null>): { mark?: ChangeMark; level?: string; decider?: string; kind?: AdmissionKind | "none" } {
  if (nodes.length < 2) return {};
  const one = <T,>(values: T[]) => (values.every((value) => value === values[0]) ? values[0] : undefined);
  const shared: { mark?: ChangeMark; level?: string; decider?: string; kind?: AdmissionKind | "none" } = {};
  const mark = one(nodes.map((node) => node.mark));
  if (mark) shared.mark = mark;
  const level = one(nodes.map((node) => node.provenance?.level));
  if (level) shared.level = level;
  const decider = one(nodes.map((node) => node.provenance?.decided_by));
  if (decider) shared.decider = decider;
  const kind = one(nodes.map((node) => kindOf.get(node.id) ?? "none"));
  if (kind) shared.kind = kind;
  return shared;
}
const MARK_WORD: Record<ChangeMark, string> = { added: "added", changed: "changed", removed: "removed" };

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
    .filter((node) => !term || matches(node, term))
    .filter((node) => !agentOnly || agentDecided(node));

  // Counted apart, never as one total: the three ask for opposite work, and "nobody looked" is not
  // the same debt as "many sites realise this and none can name it".
  const counts = (predicate: (node: SpecNode) => boolean) => board.spec.filter(predicate).length;
  const filters: Array<{ key: SpecFilter; label: string; count: number }> = [
    { key: "all", label: "all", count: board.spec.length },
    { key: "kept", label: ADMISSION_LABEL.none, count: counts((node) => kindOf.get(node.id) === null) },
    ...ADMISSION_KINDS.map((kind) => ({ key: kind as SpecFilter, label: ADMISSION_LABEL[kind], count: counts((node) => kindOf.get(node.id) === kind) })),
  ];
  const grouped = board.forms
    .filter((name) => rows.some((node) => node.form === name))
    .map((name) => ({ form: name, nodes: rows.filter((node) => node.form === name) }));

  return <div className="view">
    <div className="view__head">
      <div>
        <h2>{board.change ? board.change.title : "Specification"}</h2>
        <p>{board.change
          ? <>The model as it would be after this change — {board.spec.length} nodes; what the change adds, changes or removes is marked.</>
          : <>The accepted technical model — {board.spec.length} nodes across {board.forms.length} forms. Read-only: a node changes when it lands on the base branch.</>}</p>
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
      <input type="search" className="filters__search" data-search value={query} placeholder="find by title or text  ( / )" aria-label="Find a specification node by its title or its text"
        onChange={(event) => onQuery(event.target.value)} />
    </div>
    {agentOnly && <p className="view__filtered" role="status">Only what the agent decided on its own — the list to read through first.</p>}
    {rows.length === 0 && <p className="view__empty">No node matches. {board.spec.length === 0
      ? "This workspace has no specification yet. A node is drafted from the registered forms in the calling chat, or with the CLI's spec command."
      : "Widen the filters, or clear the search."}</p>}
    {grouped.map((group) => {
      const shared = sharedMarks(group.nodes, kindOf);
      const said = [shared.mark && MARK_WORD[shared.mark], shared.level && LEVEL_LABEL[shared.level as keyof typeof LEVEL_LABEL], shared.decider && DECIDER_LABEL[shared.decider as ProvenanceDecider], shared.kind && ADMISSION_LABEL[shared.kind]].filter(Boolean);
      return <section key={group.form} className="spec-group">
        <div className="spec-group__head">{group.form.replace(/-/g, " ")}<span>{group.nodes.length}</span>{said.length > 0 && <em className="spec-group__shared">every one: {said.join(" · ")}</em>}</div>
        {group.nodes.map((node) => {
          const kind = kindOf.get(node.id);
          const named = board.incoming.get(node.id)?.length ?? 0;
          return <EntityButton key={node.id} id={node.id} className="spec-row" onOpen={onOpen}>
            <span className="spec-row__title">{node.title}</span>
            <span className="spec-row__meta">
              <Tail id={node.id} />
              {node.mark && !shared.mark && <ChangeTag node={node} />}
              {node.uncommitted && shared.mark && <span className="tag tag-outline">not committed</span>}
              <ProvenanceBadges provenance={node.provenance} hideLevel={Boolean(shared.level)} hideDecider={Boolean(shared.decider)} />
              {!shared.kind && (kind
                ? <span className={`tag admission admission-${kind}`}>{ADMISSION_LABEL[kind]}</span>
                : <span className="tag tag-neutral">{ADMISSION_LABEL.none}</span>)}
              <span className="spec-row__leaning">{named ? `${named} node${named === 1 ? "" : "s"} name${named === 1 ? "s" : ""} it` : "nothing names it"}</span>
              {brokenReferences(node, board).length > 0 && <span className="tag broken-tag">holds a broken reference</span>}
            </span>
          </EntityButton>;
        })}
      </section>;
    })}
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
 * A node's relations, grouped by edge and named by a phrase that reads in its own direction from the
 * node shown (BR-01m4gg8w74b37208tgnb4w6cvj); a project's own edge keeps its field's name.
 */
function Relations({ node, board, onOpen }: { node: SpecNode; board: Board; onOpen: (id: string) => void }) {
  const groups = new Map<string, string[]>();
  for (const [field, ids] of Object.entries(node.edges ?? {})) if (ids.length) groups.set(relationPhrase(field, "out"), [...(groups.get(relationPhrase(field, "out")) ?? []), ...ids]);
  for (const { from, field } of board.incoming.get(node.id) ?? []) {
    const phrase = relationPhrase(field, "in");
    groups.set(phrase === field ? `${field} (from)` : phrase, [...(groups.get(phrase === field ? `${field} (from)` : phrase) ?? []), from]);
  }
  if (!groups.size) return null;
  return <section className="drawer__section">
    <div className="drawer__section-head">Relations</div>
    {[...groups].map(([phrase, ids]) => <div key={phrase} className="spec-edge">
      <span className="spec-edge__phrase">{phrase}</span>
      <span className="spec-panel__refs">{[...new Set(ids)].map((id) => board.specById.has(id)
        ? <RelatedRef key={id} id={id} onOpen={onOpen} />
        : <BrokenRef key={id} id={id} />)}</span>
    </div>)}
  </section>;
}

/**
 * A reference to a node that does not exist, said as such with what closes it, wherever it is shown
 * (BR-01m4gmdmy4keq12tj73ahtskx0).
 */
export function BrokenRef({ id }: { id: string }) {
  return <span className="broken-ref" role="note"><b>Broken reference</b> <code>{id}</code> — no such node. Add the node, or correct or remove the reference, in a change.</span>;
}
/** The ids a node names that no node of the board carries. */
export function brokenReferences(node: SpecNode, board: Board): string[] {
  return [...new Set(Object.values(node.edges ?? {}).flat().filter((id) => !board.specById.has(id)))];
}

const day = (at: string) => (at ? at.slice(0, 10) : "an unrecorded day");
const DECIDED_SENTENCE: Record<ProvenanceDecider, string> = {
  human: "You decided this node.",
  "agent-proposed-human-approved": "The agent proposed this node and you approved it.",
  "agent-decided": "The agent decided this node alone; it was approved with the change as a whole, not reviewed one by one.",
};

/** What the approval behind a node covers (BR-01m4gh4rxe5navrnzfz0t5a2jf). */
function ApprovalNote({ node, board }: { node: SpecNode; board: Board }) {
  const decider = node.provenance?.decided_by;
  const own = decider ? DECIDED_SENTENCE[decider] : "The node records no one as having decided it.";
  if (node.mark && board.change) {
    const approval = board.change.approval;
    return <p className="approval-note">{approval
      ? <>In the change <b>{board.change.title}</b>, approved by {approval.by} on {day(approval.at)}. {own}</>
      : <>In the change <b>{board.change.title}</b>, which nobody has said yes to yet. {own}</>}</p>;
  }
  const landing = board.landedBy.get(node.id);
  if (!landing) return null;
  return <p className="approval-note">Landed with the change <b>{landing.title}</b>, approved by {landing.by} on {day(landing.at)}. {own}</p>;
}

export function EntityDrawer({ id, board, onClose, onOpen, onBack, canGoBack = false, restoreTo, onLeave }: {
  id: string; board: Board; onClose: () => void; onOpen: (id: string) => void; onBack?: () => void; canGoBack?: boolean;
  /** Where to show the node from when the reader stepped back to it; opened forward it shows from its top. */
  restoreTo?: number;
  /** Told how far the reader had scrolled a node when another one replaces it. */
  onLeave?: (id: string, scroll: number) => void;
}) {
  const ref = useDialog(onClose);
  const title = useRef<HTMLHeadingElement>(null);
  // Recorded while the node is read: by the time it is replaced, the new content may have clamped it.
  const scrolled = useRef(0);
  // A node opened from a list or another node shows from its top with its title focused; stepping
  // back returns to where the reader left it (BR-01m4gmdmcjc5rcf90rh8hjz3g3).
  useLayoutEffect(() => {
    const drawer = ref.current;
    if (!drawer) return;
    drawer.scrollTop = restoreTo ?? 0;
    scrolled.current = drawer.scrollTop;
    if (restoreTo === undefined) title.current?.focus({ preventScroll: true });
    return () => { onLeave?.(id, scrolled.current); };
  }, [id]);
  const node = board.specById.get(id);
  const place = node ? placeOf(board.spec, id) : [];
  const fields: Array<[string, string]> = [];
  if (node) {
    fields.push(["form", node.form.replace(/-/g, " ")], ["file", node.path]);
    if (node.capability) fields.push(["capability", node.capability]);
    for (const admission of node.accepted) fields.push(["gap admitted", admission]);
  }

  return <div className="scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="drawer scroll" role="dialog" aria-modal="true" aria-label={`${node?.form ?? "node"}: ${node?.title ?? id}`} tabIndex={-1} ref={ref}
      onScroll={(event) => { scrolled.current = event.currentTarget.scrollTop; }}>
      <div className="drawer__bar">
        {canGoBack && onBack && <button type="button" className="drawer__back" onClick={onBack}>← Back</button>}
        <span className="tag tag-outline">{node?.form.replace(/-/g, " ") ?? "node"}</span>
        <Tail id={id} />
        <button type="button" className="drawer__close" onClick={onClose}>Close · esc</button>
      </div>
      {!node
        ? <div className="drawer__gone"><Dangling field="reference" id={id} /></div>
        : <>
          {place.length > 0 && <nav className="drawer__place" aria-label="Place in the tree">
            {place.map((step, index) => <span key={step.id}>{index > 0 && <span aria-hidden="true"> › </span>}
              <button type="button" className="drawer__place-step" onClick={() => onOpen(step.id)}>{step.title}</button></span>)}
          </nav>}
          <h2 className="drawer__title" tabIndex={-1} ref={title}>{node.title}</h2>
          {node.mark && <p className="drawer__change"><ChangeTag node={node} /></p>}
          {Object.entries(node.sections ?? {}).map(([name, body]) => body && body.trim()
            ? <section key={name} className="drawer__section">
              <div className="drawer__section-head">{titleCase(name)}</div>
              <MarkdownContent value={body} onEntity={onOpen} />
            </section>
            : null)}
          {node.before && <section className="drawer__section">
            <div className="drawer__section-head">Before the change</div>
            {Object.entries(node.before).map(([name, body]) => body && body.trim() && body !== node.sections?.[name]
              ? <div key={name}><div className="spec-edge__phrase">{titleCase(name)}</div><MarkdownContent value={body} onEntity={onOpen} /></div>
              : null)}
          </section>}
          <Relations node={node} board={board} onOpen={onOpen} />
          <ApprovalNote node={node} board={board} />
          <ProvenancePanel node={node} onOpen={onOpen} />
          <dl className="drawer__fields">
            {fields.map(([key, value], index) => <div key={`${key}-${index}`}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>)}
          </dl>
        </>}
    </div>
  </div>;
}

/* ══ An open change ════════════════════════════════════
   What waits at the gate: the proposal, its open decisions and where it stands. Read-only — the
   gate is in the conversation, never here (BR-01m40e522gtq49knhy51hr9e3d). */
const MARK_LABEL: Record<ChangeMark, string> = { added: "added", changed: "changed", removed: "removed" };
export function ChangeTag({ node }: { node: SpecNode }) {
  if (!node.mark) return null;
  return <>
    <span className={`tag change-mark change-mark-${node.mark}`}>{MARK_LABEL[node.mark]}</span>
    {node.uncommitted && <span className="tag tag-outline">not committed</span>}
  </>;
}
export function ChangeHeader({ change, onOpen }: { change: OpenChange; onOpen: (id: string) => void }) {
  const state = change.approved ? "approved" : change.planned ? "planned, not approved" : "not planned";
  const counts = { human: 0, "agent-proposed-human-approved": 0, "agent-decided": 0, none: 0 };
  for (const node of change.nodes) counts[node.provenance?.decided_by ?? "none"] += 1;
  const approval = change.approval;
  return <section className="banner banner--change" aria-label={`Open change: ${change.title}`}>
    <p><b>Open change</b> · <code>{change.name}</code> · {state}
      {change.uncommitted.length > 0 && <> · <span className="tag tag-outline">not committed</span> {change.uncommitted.length} file{change.uncommitted.length === 1 ? "" : "s"}</>}</p>
    <p className="approval-summary">{approval
      ? <>Approved by <b>{approval.by}</b> on {day(approval.at)}. The yes covers the whole change as planned. As its nodes&apos; provenance records it — the agent wrote those marks — {counts.human} were decided by you, {counts["agent-proposed-human-approved"]} the agent proposed and you approved, and {counts["agent-decided"]} the agent decided alone.</>
      : <>Nobody has said yes to this change yet.</>}</p>
    {approval && <details className="approval-list">
      <summary>What the gate listed as the agent&apos;s own decisions · {approval.agentDecidedAtGate.length}</summary>
      <ul>{approval.agentDecidedAtGate.map((line, index) => <li key={index}><MarkdownContent value={line} onEntity={onOpen} /></li>)}</ul>
    </details>}
    <details>
      <summary>Proposal</summary>
      <MarkdownContent value={change.proposal} onEntity={onOpen} />
    </details>
    {(change.unreadable ?? []).length > 0 && <div className="unreadable" role="alert">
      <b>{change.unreadable!.length === 1 ? "One file of this change cannot be read" : `${change.unreadable!.length} files of this change cannot be read`}</b> — the change is not empty; these are left out until they are fixed:
      <ul>{change.unreadable!.map((file) => <li key={file.path}><code>{file.path}</code> — {file.reason}</li>)}</ul>
    </div>}
    {change.openDecisions.length > 0 && <details open>
      <summary>Open decisions · {change.openDecisions.length}</summary>
      <ul>{change.openDecisions.map((decision, index) => <li key={index}>
        <MarkdownContent value={`${decision.node}: ${decision.text}`} onEntity={onOpen} />
      </li>)}</ul>
    </details>}
  </section>;
}

/** With nothing accepted and several changes open, the board opens on their list (BR-01m40e522gtq49knhy51hr9e3d). */
export function ChangeList({ changes, onChange }: { changes: OpenChange[]; onChange: (name: string) => void }) {
  return <div className="view">
    <div className="view__head"><div><h2>Open changes</h2><p>Nothing is accepted yet. Each change below waits at, or has passed, its gate; open one to see its model.</p></div></div>
    <ul className="change-list">{changes.map((change) => <li key={change.name}>
      <button type="button" className="change-list__item" onClick={() => onChange(change.name)}>
        <b>{change.title}</b><span>{change.nodes.length + change.removed.length} nodes · {change.approved ? "approved" : change.planned ? "planned, not approved" : "not planned"}</span>
      </button>
    </li>)}</ul>
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

/* ══ The address ═════════════════════════════════════
   The view, its filters, the search, the arrangement, the open change and the open node live in the
   page's address (QA-01m4ghr864w6xe125fkvrdptmh): a copied address opens the same screen, and opening
   one node from another is a step the browser's back retraces (BR-01m4gg8w74b37208tgnb4w6cvj). */
export type Address = {
  view: ViewKey | "changes"; change: string | null; filter: SpecFilter; form: string; query: string;
  node: string | null; arrangement: Arrangement;
};
const VIEW_KEYS = new Set<string>([...VIEWS.map((entry) => entry.key), "changes"]);
export function readAddress(search: string): Partial<Address> & { explicit: boolean } {
  const params = new URLSearchParams(search);
  const out: Partial<Address> & { explicit: boolean } = { explicit: params.has("view") || params.has("change") };
  const view = params.get("view");
  if (view && VIEW_KEYS.has(view)) out.view = view as Address["view"];
  if (params.has("change")) out.change = params.get("change") || null;
  const filter = params.get("filter");
  if (filter && ["all", "kept", ...ADMISSION_KINDS].includes(filter)) out.filter = filter as SpecFilter;
  if (params.has("form")) out.form = params.get("form")!;
  if (params.has("q")) out.query = params.get("q")!;
  if (params.has("node")) out.node = params.get("node") || null;
  const arrangement = params.get("by");
  if (arrangement === "goal" || arrangement === "actor") out.arrangement = arrangement;
  return out;
}
export function writeAddress(search: string, address: Address): string {
  const params = new URLSearchParams(search);
  const set = (key: string, value: string | null, fallback: string | null) => (value === null || value === fallback ? params.delete(key) : params.set(key, value));
  set("view", address.view, null);
  set("change", address.change, null);
  set("filter", address.filter, "all");
  set("form", address.form, "all");
  set("q", address.query, "");
  set("node", address.node, null);
  set("by", address.arrangement, "goal");
  const text = params.toString();
  return text ? `?${text}` : "";
}

/* ══ App ═══════════════════════════════════════════════ */
export function App() {
  const initial = useMemo(() => readAddress(typeof window !== "undefined" ? window.location.search : ""), []);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(initial.node ?? null);
  const [refreshed, setRefreshed] = useState(0);
  const [specFilter, setSpecFilter] = useState<SpecFilter>(initial.filter ?? "all");
  const [specForm, setSpecForm] = useState<string>(initial.form ?? "all");
  const [specQuery, setSpecQuery] = useState<string>(initial.query ?? "");
  const [view, setView] = useState<Address["view"]>(initial.view ?? "spec");
  const [arrangement, setArrangement] = useState<Arrangement>(initial.arrangement ?? "goal");
  const [agentOnly, setAgentOnly] = useState(false);
  const [changeName, setChangeName] = useState<string | null>(initial.change ?? null);
  const [depth, setDepth] = useState(0);
  const [treeExpansion, setTreeExpansion] = useState<{ open: boolean; round: number }>({ open: false, round: 0 });
  const landed = useRef(initial.explicit);
  const stage = useRef<HTMLElement>(null);
  const scrolls = useRef(new Map<string, number>());
  const shownView = useRef<string>(initial.view ?? "spec");

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

  // Nothing accepted yet: the board opens on the one open change, or on the list of several
  // (BR-01m40e522gtq49knhy51hr9e3d) — unless the address already says where to be.
  useEffect(() => {
    if (!workspace || landed.current) return;
    landed.current = true;
    const changes = workspace.changes ?? [];
    if ((workspace.spec ?? []).length > 0 || changes.length === 0) return;
    if (changes.length === 1) setChangeName(changes[0].name);
    else setView("changes");
  }, [workspace]);

  // The address follows the state; opening a node is a step back can retrace.
  const address: Address = { view, change: changeName, filter: specFilter, form: specForm, query: specQuery, node: detailId, arrangement };
  const lastNode = useRef(detailId);
  useEffect(() => {
    const next = `${window.location.pathname}${writeAddress(window.location.search, address)}${window.location.hash}`;
    if (next === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
    if (detailId && detailId !== lastNode.current) window.history.pushState({ depth }, "", next);
    else window.history.replaceState({ depth }, "", next);
    lastNode.current = detailId;
  });
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const read = readAddress(window.location.search);
      lastNode.current = read.node ?? null;
      setDetailId(read.node ?? null);
      setView(read.view ?? "spec");
      setChangeName(read.change ?? null);
      setSpecFilter(read.filter ?? "all");
      setSpecForm(read.form ?? "all");
      setSpecQuery(read.query ?? "");
      setArrangement(read.arrangement ?? "goal");
      setDepth(typeof event.state?.depth === "number" ? event.state.depth : 0);
      setSteppedBack(true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const detailIdRef = useRef(detailId);
  detailIdRef.current = detailId;
  const open = useCallback((id: string) => { setSteppedBack(false); setDepth((current) => (detailIdRef.current ? current + 1 : 1)); setDetailId(id); }, []);
  const close = useCallback(() => { setDetailId(null); setDepth(0); }, []);
  const drawerScrolls = useRef(new Map<string, number>());
  const [steppedBack, setSteppedBack] = useState(false);

  // `/` reaches search from anywhere but a field; the view a reader returns to opens where it was left,
  // and a view switched to opens at its top (QA-01m4ghr864w6xe125fkvrdptmh, QA-01m4ghr8h4345h3tt86nb28eqx).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.closest("input, textarea, select, [contenteditable=true]"))) return;
      event.preventDefault();
      setView("spec");
      setSeeking((count) => count + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  // A `/` pressed before the search is on screen is kept until it is, then answered once.
  const [seeking, setSeeking] = useState(0);
  const sought = useRef(0);
  useEffect(() => {
    if (seeking === sought.current) return;
    const search = document.querySelector<HTMLInputElement>("[data-search]");
    if (!search) return;
    search.focus();
    sought.current = seeking;
  });
  useLayoutEffect(() => {
    const element = stage.current;
    if (!element || shownView.current === view) return;
    // The scroll of the view left was recorded while it was read; the switch itself may have clamped it.
    element.scrollTop = scrolls.current.get(view) ?? 0;
    shownView.current = view;
  }, [view]);
  useEffect(() => { if (workspace) document.title = `Kotta — ${workspace.project}`; }, [workspace]);

  const board = useMemo(() => (workspace ? readBoard(workspace, changeName) : null), [workspace, changeName]);
  const changes = workspace?.changes ?? [];

  return <div className="app">
    <Rail board={board} refreshed={refreshed} view={view === "changes" ? "spec" : view} onView={setView} changes={changes} change={board?.change?.name ?? null} onChange={(name) => { setChangeName(name); if (view === "changes") setView("spec"); }} />
    <div className="content">
      <TopBar workspace={workspace} board={board} onRefresh={() => void refresh()} refreshed={refreshed} />
      {workspace?.notices?.length ? <WorkspaceNotices notices={workspace.notices} /> : null}
      {workspace && error && <div className="banner" role="alert">
        <b>Last read failed.</b> Tried <code>GET {WORKSPACE_ENDPOINT}</code> — {error}. Showing the last good read.
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>Retry</button>
      </div>}
      <main className="stage scroll" ref={stage} onScroll={(event) => scrolls.current.set(shownView.current, event.currentTarget.scrollTop)}>
        {board?.change && <ChangeHeader change={board.change} onOpen={open} />}
        {board && view !== "changes" && <ProvenanceSummary board={board} agentOnly={agentOnly} onAgentOnly={setAgentOnly} />}
        {!board && <div className="view"><Placeholder rows={6} label="Reading the workspace…" />
          {error && <div className="banner" role="alert"><b>The workspace could not be read.</b> {error}. <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>Retry</button></div>}</div>}
        {board && view === "changes" && <ChangeList changes={changes} onChange={(name) => { setChangeName(name); setView("spec"); }} />}
        {board && view === "spec" && <SpecView board={board} filter={specFilter} form={specForm} query={specQuery} agentOnly={agentOnly}
          onFilter={setSpecFilter} onForm={setSpecForm} onQuery={setSpecQuery} onOpen={open} />}
        {board && view === "use-cases" && <UseCaseView board={board} agentOnly={agentOnly} onOpen={open} />}
        {board && view === "stories" && <StoryMapView board={board} agentOnly={agentOnly} onOpen={open} />}
        {board && view === "entities" && <EntityMapView board={board} agentOnly={agentOnly} onOpen={open} />}
        {board && view === "states" && <StateMachineView board={board} agentOnly={agentOnly} onOpen={open} />}
        {board && view === "tree" && <TreeView board={board} onOpen={open} arrangement={arrangement} onArrangement={setArrangement} expansion={treeExpansion} onExpansion={setTreeExpansion} />}
      </main>
    </div>
    {detailId && board && <EntityDrawer id={detailId} board={board} onClose={close} onOpen={open} canGoBack={depth > 1} onBack={() => window.history.back()}
      restoreTo={steppedBack ? drawerScrolls.current.get(detailId) : undefined} onLeave={(id, scroll) => drawerScrolls.current.set(id, scroll)} />}
  </div>;
}
