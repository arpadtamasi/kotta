import { findRepositoryRoot, workspacePath } from "../filesystem/workspace.js";
import { listEntities, listIds } from "../filesystem/entities.js";
import { resolveControlPlane } from "../git/control-plane.js";
import { skillDrift } from "./sync.js";
import { agentsDrift } from "./agents.js";

export function statusCommand(repositoryRoot?: string) {
  const controlPlane = resolveControlPlane(repositoryRoot ?? findRepositoryRoot());
  const root = controlPlane.root;
  const byState = (entity: "task" | "observation", state: string) =>
    listEntities(root, entity, [state]).map(({ id }) => id);
  // The discovered workspace path is part of the answer: with two directory names in play, "which
  // directory did you read?" must be visible without guessing (D-007).
  // The skills are reported here because nothing else would say it: an agent told to prefer them
  // cannot notice that they were never installed, and an out-of-date copy fails silently.
  return { ok: true, command: "status", data: { workspace: workspacePath(root), definedTasks: byState("task", "defined"), activeTasks: byState("task", "active"), reviewTasks: byState("task", "review"), newObservations: byState("observation", "new"), allTasks: listIds(root, "task"), skills: skillDrift(), rules: agentsDrift(root), controlPlane: { mode: controlPlane.mode, branch: controlPlane.branch, root: controlPlane.root } } };
}
