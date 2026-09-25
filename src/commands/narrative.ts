import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { parseMarkdown } from "../core/markdown.js";
import { distill, type Distillate, type Pair } from "../conversation/distill.js";
import { REDACTION_KINDS, redact, type RedactionCounts } from "../conversation/redact.js";
import { readSession, sessionFiles, type Session, type SkipReason, type Utterance } from "../conversation/sessions.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { resolveChange } from "../spec/change.js";

/**
 * `kotta narrative <change> --from <log|directory> [--since <time>]` — the conversation behind a
 * change, distilled into `openspec/changes/<change>/conversation.md`.
 *
 * It keeps what the planning phase has to cite: the human's own sentences of intent, each agent
 * proposal with the human's answer (a one-word "igen" included) and its time, the paths the human
 * turned down, and the questions with their answers. The pairing is heuristic and says where it was
 * unsure instead of guessing. Everything passes the secret and personal-data filter before it is
 * written, and the file lists, by kind, what the filter removed.
 */

export const CONVERSATION_FILE = "conversation.md";
const GENERATOR = "kotta narrative";

export interface NarrativeSource {
  path: string;
  format: Session["format"];
  human: number;
  agent: number;
  skipped: Session["skipped"];
}

export interface NarrativeResult {
  ok: boolean;
  command: "narrative";
  data: {
    change: string;
    conversation: string | null;
    since: string | null;
    sources: NarrativeSource[];
    /** Logs under a `--from` directory that are neither format. */
    unrecognized: string[];
    counts: { intents: number; approved: number; rejected: number; questions: number; unpaired: number };
    redactions: RedactionCounts;
  };
  errors: Array<{ code: string; message: string; path?: string }>;
}

const SKIP_LABEL: Record<SkipReason, string> = {
  sidechain: "mellékszál", tool: "eszközhívás", system: "rendszerüzenet", skill: "skill-betöltés", command: "parancs",
  interrupted: "megszakítás", paste: "4000 karakternél hosszabb beillesztés", meta: "meta-üzenet", image: "csak kép", since: "--since előtti",
};

/** `2026-09-25 10:04 UTC`: minutes are what a citation names, and UTC keeps the file the same everywhere. */
export function formatTime(timestamp: string): string {
  const at = new Date(timestamp);
  if (Number.isNaN(at.getTime())) return "ismeretlen időpont";
  return `${at.toISOString().slice(0, 10)} ${at.toISOString().slice(11, 16)} UTC`;
}

const clock = (timestamp: string) => formatTime(timestamp).slice(11);

function quote(text: string): string {
  return text.trim().split(/\r?\n/).map((line) => (line.trim() ? `> ${line}` : ">")).join("\n");
}

/** The agent's words, shortened from the front: a proposal and its question stand at the end. */
export const AGENT_EXCERPT_LIMIT = 900;
function excerpt(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= AGENT_EXCERPT_LIMIT) return trimmed;
  const paragraphs = trimmed.split(/\n\s*\n/);
  const kept: string[] = [];
  let length = 0;
  for (let index = paragraphs.length - 1; index >= 0; index -= 1) {
    if (kept.length && length + paragraphs[index].length > AGENT_EXCERPT_LIMIT) break;
    kept.unshift(paragraphs[index]);
    length += paragraphs[index].length;
  }
  const joined = kept.join("\n\n");
  return `…\n\n${joined.length > AGENT_EXCERPT_LIMIT * 2 ? `${joined.slice(-AGENT_EXCERPT_LIMIT * 2)}` : joined}`;
}

function pairLines(pair: Pair, note?: string): string[] {
  const lines = [`### ${pair.id} · ${formatTime(pair.human.timestamp)}`, ""];
  lines.push(`**Ágens** (${clock(pair.agent.timestamp)}):`, "", quote(excerpt(pair.agent.text)), "");
  lines.push(`**Ember** (${clock(pair.human.timestamp)}):`, "", quote(pair.human.text), "");
  if (note) lines.push(note, "");
  return lines;
}

const optionName = (option: string) => (/\d/.test(option) ? option : option.toUpperCase());

function body(change: string, result: Distillate): string[] {
  const lines = [
    `# Beszélgetés: ${change}`,
    "",
    "A `kotta narrative` desztillátuma. Az időpontok UTC-ben. A párosítás heurisztikus: egy emberi üzenet az előtte álló ágens-üzenetre felel; ahol ez bizonytalan, a pár a „Párosítatlan” alatt áll. Az ember mondatai szó szerint, az ágenséi kivonatosan. Hivatkozás: `openspec/changes/" + change + "/conversation.md · <azonosító>`, pl. `· J1`.",
    "",
    "## Szándék",
    "",
  ];
  if (!result.intents.length) lines.push("Nincs olyan emberi üzenet, ami nem egy javaslatra vagy kérdésre felelt.", "");
  for (const intent of result.intents) lines.push(`### ${intent.id} · ${formatTime(intent.timestamp)}`, "", quote(intent.text), "");

  lines.push("## Javaslatok és válaszok", "", "Az ágens javasolta, az ember jóváhagyta (`agent-proposed-human-approved`).", "");
  if (!result.approved.length) lines.push("Nincs jóváhagyott javaslat.", "");
  for (const pair of result.approved) {
    const note = pair.choice ? `Választás: ${optionName(pair.choice)}${pair.recommended ? " (az ágens is ezt ajánlotta)" : ""}.` : undefined;
    lines.push(...pairLines(pair, note));
  }

  lines.push("## Elvetett utak", "", "Az ágens javasolt valamit, az ember mást választott.", "");
  if (!result.rejected.length) lines.push("Nincs elvetett javaslat.", "");
  for (const pair of result.rejected) {
    const note = pair.choice && pair.recommended ? `Az ágens a(z) ${optionName(pair.recommended)} változatot ajánlotta; az ember a(z) ${optionName(pair.choice)} változatot választotta.` : undefined;
    lines.push(...pairLines(pair, note));
  }

  lines.push("## Kérdések és válaszok", "");
  if (!result.questions.length) lines.push("Nincs megválaszolt kérdés.", "");
  for (const pair of result.questions) lines.push(...pairLines(pair));

  lines.push("## Párosítatlan", "", "Ahol a válasz sem egyértelmű igen, sem nem, sem választás, vagy egy puszta „mehet” csak beszámolóra felelt: a döntést ember olvassa ki.", "");
  if (!result.unpaired.length) lines.push("Nincs.", "");
  for (const pair of result.unpaired) lines.push(...pairLines(pair));
  return lines;
}

/**
 * A log's path as the file shows it: repository-relative inside the repository, home-relative outside.
 * This is the command's own record of where it read, not the conversation, so it is not counted as
 * something the filter removed.
 */
function shownPath(root: string, path: string): string {
  return path.startsWith(root + sep) ? relative(root, path).split(sep).join("/") : redact(path).text;
}

function sourceLines(root: string, sources: NarrativeSource[], since: string | null, unrecognized: string[], all: Utterance[]): string[] {
  const lines = ["## Nyers forrás", ""];
  for (const source of sources) {
    const skipped = Object.entries(source.skipped).map(([reason, count]) => `${SKIP_LABEL[reason as SkipReason]} ${count}`).join(", ");
    const path = shownPath(root, source.path);
    lines.push(`- \`${path}\` (${source.format === "codex" ? "Codex" : "Claude Code"}): ${source.human + source.agent} üzenet feldolgozva (ember ${source.human}, ágens ${source.agent})${skipped ? `; kihagyva: ${skipped}` : ""}.`);
  }
  for (const path of unrecognized) lines.push(`- \`${shownPath(root, path)}\`: nem munkamenet-napló, kihagyva.`);
  const times = all.map((utterance) => utterance.timestamp).filter(Boolean).sort();
  if (times.length) lines.push("", `Időszak: ${formatTime(times[0])} – ${formatTime(times[times.length - 1])}.${since ? ` Csak a ${formatTime(since)} utáni üzenetek.` : ""}`);
  lines.push("");
  return lines;
}

function redactionLines(counts: RedactionCounts): string[] {
  const found = REDACTION_KINDS.filter((kind) => counts[kind]);
  const lines = ["### Szűrés", ""];
  if (!found.length) lines.push("Nem kellett semmit kiszűrni.");
  for (const kind of found) lines.push(`- ${kind}: ${counts[kind]}`);
  lines.push("");
  return lines;
}

function digest(content: string): string {
  return `sha256:${createHash("sha256").update(content.trim()).digest("hex")}`;
}

/** Whether a conversation.md may be replaced: absent, or written by this command and not edited since. */
function replaceable(path: string): { ok: true } | { ok: false; message: string } {
  if (!existsSync(path)) return { ok: true };
  const parsed = parseMarkdown(readFileSync(path, "utf8"));
  if (parsed.data.generated_by !== GENERATOR) return { ok: false, message: `${CONVERSATION_FILE} was not written by '${GENERATOR}'; it is left alone. Move it aside to distil the conversation again.` };
  if (parsed.data.digest !== digest(parsed.content)) return { ok: false, message: `${CONVERSATION_FILE} was edited after '${GENERATOR}' wrote it; it is left alone. Move it aside to distil the conversation again.` };
  return { ok: true };
}

export interface NarrativeOptions { from: string; since?: string; repositoryRoot?: string; now?: Date }

export function narrativeCommand(name: string, options: NarrativeOptions): NarrativeResult {
  const root = options.repositoryRoot ?? findRepositoryRoot();
  const directory = resolveChange(root, name);
  const change = relative(join(root, "openspec", "changes"), directory);
  let since: Date | undefined;
  if (options.since !== undefined) {
    since = new Date(options.since);
    if (Number.isNaN(since.getTime())) throw new Error(`--since '${options.since}' is not a time; give an ISO 8601 timestamp such as 2026-09-25T10:00:00Z.`);
  }
  const given = resolve(options.from);
  const from = existsSync(given) ? realpathSync(given) : given;
  const files = sessionFiles(from);
  const sessions: Session[] = [];
  const unrecognized: string[] = [];
  for (const file of files) {
    try { sessions.push(readSession(file, since)); }
    catch (error) {
      if (files.length === 1) throw error;
      unrecognized.push(file);
    }
  }
  const sources: NarrativeSource[] = sessions.map((session) => ({
    path: session.path,
    format: session.format,
    human: session.utterances.filter((utterance) => utterance.speaker === "human").length,
    agent: session.utterances.filter((utterance) => utterance.speaker === "agent").length,
    skipped: session.skipped,
  }));
  const result = distill(sessions.map((session) => ({ session, source: session.path })));
  const counts = { intents: result.intents.length, approved: result.approved.length, rejected: result.rejected.length, questions: result.questions.length, unpaired: result.unpaired.length };
  const sinceText = since ? since.toISOString() : null;
  const empty = (redactions: RedactionCounts, errors: NarrativeResult["errors"]): NarrativeResult => ({
    ok: false, command: "narrative",
    data: { change, conversation: null, since: sinceText, sources: sources.map((source) => ({ ...source, path: redact(source.path).text })), unrecognized, counts, redactions },
    errors,
  });

  if (!sessions.some((session) => session.utterances.length)) {
    return empty({}, [{ code: "NARRATIVE_EMPTY", message: `No human or agent message was left to distil from ${redact(from).text}${since ? ` after ${sinceText}` : ""}.` }]);
  }
  const target = join(directory, CONVERSATION_FILE);
  const allowed = replaceable(target);
  if (!allowed.ok) return empty({}, [{ code: "NARRATIVE_EDITED", message: allowed.message, path: relative(root, target) }]);

  // Everything written passes the filter; the filter's own report is added after, and holds no secret.
  const redactions: RedactionCounts = {};
  const all = sessions.flatMap((session) => session.utterances);
  const content = redact([...body(change, result), ...sourceLines(root, sources, sinceText, unrecognized, all)].join("\n"), redactions).text;
  const text = `${content}\n${redactionLines(redactions).join("\n")}`;
  const frontmatter = [
    "---",
    `change: ${change}`,
    `generated_by: ${GENERATOR}`,
    `generated_at: "${(options.now ?? new Date()).toISOString()}"`,
    ...(sinceText ? [`since: "${sinceText}"`] : []),
    `digest: "${digest(text)}"`,
    "---",
    "",
  ].join("\n");
  writeFileSync(target, `${frontmatter}${text}`);
  return {
    ok: true,
    command: "narrative",
    data: {
      change, conversation: relative(root, target), since: sinceText,
      sources: sources.map((source) => ({ ...source, path: redact(source.path).text })),
      unrecognized: unrecognized.map((path) => redact(path).text),
      counts, redactions,
    },
    errors: [],
  };
}

export function formatNarrative(result: NarrativeResult): string {
  const { data } = result;
  if (!result.ok) return result.errors.map((error) => `${error.message}${error.path ? ` (${error.path})` : ""}`).join("\n");
  const messages = data.sources.reduce((sum, source) => sum + source.human + source.agent, 0);
  const lines = [
    `Distilled ${messages} messages from ${data.sources.length} session log${data.sources.length === 1 ? "" : "s"} into ${data.conversation}.`,
    `Intent: ${data.counts.intents}. Proposals approved: ${data.counts.approved}. Turned down: ${data.counts.rejected}. Questions answered: ${data.counts.questions}. Unpaired: ${data.counts.unpaired}.`,
  ];
  const removed = REDACTION_KINDS.filter((kind) => data.redactions[kind]).map((kind) => `${kind} ${data.redactions[kind]}`);
  lines.push(removed.length ? `Filtered before writing: ${removed.join(", ")}.` : "Filtered before writing: nothing matched.");
  if (data.unrecognized.length) lines.push(`Not a session log, skipped: ${data.unrecognized.join(", ")}.`);
  return lines.join("\n");
}
