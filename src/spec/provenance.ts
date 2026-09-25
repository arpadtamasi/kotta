/**
 * Where a node's content came from, carried in its own frontmatter so the mark travels with the node.
 *
 * Every statement in the technical model says whether it was said, partly inferred or inferred, and
 * who decided it: a human, a human on the agent's proposal, or the agent alone. The field is optional
 * on an accepted node (most were written before it existed) and required on every node a change
 * proposes under `openspec/changes/<name>/model/`, because that is where the planning phase has to be
 * able to say which of its "why"s nobody said. The same rules are published as
 * `schemas/provenance.schema.json`; a test keeps the two identical.
 */

export const PROVENANCE_LEVELS = ["stated", "partly-inferred", "inferred"] as const;
export const PROVENANCE_DECIDERS = ["human", "agent-proposed-human-approved", "agent-decided"] as const;
export const PROVENANCE_KEYS = ["level", "decided_by", "sources", "quote", "inferred"] as const;
/** A quote is a witness, not a transcript. */
export const QUOTE_WORD_LIMIT = 30;

export type ProvenanceLevel = typeof PROVENANCE_LEVELS[number];
export type ProvenanceDecider = typeof PROVENANCE_DECIDERS[number];

export interface Provenance {
  level: ProvenanceLevel;
  decided_by: ProvenanceDecider;
  sources: string[];
  quote?: string;
  inferred?: string;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && !value.trim());
}

/**
 * The problems with a node's `provenance` block, as plain messages. An absent block is a problem only
 * when `required`; a present one is always measured in full, so a half-filled block never passes.
 */
export function provenanceProblems(value: unknown, required: boolean): string[] {
  if (value === undefined || value === null) {
    return required ? [`has no provenance; a node proposed by a change must say whether it is ${PROVENANCE_LEVELS.join(", ")} and who decided it (${PROVENANCE_DECIDERS.join(", ")}).`] : [];
  }
  if (typeof value !== "object" || Array.isArray(value)) return ["has a provenance that is not a mapping of level, decided_by, sources, quote and inferred."];
  const block = value as Record<string, unknown>;
  const problems: string[] = [];
  for (const key of Object.keys(block)) {
    if (!(PROVENANCE_KEYS as readonly string[]).includes(key)) problems.push(`has an unknown provenance key '${key}'; the block carries only ${PROVENANCE_KEYS.join(", ")}.`);
  }
  const level = block.level;
  if (isBlank(level)) problems.push(`leaves provenance.level unanswered: is its content ${PROVENANCE_LEVELS.join(", ")}?`);
  else if (!(PROVENANCE_LEVELS as readonly unknown[]).includes(level)) problems.push(`has provenance.level '${String(level)}'; use ${PROVENANCE_LEVELS.join(", ")}.`);
  const decider = block.decided_by;
  if (isBlank(decider)) problems.push(`leaves provenance.decided_by unanswered: who decided it — ${PROVENANCE_DECIDERS.join(", ")}?`);
  else if (!(PROVENANCE_DECIDERS as readonly unknown[]).includes(decider)) problems.push(`has provenance.decided_by '${String(decider)}'; use ${PROVENANCE_DECIDERS.join(", ")}.`);

  const sources = block.sources;
  if (sources !== undefined && sources !== null && (!Array.isArray(sources) || sources.some((source) => typeof source !== "string" || !source.trim()))) {
    problems.push("has provenance.sources that is not a list of non-empty '<file> · <requirement or section>' strings.");
  } else if (level !== "inferred" && (!Array.isArray(sources) || !sources.length)) {
    problems.push(`names no provenance.sources; content that is ${String(level ?? "stated")} was said somewhere — name the file and section.`);
  }

  const quote = block.quote;
  if (!isBlank(quote)) {
    if (typeof quote !== "string") problems.push("has a provenance.quote that is not text.");
    else if (quote.trim().split(/\s+/).length > QUOTE_WORD_LIMIT) problems.push(`quotes ${quote.trim().split(/\s+/).length} words in provenance.quote; keep it to ${QUOTE_WORD_LIMIT} or fewer.`);
  }
  const inferred = block.inferred;
  if (!isBlank(inferred) && typeof inferred !== "string") problems.push("has a provenance.inferred that is not text.");
  if (!isBlank(level) && level !== "stated" && isBlank(inferred)) problems.push(`is ${String(level)} but leaves provenance.inferred empty; say what had to be supplied.`);
  return problems;
}

/** The block a scaffold lays out: every key present, none answered. */
export function provenanceScaffold(): Record<string, unknown> {
  return { level: null, decided_by: null, sources: [], quote: null, inferred: null };
}

/** A well-formed block, read; `undefined` when absent or malformed (validation says which). */
export function readProvenance(value: unknown): Provenance | undefined {
  return provenanceProblems(value, true).length ? undefined : value as Provenance;
}
