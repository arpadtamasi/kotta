import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { filenameMatchesId } from "../core/identity.js";
import { parseMarkdown } from "../core/markdown.js";
import { processPath } from "./workspace.js";
import { resolveEffectiveTask, stateFromEntityFile } from "./entities.js";

export function findBatch(root: string, id: string) {
  const directory = processPath(root, "batches");
  if (existsSync(directory)) {
    const filename = readdirSync(directory).find((name) => name.endsWith(".md") && filenameMatchesId(name, id));
    if (filename) {
      const path = join(directory, filename);
      return { state: stateFromEntityFile(path), filename, path };
    }
  }
  throw new Error(`Batch ${id} was not found.`);
}

/**
 * Nesting is grouping and nothing else (D-01kztxvppd40r77cq7kw9b8wzr): a child batch has no
 * coordinator branch, no execution block of its own and no merge target. What it buys is a level
 * above the task for a large product, and one readable answer to "what is under this".
 */
export interface BatchTree {
  id: string;
  title: string;
  state: string;
  tasks: string[];
  children: BatchTree[];
}

function batchMembers(root: string, id: string): { tasks: string[]; batches: string[]; title: string; state: string } {
  const batch = findBatch(root, id);
  const data = parseMarkdown(readFileSync(batch.path, "utf8")).data;
  return {
    tasks: Array.isArray(data.tasks) ? data.tasks.map(String) : [],
    batches: Array.isArray(data.batches) ? data.batches.map(String) : [],
    title: typeof data.title === "string" ? data.title : "",
    state: batch.state,
  };
}

/** The subtree under a batch. `seen` is the path back to the root, so a cycle names its own loop. */
export function batchTree(root: string, id: string, seen: string[] = []): BatchTree {
  if (seen.includes(id)) throw new Error(`Batch nesting is cyclic: ${[...seen, id].join(" → ")}.`);
  const members = batchMembers(root, id);
  return {
    id, title: members.title, state: members.state, tasks: members.tasks,
    children: members.batches.map((child) => batchTree(root, child, [...seen, id])),
  };
}

/** Every task under a batch, direct members first, then each child in declaration order. */
export function subtreeTasks(tree: BatchTree): string[] {
  return [...tree.tasks, ...tree.children.flatMap(subtreeTasks)];
}

export interface OpenMember { id: string; state: string }

/**
 * What is still open under a batch. A batch is finished when its whole subtree is, so both the
 * explicit `batch close` and the automatic completion a closing task triggers ask this one
 * question: a parent that reads only its own `tasks` array would report done while a child
 * batch was still running (F-01m0f1mqaydrtkx3x2nbck58ke).
 *
 * A task executing in its own worktree still reads as defined on the control plane, so member
 * state is the effective one.
 */
export function openSubtreeMembers(root: string, id: string): { children: OpenMember[]; tasks: OpenMember[]; taskCount: number } {
  const tree = batchTree(root, id);
  const taskIds = [...new Set(subtreeTasks(tree))];
  return {
    children: tree.children.filter((child) => child.state !== "done").map((child) => ({ id: child.id, state: child.state })),
    tasks: taskIds
      .map((taskId) => ({ id: taskId, state: resolveEffectiveTask(root, taskId, (task) => task.state).value }))
      .filter((member) => member.state !== "done"),
    taskCount: taskIds.length,
  };
}

/** Whether every child batch and every task under a batch has reached done. */
export function batchSubtreeComplete(root: string, id: string): boolean {
  const open = openSubtreeMembers(root, id);
  return open.children.length === 0 && open.tasks.length === 0;
}
