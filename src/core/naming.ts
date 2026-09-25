/**
 * How a node is named to a human. Permanence is what makes an identifier unreadable, so it is
 * never what a human is shown on its own: the title leads and the id rides along for recall.
 */
import { displayId } from "./identity.js";

function trimmed(title: unknown): string {
  return typeof title === "string" ? title.trim() : "";
}

/** The title alone, falling back to the id when there is no title to name. */
export function named(title: unknown, id: string): string {
  return trimmed(title) || id;
}

/** The title with the identifier the reader will type back. The id follows the title; it never replaces it. */
export function namedWithId(title: unknown, id: string): string {
  const name = trimmed(title);
  return name ? `${name} (${displayId(id)})` : id;
}

/** A filename-safe slug of a title: lowercase ASCII, hyphens, at most 60 characters. */
export function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
