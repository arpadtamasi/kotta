export interface ReviewEvidenceEntry {
  check: string;
  evidence: string;
}

export type ReviewEvidenceInput = string | string[] | Record<string, string>;

export interface PreparedReviewEvidence {
  entries: ReviewEvidenceEntry[];
  verification: string;
}

const normalized = (value: string): string => value.trim().replace(/\s+/g, " ");

/**
 * The legacy surface supplied one blob. Named mappings use the exact check text as their key; the
 * contract already owns those names, so no second identifier vocabulary is introduced.
 */
export function prepareReviewEvidence(checks: string[], input: ReviewEvidenceInput): PreparedReviewEvidence {
  const names = checks.length ? checks : ["Contract acceptance criteria"];
  if (typeof input === "string") {
    const evidence = input.trim();
    if (!evidence) throw new Error("Review evidence is required.");
    return { entries: names.map((check) => ({ check, evidence })), verification: evidence };
  }

  let supplied: Record<string, string>;
  if (Array.isArray(input)) {
    if (input.length === 1 && !namedEntry(input[0], names)) return prepareReviewEvidence(names, input[0]);
    supplied = {};
    for (const value of input) {
      const parsed = namedEntry(value, names);
      if (!parsed) throw new Error(`Named review evidence must use '<exact check>=<evidence>'. Available checks: ${names.join(" | ")}.`);
      if (Object.hasOwn(supplied, parsed.check)) throw new Error(`Review evidence names check '${parsed.check}' more than once.`);
      supplied[parsed.check] = parsed.evidence;
    }
  } else supplied = input;

  const unknown = Object.keys(supplied).filter((check) => !names.includes(check));
  if (unknown.length) throw new Error(`Unknown review evidence check${unknown.length === 1 ? "" : "s"}: ${unknown.join(" | ")}. Available checks: ${names.join(" | ")}.`);
  const missing = names.filter((check) => !Object.hasOwn(supplied, check));
  if (missing.length) throw new Error(`Review evidence mapping is missing check${missing.length === 1 ? "" : "s"}: ${missing.join(" | ")}.`);

  const entries = names.map((check) => ({ check, evidence: String(supplied[check] ?? "").trim() }));
  const empty = entries.find((entry) => !entry.evidence);
  if (empty) throw new Error(`Review evidence for '${empty.check}' is required.`);
  return {
    entries,
    verification: entries.map(({ check, evidence }) => `${check}: ${evidence}`).join("\n"),
  };
}

function namedEntry(value: string, checks: string[]): ReviewEvidenceEntry | null {
  const separator = value.indexOf("=");
  if (separator < 1) return null;
  const check = value.slice(0, separator).trim();
  if (!checks.includes(check)) return null;
  return { check, evidence: value.slice(separator + 1).trim() };
}

/** Pairwise, per-task gate. Whitespace layout cannot disguise one pasted blob as two answers. */
export function assertDistinctReviewEvidence(entries: ReviewEvidenceEntry[]): void {
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      if (normalized(entries[left].evidence) === normalized(entries[right].evidence)) {
        throw new Error(`Review evidence for '${entries[left].check}' and '${entries[right].check}' is identical after whitespace normalization. Evidence answers its own check: each named check requires distinct evidence.`);
      }
    }
  }
}
