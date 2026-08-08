import { findRepositoryRoot, workspacePath } from "../filesystem/workspace.js";
import { idFromEntityFile, listIds } from "../filesystem/entities.js";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { controlPlaneRoot } from "../git/control-plane.js";
import { skillDrift } from "./sync.js";

export function statusCommand(repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const byDirectory = (state: string) => {
    const path = workspacePath(root, state);
    if (!existsSync(path)) return [];
    return readdirSync(path).filter((name) => name.endsWith(".md")).map((name) => idFromEntityFile(join(path, name), name)).filter((id): id is string => id !== null);
  };
  // The discovered workspace path is part of the answer: with two directory names in play, "which
  // directory did you read?" must be visible without guessing (D-007).
  // The skills are reported here because nothing else would say it: an agent told to prefer them
  // cannot notice that they were never installed, and an out-of-date copy fails silently.
  return { ok: true, command: "status", data: { workspace: workspacePath(root), definedContracts: byDirectory("defined"), activeContracts: byDirectory("active"), reviewContracts: byDirectory("review"), newObservations: byDirectory("observations/new"), allContracts: listIds(root, "contract"), skills: skillDrift() } };
}
