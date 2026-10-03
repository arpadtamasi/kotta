import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { APPROVAL_FILE, ARCHIVE_DIRECTORY, CHANGES_DIRECTORY, MODEL_DIRECTORY, OPENSPEC_DIRECTORY, PLANNING_FILE } from "../spec/change.js";
import { markdownFiles } from "../spec/narrative.js";

/**
 * The part of `kotta migrate` that takes changes out of OpenSpec's folder (UC-01m0f0wn89x00jkpqpqc2esx9h,
 * EX-01m40e0bs4dbanbw4ypr86pf0x). Up to 1.0.0-alpha.2 a
 * Kotta change lived at `openspec/changes/<name>/`; from alpha.3 it lives at
 * `.kotta/changes/<name>/`, whether or not the project uses OpenSpec, and OpenSpec is only an
 * optional narrative beside the model.
 *
 * - Every open change under `openspec/changes/` moves to `<workspace>/changes/`: in a Kotta project
 *   a proposal starts in Kotta's folder, so an OpenSpec proposal waiting there is one too.
 * - An archived change that carries a Kotta model or receipt moves to `<workspace>/changes/archive/`.
 *   OpenSpec's own archive — proposals without a model — stays, as the history `import` reads.
 * - Inside a moved change that has not been approved, a provenance source naming its old folder is
 *   rewritten to the new one. An approved change is left byte-identical: its receipt is a hash of
 *   its model, and the migration does not touch a yes.
 * - Before alpha.3 an unset `narrative:` meant `generated`; now it means `none`. A workspace that has
 *   narrative specs under `openspec/specs/` and no setting gets `narrative: generated` written, so
 *   archive keeps doing what it did.
 *
 * Nothing under `.kotta/spec/` is read or written.
 */

export interface ChangeMove { from: string; to: string; rewrite: string[] }

export interface ChangeMigrationPlan {
  moves: ChangeMove[];
  /** Set when the config gains `narrative: generated`. */
  narrative: boolean;
  notes: string[];
}

function isDirectory(path: string): boolean {
  try { return statSync(path).isDirectory() && !lstatSync(path).isSymbolicLink(); }
  catch { return false; }
}

function directories(path: string): string[] {
  if (!isDirectory(path)) return [];
  return readdirSync(path, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

const carriesKotta = (directory: string) => [MODEL_DIRECTORY, PLANNING_FILE, APPROVAL_FILE].some((file) => existsSync(join(directory, file)));

function narrativeUnset(root: string, workspace: string): boolean {
  for (const path of [join(root, workspace, "config.yaml"), join(root, OPENSPEC_DIRECTORY, "config.yaml")]) {
    if (!existsSync(path)) continue;
    try {
      const value = (parseYaml(readFileSync(path, "utf8")) as Record<string, unknown> | null)?.narrative;
      if (value !== undefined && value !== null) return false;
    } catch { /* an unreadable config is validate's to report */ }
  }
  return true;
}

/** `workspace` is the workspace directory's name the moves land under, `.kotta` after any rename. */
export function planChangeMigration(root: string, workspace: string): ChangeMigrationPlan {
  const source = join(OPENSPEC_DIRECTORY, CHANGES_DIRECTORY);
  const target = join(workspace, CHANGES_DIRECTORY);
  const moves: ChangeMove[] = [];
  const notes: string[] = [];

  for (const name of directories(join(root, source)).filter((entry) => entry !== ARCHIVE_DIRECTORY)) {
    const from = join(source, name);
    const approved = existsSync(join(root, from, APPROVAL_FILE));
    const rewrite = approved ? [] : markdownFiles(join(root, from, MODEL_DIRECTORY))
      .filter((file) => readFileSync(file, "utf8").includes(`${from}/`))
      .map((file) => relative(join(root, from), file));
    if (approved && markdownFiles(join(root, from, MODEL_DIRECTORY)).some((file) => readFileSync(file, "utf8").includes(`${from}/`))) {
      notes.push(`${name} is approved, so its model was moved byte-identical: its provenance still names ${from}/. Archive it as it is, or rewrite the sources to ${join(target, name)}/ and plan and approve it again.`);
    }
    moves.push({ from, to: join(target, name), rewrite });
  }
  for (const name of directories(join(root, source, ARCHIVE_DIRECTORY))) {
    const from = join(source, ARCHIVE_DIRECTORY, name);
    if (carriesKotta(join(root, from))) moves.push({ from, to: join(target, ARCHIVE_DIRECTORY, name), rewrite: [] });
  }
  const taken = moves.filter((move) => existsSync(join(root, move.to))).map((move) => move.to);
  if (taken.length) {
    throw new Error(`Migration cannot move the change${taken.length === 1 ? "" : "s"} out of ${source}/: ${taken.join(", ")} already exist${taken.length === 1 ? "s" : ""}. Merge or rename by hand, then migrate again. Nothing was written.`);
  }

  const narrative = narrativeUnset(root, workspace) && markdownFiles(join(root, OPENSPEC_DIRECTORY, "specs")).length > 0;
  return { moves, narrative, notes };
}

function gitTracks(root: string, path: string): boolean {
  try { return execFileSync("git", ["ls-files", "--", path], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().length > 0; }
  catch { return false; }
}

function move(root: string, from: string, to: string): void {
  mkdirSync(dirname(join(root, to)), { recursive: true });
  if (gitTracks(root, from)) {
    try {
      execFileSync("git", ["mv", "-k", from, to], { cwd: root, stdio: "ignore" });
      if (existsSync(join(root, to)) && !existsSync(join(root, from))) return;
    } catch { /* the plain rename below is the same move */ }
  }
  // `git mv -k` moves the tracked files only; whatever it left behind goes with a plain rename.
  if (existsSync(join(root, to))) {
    for (const entry of readdirSync(join(root, from))) move(root, join(from, entry), join(to, entry));
    rmdirSync(join(root, from));
    return;
  }
  renameSync(join(root, from), join(root, to));
}

export function applyChangeMigration(root: string, workspace: string, plan: ChangeMigrationPlan): void {
  for (const entry of plan.moves) {
    move(root, entry.from, entry.to);
    for (const file of entry.rewrite) {
      const path = join(root, entry.to, file);
      writeFileSync(path, readFileSync(path, "utf8").split(`${entry.from}/`).join(`${entry.to}/`));
    }
  }
  if (plan.narrative) {
    const path = join(root, workspace, "config.yaml");
    const data = (parseYaml(readFileSync(path, "utf8")) ?? {}) as Record<string, unknown>;
    writeFileSync(path, stringifyYaml({ ...data, narrative: "generated" }));
  }
}
