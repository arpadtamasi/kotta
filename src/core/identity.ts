import { randomFillSync } from "node:crypto";

/**
 * Coordination-free entity identity (D-003, narrowed by D-010).
 *
 * A minted id is `<type>-<ULID>`: a 48-bit millisecond timestamp followed by 80 random bits,
 * both in lowercase Crockford base32. It is time-sortable and needs no allocator, lock or
 * shared base ref, so two branches that know nothing about each other can never mint the same id.
 *
 * D-010 keeps every sequential id that already exists (`T-034`, `F-008`, `P-005`, `D-003`, the
 * imported `O-…` range). The workspace is permanently mixed: both forms are valid, indefinitely.
 */

/** Crockford base32: i, l, o and u are absent, so an id cannot be misread. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
const TIME_LENGTH = 10;
const RANDOM_LENGTH = 16;
export const MINTED_BODY_LENGTH = TIME_LENGTH + RANDOM_LENGTH;
/** Filename and display tail. 8 Crockford characters carry 40 random bits. */
export const SHORT_ID_LENGTH = 8;

export type EntityPrefix = "T" | "F" | "P" | "D";

const MINTED_BODY = "[0-9a-hjkmnp-tv-z]{26}";
const MINTED = new RegExp(`^[TFPD]-${MINTED_BODY}$`);

/** Sequential forms that predate D-003 and stay valid forever (D-010). */
const LEGACY_TASK = "T-\\d{3,}|O-\\d+(?:\\.\\d+)?";
const LEGACY_OBSERVATION = "F-\\d{3,}|O-\\d+";
const LEGACY_BATCH = "P-\\d{3,}";
const LEGACY_DECISION = "D-\\d{3,}";

function accepts(legacy: string, prefix: EntityPrefix): RegExp {
  return new RegExp(`^(?:${legacy}|${prefix}-${MINTED_BODY})$`);
}

export const TASK_ID = accepts(LEGACY_TASK, "T");
export const OBSERVATION_ID = accepts(LEGACY_OBSERVATION, "F");
export const BATCH_ID = accepts(LEGACY_BATCH, "P");
export const DECISION_ID = accepts(LEGACY_DECISION, "D");

/** Any entity reference, in either form — used to linkify prose. */
export const ANY_ENTITY_ID_SOURCE = `(?:O-\\d+(?:\\.\\d+)?|[TFPD]-\\d+|[TFPD]-${MINTED_BODY})`;

function encodeTime(milliseconds: number): string {
  let value = milliseconds;
  let encoded = "";
  for (let index = 0; index < TIME_LENGTH; index += 1) {
    encoded = ALPHABET[value % 32] + encoded;
    value = Math.floor(value / 32);
  }
  return encoded;
}

function encodeRandom(): string {
  const bytes = randomFillSync(new Uint8Array(RANDOM_LENGTH));
  // 256 is an exact multiple of 32, so the modulo is unbiased.
  return [...bytes].map((byte) => ALPHABET[byte % 32]).join("");
}

/** Mints a new coordination-free identifier. No filesystem scan, no allocator, no lock. */
export function mintId(prefix: EntityPrefix, now: number = Date.now()): string {
  return `${prefix}-${encodeTime(now)}${encodeRandom()}`;
}

/** Sortable immutable event identity; events are not user-facing entities. */
export function mintEventId(now: number = Date.now()): string {
  return `E-${encodeTime(now)}${encodeRandom()}`;
}

export function isMintedId(id: string): boolean {
  return MINTED.test(id);
}

/** The disk- and display-facing tail of a minted id; `null` for sequential ids, which are short already. */
export function shortId(id: string): string | null {
  return isMintedId(id) ? id.slice(-SHORT_ID_LENGTH) : null;
}

/** Short human-facing form: `T-a3f9c1d2` for a minted id, the id itself for a sequential one. */
export function displayId(id: string): string {
  const short = shortId(id);
  return short ? `${id.slice(0, id.indexOf("-") + 1)}${short}` : id;
}

/**
 * Filename for a newly created entity: `slug-<short id>.md` when the id is minted (D-003 — readable
 * and disk-unique across branches), and the historical `<id>-slug.md` for a sequential id.
 */
export function entityFilename(id: string, slug: string): string {
  const short = shortId(id);
  const safeSlug = slug || "untitled";
  return short ? `${safeSlug}-${short}.md` : `${id}-${safeSlug}.md`;
}

/**
 * Whether `filename` belongs to `id`, in either naming scheme. Temporary write candidates
 * (`…​.md.define-123.tmp`) are matched on their published stem so pre-publication validation works.
 */
export function filenameMatchesId(filename: string, id: string): boolean {
  const stem = filename.replace(/\.md(?:\..*)?$/, "");
  if (stem === id || stem.startsWith(`${id}-`)) return true;
  const short = shortId(id);
  return short !== null && stem.endsWith(`-${short}`);
}
