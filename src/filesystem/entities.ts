import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseMarkdown } from "../core/markdown.js";
import { TASK_ID, displayId, filenameMatchesId } from "../core/identity.js";
import { processPath } from "./workspace.js";

export const TASK_STATES = ["backlog", "defined", "active", "review", "done"] as const;
export const BATCH_STATES = ["backlog", "defined", "active", "done"] as const;

export type EntityKind = "task" | "batch";

export interface EntityCopy {
  state: string;
  path: string;
  filename: string;
}

/** State directories of an entity kind, in lifecycle order — the later entry is the further-advanced state. */
export function stateDirectories(kind: EntityKind): Array<{ state: string; directory: string }> {
  return kind === "task"
    ? TASK_STATES.map((state) => ({ state, directory: state }))
    : BATCH_STATES.map((state) => ({ state, directory: `batches/${state}` }));
}

/**
 * Every file claiming `id`, in lifecycle order. State is encoded by the directory, and Git does not
 * pair a cross-directory move as delete+add, so a merge can leave one entity in several of them (T-036).
 */
export function entityCopies(root: string, kind: EntityKind, id: string): EntityCopy[] {
  const copies: EntityCopy[] = [];
  for (const { state, directory } of stateDirectories(kind)) {
    const path = processPath(root, directory);
    if (!existsSync(path)) continue;
    for (const filename of readdirSync(path).filter((name) => name.endsWith(".md")).sort()) {
      const file = join(path, filename);
      if (idFromEntityFile(file, filename) === id) copies.push({ state, path: file, filename });
    }
  }
  return copies;
}

export interface TaskLocation {
  path: string;
  state: string;
  filename: string;
}

export interface EffectiveTask<T> {
  value: T;
  location: TaskLocation;
  worktree?: string;
  fallback?: { worktree: string; reason: string };
}

/** Sequential filenames carry their id up front; a minted entity's id lives only in the frontmatter. */
export function idFromFilename(filename: string): string | null {
  return /^(?:[TFP]-\d{3,}|O-\d+(?:\.\d+)?)(?=-)/.exec(filename)?.[0] ?? null;
}

/** Canonical id of an entity file: the frontmatter is the truth, the filename only a fallback. */
export function idFromEntityFile(path: string, filename: string): string | null {
  try {
    const id = String(parseMarkdown(readFileSync(path, "utf8")).data.id ?? "").trim();
    if (id) return id;
  } catch {
    // Malformed frontmatter is reported by validation; fall back to whatever the filename says.
  }
  return idFromFilename(filename);
}

export function findTask(root: string, id: string): TaskLocation {
  for (const state of TASK_STATES) {
    const directory = processPath(root, state);
    if (!existsSync(directory)) continue;
    const filename = readdirSync(directory).find((name) => name.endsWith(".md") && filenameMatchesId(name, id));
    if (filename) return { path: join(directory, filename), state, filename };
  }
  throw new Error(`Task ${id} was not found.`);
}

export function resolveEffectiveTask<T>(root: string, id: string, read: (task: TaskLocation) => T): EffectiveTask<T> {
  if (!TASK_ID.test(id)) throw new Error(`Invalid task id: ${id}`);
  const coordinator = findTask(root, id);
  // Current-shape workspaces keep live lifecycle state on the control plane. Only a defined
  // coordinator plus an active worktree is the legacy pre-control-plane execution shape.
  if (coordinator.state !== "defined") return { value: read(coordinator), location: coordinator };
  const worktree = join(root, ".worktrees", id);
  if (existsSync(worktree)) {
    try {
      const location = findTask(worktree, id);
      if (location.state === "active") return { value: read(location), location, worktree };
      return { value: read(coordinator), location: coordinator };
    } catch (error) {
      return {
        value: read(coordinator),
        location: coordinator,
        fallback: { worktree, reason: error instanceof Error ? error.message : String(error) },
      };
    }
  }
  return { value: read(coordinator), location: coordinator };
}

export const OBSERVATION_STATES = ["new", "resolved"] as const;

/** Every listable entity. Decisions are stored flat: recorded is the only state they have. */
export type ListableEntity = "task" | "observation" | "batch" | "decision";

/**
 * Where an entity kind keeps its files, paired with the state each directory means.
 * One source for the mapping: `status`, the index, `listIds` and `list` all read it,
 * so a new state cannot appear in one of them and be missing from the rest.
 */
export function entityStateDirectories(entity: ListableEntity): Array<{ state: string; directory: string }> {
  switch (entity) {
    case "task": return TASK_STATES.map((state) => ({ state, directory: state }));
    case "batch": return BATCH_STATES.map((state) => ({ state, directory: `batches/${state}` }));
    case "observation": return OBSERVATION_STATES.map((state) => ({ state, directory: `observations/${state}` }));
    case "decision": return [{ state: "recorded", directory: "decisions" }];
  }
}

/** The states an entity kind can be narrowed to, for the option that does the narrowing. */
export function entityStates(entity: ListableEntity): string[] {
  return entityStateDirectories(entity).map(({ state }) => state);
}

export function listIds(root: string, entity: "task" | "observation" | "batch"): string[] {
  return listEntities(root, entity).map(({ id }) => id);
}

export interface ListedEntity {
  id: string;
  state: string;
  title: string;
  path: string;
}

/**
 * Every entity of a kind, with the title a human reads first. Lifecycle order across
 * directories, then filename order inside one, so the same workspace always lists the
 * same bytes. A file whose title cannot be read is listed with an empty one rather
 * than omitted: a listing that silently drops entities is worse than an ugly row.
 */
export function listEntities(root: string, entity: ListableEntity, states?: string[]): ListedEntity[] {
  const workspace = processPath(root);
  const wanted = states?.length ? new Set(states) : null;
  return entityStateDirectories(entity)
    .filter(({ state }) => !wanted || wanted.has(state))
    .flatMap(({ state, directory }) => {
      const path = join(workspace, directory);
      if (!existsSync(path)) return [];
      return readdirSync(path)
        .filter((name) => name.endsWith(".md"))
        .sort()
        .flatMap((name) => {
          const file = join(path, name);
          const id = idFromEntityFile(file, name);
          return id === null ? [] : [{ id, state, title: entityTitle(file), path: file }];
        });
    });
}

/**
 * The full id behind an id the CLI printed. `displayId` shows a minted id by its last
 * eight characters, and until this existed that short form was output the input side
 * refused — every listing invited a name the next command would not accept.
 *
 * Ambiguity is refused rather than resolved: two entities behind one short form is a
 * question for the operator, and silently picking one is the worse failure. One id
 * living in two state directories is not ambiguity — a merge can leave it there, and
 * the readers already handle it in lifecycle order.
 */
export function canonicalEntityId(root: string, entity: ListableEntity, id: string): string {
  const trimmed = id.trim();
  const matches = [...new Set(listEntities(root, entity).map((found) => found.id))]
    .filter((candidate) => candidate === trimmed || displayId(candidate) === trimmed);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    throw new Error(`${entity} id '${trimmed}' is ambiguous; it matches ${matches.join(", ")}. Name one of them in full.`);
  }
  return trimmed;
}

function entityTitle(path: string): string {
  try {
    const title = parseMarkdown(readFileSync(path, "utf8")).data.title;
    return typeof title === "string" ? title.trim() : "";
  } catch {
    return "";
  }
}
