import { readFileSync } from "node:fs";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { controlPlaneRoot } from "../git/control-plane.js";
import { canonicalEntityId, listEntities, type ListableEntity } from "../filesystem/entities.js";
import { parseMarkdown } from "../core/markdown.js";
import { displayId } from "../core/identity.js";
import { readTaskVocabulary } from "../compatibility/task-v3.js";

export interface ShowResult {
  ok: true;
  command: string;
  data: { entity: ListableEntity; id: string; state: string; path: string; title: string; facts: Record<string, string>; body: string; superseded: Array<{ id: string; title: string }> };
}

/**
 * One entity as it is stored. Deliberately not `task brief`: the brief is the
 * execution package — decisions, profiles, claim, token accounting — assembled for an
 * agent about to implement. This answers the other question, "what does it say", for
 * every entity kind rather than for tasks alone.
 */
export function showCommand(entity: ListableEntity, id: string, repositoryRoot?: string): ShowResult {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const canonical = canonicalEntityId(root, entity, id);
  const found = listEntities(root, entity).find((candidate) => candidate.id === canonical);
  if (!found) throw new Error(`${entity} ${id} was not found.`);

  const parsed = parseMarkdown(readFileSync(found.path, "utf8"));
  parsed.data = readTaskVocabulary(parsed.data);
  const facts: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (key === "id" || key === "title" || key === "status") continue;
    // An unset field is absent, not empty: a block of `branch: null` lines says nothing
    // and hides the two facts that are set.
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value) && !value.length) continue;
    facts[key] = Array.isArray(value) ? value.map(String).join(", ") : String(value);
  }
  const title = typeof parsed.data.title === "string" ? parsed.data.title.trim() : "";
  const superseded = entity === "decision" ? supersededTasks(root, canonical) : [];
  return { ok: true, command: `${entity} show`, data: { entity, id: canonical, state: found.state, path: found.path, title, facts, body: parsed.content.trim(), superseded } };
}

/**
 * The tasks a decision retired, read back from the tasks themselves.
 * A decision file keeps three fields and stays that way; the link is stored once, on the
 * task that lost its purpose, and the decision's side of it is derived here.
 */
function supersededTasks(root: string, decision: string): Array<{ id: string; title: string }> {
  return listEntities(root, "task")
    .filter((found) => parseMarkdown(readFileSync(found.path, "utf8")).data.superseded_by === decision)
    .map(({ id, title }) => ({ id, title }));
}

export function formatShow(result: ShowResult): string {
  const { id, state, title, facts, body, path, superseded } = result.data;
  const width = Math.max(...["state", "id", ...Object.keys(facts)].map((key) => key.length));
  const lines = [
    title || "(untitled)",
    "",
    `  ${"state".padEnd(width)}  ${state}`,
    `  ${"id".padEnd(width)}  ${displayId(id)}${displayId(id) === id ? "" : `  (${id})`}`,
    ...Object.entries(facts).map(([key, value]) => `  ${key.padEnd(width)}  ${value}`),
    `  ${"path".padEnd(width)}  ${path}`,
    ...(superseded.length ? ["", "Superseded tasks", ...superseded.map(({ id: retired, title: retiredTitle }) => `  ${displayId(retired)}  ${retiredTitle}`)] : []),
    "",
    body,
  ];
  return lines.join("\n");
}
