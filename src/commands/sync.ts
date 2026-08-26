import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { readEnv } from "../core/env.js";
import { findRepositoryRoot, hasWorkspace, syncWorkspaceForms } from "../filesystem/workspace.js";
import { linkProjectAgents, pointerLine, syncWorkspaceAgents } from "./agents.js";

/** Skill directories the v3 `contract` vocabulary named; sync removes an owned leftover once its rename is installed. */
const LEGACY_TASK_SKILL_RENAMES: Readonly<Record<string, string>> = {
  "close-contract": "close-task",
  "define-contract": "define-task",
  "design-by-contract": "design-by-task",
  "execute-contract": "execute-task",
  "start-contract": "start-task",
};

/**
 * Kotta ships its skills inside the package, but nothing has ever installed them — so the
 * `AGENTS.md` instruction to prefer them has never had a true precondition. `sync` copies them
 * where the host looks.
 *
 * The install is GLOBAL, not per repository. A copy under the host's skill directory is seen by
 * every project and every linked worktree, which removes the worktree-path problem rather than
 * solving it once per checkout.
 *
 * It is a copy, never a symlink. The only skills ever installed on the operator's machine were
 * symlinks into a directory that later moved, and both were dangling by the time anyone looked.
 */

/** Where the shipped skills live: `<package>/skills`, alongside `profiles/` and `templates/`. */
export function shippedSkillsRoot(): string {
  return fileURLToPath(new URL("../../skills", import.meta.url));
}

/**
 * Where the host reads skills from. `KOTTA_SKILLS_HOME` redirects the whole operation, so tests
 * never touch the real home directory.
 */
export function installedSkillsRoot(environment: NodeJS.ProcessEnv = process.env): string {
  const override = readEnv("SKILLS_HOME", environment)?.trim();
  return override || join(homedir(), ".claude", "skills");
}

/**
 * One manifest naming what Kotta installed, so a later run can tell its own copy from a
 * same-named skill belonging to another tool. It records ownership only — never content. Drift is
 * answered by comparing against the shipped files directly, so there is no hash here to fall out
 * of date.
 */
function manifestPath(target: string): string {
  return join(target, ".kotta-installed.json");
}

function readManifest(target: string): Set<string> {
  const path = manifestPath(target);
  if (!existsSync(path)) return new Set();
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { skills?: unknown };
    return new Set(Array.isArray(parsed.skills) ? parsed.skills.map(String) : []);
  } catch {
    return new Set(); // an unreadable manifest claims nothing: better to skip than to clobber
  }
}

function writeManifest(target: string, names: Set<string>): void {
  writeFileSync(manifestPath(target), `${JSON.stringify({ skills: [...names].sort() }, null, 2)}\n`);
}

export interface SyncResult {
  ok: true;
  command: "sync";
  data: {
    target: string;
    created: string[];
    updated: string[];
    unchanged: string[];
    skipped: string[];
    removed: string[];
  };
}

function shippedSkillNames(source: string): string[] {
  if (!existsSync(source)) return [];
  return readdirSync(source, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(source, name, "SKILL.md")))
    .sort();
}

/** Every file in a skill directory, as relative paths, sorted — the unit of comparison. */
function skillFiles(directory: string, relative = ""): string[] {
  const here = relative ? join(directory, relative) : directory;
  return readdirSync(here, { withFileTypes: true })
    .flatMap((entry) => {
      const path = relative ? join(relative, entry.name) : entry.name;
      return entry.isDirectory() ? skillFiles(directory, path) : [path];
    })
    .sort();
}

function sameSkill(shipped: string, installed: string): boolean {
  if (!existsSync(installed) || !statSync(installed).isDirectory()) return false;
  const left = skillFiles(shipped);
  const right = skillFiles(installed);
  if (left.length !== right.length || left.some((path, index) => path !== right[index])) return false;
  return left.every((path) => readFileSync(join(shipped, path)).equals(readFileSync(join(installed, path))));
}

/** A path that exists as a link but resolves to nothing — safe to replace, nothing is lost. */
function dangling(path: string): boolean {
  return !existsSync(path) && lstatSync(path, { throwIfNoEntry: false }) !== undefined;
}

export function syncSkills(environment: NodeJS.ProcessEnv = process.env): SyncResult {
  const source = shippedSkillsRoot();
  const target = installedSkillsRoot(environment);
  const created: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];
  const skipped: string[] = [];
  const removed: string[] = [];

  mkdirSync(target, { recursive: true });
  const owned = readManifest(target);

  for (const name of shippedSkillNames(source)) {
    const from = join(source, name);
    const to = join(target, name);

    if (sameSkill(from, to)) {
      owned.add(name); // adopt an identical copy: it is ours by content, whatever put it there
      unchanged.push(name);
      continue;
    }

    const occupied = existsSync(to);
    if (occupied && !owned.has(name)) {
      skipped.push(name); // someone else's skill under the same name — Kotta does not get to decide it is disposable
      continue;
    }

    const replaceable = occupied || dangling(to);
    if (replaceable) rmSync(to, { recursive: true, force: true });
    cpSync(from, to, { recursive: true, dereference: true });
    owned.add(name);
    (occupied ? updated : created).push(name);
  }

  // Remove only legacy task-vocabulary directories that Kotta's own manifest claims, and only
  // after their renamed replacement is present. Unowned collisions remain somebody else's files.
  for (const [legacy, current] of Object.entries(LEGACY_TASK_SKILL_RENAMES)) {
    const oldPath = join(target, legacy);
    if (!owned.has(legacy) || !owned.has(current) || !existsSync(join(target, current)) || !existsSync(oldPath)) continue;
    rmSync(oldPath, { recursive: true, force: true });
    owned.delete(legacy);
    removed.push(legacy);
  }

  writeManifest(target, owned);
  return { ok: true, command: "sync", data: { target, created, updated, unchanged, skipped, removed } };
}

/**
 * `sync` keeps both shipped artefacts current: the skills, in the host's global skill directory,
 * and the workspace rules file, in the repository. They travel together because they go stale
 * together — an upgrade moves both, and an agent reading yesterday's rules is the failure this
 * command exists to prevent.
 *
 * The project's own `AGENTS.md` is a third thing and is not Kotta's. `linkAgents` appends one
 * pointer line to it after a human said yes; without the flag the pointer is only reported, so the
 * calling agent can quote the exact line when it asks (D-01kztp2epe4sehb25mpv7hc33b).
 */
export function syncCommand(options: { linkAgents?: boolean; replaceRules?: boolean } = {}, environment: NodeJS.ProcessEnv = process.env) {
  const skills = syncSkills(environment);
  // `sync` installs the skills from anywhere; only the rules file needs a workspace to live in.
  const located = (() => { try { return findRepositoryRoot(); } catch { return null; } })();
  const root = located && hasWorkspace(located) ? located : null;
  if (root) syncWorkspaceForms(root);
  const agents = root ? syncWorkspaceAgents(root, { replace: options.replaceRules }) : null;
  const projectAgents = root && options.linkAgents ? linkProjectAgents(root) : null;
  return { ok: true as const, command: "sync" as const, data: { ...skills.data, agents, projectAgents, pointer: root ? pointerLine(root) : null } };
}

/**
 * Which installed skills no longer match the shipped ones — because Kotta was upgraded, or because
 * the copy was edited. Nothing is stored to answer this: the shipped skills are on disk in the
 * installed package, so the comparison is made directly.
 *
 * A skill that was never installed is not drift. `sync` has simply not been run, and `status`
 * reports that separately rather than nagging about ten absences.
 */
export function skillDrift(environment: NodeJS.ProcessEnv = process.env): { installed: number; shipped: number; drifted: string[] } {
  const source = shippedSkillsRoot();
  const target = installedSkillsRoot(environment);
  const owned = readManifest(target);
  const names = shippedSkillNames(source);
  const present = names.filter((name) => existsSync(join(target, name)));
  return {
    shipped: names.length,
    installed: present.length,
    drifted: present.filter((name) => owned.has(name) && !sameSkill(join(source, name), join(target, name))),
  };
}
