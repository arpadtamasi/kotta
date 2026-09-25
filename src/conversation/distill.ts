import type { Session, Utterance } from "./sessions.js";

/**
 * The distillate of a conversation: what the human meant, what the agent proposed and what the human
 * answered, the paths the human turned down, the questions and their answers.
 *
 * Pairing is a heuristic, and it says so. A human message answers the agent message directly before
 * it — never one further back. It is paired only when that agent message proposes or asks something
 * and the reply reads as a yes, a pick among offered options, a no, or (to a plain question) an
 * answer. A reply to a proposal that is none of these is listed as unpaired with the proposal beside
 * it, never forced into a decision. Every human message appears exactly once, verbatim.
 */

export type AgentMove = "proposal" | "question" | "statement";
export type ReplyKind = "approve" | "reject" | "unclear";

export interface Pair {
  id: string;
  source: string;
  agent: Utterance;
  human: Utterance;
  /** The option the human picked, when the agent offered several. */
  choice?: string;
  /** The option the agent recommended, when it said which. */
  recommended?: string;
}

export interface Distillate {
  intents: Array<Utterance & { id: string; source: string }>;
  approved: Pair[];
  rejected: Pair[];
  questions: Pair[];
  unpaired: Pair[];
}

const PROPOSAL_MARKERS = [
  /\bjavasl/i, /\bajánl(?:om|anám|ott|anám)/i, /\bszeretnéd\b/i, /\bakarod\b/i, /\bcsináljam\b/i, /\bmegcsináljam\b/i,
  /\binduljak\b/i, /\bmehet\s*\?/i, /\blegyen\s*\?/i, /\b(?:rendben|oké|ok)\s*\?/i,
  /\bI(?:'d| would)? (?:propose|suggest|recommend)/i, /\brecommend(?:ed|ation)?\b/i, /\b(?:should|shall) I\b/i,
  /\b(?:do you )?want me to\b/i, /\bwould you like me to\b/i, /\bI(?:'d| would) go with\b/i, /\bproposal\b/i, /\bérdemes (?:lenne|volna)\b/i, /\b(?:might be )?worth (?:doing|trying|considering)\b/i,
];

/** A line that offers one option: `a)`, `(b)`, `1.`, `**A**`, `Option C`, `B:` at its start. */
const OPTION_LINE = /^\s*(?:[-*]\s+)?(?:\*\*)?(?:\(?([A-Da-d1-4])[).:](?:\*\*)?\s|([A-D])\*\*[\s:.—-]|(?:Option|Opció|Változat)\s+([A-D1-4])\b)/;

function stripCode(text: string): string {
  return text.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
}

/** The options an agent message offers, in order; empty when it offers fewer than two. */
export function offeredOptions(text: string): string[] {
  const options = stripCode(text).split(/\r?\n/)
    .map((line) => OPTION_LINE.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => (match[1] ?? match[2] ?? match[3]).toLowerCase());
  return new Set(options).size >= 2 ? [...new Set(options)] : [];
}

/** The option the agent says it recommends, when it names exactly one. */
export function recommendedOption(text: string, options: string[]): string | undefined {
  if (!options.length) return undefined;
  const plain = stripCode(text);
  for (const line of plain.split(/\r?\n/)) {
    const option = OPTION_LINE.exec(line);
    if (option && /\b(?:ajánlott|javasolt|recommended|preferred)\b|\(ajánlom\)|\(javaslom\)/i.test(line)) return (option[1] ?? option[2] ?? option[3]).toLowerCase();
  }
  const named = /(?:javaslom|ajánlom|javaslatom|recommend|I(?:'d| would) go with|I(?:'d| would) pick|prefer)[^\n?]{0,40}?(?:\b|\*\*|\()([A-D1-4])(?:\*\*|\)|-[ae]?t\b|\b)/.exec(plain);
  const candidate = named?.[1]?.toLowerCase();
  return candidate && options.includes(candidate) ? candidate : undefined;
}

/** Whether an agent message proposes something, asks something, or only reports. */
export function agentMove(text: string): AgentMove {
  const plain = stripCode(text);
  if (offeredOptions(plain).length && plain.includes("?")) return "proposal";
  if (PROPOSAL_MARKERS.some((pattern) => pattern.test(plain))) return "proposal";
  const paragraphs = plain.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  if (paragraphs.slice(-2).some((paragraph) => /\?\s*(?:\*\*)?\s*$/m.test(paragraph))) return "question";
  return "statement";
}

const APPROVAL = /^(?:igen|ja|aha|jó|jo|rendben|mehet|oké|oke|ok|okay|okés|yes|yep|yeah|sure|persze|csináld|csinald|legyen|go|go ahead|do it|pontosan|egyetértek|így|igy|úgy|ugy|lgtm|jöhet|johet|hajrá|hajra|naná|perfect|great|tökéletes|szuper|köszi|thanks|👍|✅)$/i;
const REJECTION = /^(?:nem|ne|no|nope|inkább|inkabb|helyette|instead|rather|don't|dont|do not|hagyd|mégse|mégsem|egyik sem|neither|none)\b/i;
const HEDGE = /(?:^|[\s,;])(?:de|but|viszont|kivéve|except|csak ha|only if|however|azonban)\b/i;

function words(text: string): string[] {
  return text.toLowerCase().replace(/[.!,;:…]+/g, " ").split(/\s+/).filter(Boolean);
}

/** The option a short reply picks — `b`, `az a`, `B-t`, `2, mehet` — or `undefined`. */
export function pickedOption(reply: string, options: string[]): string | undefined {
  if (!options.length) return undefined;
  const match = /^\s*(?:(?:az?|the|option|opció|változat)\s+)?\(?\**([a-d1-4])\**\)?(?:-?[ae]?t)?\s*[.!,]?\s*(?:(?:mehet|legyen|igen|ok|oké|please|kérem)\s*[.!]?\s*)?$/i.exec(reply);
  const option = match?.[1]?.toLowerCase();
  return option && options.includes(option) ? option : undefined;
}

/** How a human reply stands to the proposal before it. */
export function replyKind(reply: string): ReplyKind {
  const text = reply.trim();
  const tokens = words(text);
  if (!tokens.length) return "unclear";
  if (REJECTION.test(text)) return "reject";
  if (HEDGE.test(text)) return "unclear";
  // A yes is a short run of yes-words, optionally with a courtesy ("igen, köszi", "ok, mehet").
  if (tokens.length <= 4 && tokens.every((token) => APPROVAL.test(token))) return "approve";
  if (tokens.length <= 8 && APPROVAL.test(tokens[0]) && text.length <= 80) return "approve";
  return "unclear";
}

/** One session's conversation, paired. Ids are assigned by the caller across sessions. */
export function distillSession(session: Session, source: string): Omit<Distillate, "intents"> & { intents: Array<Utterance & { source: string }> } {
  const result = { intents: [] as Array<Utterance & { source: string }>, approved: [] as Pair[], rejected: [] as Pair[], questions: [] as Pair[], unpaired: [] as Pair[] };
  let lastAgent: Utterance | undefined;
  for (const utterance of session.utterances) {
    if (utterance.speaker === "agent") { lastAgent = utterance; continue; }
    const agent = lastAgent;
    lastAgent = undefined;
    const move = agent ? agentMove(agent.text) : "statement";
    if (!agent) { result.intents.push({ ...utterance, source }); continue; }
    const pair: Pair = { id: "", source, agent, human: utterance };
    if (move === "statement") {
      // A bare "mehet" after a report agrees to something the report only implied: not intent, not a pair.
      if (replyKind(utterance.text) === "approve") result.unpaired.push(pair);
      else result.intents.push({ ...utterance, source });
      continue;
    }
    if (move === "question") { result.questions.push(pair); continue; }
    const options = offeredOptions(agent.text);
    const choice = pickedOption(utterance.text, options);
    const recommended = recommendedOption(agent.text, options);
    if (choice) {
      pair.choice = choice;
      if (recommended) pair.recommended = recommended;
      (recommended && recommended !== choice ? result.rejected : result.approved).push(pair);
      continue;
    }
    const kind = replyKind(utterance.text);
    if (kind === "approve") result.approved.push(pair);
    else if (kind === "reject") result.rejected.push(pair);
    else result.unpaired.push(pair);
  }
  return result;
}

const byTime = <T extends { timestamp: string }>(a: T, b: T) => a.timestamp.localeCompare(b.timestamp);

/** Every session distilled into one, in time order, with the ids a provenance source cites. */
export function distill(sessions: Array<{ session: Session; source: string }>): Distillate {
  const parts = sessions.map(({ session, source }) => distillSession(session, source));
  const number = <T>(prefix: string, items: T[], time: (item: T) => string) =>
    [...items].sort((a, b) => time(a).localeCompare(time(b))).map((item, index) => ({ ...item, id: `${prefix}${index + 1}` }));
  const at = (pair: Pair) => pair.human.timestamp;
  return {
    intents: number("SZ", parts.flatMap((part) => part.intents).sort(byTime), (item) => item.timestamp),
    approved: number("J", parts.flatMap((part) => part.approved), at),
    rejected: number("E", parts.flatMap((part) => part.rejected), at),
    questions: number("K", parts.flatMap((part) => part.questions), at),
    unpaired: number("P", parts.flatMap((part) => part.unpaired), at),
  };
}
