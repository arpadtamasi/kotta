import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { listEntities, type ListableEntity } from "../filesystem/entities.js";
import { displayId } from "../core/identity.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { controlPlaneRoot } from "../git/control-plane.js";
import { parseOpenQuestions, unresolvedQuestions, type OpenQuestion } from "../core/questions.js";
import { findDecision } from "./decision.js";

/**
 * What still waits on a human, for one entity or for all of them
 * (BR-01m0z873stwx7szg5896gwsbry, UC-01m0f0wn89m98wpkqq8e5c9p6p).
 *
 * The same parse the defining gate reads, so a listing can never disagree with a refusal. Nothing
 * here writes, and a workspace that does not validate is still answerable — the question is asked
 * most often about an entity that will not go through.
 */

/** The kinds that can carry the section. Only tasks do today; a hand-written one is still read. */
const KINDS: readonly ListableEntity[] = ["task", "observation", "batch"];

export interface EntityQuestions {
  id: string;
  kind: ListableEntity;
  title: string;
  state: string;
  /** Path relative to the repository root, so the reader can open it. */
  path: string;
  questions: OpenQuestion[];
  /** How many of them are still unanswered — what puts this entity ahead of the others. */
  open: number;
  /** Whether an unanswered question here is what stops the entity from being defined. */
  blocksDefining: boolean;
}

function relative(root: string, path: string): string {
  return path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
}

function forEntity(root: string, kind: ListableEntity, listed: { id: string; title: string; state: string; path: string }): EntityQuestions | null {
  if (!existsSync(listed.path)) return null;
  const content = readFileSync(listed.path, "utf8");
  const questions = parseOpenQuestions(listed.id, content, (decision) => Boolean(findDecision(root, decision)));
  if (!questions.length) return null;
  const open = unresolvedQuestions(questions).length;
  return {
    id: listed.id,
    kind,
    title: listed.title,
    state: listed.state,
    path: relative(root, listed.path),
    questions,
    open,
    // Only a task has a defining gate to block, and only before it is through it.
    blocksDefining: open > 0 && kind === "task" && listed.state === "backlog",
  };
}

export interface QuestionsResult {
  ok: true;
  command: "questions";
  data: {
    /** The entity asked about, when one was; null for the whole workspace. */
    entity: string | null;
    entities: EntityQuestions[];
    total: number;
    open: number;
  };
}

/**
 * Open questions, grouped by entity. Blocking entities come first, then the rest by how many
 * questions are still open, then by id, so the order is the order to work through.
 */
export function openQuestions(id?: string, repositoryRoot?: string): QuestionsResult {
  const root = controlPlaneRoot(repositoryRoot ? resolve(repositoryRoot) : findRepositoryRoot());
  const listed = KINDS.flatMap((kind) => listEntities(root, kind).map((found) => ({ kind, found })));
  let entity: string | null = null;
  let wanted = listed;

  if (id) {
    const trimmed = id.trim();
    // The id the CLI printed is the id the CLI accepts, on every kind at once: a short form
    // resolves here the same way it resolves inside a family, and two matches are refused.
    const matches = listed.filter(({ found }) => found.id === trimmed || displayId(found.id) === trimmed);
    const ids = [...new Set(matches.map(({ found }) => found.id))];
    if (ids.length > 1) throw new Error(`Entity id '${trimmed}' is ambiguous; it matches ${ids.join(", ")}. Name one of them in full.`);
    if (!ids.length) throw new Error(`No entity matches '${trimmed}'.`);
    entity = ids[0];
    wanted = matches;
  }

  // An entity with nothing open is not an error: it is the empty enumeration, and saying so is the
  // answer the reader came for.
  const entities = wanted.flatMap(({ kind, found }) => forEntity(root, kind, found) ?? []);

  entities.sort((a, b) =>
    Number(b.blocksDefining) - Number(a.blocksDefining) || b.open - a.open || a.id.localeCompare(b.id));

  return {
    ok: true,
    command: "questions",
    data: {
      entity,
      entities,
      total: entities.reduce((count, item) => count + item.questions.length, 0),
      open: entities.reduce((count, item) => count + item.open, 0),
    },
  };
}
