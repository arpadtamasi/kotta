import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { displayId } from "../core/identity.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { parseOpenQuestions, unresolvedQuestions, type OpenQuestion } from "../core/questions.js";
import { readFormRegistry, readSpecNodes } from "../spec/registry.js";

/**
 * What still waits on a human, for one specification node or for all of them.
 *
 * A draft carries its undecided points under an `Open decisions` heading, one list item each. The
 * planning phase (phase 2) refuses to approve a model delta while any of them is open; this command
 * is the read that lists them. Nothing here writes, and a workspace that does not validate is still
 * answerable — the question is asked most often about a draft that is not finished.
 */

export interface EntityQuestions {
  id: string;
  form: string;
  title: string;
  /** Path relative to the repository root, so the reader can open it. */
  path: string;
  questions: OpenQuestion[];
  /** How many of them are still unanswered — what puts this node ahead of the others. */
  open: number;
}

function relative(root: string, path: string): string {
  return path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
}

export interface QuestionsResult {
  ok: true;
  command: "questions";
  data: {
    /** The node asked about, when one was; null for the whole workspace. */
    entity: string | null;
    entities: EntityQuestions[];
    total: number;
    open: number;
  };
}

/**
 * Open questions, grouped by node: the most open first, then by id, so the order is the order to
 * work through. A question that names a decision reference counts as answered at face value; the
 * planning phase is where an answer is recorded and checked.
 */
export function openQuestions(id?: string, repositoryRoot?: string): QuestionsResult {
  const root = repositoryRoot ? resolve(repositoryRoot) : findRepositoryRoot();
  const { forms } = readFormRegistry(root);
  const { nodes } = readSpecNodes(root, forms);
  let entity: string | null = null;
  let wanted = nodes;

  if (id) {
    const trimmed = id.trim();
    // The id the CLI printed is the id the CLI accepts: a short form resolves here, and two matches
    // are refused rather than guessed between.
    const matches = nodes.filter((node) => node.id === trimmed || displayId(node.id) === trimmed);
    const ids = [...new Set(matches.map((node) => node.id))];
    if (ids.length > 1) throw new Error(`Node id '${trimmed}' is ambiguous; it matches ${ids.join(", ")}. Name one of them in full.`);
    if (!ids.length) throw new Error(`No specification node matches '${trimmed}'.`);
    entity = ids[0];
    wanted = matches;
  }

  const entities = wanted.flatMap((node): EntityQuestions[] => {
    const content = readFileSync(node.path, "utf8");
    const questions = parseOpenQuestions(node.id, content);
    if (!questions.length) return [];
    return [{
      id: node.id,
      form: node.form,
      title: typeof node.data.title === "string" ? node.data.title.trim() : node.id,
      path: relative(root, node.path),
      questions,
      open: unresolvedQuestions(questions).length,
    }];
  });

  entities.sort((a, b) => b.open - a.open || a.id.localeCompare(b.id));

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
