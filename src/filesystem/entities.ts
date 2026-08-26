import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseMarkdown } from "../core/markdown.js";
import { TASK_ID, displayId, filenameMatchesId } from "../core/identity.js";
import { processPath } from "./workspace.js";

export const TASK_STATES = ["backlog", "defined", "active", "review", "done"] as const;
/**
 * The sets the published schemas declare, stated once at runtime so they can be asserted against
 * (BR-01m0sj2f8mxydc7zxz6y8xn6b1). A TypeScript union alone vanishes before the comparison.
 */
export const ENTITY_ORIGINS = ["human", "agent", "observation", "imported"] as const;
export const OBSERVATION_ORIGINS = ["human", "agent"] as const;
export const EXECUTION_MODES = ["fresh", "inherited"] as const;
export const CLAIM_ORIGINS = ["created", "adopted"] as const;
export const OBSERVATION_TYPES = ["bug", "technical-debt", "risk", "improvement", "inconsistency", "duplication", "security", "performance", "other"] as const;
export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export const SEVERITY_LEVELS = ["low", "medium", "high", "critical"] as const;
/** A task's priority and its risk are graded on the same scale, and both are published. */
export const PRIORITY_LEVELS = SEVERITY_LEVELS;
export const RISK_LEVELS = SEVERITY_LEVELS;
export const BATCH_STATES = ["backlog", "defined", "active", "done"] as const;

export type EntityKind = "task" | "batch";

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

/**
 * How a terminal state was reached. `done` alone does not say whether work was delivered or
 * retired, and the two must not read alike (BR-01m0pw5bc7b1rkg5dct5qgdkmb) — so every reader that
 * shows a state can ask for the qualifier beside it. Absent on a live entity, which has not ended.
 */
/**
 * Whose noticing an observation records. Read for the listing, where the distinction between the
 * operator's own and an agent's is the one a reader wants first
 * (UC-01m0f0wn89jqb5mpcjjt1j5j8p).
 */
export function originFromEntityFile(path: string): string | null {
  try {
    const origin = String(parseMarkdown(readFileSync(path, "utf8")).data.origin ?? "").trim();
    return origin || null;
  } catch {
    return null;
  }
}

export function resolutionFromEntityFile(path: string): string | null {
  try {
    const resolution = String(parseMarkdown(readFileSync(path, "utf8")).data.resolution ?? "").trim();
    return resolution || null;
  } catch {
    return null;
  }
}

/** Lifecycle state of an entity file: the frontmatter status is the single authority. */
export function stateFromEntityFile(path: string): string {
  try {
    return String(parseMarkdown(readFileSync(path, "utf8")).data.status ?? "").trim();
  } catch {
    // Malformed frontmatter is reported by validation; an unreadable state stays empty.
    return "";
  }
}

export function findTask(root: string, id: string): TaskLocation {
  const directory = processPath(root, "tasks");
  if (existsSync(directory)) {
    const filename = readdirSync(directory).find((name) => name.endsWith(".md") && filenameMatchesId(name, id));
    if (filename) {
      const path = join(directory, filename);
      return { path, state: stateFromEntityFile(path), filename };
    }
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
 * Where an entity kind keeps its files. One stable directory per kind: lifecycle state lives in
 * the frontmatter status field alone, so a transition never moves a file.
 */
export function entityDirectory(entity: ListableEntity): string {
  switch (entity) {
    case "task": return "tasks";
    case "batch": return "batches";
    case "observation": return "observations";
    case "decision": return "decisions";
  }
}

/** The states an entity kind can be narrowed to, for the option that does the narrowing. */
export function entityStates(entity: ListableEntity): string[] {
  switch (entity) {
    case "task": return [...TASK_STATES];
    case "batch": return [...BATCH_STATES];
    case "observation": return [...OBSERVATION_STATES];
    case "decision": return ["recorded"];
  }
}

export function listIds(root: string, entity: "task" | "observation" | "batch"): string[] {
  return listEntities(root, entity).map(({ id }) => id);
}

export interface ListedEntity {
  id: string;
  state: string;
  title: string;
  path: string;
  /** How a terminal state was reached, when that changes what the state means; null otherwise. */
  resolution: string | null;
  /** Whose noticing this was, for observations; null for kinds that have no origin. */
  origin: string | null;
}

/**
 * Every entity of a kind, with the title a human reads first. Lifecycle order first, filename
 * order inside one state, so the same workspace always lists the same bytes. A file whose title
 * cannot be read is listed with an empty one rather than omitted: a listing that silently drops
 * entities is worse than an ugly row.
 */
export function listEntities(root: string, entity: ListableEntity, states?: string[]): ListedEntity[] {
  const directory = join(processPath(root), entityDirectory(entity));
  if (!existsSync(directory)) return [];
  const wanted = states?.length ? new Set(states) : null;
  const order = new Map(entityStates(entity).map((state, index) => [state, index]));
  return readdirSync(directory)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .flatMap((name) => {
      const file = join(directory, name);
      const id = idFromEntityFile(file, name);
      if (id === null) return [];
      const state = entity === "decision" ? "recorded" : stateFromEntityFile(file);
      return [{
        id,
        state,
        title: entityTitle(file),
        path: file,
        resolution: entity === "decision" ? null : resolutionFromEntityFile(file),
        origin: entity === "observation" ? originFromEntityFile(file) : null,
      }];
    })
    .filter(({ state }) => !wanted || wanted.has(state))
    .sort((a, b) => (order.get(a.state) ?? order.size) - (order.get(b.state) ?? order.size) || a.path.localeCompare(b.path));
}

/**
 * The full id behind an id the CLI printed. `displayId` shows a minted id by its last
 * eight characters, and until this existed that short form was output the input side
 * refused — every listing invited a name the next command would not accept.
 *
 * Ambiguity is refused rather than resolved: two entities behind one short form is a
 * question for the operator, and silently picking one is the worse failure.
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
