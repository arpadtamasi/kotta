import { randomFillSync } from "node:crypto";

/**
 * Coordination-free node identity.
 *
 * A minted id is `<prefix>-<ULID>`: a 48-bit millisecond timestamp followed by 80 random bits, both
 * in lowercase Crockford base32. It is time-sortable and needs no allocator, lock or shared base
 * ref, so two branches that know nothing about each other can never mint the same id. The prefix
 * is declared by the node's form in the project-owned registry; none is compiled in here.
 */

/** Crockford base32: i, l, o and u are absent, so an id cannot be misread. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
const TIME_LENGTH = 10;
const RANDOM_LENGTH = 16;
export const MINTED_BODY_LENGTH = TIME_LENGTH + RANDOM_LENGTH;
/** Filename and display tail. 8 Crockford characters carry 40 random bits. */
export const SHORT_ID_LENGTH = 8;

export const MINTED_BODY = "[0-9a-hjkmnp-tv-z]{26}";
const MINTED = new RegExp(`^[A-Za-z]{1,4}-${MINTED_BODY}$`);

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

/** Mints a specification node id under the prefix its form declares. No scan, no allocator, no lock. */
export function mintSpecId(prefix: string, now: number = Date.now()): string {
  return `${prefix}-${encodeTime(now)}${encodeRandom()}`;
}

/** A specification node's filename, in the shape every registered form declares: `<slug>-<last 8>.md`. */
export function specFilename(id: string, slug: string): string {
  return `${slug || "untitled"}-${id.slice(-SHORT_ID_LENGTH)}.md`;
}

export function isMintedId(id: string): boolean {
  return MINTED.test(id);
}

/** The display tail of a minted id; `null` for anything else, which is short already. */
export function shortId(id: string): string | null {
  return isMintedId(id) ? id.slice(-SHORT_ID_LENGTH) : null;
}

/** Short human-facing form: `UC-a3f9c1d2` for a minted id, the id itself otherwise. */
export function displayId(id: string): string {
  const short = shortId(id);
  return short ? `${id.slice(0, id.indexOf("-") + 1)}${short}` : id;
}
