import { findRepositoryRoot, workspacePath } from "../filesystem/workspace.js";
import { idFromEntityFile, listEntities, listIds } from "../filesystem/entities.js";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { controlPlaneRoot } from "../git/control-plane.js";
import { parseMarkdown } from "../core/markdown.js";
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
  // A revised contract sits in backlog next to ones that were never signed, and looks
  // identical to them. The reason is what distinguishes work that was reconsidered from
  // work that was never approved, so it is named here rather than left in the file.
  const revised = listEntities(root, "contract", ["backlog"]).flatMap((entity) => {
    const reason = String((parseMarkdown(readFileSync(entity.path, "utf8")).data.revision_reason ?? "")).trim();
    return reason ? [{ id: entity.id, title: entity.title, reason }] : [];
  });
  return { ok: true, command: "status", data: { workspace: workspacePath(root), definedContracts: byDirectory("defined"), activeContracts: byDirectory("active"), reviewContracts: byDirectory("review"), newObservations: byDirectory("observations/new"), allContracts: listIds(root, "contract"), revisedContracts: revised, skills: skillDrift() } };
}
