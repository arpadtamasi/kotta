import { findRepositoryRoot } from "../filesystem/workspace.js";
import { controlPlaneRoot } from "../git/control-plane.js";
import { entityStates, listEntities, type ListableEntity, type ListedEntity } from "../filesystem/entities.js";
import { displayId } from "../core/identity.js";

export interface ListResult {
  ok: true;
  command: string;
  data: { entity: ListableEntity; states: string[]; count: number; entities: ListedEntity[] };
}

/**
 * The plural of every entity lookup. Read-only by construction: it opens files, and
 * nothing here writes, commits or repairs — including the index, which a listing must
 * never quietly rebuild on someone's behalf.
 *
 * Canonical state is the control plane, not the working tree, so the answer is the same
 * from a linked worktree as from the checkout that owns the workspace.
 */
export function listCommand(entity: ListableEntity, options: { state?: string[] } = {}, repositoryRoot?: string): ListResult {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const available = entityStates(entity);
  const requested = options.state?.map((state) => state.trim()).filter(Boolean) ?? [];

  if (requested.length && entity === "decision") {
    throw new Error("Decisions have no lifecycle states — they are recorded or they do not exist — so --state does not apply to 'decision list'.");
  }
  const unknown = requested.filter((state) => !available.includes(state));
  if (unknown.length) {
    throw new Error(`Unknown ${entity} state${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}. ${entity} states are ${available.join(", ")}.`);
  }

  const entities = listEntities(root, entity, requested);
  return { ok: true, command: `${entity} list`, data: { entity, states: requested.length ? requested : available, count: entities.length, entities } };
}

/**
 * The title leads; the id is present because commands need it, never because a human
 * should read it first. States are padded to one width so the column scans vertically.
 */
export function formatList(result: ListResult): string {
  const { entity, states, count, entities } = result.data;
  if (!count) {
    const narrowed = states.length === entityStates(entity).length ? "" : ` in ${states.join(", ")}`;
    return `No ${plural(entity)}${narrowed}.`;
  }
  const width = Math.max(...entities.map(({ state }) => state.length));
  // displayId, not shortId: a sequential id has no short form, and printing `null`
  // beside a title is worse than printing the id it already has.
  const lines = entities.map(({ state, id, title }) => `  ${state.padEnd(width)}  ${title || "(untitled)"}  ${displayId(id)}`);
  return [...lines, `${count} ${count === 1 ? entity : plural(entity)}.`].join("\n");
}

function plural(entity: ListableEntity): string {
  return entity === "batch" ? "batches" : `${entity}s`;
}
