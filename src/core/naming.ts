/**
 * How an entity is named to a human (BR-01m0f0wn89c50fe1mz5yn1nw85).
 *
 * Permanence is what makes an identifier unreadable, so it is never what a human is shown. One
 * resolution serves the terminal, the calling chat and the gate question, because three of them
 * would eventually disagree about the same entity.
 */
import { displayId } from "./identity.js";

function trimmed(title: unknown): string {
  return typeof title === "string" ? title.trim() : "";
}

/**
 * The title alone. For a gate question, where the specification forbids an identifier outright, and
 * for prose that already carries the id elsewhere. Falls back to the id when there is no title to
 * name: a rendering never claims more than its result carries (BR-01m0pw5bc7b1rkg5dct5qgdkmb), and
 * a blank name would claim less.
 */
export function named(title: unknown, id: string): string {
  return trimmed(title) || id;
}

/**
 * The title with the identifier the reader will type back, for a result that invites a next
 * command. The id follows the title; it never replaces it.
 */
export function namedWithId(title: unknown, id: string): string {
  const name = trimmed(title);
  return name ? `${name} (${displayId(id)})` : id;
}
