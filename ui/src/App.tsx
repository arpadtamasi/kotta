import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ══ Kotta Console v2 ═══════════════════════════════════
   The board is a read-only projection of canonical state. Calling chats use
   Kotta's MCP tools for structured actions and human approvals.
   Layout, wording and behaviour come from design/kotta/Kotta Console v2.dc.html;
   every colour, space and radius comes from the Modernist tokens in styles.css. */

/* ── Types ───────────────────────────────────────────── */
type Status = "backlog" | "defined" | "active" | "review" | "done";
type Migration = {
  project: string;
  legacy_ticket_count: number;
  migrated_ticket_count: number;
  ready_candidate_count: number;
  package_count: number;
  split_audit: Array<{ legacy_id: string; disposition: string; reason: string; targets: string[] }>;
};
type Contract = {
  id: string; title: string; status: Status; types: string[]; profiles: string[]; priority: string; risk: string;
  batch: string | null; depends_on: string[]; blocks?: string[]; blocked?: boolean; resolution?: string;
  source_observation?: string | null; assigned_agent?: string | null; worktree?: string | null;
  execution_mode?: "fresh" | "inherited"; branch?: string | null; pull_request?: string | null; created_at?: string | null; updated_at?: string | null; sections: Record<string, string>;
  claim?: Claim | null;
  migration?: { legacy_id: string; legacy_title: string; lane: string; legacy_status: string; backlog_section: string; story_points: number | null; ready_candidate: boolean; split: boolean; status_correction?: string | null; source_file: string } | null;
};
type Claim = { contract: string; agent: string; branch: string; worktree: string; started_at: string };
type Batch = {
  id: string; title: string; status: string; kind: string; contracts: string[]; batches?: string[]; sections: Record<string, string>;
  created_at?: string | null; updated_at?: string | null;
  execution?: { mode?: string; parallelism?: number; stop_on_failure?: boolean };
  coordinator?: { branch?: string; base_branch?: string; base_commit?: string; cleaned_at?: string | null } | null;
};
type Observation = {
  id: string; title: string; status: "new" | "resolved"; observation_type: string; severity: string; confidence: string;
  discovered_during?: string | null; created_at?: string | null; resolution?: string; became?: string | null; sections: Record<string, string>;
};
type Decision = { id: string; title: string; date: string | null; sections: Record<string, string> };
type Diagnostic = { entity: string; id: string; worktree: string; message: string };
type KottaEvent = {
  id: string; entity: string; contract: string | null; kind: "message" | "turn-failed" | "lifecycle" | "approval"; created_at: string;
  role?: "human" | "assistant"; text?: string; thread_id?: string | null; attempt_of?: string | null; state?: string; summary?: string;
  approval_id?: string; phase?: "proposed" | "approved" | "rejected" | "cancelled" | "applied" | "failed"; action?: string;
  payload?: Record<string, unknown>; source_message?: string | null; error?: string | null;
};
export type Workspace = {
  project: string; workspace?: string; migration: Migration | null;
  contracts: Contract[]; batches: Batch[]; observations: Observation[]; decisions?: Decision[]; diagnostics?: Diagnostic[];
  events?: KottaEvent[];
  claims?: Claim[];
  /* What the reader has to say about itself before the page is believed — see WorkspaceNotices. */
  notices?: string[];
};

/** The rail's five destinations. `running` is an overlay over any of them, not a sixth destination. */
export type View = "home" | "observations" | "contracts" | "batches" | "decisions";

/* Reporting leaves the workspace: the board never writes a report, it hands off to GitHub. */
const BUG_REPORT_URL = "https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml";
/* The canonical workspace read endpoint. */
export const WORKSPACE_ENDPOINT = "/api/workspace";
/* The stored state and the board's word for it are the same again since T-023: `defined` on disk. */
const DEFINED: Status = "defined";
const CONTRACT_STATES: Status[] = ["backlog", "defined", "active", "review", "done"];

/* Identity is mixed for good (D-010): sequential ids stay, minted ones are `<type>-<26 char ULID>`. */
const MINTED_BODY = "[0-9a-hjkmnp-tv-z]{26}";
const ENTITY_SOURCE = `(?:O-\\d+(?:\\.\\d+)?|[TFPD]-\\d+|[TFPD]-${MINTED_BODY})`;
const ENTITY_PATTERN = new RegExp(`\\b${ENTITY_SOURCE}\\b`, "g");
const MINTED_ID = new RegExp(`^[TFPD]-${MINTED_BODY}$`);
/* Non-global twin of ENTITY_PATTERN: `.test` on a /g regex carries lastIndex between calls. */
const ID_TEST = new RegExp(`^${ENTITY_SOURCE}$`);

/** The short tail of a minted id — the part a human can still recognise (D-003). */
export function displayId(id: string): string {
  return MINTED_ID.test(id) ? `${id.slice(0, id.indexOf("-") + 1)}${id.slice(-8)}` : id;
}
const entityTitles = new Map<string, string>();
/** Human reference is the title; the raw id rides along for recall (D-003, D-01kz1yqm…). */
function entityLabel(id: string): string {
  const title = entityTitles.get(id);
  return title ? `${title} · ${id}` : id;
}
function titleOf(id: string): string | null {
  return entityTitles.get(id) ?? null;
}
function stampSuffix(id: string): "t" | "f" | "p" | "d" {
  if (/^P-/.test(id)) return "p";
  if (/^F-/.test(id)) return "f";
  if (/^D-/.test(id)) return "d";
  return "t"; // T- and legacy O-
}

/* ── Time ────────────────────────────────────────────── */
function parseDate(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(parsed) ? null : parsed;
}
export function daysSince(value?: string | null, now = Date.now()): number | null {
  const then = parseDate(value);
  return then === null || then > now ? null : Math.floor((now - then) / 86_400_000);
}
function relativeTime(iso?: string | null, now = Date.now()): string {
  const then = parseDate(iso);
  if (then === null || then > now) return "Unavailable";
  const secs = Math.round((now - then) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  return `${Math.round(secs / 86400)}d ago`;
}

export function formatDuration(milliseconds: number | null | undefined): string {
  if (milliseconds === null || milliseconds === undefined || !Number.isFinite(milliseconds) || milliseconds < 0) return "Unavailable";
  const seconds = Math.round(milliseconds / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

function elapsedSince(iso?: string | null, now = Date.now()): string {
  const then = parseDate(iso);
  return then === null || then > now ? "Unavailable" : formatDuration(now - then);
}

function formatTokens(value?: number | null): string {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? `${Math.round(value).toLocaleString("en-US")} tokens` : "Not recorded";
}

function useNow(interval = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);
  return now;
}

/* ── Markdown + entity links ─────────────────────────── */
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
/** In prose an entity reads as its title, with the id kept for recall (D-01kz1yqm…). */
export function MarkdownContent({ value, onEntity }: { value: string; onEntity: (id: string) => void }) {
  return <div className="prose"><ReactMarkdown
    remarkPlugins={[remarkGfm, remarkEntityLinks]}
    urlTransform={(url) => (/^(?:https?:|mailto:|#|entity:)/.test(url) ? url : "#")}
    components={{ a: ({ href = "", children }) => {
      const label = String(children);
      const entityId = href.startsWith("entity:") ? href.slice(7) : label.match(ENTITY_PATTERN)?.[0];
      if (entityId) {
        const known = titleOf(entityId);
        return <button type="button" className={`ref ref-${stampSuffix(entityId)}`} title={entityLabel(entityId)} onClick={() => onEntity(entityId)}>
          {known ?? entityId}{known ? <span className="ref__tail">{displayId(entityId)}</span> : null}
        </button>;
      }
      if (/^https?:|^mailto:/.test(href)) return <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>;
      return <span>{children}</span>;
    } }}
  >{normalizeMarkdown(value)}</ReactMarkdown></div>;
}

/* ── Derivation of everything the board shows ────────── */
export type Queue = { key: string; count: number; label: string; ask: string; age: number | null; view: View; filter?: Status };
export type Contradiction = {
  key: string; kind: string; subject: string; subjectId: string | null; title: string;
  leftLabel: string; left: string[]; rightLabel: string; right: string[]; command: string; action: string; view: View;
};
export type MenuItem = { id: string; title: string; batch: string | null; why: string; command: string };
export type ExecutionMetric = {
  id: string; contract: string; state: string; completedAt: string;
  startedAt: string | null; durationMs: number | null;
  usage: { input_tokens: number; output_tokens: number; total_tokens: number; cached_input_tokens?: number } | null;
};

export type Board = {
  contracts: Contract[]; batches: Batch[]; observations: Observation[]; decisions: Decision[];
  contractById: Map<string, Contract>; batchById: Map<string, Batch>; observationById: Map<string, Observation>;
  undisposed: Observation[]; inReview: Contract[]; closable: Batch[]; defined: Contract[]; running: Contract[]; activeBatches: Batch[];
  executions: ExecutionMetric[]; latestExecutionByContract: Map<string, ExecutionMetric>;
  queues: Queue[]; queueTotal: number; contradictions: Contradiction[]; menu: MenuItem[];
};

const isDone = (t?: Contract) => t?.status === "done";

/** Everything the three bands, the rail counts and the header stats are derived from. */
export function readBoard(workspace: Workspace): Board {
  const contracts = (workspace.contracts ?? []).map((contract) => contract.claim
    ? { ...contract, assigned_agent: contract.claim.agent, branch: contract.claim.branch }
    : contract);
  const batches = workspace.batches ?? [];
  const observations = workspace.observations ?? [];
  const decisions = workspace.decisions ?? [];
  const contractById = new Map(contracts.map((t) => [t.id, t]));
  const batchById = new Map(batches.map((p) => [p.id, p]));
  // Nesting is grouping: a parent's work is everything under it, so progress, closability and the
  // member list all read the subtree rather than the directly named contracts.
  const subtreeContracts = (batch: Batch, seen = new Set<string>()): string[] => {
    if (seen.has(batch.id)) return [];
    seen.add(batch.id);
    return [...batch.contracts, ...(batch.batches ?? []).flatMap((child) => {
      const nested = batchById.get(child);
      return nested ? subtreeContracts(nested, seen) : [];
    })];
  };
  const observationById = new Map(observations.map((f) => [f.id, f]));
  const executions = (workspace.events ?? []).flatMap((event): ExecutionMetric[] => {
    if (event.kind !== "lifecycle" || !event.contract || !event.state?.startsWith("execution-")) return [];
    const payload = event.payload ?? {};
    const duration = typeof payload.duration_ms === "number" && Number.isFinite(payload.duration_ms) && payload.duration_ms >= 0 ? payload.duration_ms : null;
    const rawUsage = payload.token_usage && typeof payload.token_usage === "object" ? payload.token_usage as Record<string, unknown> : null;
    const usage = rawUsage
      && [rawUsage.input_tokens, rawUsage.output_tokens, rawUsage.total_tokens].every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0)
      ? rawUsage as ExecutionMetric["usage"] : null;
    return [{
      id: event.id, contract: event.contract, state: event.state, completedAt: typeof payload.completed_at === "string" ? payload.completed_at : event.created_at,
      startedAt: typeof payload.started_at === "string" ? payload.started_at : null, durationMs: duration, usage,
    }];
  }).sort((left, right) => left.completedAt.localeCompare(right.completedAt) || left.id.localeCompare(right.id));
  const latestExecutionByContract = new Map<string, ExecutionMetric>();
  for (const execution of executions) latestExecutionByContract.set(execution.contract, execution);
  // Every surface names an entity by its title, so the title index is part of reading the board.
  entityTitles.clear();
  for (const entity of [...contracts, ...batches, ...observations, ...decisions]) entityTitles.set(entity.id, entity.title);

  // The three queues are the human decisions surfaced directly in chat.
  const undisposed = observations.filter((f) => f.status === "new");
  const inReview = contracts.filter((t) => t.status === "review");
  const closable = batches.filter((p) => p.status !== "done" && subtreeContracts(p).length > 0 && subtreeContracts(p).every((id) => isDone(contractById.get(id))) && (p.batches ?? []).every((child) => batchById.get(child)?.status === "done"));
  // The backlog menu is deliberately NOT a queue: a defined contract is an option, not a debt.
  const defined = contracts.filter((t) => t.status === DEFINED);
  const running = contracts.filter((t) => t.status === "active");
  const activeBatches = batches.filter((p) => p.status === "active" || subtreeContracts(p).some((id) => contractById.get(id)?.status === "active"));

  const oldest = (values: Array<string | null | undefined>) => values.reduce<number | null>((max, value) => {
    const age = daysSince(value);
    return age === null ? max : Math.max(max ?? 0, age);
  }, null);

  const queues: Queue[] = [
    { key: "observations", count: undisposed.length, label: "Observations without a disposition", ask: "yes / no · then it is gone", age: oldest(undisposed.map((f) => f.created_at)), view: "observations" },
    { key: "review", count: inReview.length, label: "Contracts waiting for review", ask: "accept, or request changes", age: oldest(inReview.map((t) => t.updated_at)), view: "contracts", filter: "review" },
    { key: "batches", count: closable.length, label: "Batches waiting to be closed", ask: "every member is done", age: oldest(closable.map((p) => p.updated_at)), view: "batches" },
  ];

  const label = (id: string) => titleOf(id) ?? id;
  const contradictions: Contradiction[] = [];
  // 1. Files and git disagree about the same contract — the board shows both and picks neither.
  for (const diagnostic of workspace.diagnostics ?? []) {
    const contract = contractById.get(diagnostic.id);
    contradictions.push({
      key: `drift:${diagnostic.id}`, kind: "state drift", subject: label(diagnostic.id), subjectId: diagnostic.id,
      title: "A live worktree disagrees with the committed contract",
      leftLabel: "files say", left: [`state: ${stateLabel(contract?.status ?? "unknown")}`, `.kotta/${contract?.status ?? "?"}/`],
      rightLabel: "git says", right: [diagnostic.worktree, diagnostic.message],
      command: "kotta validate", action: "Open contract", view: "contracts",
    });
  }
  // 2. A recorded link with nothing behind it. `kotta validate` reports the same ones it can see.
  const dangling = (from: string, field: string, target: string, kind: string) => contradictions.push({
    key: `dangling:${from}:${field}:${target}`, kind: "dangling reference", subject: label(from), subjectId: from,
    title: `${field} points at ${kind} that is not on disk`,
    leftLabel: "frontmatter says", left: [`${field}: ${target}`],
    rightLabel: "disk says", right: ["no such file", "the link is recorded, the entity is gone"],
    command: "kotta validate", action: "Open contract", view: "contracts",
  });
  for (const contract of contracts) {
    if (contract.source_observation && !observationById.has(contract.source_observation)) dangling(contract.id, "source_observation", contract.source_observation, "an observation");
    if (contract.batch && !batchById.has(contract.batch)) dangling(contract.id, "batch", contract.batch, "a batch");
    for (const field of ["depends_on", "blocks"] as const) {
      for (const reference of contract[field] ?? []) if (!contractById.has(reference)) dangling(contract.id, field, reference, "a contract");
    }
  }
  for (const batch of batches) for (const member of batch.contracts) if (!contractById.has(member)) dangling(batch.id, "contracts", member, "a contract");
  for (const batch of batches) for (const child of batch.batches ?? []) if (!batchById.has(child)) dangling(batch.id, "batches", child, "a batch");
  for (const observation of observations) if (observation.became && !contractById.has(observation.became)) dangling(observation.id, "became", observation.became, "a contract");
  // 3. Membership recorded on one side only: two files describe the same relationship differently.
  for (const contract of contracts) {
    const batch = contract.batch ? batchById.get(contract.batch) : null;
    if (batch && !batch.contracts.includes(contract.id)) contradictions.push({
      key: `member:${contract.id}`, kind: "membership", subject: label(contract.id), subjectId: contract.id,
      title: "The contract claims a batch that does not list it",
      leftLabel: "the contract says", left: [`batch: ${batch.id}`],
      rightLabel: "the batch says", right: [`contracts: ${batch.contracts.length ? batch.contracts.map(displayId).join(", ") : "—"}`],
      command: `kotta batch validate ${batch.id}`, action: "See batches", view: "batches",
    });
  }
  for (const batch of batches) for (const member of batch.contracts) {
    const contract = contractById.get(member);
    if (contract && contract.batch !== batch.id) contradictions.push({
      key: `member:${batch.id}:${member}`, kind: "membership", subject: label(batch.id), subjectId: batch.id,
      title: "The batch lists a contract that belongs elsewhere",
      leftLabel: "the batch says", left: [`contracts: … ${displayId(member)}`],
      rightLabel: "the contract says", right: [`batch: ${contract.batch ?? "null"}`],
      command: `kotta batch validate ${batch.id}`, action: "See batches", view: "batches",
    });
  }

  const menu: MenuItem[] = defined.map((contract) => {
    const waiting = (contract.depends_on ?? []).filter((id) => !isDone(contractById.get(id)));
    const unblocks = (contract.blocks ?? []).length;
    return {
      id: contract.id, title: contract.title, batch: contract.batch,
      why: waiting.length ? `waits on ${waiting.map((id) => titleOf(id) ?? displayId(id)).join(", ")}`
        : unblocks ? `unblocks ${unblocks} other${unblocks === 1 ? "" : "s"}` : "no blockers",
      command: `kotta contract execute ${contract.id} --agent codex`,
    };
  });

  return {
    contracts, batches, observations, decisions, contractById, batchById, observationById, subtreeContracts, executions, latestExecutionByContract,
    undisposed, inReview, closable, defined, running, activeBatches,
    queues, queueTotal: undisposed.length + inReview.length + closable.length, contradictions, menu,
  };
}

/* ── Small presentational bits ───────────────────────── */
/* The stored status is the label: the vocabulary rename removed the translation layer (T-023). */
export const stateLabel = (s: string) => s;
function StateTag({ state }: { state: string }) {
  return <span className={`tag state state-${state}`}>{stateLabel(state)}</span>;
}
function ClaimDot({ agent }: { agent?: string | null }) {
  const cls = agent === "codex" ? "dot-codex" : agent === "claude" ? "dot-claude" : "dot-none";
  return <span className={`dot ${cls}`} aria-hidden="true" />;
}
function executionSummary(metric?: ExecutionMetric | null): string {
  return metric ? `${metric.durationMs === null ? "Not recorded" : formatDuration(metric.durationMs)} · ${formatTokens(metric.usage?.total_tokens)}` : "Not recorded";
}
function entityAge(created?: string | null, updated?: string | null): string {
  const createdLabel = created ? `created ${relativeTime(created)}` : "created date unavailable";
  if (!updated || updated === created) return createdLabel;
  return `${createdLabel} · updated ${relativeTime(updated)}`;
}
/** The small monospace id marker the design puts beside a title. Never the label on its own. */
function Tail({ id }: { id: string }) {
  return <span className={`tail tail-${stampSuffix(id)}`}>{displayId(id)}</span>;
}
/** A row that opens an entity: the title is the accessible name, the id rides in `title`. */
function EntityButton({ id, className, children, onOpen }: { id: string; className: string; children: ReactNode; onOpen: (id: string) => void }) {
  return <button type="button" className={className} title={entityLabel(id)} onClick={() => onOpen(id)}>{children}</button>;
}
function CopyCommand({ command, label = "Copy" }: { command: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return <span className="cmd">
    <code>{command}</code>
    <button type="button" className="btn btn-ghost btn-sm" aria-label={`Copy command: ${command}`} onClick={() => {
      void navigator.clipboard?.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_200);
    }}>{copied ? "Copied" : label}</button>
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
   between two. Four rules above 24px, three below, two below 18px (Kotta Logo). */
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

/* ══ The rail ══════════════════════════════════════════ */
export function Rail({ view, onView, board, running, onWatch, refreshed }: {
  view: View; onView: (v: View) => void; board: Board | null; running: boolean; onWatch: () => void; refreshed: number;
}) {
  const chain: Array<{ id: View; step: string; label: string; sub: string; count: number | null }> = [
    { id: "observations", step: "01", label: "Observations", sub: "new information", count: board ? board.undisposed.length : null },
    { id: "contracts", step: "02", label: "Contracts", sub: "agreements", count: board ? board.contracts.length : null },
    { id: "batches", step: "03", label: "Batches", sub: "sequencing", count: board ? board.batches.length : null },
  ];
  const runningCount = board ? board.running.length : 0;
  const batchCount = board ? board.activeBatches.length : 0;
  return <nav className="rail" aria-label="Board sections">
    <div className="rail__head">
      <BrandMark />
      <h1 className="rail__brand">KOTTA</h1>
      <span className="rail__version">v2</span>
    </div>
    <button type="button" className={`rail__home ${view === "home" ? "is-active" : ""}`} aria-current={view === "home" ? "page" : undefined} onClick={() => onView("home")}>
      <span className="rail__home-label">Home</span>
      <span className="rail__count">{board ? board.queueTotal : "—"}</span>
    </button>
    <div className="rail__group">derivation chain</div>
    {chain.map((item) => <button key={item.id} type="button" className={`rail__item ${view === item.id ? "is-active" : ""}`}
      aria-current={view === item.id ? "page" : undefined} onClick={() => onView(item.id)}>
      <span className="rail__step">{item.step}</span>
      <span className="rail__label"><b>{item.label}</b><span>{item.sub}</span></span>
      <span className="rail__count">{item.count ?? "—"}</span>
    </button>)}
    <div className="rail__group rail__group--cross">cross-cutting</div>
    <button type="button" className={`rail__item ${view === "decisions" ? "is-active" : ""}`}
      aria-current={view === "decisions" ? "page" : undefined} onClick={() => onView("decisions")}>
      <span className="rail__step">·</span>
      <span className="rail__label"><b>Decisions</b><span>quoted, not staged</span></span>
      <span className="rail__count">{board ? board.decisions.length : "—"}</span>
    </button>
    <div className="rail__foot">
      <button type="button" className={`rail__watch ${running ? "is-live" : ""}`} onClick={onWatch}>
        <span className="rail__watch-top">
          <span className={`pulse ${running ? "is-live" : ""}`} aria-hidden="true" />
          Running
          <span className="rail__count rail__count--watch">{runningCount}</span>
        </span>
        <span className="rail__watch-sub">
          {runningCount
            ? `${runningCount} contract${runningCount === 1 ? "" : "s"} under way in ${batchCount} batch${batchCount === 1 ? "" : "es"} · Watch →`
            : "Nothing is running · Watch →"}
        </span>
      </button>
      <a className="rail__report" href={BUG_REPORT_URL} target="_blank" rel="noreferrer noopener" aria-label="Report a bug — opens the Kotta issue form on GitHub">
        <span className="rail__key" aria-hidden="true">!</span> Report a bug <span aria-hidden="true">↗</span>
      </a>
      <div className="rail__report-note">Opens GitHub. Nothing from this workspace is sent — you write and submit the report there.</div>
      <div className="rail__meta">read from frontmatter · no per-file git<br />refreshed {refreshed}s ago</div>
    </div>
  </nav>;
}

/* ══ Header ════════════════════════════════════════════ */
function initials(project: string): string {
  const words = project.split(/[\s\-_/]+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 2).map((w) => w[0]).join("") : project.slice(0, 2)).toUpperCase();
}
export function TopBar({ workspace, board, onHelp, onRefresh, refreshed }: {
  workspace: Workspace | null; board: Board | null; onHelp: () => void; onRefresh: () => void; refreshed: number;
}) {
  const project = workspace?.project ?? "workspace";
  const oldestWaiting = board?.queues.reduce<number | null>((oldest, queue) => queue.age === null ? oldest : Math.max(oldest ?? 0, queue.age), null) ?? null;
  const stats: Array<{ label: string; value: string; hot?: boolean }> = [
    { label: "waiting on you", value: board ? String(board.queueTotal) : "—", hot: Boolean(board?.queueTotal) },
    { label: "running", value: board ? `${board.running.length} in ${board.activeBatches.length} batch${board.activeBatches.length === 1 ? "" : "es"}` : "—" },
    { label: "oldest waiting", value: board ? (oldestWaiting === null ? "—" : `${oldestWaiting}d`) : "—", hot: Boolean(oldestWaiting && oldestWaiting > 30) },
    { label: "contradictions", value: board ? String(board.contradictions.length) : "—", hot: Boolean(board?.contradictions.length) },
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
    <button type="button" className="top__action" onClick={onHelp}><span className="top__key" aria-hidden="true">?</span> CLI fallback</button>
  </header>;
}

/* ══ Running strip ═════════════════════════════════════ */
function RunningStrip({ board, onWatch, onOpen }: { board: Board; onWatch: () => void; onOpen: (id: string) => void }) {
  const now = useNow();
  if (!board.running.length) return null;
  return <section className="live" aria-label="Running now">
    <div className="live__label"><span className="pulse is-live" aria-hidden="true" /> Running</div>
    <div className="live__items scroll" tabIndex={0} role="group" aria-label="Contracts running now">
      {board.running.map((contract) => <EntityButton key={contract.id} id={contract.id} className="live__item" onOpen={onOpen}>
        <span className="live__item-title">{contract.title}</span>
        <Tail id={contract.id} />
        <span className="live__item-meta">{contract.assigned_agent ?? "no claim"} · running {elapsedSince(contract.claim?.started_at, now)}</span>
      </EntityButton>)}
    </div>
    <button type="button" className="live__watch" onClick={onWatch}>Watch →</button>
  </section>;
}

/* ══ Home ══════════════════════════════════════════════ */
function BandHead({ id, title, children, tone }: { id: string; title: string; children: ReactNode; tone?: "alarm" }) {
  return <div className={`band__head ${tone === "alarm" ? "band__head--alarm" : ""}`}>
    <h2 id={id}>{title}</h2>
    <p>{children}</p>
  </div>;
}

export function HomeView({ workspace, board, error, onView, onOpen, onRetry }: {
  workspace: Workspace | null; board: Board | null; error: string | null;
  onView: (view: View, filter?: Status) => void; onOpen: (id: string) => void; onRetry: () => void;
}) {
  const loading = !board && !error;
  const emptyWorkspace = Boolean(board && !board.contracts.length && !board.observations.length && !board.batches.length);
  return <div className="home">
    <section className="band" aria-labelledby="band-waiting">
      <BandHead id="band-waiting" title="Waiting on you">
        Explicit decisions, oldest first.
      </BandHead>
      <div className="band__body">
        {loading && <Placeholder label="Reading the workspace…" />}
        {error && <BandError error={error} onRetry={onRetry} />}
        {board && !board.queueTotal && <p className="band__empty">Nothing waiting to decide. Every observation has a disposition, no contract sits in review, no batch is waiting to be closed.</p>}
        {board && board.queueTotal > 0 && board.queues.map((queue) => <button key={queue.key} type="button"
          className={`queue ${queue.count ? "" : "is-zero"}`} onClick={() => onView(queue.view, queue.filter)}>
          <span className="queue__top">
            <span className={`queue__n ${queue.age !== null && queue.age > 30 ? "is-hot" : ""}`}>{queue.count}</span>
            <span className="queue__label">{queue.label}</span>
          </span>
          <span className="queue__meta">
            <span className="queue__ask">{queue.ask}</span>
            <span className={`queue__age ${queue.age !== null && queue.age > 30 ? "is-hot" : ""}`}>{queue.age === null ? "no date on record" : `oldest ${queue.age}d`}</span>
          </span>
          {queue.age !== null && <span className="queue__bar"><span className={queue.age > 30 ? "is-hot" : ""} style={{ width: `${Math.min(100, (queue.age / 45) * 100)}%` }} /></span>}
        </button>)}
      </div>
    </section>

    <section className="band band--alarm" aria-labelledby="band-contradictions">
      <BandHead id="band-contradictions" title="Doesn't add up" tone="alarm">
        Conflicting canonical facts that need attention.
      </BandHead>
      <div className="band__body">
        {loading && <Placeholder label="Reading the workspace…" />}
        {error && <BandError error={error} onRetry={onRetry} />}
        {board && !board.contradictions.length && <p className="band__empty">Nothing contradictory. Every recorded link resolves, and no worktree disagrees with its contract.</p>}
        {board?.contradictions.map((item) => <article key={item.key} className="contra">
          <div className="contra__top">
            <span className="contra__kind">{item.kind}</span>
            {item.subjectId
              ? <EntityButton id={item.subjectId} className="contra__subject" onOpen={onOpen}>{item.subject}<Tail id={item.subjectId} /></EntityButton>
              : <span className="contra__subject">{item.subject}</span>}
          </div>
          <h3 className="contra__title">{item.title}</h3>
          <div className="contra__cmp">
            <div>
              <div className="contra__side">{item.leftLabel}</div>
              {item.left.map((line, i) => <div key={i} className="contra__line">{line}</div>)}
            </div>
            <div className="contra__right">
              <div className="contra__side">{item.rightLabel}</div>
              {item.right.map((line, i) => <div key={i} className="contra__line">{line}</div>)}
            </div>
          </div>
          <div className="contra__foot">
            <CopyCommand command={item.command} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => onView(item.view)}>{item.action}</button>
          </div>
        </article>)}
      </div>
    </section>

    <section className="band" aria-labelledby="band-menu">
      <BandHead id="band-menu" title="What runs next?">
        {board ? board.defined.length : "—"} executable contracts, with age visible.
      </BandHead>
      <div className="band__body">
        {loading && <Placeholder label="Reading the workspace…" />}
        {error && <BandError error={error} onRetry={onRetry} />}
        {board && !board.menu.length && <p className="band__empty">
          Nothing defined to run. {emptyWorkspace
            ? "This workspace is empty — write the first contract with the CLI:"
            : "Shape a backlog contract until it validates, then define it:"}
          <br /><code>{emptyWorkspace ? 'kotta contract new --title "…" --type feature' : "kotta contract sign <id> --approve"}</code>
        </p>}
        {board?.menu.map((item, index) => <div key={item.id} className={`menu ${index === 0 ? "is-first" : ""}`}>
          <div className="menu__top">
            <EntityButton id={item.id} className="menu__title" onOpen={onOpen}>{item.title}</EntityButton>
            <Tail id={item.id} />
          </div>
        <div className="menu__meta">
          <span className={`tag ${item.batch ? "tag-neutral" : "tag-outline"}`}>{item.batch ? titleOf(item.batch) ?? item.batch : "no batch"}</span>
          <span className="menu__why">{item.why}</span>
          <span className="menu__age">{entityAge(board.contractById.get(item.id)?.created_at, board.contractById.get(item.id)?.updated_at)}</span>
          </div>
          <div className="menu__run">
            <CopyCommand command={item.command} label="Run next →" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onOpen(item.id)}>Chain →</button>
          </div>
        </div>)}
        {board && board.menu.length > 0 && <button type="button" className="band__more" onClick={() => onView("contracts", DEFINED)}>See all {board.defined.length} defined →</button>}
      </div>
    </section>
  </div>;
}

function BandError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return <div className="band__error" role="alert">
    <b>The workspace could not be read.</b>
    <p>Tried <code>GET {WORKSPACE_ENDPOINT}</code> — {error}</p>
    <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
  </div>;
}

/* ══ Observations ══════════════════════════════════════ */
type ObsFilter = "waiting" | "dispositioned" | "all";
export function ObservationsView({ board, filter, onFilter, onOpen }: {
  board: Board; filter: ObsFilter; onFilter: (f: ObsFilter) => void; onOpen: (id: string) => void;
}) {
  const waiting = board.undisposed;
  const rows = board.observations.filter((f) => (filter === "all" ? true : filter === "waiting" ? f.status === "new" : f.status === "resolved"));
  const filters: Array<{ key: ObsFilter; label: string; count: number }> = [
    { key: "waiting", label: "waiting", count: waiting.length },
    { key: "dispositioned", label: "dispositioned", count: board.observations.length - waiting.length },
    { key: "all", label: "all", count: board.observations.length },
  ];
  return <div className="view">
    <div className="view__head">
      <div>
        <h2>Observations</h2>
        <p>New information, ordered with its age visible.</p>
      </div>
    </div>
    <div className="filters">
      <span className="filters__label">disposition</span>
      {filters.map((f) => <button key={f.key} type="button" className={`filter ${filter === f.key ? "is-active" : ""}`}
        aria-pressed={filter === f.key} onClick={() => onFilter(f.key)}>{f.label}<span>{f.count}</span></button>)}
    </div>
    {rows.length === 0 && <p className="view__empty">Nothing here — the {filter} list is empty.</p>}
    {rows.map((observation) => {
      const age = daysSince(observation.created_at);
      return <EntityButton key={observation.id} id={observation.id} className={`obs ${age !== null && age > 30 ? "is-stale" : ""}`} onOpen={onOpen}>
        <span className="obs__title">{observation.title}</span>
        <span className="obs__meta">
          <Tail id={observation.id} />
          <span className="tag tag-neutral">{observation.observation_type}</span>
          <span className={`tag sev-${observation.severity}`}>sev {observation.severity}</span>
          {observation.discovered_during && <span className="obs__during">seen during {titleOf(observation.discovered_during) ?? displayId(observation.discovered_during)}</span>}
          <span className={`obs__age ${age !== null && age > 30 ? "is-hot" : ""}`}>{observation.created_at ? `created ${relativeTime(observation.created_at)}` : "created date unavailable"}</span>
          {observation.became && <span className="obs__became">→ {titleOf(observation.became) ?? displayId(observation.became)}</span>}
        </span>
      </EntityButton>;
    })}
  </div>;
}

/* ══ Contracts ═════════════════════════════════════════ */
export function ContractsView({ board, filter, onFilter, query, onQuery, onOpen }: {
  board: Board; filter: Status | "all"; onFilter: (f: Status | "all") => void; query: string; onQuery: (q: string) => void; onOpen: (id: string) => void;
}) {
  const now = useNow();
  const needle = query.trim().toLowerCase();
  const rows = board.contracts
    .filter((t) => (filter === "all" ? true : t.status === filter))
    .filter((t) => !needle || `${t.id} ${t.title}`.toLowerCase().includes(needle));
  const count = (state: Status) => board.contracts.filter((t) => t.status === state).length;
  const filters: Array<{ key: Status | "all"; label: string; count: number }> = [
    { key: "all", label: "all", count: board.contracts.length },
    ...CONTRACT_STATES.map((state) => ({ key: state, label: stateLabel(state), count: count(state) })),
  ];
  return <div className="view">
    <div className="view__head">
      <div>
        <h2>Contracts</h2>
        <p>State, age and execution at scan speed.</p>
      </div>
      <label className="view__search">
        <span className="visually-hidden">Search contracts by title or id</span>
        <input className="input" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search title or id…" />
      </label>
    </div>
    <div className="filters">
      <span className="filters__label">state</span>
      {filters.map((f) => <button key={f.key} type="button" className={`filter ${filter === f.key ? "is-active" : ""}`}
        aria-pressed={filter === f.key} onClick={() => onFilter(f.key)}>{f.label}<span>{f.count}</span></button>)}
    </div>
    <div className="ctr__head" aria-hidden="true"><span>contract</span><span>state</span><span>age</span><span>execution</span></div>
    {rows.length === 0 && <p className="view__empty">No contract matches this filter{needle ? " and search" : ""}.</p>}
    {rows.map((contract) => <EntityButton key={contract.id} id={contract.id} className="ctr" onOpen={onOpen}>
      <span className="ctr__title">{contract.title}<Tail id={contract.id} /></span>
      <span><StateTag state={contract.blocked ? "blocked" : contract.status} /></span>
      <span className="ctr__age">{entityAge(contract.created_at, contract.updated_at)}</span>
      <span className="ctr__execution">{contract.status === "active"
        ? <><ClaimDot agent={contract.assigned_agent} />running {elapsedSince(contract.claim?.started_at, now)}</>
        : executionSummary(board.latestExecutionByContract.get(contract.id))}</span>
    </EntityButton>)}
  </div>;
}

/* ══ Batches ═══════════════════════════════════════════ */
export function BatchesView({ board, onOpen }: { board: Board; onOpen: (id: string) => void }) {
  return <div className="view">
    <div className="view__head">
      <div>
        <h2>Batches</h2>
        <p>Related work, progress and age.</p>
      </div>
    </div>
    {board.batches.length === 0 && <p className="view__empty">No batch on disk. A batch is written with <code>kotta batch new</code>.</p>}
    <div className="cards">
      {board.batches.map((batch) => {
        const memberIds = board.subtreeContracts(batch);
        const members = memberIds.map((id) => board.contractById.get(id)).filter((t): t is Contract => Boolean(t));
        const done = members.filter((t) => t.status === "done").length;
        const total = memberIds.length;
        return <EntityButton key={batch.id} id={batch.id} className={`card-batch ${batch.status === "active" ? "is-active" : ""}`} onOpen={onOpen}>
          <span className="card-batch__top">
            <StateTag state={batch.status} />
            <span className="card-batch__frac">{done}/{total}</span>
          </span>
          <span className="card-batch__title">{batch.title}<Tail id={batch.id} /></span>
          <span className="bar"><span style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></span>
          <span className="card-batch__why">{firstLine(batch.sections.goal) || "No goal recorded."}</span>
          <span className="card-batch__mode">{entityAge(batch.created_at, batch.updated_at)}</span>
        </EntityButton>;
      })}
    </div>
  </div>;
}
function firstLine(value?: string): string {
  return (value ?? "").split("\n").map((line) => line.trim()).find(Boolean) ?? "";
}

/* ══ Decisions ═════════════════════════════════════════ */
export function DecisionsView({ board, onOpen }: { board: Board; onOpen: (id: string) => void }) {
  const decisions = [...board.decisions].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b.id.localeCompare(a.id));
  return <div className="view">
    <div className="view__head">
      <div>
        <h2>Decisions</h2>
        <p>Durable choices, with their age visible.</p>
      </div>
    </div>
    {decisions.length === 0 && <p className="view__empty">No decision recorded yet. One is written with <code>kotta decision create --from &lt;file&gt; --approve</code>.</p>}
    {decisions.map((decision) => {
      const referenced = [...new Set((decision.sections.decision ?? "").match(new RegExp(`\\bD-(?:\\d+|${MINTED_BODY})\\b`, "g")) ?? [])].filter((id) => id !== decision.id);
      return <EntityButton key={decision.id} id={decision.id} className="dec" onOpen={onOpen}>
        <span className="dec__date">{decision.date ? relativeTime(decision.date) : "date unavailable"}</span>
        <span className="dec__body">
          <span className="dec__title">{decision.title}<Tail id={decision.id} /></span>
          {referenced.length > 0 && <span className="dec__refs">reads with {referenced.map((id) => titleOf(id) ?? displayId(id)).join(" · ")}</span>}
        </span>
      </EntityButton>;
    })}
  </div>;
}

/* ══ Derivation ════════════════════════════════════════
   `came from` and `goes with` name their target by title; a link with nothing behind
   it is drawn as `dangling reference` — the one place a bare id is the message. */
type Link = { id: string; title: string | null; note?: string };
function Dangling({ field, id }: { field: string; id: string }) {
  return <div className="dangling">
    <div className="dangling__kind">dangling reference</div>
    <div className="dangling__text"><code>{field}: {id}</code> — no such entity on disk. The link is recorded but the file is gone.</div>
  </div>;
}
function LinkRow({ link, onOpen }: { link: Link; onOpen: (id: string) => void }) {
  return <EntityButton id={link.id} className="deriv__link" onOpen={onOpen}>
    <span className="deriv__link-title">{link.title ?? displayId(link.id)}</span>
    <Tail id={link.id} />
    {link.note && <span className="deriv__link-note">{link.note}</span>}
  </EntityButton>;
}

export function DerivationPanel({ id, board, onOpen }: { id: string; board: Board; onOpen: (id: string) => void }) {
  const contract = board.contractById.get(id);
  const batch = board.batchById.get(id);
  const observation = board.observationById.get(id);

  // came from
  let came: ReactNode = <p className="deriv__none">Nothing records where this came from.</p>;
  if (contract) {
    const source = contract.source_observation;
    came = !source
      ? <p className="deriv__none">No <code>source_observation</code> recorded — written straight as a contract.</p>
      : board.observationById.has(source)
        ? <LinkRow link={{ id: source, title: titleOf(source), note: `disposition: contract · ${board.observationById.get(source)?.observation_type}` }} onOpen={onOpen} />
        : <Dangling field="source_observation" id={source} />;
  } else if (observation) {
    const during = observation.discovered_during;
    came = !during
      ? <p className="deriv__none">Not discovered during a contract — reported straight into the queue.</p>
      : board.contractById.has(during)
        ? <LinkRow link={{ id: during, title: titleOf(during), note: "seen during this contract" }} onOpen={onOpen} />
        : <Dangling field="discovered_during" id={during} />;
  } else if (batch) {
    came = <p className="deriv__none">A batch is written, not derived — it groups contracts by reason.</p>;
  }

  // goes with
  let goes: ReactNode = <p className="deriv__none">Nothing else goes with this.</p>;
  if (contract) {
    const batchId = contract.batch;
    const target = batchId ? board.batchById.get(batchId) : null;
    goes = !batchId
      ? <p className="deriv__none">Not in a batch — nothing else has to be solved together with it.</p>
      : !target
        ? <Dangling field="batch" id={batchId} />
        : <>
          <LinkRow link={{ id: target.id, title: target.title, note: firstLine(target.sections.goal) }} onOpen={onOpen} />
          <div className="deriv__siblings">
            {target.contracts.filter((member) => member !== contract.id).map((member) => {
              const sibling = board.contractById.get(member);
              return sibling
                ? <EntityButton key={member} id={member} className="deriv__sibling" onOpen={onOpen}>
                  <span>{sibling.title}</span><StateTag state={sibling.status} />
                </EntityButton>
                : <div key={member} className="deriv__sibling"><Dangling field="contracts" id={member} /></div>;
            })}
          </div>
        </>;
  } else if (observation) {
    const became = observation.became;
    goes = !became
      ? <p className="deriv__none">No contract was written from this yet.</p>
      : board.contractById.has(became)
        ? <LinkRow link={{ id: became, title: titleOf(became), note: "became this contract" }} onOpen={onOpen} />
        : <Dangling field="became" id={became} />;
  } else if (batch) {
    const nested = batch.batches ?? [];
    const memberIds = board.subtreeContracts(batch);
    goes = <div className="deriv__siblings">
      {nested.map((child) => {
        const grouped = board.batchById.get(child);
        return grouped
          ? <EntityButton key={child} id={child} className="deriv__sibling" onOpen={onOpen}>
            <span>{grouped.title}</span><StateTag state={grouped.status} />
          </EntityButton>
          : <div key={child} className="deriv__sibling"><Dangling field="batches" id={child} /></div>;
      })}
      {memberIds.length === 0 && nested.length === 0 && <p className="deriv__none">No member contracts.</p>}
      {memberIds.map((member) => {
        const sibling = board.contractById.get(member);
        return sibling
          ? <EntityButton key={member} id={member} className="deriv__sibling" onOpen={onOpen}>
            <span>{sibling.title}</span><StateTag state={sibling.status} />
          </EntityButton>
          : <div key={member} className="deriv__sibling"><Dangling field="contracts" id={member} /></div>;
      })}
    </div>;
  }

  return <section className="deriv" aria-label="Derivation">
    <div className="deriv__head"><b>Derivation</b><span>what it came from, what it goes with</span></div>
    <div className="deriv__block">
      <div className="deriv__kicker">came from</div>
      {came}
    </div>
    <div className="deriv__arrow" aria-hidden="true">↓</div>
    <div className="deriv__block deriv__block--self">
      <div className="deriv__kicker">this</div>
      <div className="deriv__self">{titleOf(id) ?? id}<Tail id={id} /></div>
    </div>
    <div className="deriv__arrow" aria-hidden="true">↓</div>
    <div className="deriv__block">
      <div className="deriv__kicker">goes with</div>
      {goes}
    </div>
  </section>;
}

/* ══ Entity drawer ═════════════════════════════════════ */
/** Escape closes, focus enters on open and returns to the invoking row on close. */
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

function approvalLabel(action?: string, payload?: Record<string, unknown>): string {
  if (action === "observation.resolve" && typeof payload?.disposition === "string") return `Resolve observation as ${titleCase(payload.disposition)}`;
  return ({
    "contract.sign": "Approve contract for execution",
    "contract.close": "Accept review and close contract",
    "contract.request-changes": "Request changes",
    "observation.resolve": "Resolve observation",
    "batch.close": "Close completed batch",
  } as Record<string, string>)[action ?? ""] ?? titleCase(action ?? "approval");
}

function EntityTimeline({ id, workspace }: {
  id: string; workspace: Workspace;
}) {
  const events = (workspace.events ?? []).filter((event) => event.entity === id);
  const approvalOutcome = (approvalId?: string) => [...events].reverse().find((event) => event.kind === "approval" && event.approval_id === approvalId && event.phase !== "proposed");
  const approvalState = (approvalId?: string) => approvalOutcome(approvalId)?.phase ?? "proposed";

  return <section className="timeline" aria-label="Read-only conversation and activity">
    <div className="timeline__head"><b>Conversation & activity</b><span>read-only · persisted on the control plane</span></div>
    <div className="timeline__events" role="log" aria-live="polite" aria-relevant="additions text">
      {events.length === 0 && <p className="timeline__empty">No recorded conversation or activity yet.</p>}
      {events.map((item) => {
        if (item.kind === "approval" && item.phase !== "proposed") return null;
        if (item.kind === "approval") {
          const phase = approvalState(item.approval_id);
          const outcome = approvalOutcome(item.approval_id);
          return <article key={item.id} id={`approval-${item.approval_id}`} tabIndex={-1} className={`approval approval--${phase}`}>
            <div className="approval__kind">Approval · {phase}</div>
            <b>{approvalLabel(item.action, item.payload)}</b>
            <code>{item.action} {item.entity}{item.action === "observation.resolve" ? ` --disposition ${String(item.payload?.disposition)}` : ""}</code>
            {outcome?.error && <span role="alert">{outcome.error}</span>}
            {phase === "proposed" && <span>Waiting in the calling chat.</span>}
          </article>;
        }
        if (item.kind === "message") return <article key={item.id} className={`message message--${item.role}`}><div className="message__role">{item.role === "human" ? "You" : "Kotta"}</div><div>{item.text}</div></article>;
        if (item.kind === "turn-failed") return <article key={item.id} className="message message--error" role="alert"><div className="message__role">Turn failed</div><div>{item.error}</div></article>;
        return <article key={item.id} className="lifecycle"><div className="message__role">{item.state}</div><div>{item.summary}</div></article>;
      })}
    </div>
  </section>;
}

function ContractSection({ label, value, onOpen }: { label: string; value?: string; onOpen: (id: string) => void }) {
  if (!value?.trim()) return null;
  return <section className="contract-brief__section">
    <h3>{label}</h3>
    <MarkdownContent value={value} onEntity={onOpen} />
  </section>;
}

function ContractTabs({ contract, workspace, board, onOpen }: { contract: Contract; workspace: Workspace; board: Board; onOpen: (id: string) => void }) {
  const tabs = ["brief", "context", "activity"] as const;
  type Tab = typeof tabs[number];
  const [active, setActive] = useState<Tab>("brief");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const now = useNow();
  const latest = board.latestExecutionByContract.get(contract.id);
  const normalizedName = (name: string) => name.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const sectionByName = new Map(Object.entries(contract.sections).map(([name, body]) => [normalizedName(name), body]));
  const section = (name: string) => sectionByName.get(normalizedName(name));
  const goal = section("user goal")?.trim() || section("outcome");
  const outcome = section("outcome")?.trim() && section("outcome")?.trim() !== goal?.trim() ? section("outcome") : undefined;
  const briefSections = [goal, outcome, section("acceptance"), section("constraints"), section("verification")].filter((value) => value?.trim());
  const contextKeys = ["scope", "non goals", "open decisions", "execution notes"];
  const activityKeys = ["review evidence", "verification performed", "deviations", "observations created", "known concerns"];
  const reserved = new Set(["user goal", "outcome", "acceptance", "constraints", "verification", ...contextKeys, ...activityKeys].map(normalizedName));
  const specialist = Object.entries(contract.sections).filter(([name, body]) => body?.trim() && !reserved.has(normalizedName(name)));
  const onTabKey = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActive(tabs[next]);
    tabRefs.current[next]?.focus();
  };

  return <>
    <dl className="contract-metrics" aria-label="Contract status and age">
      <div><dt>State</dt><dd><StateTag state={contract.blocked ? "blocked" : contract.status} /></dd></div>
      <div><dt>Age</dt><dd>{entityAge(contract.created_at, contract.updated_at)}</dd></div>
      <div><dt>Current run</dt><dd>{contract.status === "active" ? `Running ${elapsedSince(contract.claim?.started_at, now)}` : "Not running"}</dd></div>
      <div><dt>Last execution</dt><dd>{latest?.durationMs === null || !latest ? "Not recorded" : formatDuration(latest.durationMs)}</dd></div>
      <div><dt>Tokens</dt><dd>{formatTokens(latest?.usage?.total_tokens)}</dd></div>
    </dl>
    <div className="contract-tabs" role="tablist" aria-label="Contract detail sections">
      {tabs.map((tab, index) => <button
        key={tab} type="button" role="tab" id={`${contract.id}-${tab}-tab`} aria-controls={`${contract.id}-${tab}-panel`}
        aria-selected={active === tab} tabIndex={active === tab ? 0 : -1}
        ref={(node) => { tabRefs.current[index] = node; }} onClick={() => setActive(tab)} onKeyDown={(event) => onTabKey(event, index)}
      >{titleCase(tab)}</button>)}
    </div>
    <div className="contract-panel" role="tabpanel" tabIndex={0} id={`${contract.id}-${active}-panel`} aria-labelledby={`${contract.id}-${active}-tab`}>
      {active === "brief" && <div className="contract-brief">
        {briefSections.length === 0 && <p className="contract-panel__empty">No structured brief recorded.</p>}
        <ContractSection label="Goal" value={goal} onOpen={onOpen} />
        <ContractSection label="Expected output" value={outcome} onOpen={onOpen} />
        <ContractSection label="Success conditions" value={section("acceptance")} onOpen={onOpen} />
        <ContractSection label="Constraints" value={section("constraints")} onOpen={onOpen} />
        <ContractSection label="Verification" value={section("verification")} onOpen={onOpen} />
      </div>}
      {active === "context" && <div className="contract-context">
        <dl className="contract-context__facts">
          <div><dt>Claim</dt><dd>{contract.assigned_agent ?? "unclaimed"}</dd></div>
          <div><dt>Branch</dt><dd>{contract.branch ?? "not started"}</dd></div>
          <div><dt>Depends on</dt><dd>{contract.depends_on?.length ? contract.depends_on.map(displayId).join(", ") : "none"}</dd></div>
        </dl>
        <DerivationPanel id={contract.id} board={board} onOpen={onOpen} />
        {contextKeys.map((name) => <ContractSection key={name} label={titleCase(name)} value={section(name)} onOpen={onOpen} />)}
        {specialist.length > 0 && <details className="contract-more">
          <summary>Additional contract sections · {specialist.length}</summary>
          {specialist.map(([name, body]) => <ContractSection key={name} label={titleCase(name)} value={body} onOpen={onOpen} />)}
        </details>}
      </div>}
      {active === "activity" && <div className="contract-activity">
        {activityKeys.map((name) => <ContractSection key={name} label={titleCase(name)} value={section(name)} onOpen={onOpen} />)}
        <EntityTimeline id={contract.id} workspace={workspace} />
      </div>}
    </div>
  </>;
}

export function EntityDrawer({ id, workspace, board, onClose, onOpen }: {
  id: string; workspace: Workspace; board: Board; onClose: () => void; onOpen: (id: string) => void;
}) {
  const ref = useDialog(onClose);
  const contract = board.contractById.get(id);
  const batch = board.batchById.get(id);
  const observation = board.observationById.get(id);
  const decision = board.decisions.find((d) => d.id === id);
  const entity = contract ?? batch ?? observation ?? decision;
  const kind = contract ? "contract" : batch ? "batch" : observation ? "observation" : decision ? "decision" : "entity";
  const drift = (workspace.diagnostics ?? []).filter((d) => d.id === id);

  const fields: Array<[string, string]> = [];
  if (observation) {
    fields.push(["state", observation.status], ["type", observation.observation_type], ["severity", observation.severity], ["confidence", observation.confidence],
      ["age", observation.created_at ? `created ${relativeTime(observation.created_at)}` : "created date unavailable"]);
  } else if (batch) {
    fields.push(["state", batch.status], ["kind", batch.kind], ["members", String(batch.contracts.length)],
      ["age", entityAge(batch.created_at, batch.updated_at)]);
  } else if (decision) {
    fields.push(["age", decision.date ? relativeTime(decision.date) : "date unavailable"]);
  }

  return <div className="scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="drawer scroll" role="dialog" aria-modal="true" aria-label={`${kind}: ${entity?.title ?? id}`} tabIndex={-1} ref={ref}>
      <div className="drawer__bar">
        <span className="tag tag-outline">{kind}</span>
        <Tail id={id} />
        <button type="button" className="drawer__close" onClick={onClose}>Close · esc</button>
      </div>
      {!entity
        ? <div className="drawer__gone"><Dangling field="reference" id={id} /></div>
        : <>
          <h2 className="drawer__title">{entity.title}</h2>
          {drift.length > 0 && <div className="drawer__drift" role="alert">
            <div className="dangling__kind">state drift</div>
            {drift.map((d, i) => <div key={i} className="contra__line">{d.message} · {d.worktree}</div>)}
          </div>}
          {contract ? <ContractTabs key={contract.id} contract={contract} workspace={workspace} board={board} onOpen={onOpen} /> : <>
            <dl className="drawer__fields">
              {fields.map(([key, value]) => <div key={key}>
                <dt>{key}</dt>
                <dd>{ID_TEST.test(value) && titleOf(value) ? <>{titleOf(value)} <Tail id={value} /></> : value}</dd>
              </div>)}
            </dl>
            {Object.entries(entity.sections ?? {}).map(([name, body]) => body && body.trim()
              ? <section key={name} className="drawer__section">
                <div className="drawer__section-head">{titleCase(name)}</div>
                <MarkdownContent value={body} onEntity={onOpen} />
              </section>
              : null)}
            {(batch || observation) && <DerivationPanel id={id} board={board} onOpen={onOpen} />}
            {(batch || observation) && <EntityTimeline id={id} workspace={workspace} />}
          </>}
        </>}
    </div>
  </div>;
}

/* ══ The run ═══════════════════════════════════════════ */
export type RunWaves = { waves: Contract[][]; remainder: Contract[] };

/**
 * Stable topological layers for one batch. Only in-batch edges sequence its
 * members; cycles are left unresolved so the Run never manufactures an order.
 */
export function computeRunWaves(input: Workspace["contracts"]): RunWaves {
  const members = input.filter((contract, index) => input.findIndex((candidate) => candidate.id === contract.id) === index);
  const memberIds = new Set(members.map((contract) => contract.id));
  const placed = new Set<string>();
  let pending = [...members];
  const waves: Contract[][] = [];

  while (pending.length > 0) {
    const wave = pending.filter((contract) => (contract.depends_on ?? []).every((dependency) => !memberIds.has(dependency) || placed.has(dependency)));
    if (wave.length === 0) break;
    waves.push(wave);
    for (const contract of wave) placed.add(contract.id);
    pending = pending.filter((contract) => !placed.has(contract.id));
  }

  return { waves, remainder: pending };
}

type RunCardState = Status | "blocked" | "inconsistent";
const runCardState = (contract: Contract): RunCardState => contract.blocked ? "blocked" : contract.status === "backlog" ? "inconsistent" : contract.status;
const runCardLabel = (contract: Contract) => contract.blocked ? "blocked" : contract.status;

function runComposition(contracts: Contract[]): string {
  const order: Array<[RunCardState, string]> = [
    ["done", "done"], ["active", "active"], ["review", "review"], ["blocked", "blocked"], ["defined", "waiting"], ["inconsistent", "inconsistent"],
  ];
  return order
    .map(([state, label]) => [contracts.filter((contract) => runCardState(contract) === state).length, label] as const)
    .filter(([count]) => count > 0)
    .map(([count, label]) => `${count} ${label}`)
    .join(" · ");
}

function runWaitingReason(contract: Contract, memberById: Map<string, Contract>, unresolved: boolean): string {
  const dependencies = contract.depends_on ?? [];
  const missing = dependencies.filter((id) => !memberById.has(id));
  if (missing.length > 0) return `unresolved dependency · ${missing.map(displayId).join(", ")}`;
  if (unresolved) return "dependency cycle or blocked chain";
  if (contract.blocked) return contract.sections.blocker ?? contract.sections.blocked ?? "blocked in canonical workspace";
  if (contract.status === "backlog") return "backlog member · inconsistent with an active batch";
  const waiting = dependencies.filter((id) => memberById.get(id)?.status !== "done");
  if (waiting.length > 0) return `waiting on ${waiting.map(displayId).join(", ")}`;
  return "ready to start";
}

function RunContractCard({ contract, metric, memberById, unresolved, selected, now, onSelect }: {
  contract: Contract; metric?: ExecutionMetric; memberById: Map<string, Contract>; unresolved: boolean; selected: boolean; now: number; onSelect: (id: string) => void;
}) {
  const state = runCardState(contract);
  const claimed = Boolean(contract.claim);
  return <button
    type="button"
    className={`run__card run__card--${state}`}
    aria-pressed={selected}
    title={entityLabel(contract.id)}
    onClick={() => onSelect(contract.id)}
  >
    <span className="run__card-top"><Tail id={contract.id} /><StateTag state={runCardLabel(contract)} /></span>
    <span className="run__card-title">{contract.title}</span>
    <span className="run__card-meta">
      {claimed
        ? <><ClaimDot agent={contract.assigned_agent} />{contract.assigned_agent} · running {elapsedSince(contract.claim?.started_at, now)}</>
        : metric ? executionSummary(metric) : runWaitingReason(contract, memberById, unresolved)}
    </span>
  </button>;
}

function RunWaveGraph({ batch, members, metrics, selectedId, now, onSelect }: {
  batch: Batch; members: Contract[]; metrics: Map<string, ExecutionMetric>; selectedId: string | null; now: number; onSelect: (id: string) => void;
}) {
  const topology = computeRunWaves(members);
  const memberById = new Map(members.map((contract) => [contract.id, contract]));
  const groups = [
    ...topology.waves.map((contracts, index) => ({ key: `wave-${index + 1}`, label: `Wave ${index + 1}`, contracts, unresolved: false })),
    ...(topology.remainder.length > 0 ? [{ key: "unresolved", label: "Unresolved topology", contracts: topology.remainder, unresolved: true }] : []),
  ];

  if (groups.length === 0) return <p className="run__empty">No members to sequence.</p>;
  return <div className="run__graph-scroll scroll" tabIndex={0} aria-label={`Execution waves for ${batch.title}`}>
    <div className="run__waves">
      {groups.map((group, index) => <div className="run__wave-unit" key={group.key}>
        <section className={`run__wave${group.unresolved ? " run__wave--unresolved" : ""}`} aria-labelledby={`${batch.id}-${group.key}`}>
          <div className="run__wave-head"><b id={`${batch.id}-${group.key}`}>{group.label}</b><span>{runComposition(group.contracts)}</span></div>
          <div className="run__wave-stack">
            {group.contracts.map((contract) => <RunContractCard
              key={contract.id} contract={contract} metric={metrics.get(contract.id)} memberById={memberById} unresolved={group.unresolved}
              selected={selectedId === contract.id} now={now} onSelect={onSelect}
            />)}
          </div>
        </section>
        {index < groups.length - 1 && <div className="run__connector" aria-hidden="true"><span /></div>}
      </div>)}
    </div>
  </div>;
}

export function RunOverlay({ board, onClose, onOpen }: { board: Board; onClose: () => void; onOpen: (id: string) => void }) {
  const ref = useDialog(onClose);
  const now = useNow();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? board.contractById.get(selectedId) ?? null : null;
  const recent = [...board.executions].reverse().slice(0, 12);
  return <div className="run" role="dialog" aria-modal="true" aria-label="The run" tabIndex={-1} ref={ref}>
    <div className="run__bar">
      <span className="pulse is-live" aria-hidden="true" />
      <h2>The run</h2>
      <span className="run__readonly">read-only derived view</span>
      <button type="button" className="run__close" onClick={onClose}>Close · esc</button>
    </div>
    <div className="run__body">
      <div className="run__batches scroll">
        {board.activeBatches.length === 0 && board.running.length === 0 && <p className="run__empty">Nothing is running. A batch starts with <code>kotta batch start &lt;id&gt;</code>, a single contract with <code>kotta contract execute &lt;id&gt; --agent codex</code>.</p>}
        {board.activeBatches.map((batch) => {
          const members = batch.contracts.map((id) => board.contractById.get(id)).filter((t): t is Contract => Boolean(t));
          const done = members.filter((t) => t.status === "done").length;
          const active = members.filter((t) => t.status === "active").length;
          const review = members.filter((t) => t.status === "review").length;
          const blocked = members.filter((t) => t.blocked).length;
          const progress = batch.contracts.length ? Math.round((done / batch.contracts.length) * 100) : 0;
          return <section key={batch.id} className="run__batch">
            <div className="run__batch-head">
              <div className="run__batch-title">
                <div><h3>{batch.title}</h3><Tail id={batch.id} /></div>
                <span>{batch.execution?.mode ?? "dependency-aware"} · parallelism {batch.execution?.parallelism ?? 2} · {(batch.execution?.stop_on_failure ?? true) ? "stop on failure" : "continue on failure"}</span>
              </div>
              <div className="run__summary" aria-label="Run summary">
                <span><b>{active}</b>active</span><span><b>{review}</b>review</span><span><b>{blocked}</b>blocked</span>
              </div>
              <div className="run__progress" aria-label={`${done} of ${batch.contracts.length} complete`}>
                <span><b>{done} / {batch.contracts.length} complete</b><b>{progress}%</b></span>
                <span className="bar bar--dark"><span style={{ width: `${progress}%` }} /></span>
              </div>
            </div>
            <div className="run__canvas-head"><b>Execution order</b><span>Waves are sequential. Cards inside a wave may run in parallel.</span><span className="run__scroll-hint">shift + wheel ↔</span></div>
            <RunWaveGraph batch={batch} members={members} metrics={board.latestExecutionByContract} selectedId={selectedId} now={now} onSelect={setSelectedId} />
            <div className="run__legend" aria-label="Contract state legend">
              {[["done", "done"], ["active", "active"], ["review", "review"], ["defined", "defined"], ["blocked", "blocked"], ["inconsistent", "backlog / inconsistent"]].map(([state, label]) => <span key={state}><i className={`run__legend-swatch run__legend-swatch--${state}`} />{label}</span>)}
              <em>Choose a contract to inspect it without leaving the run.</em>
            </div>
          </section>;
        })}
        {board.running.filter((t) => !t.batch).length > 0 && <section className="run__batch">
          <div className="run__loose-head"><h3>Outside every batch</h3><span>Loose work</span></div>
          {board.running.filter((t) => !t.batch).map((contract) => <EntityButton key={contract.id} id={contract.id} className="run__row" onOpen={onOpen}>
            <span className="run__row-title">{contract.title}</span>
            <StateTag state={contract.status} />
            <span className="run__row-claim"><ClaimDot agent={contract.assigned_agent} />{contract.assigned_agent ?? "no claim"} · {contract.branch ?? "no branch"}</span>
            <span className="run__row-act">running {elapsedSince(contract.claim?.started_at, now)}</span>
          </EntityButton>)}
        </section>}
      </div>
      <div className="run__side">
        <div className="run__side-head"><span>{selected ? "Contract context" : "Recent executions"}</span>{selected && <button type="button" onClick={() => setSelectedId(null)}>← Recent executions</button>}</div>
        {selected ? <div className="run__context scroll">
          <div className="run__context-state"><Tail id={selected.id} /><StateTag state={runCardLabel(selected)} /></div>
          <h3>{selected.title}</h3>
          <dl className="run__facts">
            <div><dt>claim</dt><dd>{selected.assigned_agent ?? "unclaimed"}</dd></div>
            <div><dt>branch</dt><dd>{selected.branch ?? "not started"}</dd></div>
            <div><dt>age</dt><dd>{entityAge(selected.created_at, selected.updated_at)}</dd></div>
            <div><dt>current run</dt><dd>{selected.status === "active" ? elapsedSince(selected.claim?.started_at, now) : "not running"}</dd></div>
            <div><dt>last duration</dt><dd>{board.latestExecutionByContract.get(selected.id)?.durationMs === null || !board.latestExecutionByContract.has(selected.id) ? "Not recorded" : formatDuration(board.latestExecutionByContract.get(selected.id)?.durationMs)}</dd></div>
            <div><dt>last tokens</dt><dd>{formatTokens(board.latestExecutionByContract.get(selected.id)?.usage?.total_tokens)}</dd></div>
            <div><dt>depends on</dt><dd>{selected.depends_on?.length ? selected.depends_on.map(displayId).join(", ") : "none"}</dd></div>
          </dl>
          <button type="button" className="run__open-detail" onClick={() => onOpen(selected.id)}>Open full contract detail →</button>
        </div> : <div className="run__ticker scroll">
            {recent.map((execution) => <div key={execution.id} className="run__tick">
              <span className="run__tick-time">{relativeTime(execution.completedAt, now)}</span>
              <span className="run__tick-text">{execution.state.replace("execution-", "")} · {board.contractById.get(execution.contract)?.title ?? displayId(execution.contract)}<small>{executionSummary(execution)}</small></span>
            </div>)}
            {recent.length === 0 && <p className="run__empty">No recorded execution metrics.</p>}
          </div>}
      </div>
    </div>
  </div>;
}

/* ══ The CLI sheet ═════════════════════════════════════ */
export function CliSheet({ onClose }: { onClose: () => void }) {
  const ref = useDialog(onClose);
  const groups: Array<{ label: string; rows: Array<[string, string]> }> = [
    { label: "observations", rows: [
      ["kotta observation new --title … --type …", "record what was noticed"],
      ["kotta observation resolve <id> --disposition … --approve", "reject it, or turn it into a contract"],
    ] },
    { label: "contracts", rows: [
      ["kotta contract sign <id> --approve", "backlog → defined; validates the contract"],
      ["kotta contract execute <id> --agent codex", "run a defined contract in a fresh context"],
      ["kotta contract close <id> --approve", "review → done"],
    ] },
    { label: "batches", rows: [
      ["kotta batch start <id>", "start it; claims and worktrees per member"],
      ["kotta batch close <id> --approve", "every member is done"],
    ] },
    { label: "decisions and checks", rows: [
      ["kotta decision create --from <file> --approve", "record one; it gets quoted where referenced"],
      ["kotta validate", "what does not add up, exactly as the board shows it"],
    ] },
  ];
  return <div className="scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="sheet" role="dialog" aria-modal="true" aria-label="CLI fallback" tabIndex={-1} ref={ref}>
      <div className="sheet__head">
        <b>CLI fallback</b>
        <button type="button" className="drawer__close" onClick={onClose}>Close · esc</button>
      </div>
      <p className="sheet__lede">The calling chat is the primary approval surface. The board is read-only. These commands remain available for automation, recovery and terminal-first workflows; both paths use the same validated services.</p>
      {groups.map((group) => <div key={group.label} className="sheet__group">
        <div className="sheet__kicker">{group.label}</div>
        {group.rows.map(([command, what]) => <div key={command} className="sheet__row"><code>{command}</code><span>{what}</span></div>)}
      </div>)}
      <div className="sheet__keys"><span>? — this sheet</span><span>w — watch the run</span><span>esc — close</span></div>
    </div>
  </div>;
}

/* ══ What the reader says about itself ═══════════
   An empty board is ambiguous: it can mean an empty workspace, or a workspace whose
   files have not reached the ref this board reads. The server distinguishes the two
   (F-01kz25qf318bmn1t860n2rjcpt) and the page prints the answer above everything else. */
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
  const [view, setView] = useState<View>("home");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [refreshed, setRefreshed] = useState(0);
  const [contractFilter, setContractFilter] = useState<Status | "all">("all");
  const [obsFilter, setObsFilter] = useState<ObsFilter>("waiting");
  const [query, setQuery] = useState("");

  /* One request, always the same one: the board never posts. A failed read keeps the last
     good data on screen and says what failed — a refresh preserves view and drawer. */
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

  const goto = useCallback((next: View, filter?: Status) => {
    setView(next);
    setWatching(false);
    if (filter) setContractFilter(filter);
    if (next === "observations") setObsFilter("waiting");
  }, []);

  // `?` opens the CLI sheet, `w` the run. Overlays own Escape themselves, so it is not handled here.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /input|textarea|select/i.test(target.tagName)) return;
      if (event.key === "?") { event.preventDefault(); setHelpOpen((v) => !v); }
      else if (event.key === "w") { event.preventDefault(); setWatching((v) => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return <div className="app">
    <Rail view={view} onView={goto} board={board} running={Boolean(board?.running.length)} onWatch={() => setWatching(true)} refreshed={refreshed} />
    <div className="content">
      <TopBar workspace={workspace} board={board} onHelp={() => setHelpOpen(true)} onRefresh={() => void refresh()} refreshed={refreshed} />
      {board && <RunningStrip board={board} onWatch={() => setWatching(true)} onOpen={setDetailId} />}
      {workspace?.notices?.length ? <WorkspaceNotices notices={workspace.notices} /> : null}
      {workspace && error && <div className="banner" role="alert">
        <b>Last read failed.</b> Tried <code>GET {WORKSPACE_ENDPOINT}</code> — {error}. Showing the last good read.
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>Retry</button>
      </div>}
      <main className="stage scroll">
        {view === "home" && <HomeView workspace={workspace} board={board} error={workspace ? null : error} onView={goto} onOpen={setDetailId} onRetry={() => void refresh()} />}
        {view !== "home" && !board && <div className="view"><Placeholder rows={6} label="Reading the workspace…" />
          {error && <BandError error={error} onRetry={() => void refresh()} />}</div>}
        {view === "observations" && board && <ObservationsView board={board} filter={obsFilter} onFilter={setObsFilter} onOpen={setDetailId} />}
        {view === "contracts" && board && <ContractsView board={board} filter={contractFilter} onFilter={setContractFilter} query={query} onQuery={setQuery} onOpen={setDetailId} />}
        {view === "batches" && board && <BatchesView board={board} onOpen={setDetailId} />}
        {view === "decisions" && board && <DecisionsView board={board} onOpen={setDetailId} />}
      </main>
    </div>
    {watching && board && <RunOverlay board={board} onClose={() => setWatching(false)} onOpen={(id) => { setWatching(false); setDetailId(id); }} />}
    {detailId && workspace && board && <EntityDrawer id={detailId} workspace={workspace} board={board} onClose={() => setDetailId(null)} onOpen={setDetailId} />}
    {helpOpen && <CliSheet onClose={() => setHelpOpen(false)} />}
  </div>;
}
