import { readFileSync, unlinkSync } from "node:fs";
import { findRepositoryRoot, regenerateIndex } from "../filesystem/workspace.js";
import { entityCopies, type EntityKind } from "../filesystem/entities.js";
import { parseMarkdown } from "../core/markdown.js";

/**
 * Resolve one entity that a merge left in two state directories (T-036, second root of F-008).
 *
 * The rule is deterministic and respects lifecycle progression: the furthest-advanced copy is kept,
 * every earlier one is removed through the supported writer path and named in the result. The
 * command never decides for a human: if a copy's body differs from the kept one it stops, and it
 * never runs without explicit approval.
 */

/** Fields the lifecycle itself owns; they are expected to differ between two states. */
const LIFECYCLE_FIELDS = new Set(["status", "updated_at"]);

export interface DroppedCopy {
  state: string;
  path: string;
  /** Frontmatter fields, beyond the lifecycle-owned ones, that differed from the kept copy. */
  differing_fields: string[];
}

export interface DedupeResult {
  ok: true;
  command: string;
  data: {
    id: string;
    kept: { state: string; path: string };
    dropped: DroppedCopy[];
  };
}

function body(path: string): string {
  return parseMarkdown(readFileSync(path, "utf8")).content.replace(/\r\n/g, "\n").trim();
}

function differingFields(kept: Record<string, unknown>, dropped: Record<string, unknown>): string[] {
  const fields = new Set([...Object.keys(kept), ...Object.keys(dropped)].filter((field) => !LIFECYCLE_FIELDS.has(field)));
  return [...fields].filter((field) => JSON.stringify(kept[field] ?? null) !== JSON.stringify(dropped[field] ?? null)).sort();
}

export function dedupeEntity(kind: EntityKind, id: string, approved: boolean, repositoryRoot?: string): DedupeResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const label = kind === "task" ? "Task" : "Batch";
  const copies = entityCopies(root, kind, id);
  if (!copies.length) throw new Error(`${label} ${id} was not found.`);
  if (copies.length === 1) throw new Error(`${label} ${id} occupies a single state directory (${copies[0].state}); there is nothing to resolve.`);

  const collided = [...new Set(copies.map((copy) => copy.state))]
    .map((state) => copies.filter((copy) => copy.state === state))
    .find((group) => group.length > 1);
  if (collided) {
    throw new Error(`${label} ${id} has ${collided.length} files inside '${collided[0].state}': ${collided.map((copy) => copy.path).join(", ")}. That is an identifier collision, not a merge duplicate; dedupe never chooses between distinct entities.`);
  }

  // entityCopies returns lifecycle order, so the last copy is the furthest-advanced state.
  const kept = copies[copies.length - 1];
  const losing = copies.slice(0, -1);
  const keptBody = body(kept.path);
  for (const copy of losing) {
    if (body(copy.path) !== keptBody) {
      throw new Error(`${label} ${id} has different bodies in '${copy.state}' (${copy.path}) and '${kept.state}' (${kept.path}). Dedupe never discards content: reconcile the two bodies first, then re-run.`);
    }
  }

  if (!approved) {
    throw new Error(`Human approval is required to drop a duplicate copy of ${id}. Re-run with --approve to keep '${kept.state}' (${kept.path}) and remove ${losing.map((copy) => `'${copy.state}' (${copy.path})`).join(", ")}.`);
  }

  const keptData = parseMarkdown(readFileSync(kept.path, "utf8")).data;
  const dropped: DroppedCopy[] = losing.map((copy) => {
    const fields = differingFields(keptData, parseMarkdown(readFileSync(copy.path, "utf8")).data);
    unlinkSync(copy.path);
    return { state: copy.state, path: copy.path, differing_fields: fields };
  });
  regenerateIndex(root);
  return { ok: true, command: `${kind} dedupe`, data: { id, kept: { state: kept.state, path: kept.path }, dropped } };
}

export function describeDedupe(data: DedupeResult["data"]): string {
  const dropped = data.dropped
    .map((copy) => `${copy.path} (${copy.state}${copy.differing_fields.length ? `; differing fields: ${copy.differing_fields.join(", ")}` : ""})`)
    .join(", ");
  return `Kept ${data.id} at ${data.kept.path} (${data.kept.state}); dropped ${dropped}.`;
}
