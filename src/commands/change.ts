import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { MODEL_DIRECTORY, PROPOSAL_FILE, assertChangeName, changesFolder, changesPath, listChanges, strandedChanges } from "../spec/change.js";

/**
 * `kotta change new <name>` — where every proposal starts (BR-01m40e0afjevd5jy04135bh7fj). A request to specify, propose or plan
 * something opens a change here, inside the workspace, whether or not the project uses OpenSpec: a
 * `proposal.md` in prose and an empty `model/` beside it for the planning phase to fill. Nothing
 * else is created, and nothing under `openspec/` is ever written.
 *
 * `kotta change list` — the open changes, and any an earlier release left in OpenSpec's folder.
 */

export interface ChangeNewResult {
  ok: true;
  command: "change new";
  data: { change: string; directory: string; proposal: string };
}

export interface ChangeListResult {
  ok: true;
  command: "change list";
  data: { folder: string; changes: string[]; stranded: string[] };
}

function proposalSkeleton(title: string): string {
  return [
    `# ${title}`,
    "",
    "## Why",
    "",
    "<!-- The problem or the opportunity, in the words of whoever asked. -->",
    "",
    "## What changes",
    "",
    "<!-- What will be true after the change, and what stays as it is. Name the accepted nodes it touches by title. -->",
    "",
    "## Open decisions",
    "",
    "<!-- One list item per point nobody has decided yet. Planning answers them before the gate. -->",
    "",
  ].join("\n");
}

export function newChange(options: { name: string; title?: string }, repositoryRoot?: string): ChangeNewResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const name = assertChangeName(options.name);
  const directory = changesPath(root, name);
  const path = (file: string) => relative(root, file).split(sep).join("/");
  if (existsSync(directory)) throw new Error(`${path(directory)}/ already exists. Nothing was written; plan the change that is there, or name another.`);
  const title = options.title?.trim() || name.replace(/[-_.]+/g, " ").replace(/^./, (first) => first.toUpperCase());
  mkdirSync(join(directory, MODEL_DIRECTORY), { recursive: true });
  const proposal = join(directory, PROPOSAL_FILE);
  writeFileSync(proposal, proposalSkeleton(title));
  return { ok: true, command: "change new", data: { change: name, directory: path(directory), proposal: path(proposal) } };
}

export function formatChangeNew(result: ChangeNewResult): string {
  const { data } = result;
  return [
    `Opened the change ${data.change} at ${data.directory}/.`,
    `Write the proposal in ${data.proposal}: why, what changes, and what is still undecided.`,
    `Then the plan-change skill drafts the model delta into ${data.directory}/model/ ('kotta spec new <form> --title "…" --into ${data.change}'), 'kotta plan ${data.change}' measures it, and the human decides it at the one gate.`,
    "Nothing was committed.",
  ].join("\n");
}

export function changeList(repositoryRoot?: string): ChangeListResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  return { ok: true, command: "change list", data: { folder: changesFolder(root), changes: listChanges(root), stranded: strandedChanges(root) } };
}

export function formatChangeList(result: ChangeListResult): string {
  const { data } = result;
  const lines = data.changes.length
    ? [`${data.changes.length} open change${data.changes.length === 1 ? "" : "s"} under ${data.folder}/:`, ...data.changes.map((name) => `  ${name}`)]
    : [`No open change under ${data.folder}/. Open one with 'kotta change new <name>'.`];
  if (data.stranded.length) {
    lines.push(`Left in OpenSpec's folder by an earlier release, and read by nothing there:`);
    for (const name of data.stranded) lines.push(`  openspec/changes/${name}  →  git mv openspec/changes/${name} ${data.folder}/${name}`);
  }
  return lines.join("\n");
}
