import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Agent session logs, read into the conversation a human and an agent had — nothing else.
 *
 * Two formats are recognised from their content, never from their path:
 *
 * - Claude Code (`~/.claude/projects/<slug>/*.jsonl`): one entry per line, `type: user | assistant`,
 *   `message.content` a string or a list of blocks, `isSidechain` for a sub-agent's own thread.
 * - Codex (`~/.codex/sessions/**\/rollout-*.jsonl`): `type: response_item` whose `payload.type` is
 *   `message`, `payload.role: user | assistant`, and `payload.content[].text`.
 *
 * Tool calls and results, the host's reminders and notifications, skill loads, command echoes,
 * interruptions and pastes longer than {@link PASTE_LIMIT} characters are not the conversation; they
 * are counted as skipped, by reason, so the distillate can say what it left out.
 */

export type SessionFormat = "claude-code" | "codex";
export type Speaker = "human" | "agent";

export interface Utterance {
  speaker: Speaker;
  /** ISO 8601, as the log recorded it. */
  timestamp: string;
  text: string;
}

export type SkipReason = "sidechain" | "tool" | "system" | "skill" | "command" | "interrupted" | "paste" | "meta" | "image" | "since";

export interface Session {
  path: string;
  format: SessionFormat;
  utterances: Utterance[];
  skipped: Partial<Record<SkipReason, number>>;
}

/** A human message longer than this is a paste, not something the human said. */
export const PASTE_LIMIT = 4000;

type Entry = Record<string, unknown>;

function parseLines(content: string): Entry[] {
  const entries: Entry[] = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const value = JSON.parse(line) as unknown;
      if (value && typeof value === "object" && !Array.isArray(value)) entries.push(value as Entry);
    } catch {
      // A torn last line of a log still being written is not an error of the conversation.
    }
  }
  return entries;
}

const record = (value: unknown): Entry | undefined => (value && typeof value === "object" && !Array.isArray(value) ? value as Entry : undefined);

/** Which agent wrote this log, decided from its entries; `undefined` when neither format fits. */
export function detectFormat(entries: Entry[]): SessionFormat | undefined {
  let claude = 0, codex = 0;
  for (const entry of entries) {
    if (entry.type === "response_item" || entry.type === "session_meta" || entry.type === "turn_context") codex += 1;
    else if ((entry.type === "user" || entry.type === "assistant") && record(entry.message)) claude += 1;
  }
  if (!claude && !codex) return undefined;
  return codex > claude ? "codex" : "claude-code";
}

/** The reason a human message is not something the human said, or `undefined` when it is. */
function humanSkipReason(text: string): SkipReason | undefined {
  const start = text.trimStart();
  if (/^\[Request interrupted/i.test(start) || /^<turn_aborted>/.test(start)) return "interrupted";
  if (/^<(?:command-|local-command-)/.test(start) || /^Caveat: The messages below/.test(start)) return "command";
  if (/^Base directory for this skill:/.test(start) || /^<skill>/.test(start)) return "skill";
  if (/^<(?:system-reminder|task-notification|environment_context|user_instructions|permissions|developer)/.test(start)
    || /^# AGENTS\.md instructions/.test(start)
    || /^This session is being continued from a previous conversation/.test(start)
    || /^Another Claude session sent a message:/.test(start)
    || /^\[Your previous response/.test(start)) return "system";
  if (text.length > PASTE_LIMIT) return "paste";
  return undefined;
}

/** Host wrappers inside a human's own message: removed, the human's words kept. */
function unwrapHuman(text: string): string {
  let result = text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
    .replace(/<ide_[a-z_]+>[\s\S]*?<\/ide_[a-z_]+>/g, "")
    .replace(/<\/?image\b[^>]*>/g, "")
    .replace(/\[Image[^\]]*\]/g, "");
  // Codex's IDE extension prefixes the request with the editor's state; the request follows its heading.
  const request = /^#+\s*My request for Codex:\s*$/m.exec(result);
  if (/^# Context from my IDE setup:/.test(result.trimStart())) result = request ? result.slice(request.index + request[0].length) : "";
  return result.trim();
}

function blockTexts(content: unknown, types: string[]): { texts: string[]; other: number } {
  if (typeof content === "string") return { texts: [content], other: 0 };
  if (!Array.isArray(content)) return { texts: [], other: 0 };
  const texts: string[] = [];
  let other = 0;
  for (const block of content) {
    const item = record(block);
    if (item && types.includes(String(item.type)) && typeof item.text === "string") texts.push(item.text);
    else other += 1;
  }
  return { texts, other };
}

function readClaude(entries: Entry[], skip: (reason: SkipReason) => void): Utterance[] {
  const utterances: Utterance[] = [];
  for (const entry of entries) {
    if (entry.type !== "user" && entry.type !== "assistant") continue;
    const message = record(entry.message);
    if (!message) continue;
    if (entry.isSidechain === true) { skip("sidechain"); continue; }
    const timestamp = typeof entry.timestamp === "string" ? entry.timestamp : "";
    const { texts } = blockTexts(message.content, ["text"]);
    if (entry.type === "assistant") {
      const text = texts.join("\n\n").trim();
      if (text) utterances.push({ speaker: "agent", timestamp, text });
      else skip("tool");
      continue;
    }
    // A user entry holding only tool results is the harness talking, not the human.
    if (!texts.length) {
      const images = Array.isArray(message.content) && message.content.some((block) => record(block)?.type === "image");
      skip(images ? "image" : "tool");
      continue;
    }
    if (entry.isMeta === true || entry.isCompactSummary === true) { skip("meta"); continue; }
    const raw = texts.join("\n\n");
    const reason = humanSkipReason(raw);
    if (reason) { skip(reason); continue; }
    const text = unwrapHuman(raw);
    if (!text) { skip(/<\/?image|\[Image/.test(raw) ? "image" : "system"); continue; }
    if (text.length > PASTE_LIMIT) { skip("paste"); continue; }
    utterances.push({ speaker: "human", timestamp, text });
  }
  return utterances;
}

function readCodex(entries: Entry[], skip: (reason: SkipReason) => void): Utterance[] {
  const utterances: Utterance[] = [];
  for (const entry of entries) {
    if (entry.type !== "response_item") continue;
    const payload = record(entry.payload);
    if (!payload) continue;
    if (payload.type !== "message") { skip("tool"); continue; }
    const timestamp = typeof entry.timestamp === "string" ? entry.timestamp : "";
    if (payload.role === "assistant") {
      const text = blockTexts(payload.content, ["output_text", "text"]).texts.join("\n\n").trim();
      if (text) utterances.push({ speaker: "agent", timestamp, text });
      else skip("tool");
      continue;
    }
    if (payload.role !== "user") { skip("system"); continue; }
    // Each input block is judged on its own: Codex sends the environment and the request as siblings.
    const kept: string[] = [];
    let judged = false;
    for (const text of blockTexts(payload.content, ["input_text", "text"]).texts) {
      const reason = humanSkipReason(text);
      if (reason) { skip(reason); judged = true; continue; }
      const unwrapped = unwrapHuman(text);
      if (unwrapped) kept.push(unwrapped);
    }
    const text = kept.join("\n\n").trim();
    // Nothing left and nothing skipped for a reason: the message was only an image and its tags.
    if (!text) { if (!judged) skip("image"); continue; }
    if (text.length > PASTE_LIMIT) { skip("paste"); continue; }
    utterances.push({ speaker: "human", timestamp, text });
  }
  return utterances;
}

/** One session log, read; refused when it is neither format. `since` drops everything earlier. */
export function readSession(path: string, since?: Date): Session {
  const entries = parseLines(readFileSync(path, "utf8"));
  const format = detectFormat(entries);
  if (!format) throw new Error(`${path} is neither a Claude Code nor a Codex session log: no line holds a user or assistant message.`);
  const skipped: Session["skipped"] = {};
  const skip = (reason: SkipReason) => { skipped[reason] = (skipped[reason] ?? 0) + 1; };
  const all = format === "codex" ? readCodex(entries, skip) : readClaude(entries, skip);
  const utterances = all.filter((utterance) => {
    if (!since) return true;
    const at = Date.parse(utterance.timestamp);
    if (Number.isNaN(at) || at < since.getTime()) { skip("since"); return false; }
    return true;
  });
  return { path, format, utterances, skipped };
}

/** The logs `--from` names: the file itself, or every `.jsonl` under a directory, in name order. */
export function sessionFiles(from: string): string[] {
  if (!existsSync(from)) throw new Error(`No session log at ${from}.`);
  if (statSync(from).isFile()) return [from];
  const found: string[] = [];
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && entry.name.endsWith(".jsonl")) found.push(path);
    }
  };
  walk(from);
  if (!found.length) throw new Error(`${from} holds no .jsonl session log.`);
  return found;
}
