import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createServer, type Server, type ServerResponse } from "node:http";
import { basename, dirname, extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { parse } from "yaml";
import { sections } from "../core/markdown.js";
import { parseOpenQuestions } from "../core/questions.js";
import { findTask, idFromFilename } from "../filesystem/entities.js";
import { ENV_PREFIX, readEnv } from "../core/env.js";
import { PROCESS_DIRECTORY, WORKSPACE_DIRECTORIES, WORKSPACE_SCHEMA_VERSION, flatWorkspaceEntries, hasWorkspace, legacyStateDirectories, v4StateDirectories, workspaceDirectoryName, workspaceSchemaVersion, workspaceShapeStanding } from "../filesystem/workspace.js";
import type { KottaEvent } from "../core/events.js";

function git(root: string, args: string[]): { ok: boolean; out: string } {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return { ok: result.status === 0, out: result.stdout ?? "" };
}
function listFilesFromRef(root: string, ref: string, directory: string, subpath: string, extension: string): string[] {
  const result = git(root, ["ls-tree", "-r", "--name-only", ref, `${directory}/${subpath}`]);
  return result.ok ? result.out.split("\n").map((line) => line.trim()).filter((line) => line.endsWith(extension)) : [];
}
function listMdFromRef(root: string, ref: string, directory: string, subpath: string): string[] {
  return listFilesFromRef(root, ref, directory, subpath, ".md");
}
function readFileFromRef(root: string, ref: string, repoPath: string): string | null {
  const result = git(root, ["show", `${ref}:${repoPath}`]);
  return result.ok ? result.out : null;
}
function uncommittedMdAdds(root: string, directory: string): string[] {
  const result = git(root, ["status", "--porcelain", "--", directory]);
  if (!result.ok) return [];
  return result.out.split("\n").filter(Boolean)
    .filter((line) => { const flag = line.slice(0, 2); return flag === "??" || flag.includes("A"); })
    .map((line) => line.slice(3).trim()).filter((path) => path.endsWith(".md"));
}

// One rev-parse resolves everything the base-ref decision needs: the base commit hash (cache key),
// the repo toplevel and the current branch. A failed call (no git repo, missing base) means "no base ref".
function baseRefInfo(root: string, base: string): { commit: string; toplevel: string; branch: string } | null {
  const result = git(root, ["rev-parse", `${base}^{commit}`, "--show-toplevel", "--abbrev-ref", "HEAD"]);
  if (!result.ok) return null;
  const [commit, toplevel, branch] = result.out.split("\n").map((line) => line.trim());
  return commit && toplevel && branch ? { commit, toplevel, branch } : null;
}

// Minimal ustar reader for `git archive` output: regular files only, pax path records honored.
function parseTar(archive: Buffer): Map<string, string> {
  const files = new Map<string, string>();
  const field = (block: Buffer, start: number, length: number): string => {
    const raw = block.subarray(start, start + length);
    const nul = raw.indexOf(0);
    return (nul === -1 ? raw : raw.subarray(0, nul)).toString("utf8");
  };
  let offset = 0;
  let paxPath: string | null = null;
  while (offset + 512 <= archive.length) {
    const block = archive.subarray(offset, offset + 512);
    if (block.every((byte) => byte === 0)) break;
    const size = Number.parseInt(field(block, 124, 12).trim() || "0", 8);
    const typeflag = String.fromCharCode(block[156] ?? 0);
    const content = archive.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;
    if (typeflag === "x" || typeflag === "X") {
      const record = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(content.toString("utf8"));
      if (record?.[1]) paxPath = record[1];
      continue;
    }
    if (typeflag !== "0" && typeflag !== "\0") continue; // pax global headers, directories, links
    const prefix = field(block, 345, 155);
    const name = field(block, 0, 100);
    files.set(paxPath ?? (prefix ? `${prefix}/${name}` : name), content.toString("utf8"));
    paxPath = null;
  }
  return files;
}

// In-process snapshot of the workspace directory at the base commit, read with a single `git archive`
// subprocess and cached on the commit hash: identical hash between reloads means no batch read. (T-029)
let refSnapshotCache: { key: string; files: Map<string, string> } | null = null;
function refSnapshot(root: string, commit: string, directory: string): Map<string, string> | null {
  const key = `${resolve(root)}\0${commit}\0${directory}`;
  if (refSnapshotCache?.key === key) return refSnapshotCache.files;
  const result = spawnSync("git", ["archive", "--format=tar", commit, "--", directory], { cwd: root, maxBuffer: 256 * 1024 * 1024 });
  if (result.status !== 0 || !Buffer.isBuffer(result.stdout)) {
    const detail = (result.stderr ?? "").toString().trim() || "unknown error";
    process.stderr.write(`kotta ui: batch read of ${directory} at ${commit} failed (${detail}); falling back to per-file git reads.\n`);
    return null;
  }
  refSnapshotCache = { key, files: parseTar(result.stdout) };
  return refSnapshotCache.files;
}

function sectionObject(content: string): Record<string, string> {
  return Object.fromEntries([...sections(content)].map(([key, value]) => [key, value.trim()]));
}

/**
 * Where the board reads from: the workspace directory, the repository root above it, and the
 * repo-relative directory name Git plumbing must use. `--workspace` may name either the repository
 * root or the workspace directory itself, under any name in `WORKSPACE_DIRECTORIES`.
 */
export function resolveWorkspaceLocation(workspaceOption: string): { workspace: string; projectRoot: string; directory: string } {
  const candidate = resolve(workspaceOption);
  const named = (WORKSPACE_DIRECTORIES as readonly string[]).includes(basename(candidate));
  const projectRoot = named ? dirname(candidate) : candidate;
  if (named || hasWorkspace(candidate)) {
    // A symlinked bridge between the two names points at one real directory; resolving to the real
    // name keeps `git archive`/`ls-tree` — which see a symlink as a link, not as a tree — working.
    const directory = workspaceDirectoryName(projectRoot);
    return { workspace: join(projectRoot, directory), projectRoot, directory };
  }
  return { workspace: candidate, projectRoot: candidate, directory: basename(candidate) };
}

export function readWorkspace(workspaceOption: string) {
  const { workspace, projectRoot, directory: workspaceDirectory } = resolveWorkspaceLocation(workspaceOption);
  if (!existsSync(join(workspace, "config.yaml"))) throw new Error(`No Kotta workspace found at ${workspace}.`);
  const config = parse(readFileSync(join(workspace, "config.yaml"), "utf8")) as { version?: unknown; project?: { name?: string }; git?: { base_branch?: string } };
  const schemaVersion = Number(config.version);
  const processDirectory = schemaVersion === WORKSPACE_SCHEMA_VERSION ? PROCESS_DIRECTORY : "__legacy_workspace_schema__";
  const base = config.git?.base_branch ?? "main";
  // Read from the base ref only when this workspace IS a git repo root with that ref; otherwise (non-git
  // fixtures, example dirs, a nested/uncommitted workspace) fall back to reading the working tree directly.
  const baseInfo = baseRefInfo(projectRoot, base);
  const useBase = baseInfo !== null && resolve(baseInfo.toplevel) === resolve(projectRoot);
  const onBase = useBase && baseInfo.branch === base;
  // Batched, cached ref-side content (T-029): one archive subprocess per base commit, memory-cached on
  // its hash. null (batch failure) falls back to the legacy per-file ls-tree/show path, loudly.
  const refFiles = useBase ? refSnapshot(projectRoot, baseInfo.commit, workspaceDirectory) : null;
  // Working-tree state is never cached: one status call per reload, filtered per subpath below.
  const uncommittedAdds = onBase ? uncommittedMdAdds(projectRoot, workspaceDirectory) : [];
  // `migration.json` is a pre-Kotta import artefact, not part of the entity model: its `tickets` /
  // `findings` / `packages` keys are frozen at what the importer wrote and deliberately keep the old
  // words, so an already-imported workspace stays readable. Nothing else in the code says them.
  const migrationPath = join(workspace, "migration.json");
  const migration = existsSync(migrationPath) ? JSON.parse(readFileSync(migrationPath, "utf8")) as { project?: string; tickets?: Array<{ id: string; [key: string]: unknown }> } : null;
  const migrationById = new Map((migration?.tickets ?? []).map((task) => [task.id, task]));

  // Derive the baseline entity set from the configured base ref (git plumbing, no checkout), so it does
  // not change when another process checks out a different branch in the primary working tree. When the
  // primary dir IS on the base branch, union its uncommitted workspace additions so freshly-created intake
  // shows immediately. Active worktrees are overlaid per task below. (T-016 / D-001)
  const readMd = (repoPath: string, fromRef: boolean): string =>
    (fromRef ? (refFiles?.get(repoPath) ?? readFileFromRef(projectRoot, base, repoPath)) : readFileSync(join(projectRoot, repoPath), "utf8")) ?? "";
  const listRefMd = (subpath: string): string[] => refFiles
    ? [...refFiles.keys()].filter((path) => path.startsWith(`${workspaceDirectory}/${subpath}/`) && path.endsWith(".md"))
    : listMdFromRef(projectRoot, base, workspaceDirectory, subpath);
  const gather = (subpath: string) => {
    const entries: Array<{ repoPath: string; fromRef: boolean }> = [];
    const seen = new Set<string>();
    if (useBase) {
      for (const path of listRefMd(subpath)) if (!seen.has(path)) { seen.add(path); entries.push({ repoPath: path, fromRef: true }); }
      for (const path of uncommittedAdds.filter((candidate) => candidate.startsWith(`${workspaceDirectory}/${subpath}/`))) if (!seen.has(path)) { seen.add(path); entries.push({ repoPath: path, fromRef: false }); }
    } else {
      const dir = join(workspace, subpath);
      if (existsSync(dir)) for (const name of readdirSync(dir).filter((entry) => entry.endsWith(".md"))) {
        const path = `${workspaceDirectory}/${subpath}/${name}`;
        if (!seen.has(path)) { seen.add(path); entries.push({ repoPath: path, fromRef: false }); }
      }
    }
    return entries.sort((left, right) => basename(left.repoPath).localeCompare(basename(right.repoPath)));
  };
  // Decisions are cross-cutting and stateless, so they carry a date instead of a status.
  // They come out of the same cached snapshot: no extra subprocess. (T-029)
  const decisions = gather(`${processDirectory}/decisions`).map((entry) => {
    const parsed = matter(readMd(entry.repoPath, entry.fromRef));
    const date = parsed.data.date;
    return {
      id: String(parsed.data.id ?? basename(entry.repoPath).replace(/\.md$/, "")),
      title: String(parsed.data.title ?? ""),
      date: date instanceof Date ? date.toISOString().slice(0, 10) : date === undefined ? null : String(date),
      filename: basename(entry.repoPath),
      sections: sectionObject(parsed.content),
    };
  });
  const decisionIds = new Set(decisions.map((decision) => decision.id));

  // Lifecycle state lives in the frontmatter status field alone; the file's location says nothing.
  const parseEntity = (entry: { repoPath: string; fromRef: boolean }): Record<string, unknown> => {
    const parsed = matter(readMd(entry.repoPath, entry.fromRef));
    const id = String(parsed.data.id ?? idFromFilename(basename(entry.repoPath)) ?? "");
    return {
      ...(parsed.data as Record<string, unknown>),
      filename: basename(entry.repoPath),
      sections: sectionObject(parsed.content),
      // The same parse the gate and the CLI read (BR-01m0z873stwx7szg5896gwsbry): the panel cannot
      // show an entity as clear while defining refuses it.
      questions: parseOpenQuestions(id, parsed.content, (decision) => decisionIds.has(decision)),
    };
  };

  const diagnostics: Array<{ entity: "task"; id: string; worktree: string; message: string }> = [];

  // Tasks: the base control plane is canonical. A defined base plus an active worktree is the
  // legacy pre-control-plane shape and remains readable until its next lifecycle mutation adopts it.
  // Identity comes from the frontmatter: a minted entity's filename carries only its short id suffix.
  const taskBase = new Map<string, Record<string, unknown>>();
  for (const entry of gather(`${processDirectory}/tasks`)) {
    const parsed = parseEntity(entry);
    const id = String(parsed.id ?? idFromFilename(basename(entry.repoPath)) ?? "");
    if (id && !taskBase.has(id)) taskBase.set(id, parsed);
  }
  const tasks = [...taskBase].map(([id, baseline]) => {
    const worktree = join(projectRoot, ".worktrees", id);
    if (existsSync(worktree)) {
      try {
        const location = findTask(worktree, id);
        const parsed = matter(readFileSync(location.path, "utf8"));
        if (String(parsed.data.id) !== id) throw new Error(`Task metadata id '${String(parsed.data.id)}' does not match ${id}.`);
        if (String(baseline.status) === "defined" && location.state === "active") {
          diagnostics.push({ entity: "task", id, worktree, message: "Legacy execution state is still stored in the feature worktree; the next lifecycle mutation will adopt it into the control plane." });
          return { ...(parsed.data as Record<string, unknown>), filename: location.filename, sections: sectionObject(parsed.content), questions: parseOpenQuestions(id, parsed.content, (decision) => decisionIds.has(decision)), migration: migrationById.get(id) ?? null, worktree };
        }
        return { ...baseline, migration: migrationById.get(id) ?? null, worktree };
      } catch (error) {
        diagnostics.push({ entity: "task", id, worktree: worktree, message: error instanceof Error ? error.message : String(error) });
      }
    }
    return { ...baseline, migration: migrationById.get(id) ?? null };
  });
  const batches = gather(`${processDirectory}/batches`).map(parseEntity);
  const observations = gather(`${processDirectory}/observations`).map(parseEntity);
  const eventPrefix = `${workspaceDirectory}/${processDirectory}/events/`;
  const eventPaths = useBase
    ? (refFiles ? [...refFiles.keys()].filter((path) => path.startsWith(eventPrefix) && path.endsWith(".json")) : listFilesFromRef(projectRoot, base, workspaceDirectory, `${processDirectory}/events`, ".json"))
    : (() => {
        const directory = join(workspace, processDirectory, "events");
        if (!existsSync(directory)) return [];
        return readdirSync(directory).flatMap((entity) => {
          const entityDirectory = join(directory, entity);
          return statSync(entityDirectory).isDirectory()
            ? readdirSync(entityDirectory).filter((name) => name.endsWith(".json")).map((name) => `${workspaceDirectory}/${processDirectory}/events/${entity}/${name}`)
            : [];
        });
      })();
  const events = eventPaths.map((path) => JSON.parse((useBase ? (refFiles?.get(path) ?? readFileFromRef(projectRoot, base, path)) : readFileSync(join(projectRoot, path), "utf8")) ?? "{}") as KottaEvent)
    .sort((left, right) => left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id));
  const claimPrefix = `${workspaceDirectory}/${processDirectory}/claims/`;
  const claimPaths = useBase
    ? (refFiles ? [...refFiles.keys()].filter((path) => path.startsWith(claimPrefix) && path.endsWith(".yaml")) : listFilesFromRef(projectRoot, base, workspaceDirectory, `${processDirectory}/claims`, ".yaml"))
    : (() => {
        const directory = join(workspace, processDirectory, "claims");
        return existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith(".yaml")).map((name) => `${workspaceDirectory}/${processDirectory}/claims/${name}`) : [];
      })();
  const claims = claimPaths.map((path) => parse((useBase ? (refFiles?.get(path) ?? readFileFromRef(projectRoot, base, path)) : readFileSync(join(projectRoot, path), "utf8")) ?? "{}") as Record<string, unknown>);
  const claimByTask = new Map(claims.map((claim) => [String(claim.task ?? ""), claim]));
  const tasksWithClaims = tasks.map((task) => ({ ...task, claim: claimByTask.get(String((task as Record<string, unknown>).id ?? "")) ?? null }));
  const notices = readNotices(projectRoot, workspace, useBase, base, tasks.length + batches.length + observations.length);
  return { workspace, project: migration?.project ?? config.project?.name ?? "Kotta workspace", migration, tasks: tasksWithClaims, batches, observations, decisions, events, claims, diagnostics, notices, generatedAt: new Date().toISOString() };
}

/** Entity files sitting in the working tree, under any historical shape — the counterweight to the ref read. */
function workingTreeEntityCount(workspace: string): number {
  const taskStates = ["backlog", "defined", "active", "review", "done"];
  const directories = [
    `${PROCESS_DIRECTORY}/tasks`, `${PROCESS_DIRECTORY}/batches`, `${PROCESS_DIRECTORY}/observations`,
    ...taskStates.map((state) => `${PROCESS_DIRECTORY}/${state}`),
    ...["backlog", "defined", "active", "done"].map((state) => `${PROCESS_DIRECTORY}/batches/${state}`),
    `${PROCESS_DIRECTORY}/observations/new`, `${PROCESS_DIRECTORY}/observations/resolved`,
    ...taskStates, "ready",
    "observations/new", "observations/resolved", "findings/new", "findings/resolved",
    ...["backlog", "ready", "defined", "active", "done"].flatMap((state) => [`batches/${state}`, `packages/${state}`]),
  ];
  return directories.reduce((total, directory) => {
    const path = join(workspace, directory);
    return existsSync(path) ? total + readdirSync(path).filter((name) => name.endsWith(".md")).length : total;
  }, 0);
}

/**
 * What the board must say out loud instead of rendering an empty page (F-01kz25qf318bmn1t860n2rjcpt).
 *
 * The board reads the configured base ref through git plumbing, not the working tree, so a directory
 * or vocabulary migration that has not reached that ref yet produces a header path that looks right
 * above no content at all. That is indistinguishable from an empty workspace — unless the reader says
 * which side it read and why the other side is fuller.
 */
export function readNotices(projectRoot: string, workspace: string, useBase: boolean, base: string, fromRef: number): string[] {
  const notices: string[] = [];
  const legacy = legacyStateDirectories(projectRoot);
  const flat = flatWorkspaceEntries(projectRoot);
  const stateDirs = v4StateDirectories(projectRoot).map((name) => `${PROCESS_DIRECTORY}/${name}`);
  const version = workspaceSchemaVersion(projectRoot);
  const standing = workspaceShapeStanding(projectRoot);
  // The board explains rather than refuses, but it must not explain in the wrong direction: telling a
  // reader of a newer workspace to migrate would send them to the command that rewrites it backwards
  // (BR-01m0q89b16xcfasfj1z8mc2hgg). The far side of the window is its own notice, and it is the only
  // one shown, because no legacy directory finding is meaningful in a shape this build cannot read.
  if (standing === "newer" || standing === "unreadable") {
    notices.push(standing === "newer"
      ? `This workspace was written by a newer Kotta: its config records shape version ${version}, and this build implements version ${WORKSPACE_SCHEMA_VERSION}. The board does not read it. Upgrade Kotta; migration only carries a workspace forward and will not rewrite this one backwards.`
      : `This workspace does not record a readable shape version, so the board cannot tell whether it is older or newer than the version ${WORKSPACE_SCHEMA_VERSION} this build implements. Repair its config.yaml.`);
    return notices;
  }
  const readableVersion = version === WORKSPACE_SCHEMA_VERSION;
  const obsolete = [...new Set([...legacy, ...flat, ...stateDirs, ...(readableVersion ? [] : [`config schema ${Number.isFinite(version) ? version : "unreadable"}`])])];
  if (obsolete.length) {
    notices.push(`This workspace still uses a legacy shape (${obsolete.map((name) => name.startsWith("config schema ") ? name : `${name}${name.includes(".") ? "" : "/"}`).join(", ")}). The board does not read it. Run 'kotta migrate --dry-run', then 'kotta migrate'.`);
  }
  // Only when the shape is current: an old-shape workspace reads as empty for the reason above, and
  // saying "the ref has no entities" about it would be wrong — the ref has them, under the old names.
  if (!obsolete.length && useBase && fromRef === 0) {
    const onDisk = workingTreeEntityCount(workspace);
    if (onDisk > 0) {
      notices.push(`The board reads ${basename(workspace)}/ from the '${base}' ref, not from the working tree. That ref has no entities while the working tree has ${onDisk} — a migration or rename that has not reached '${base}' yet. Commit it and merge it into '${base}'; the board is empty until then, and the workspace is not.`);
    }
  }
  return notices;
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
}

function commandAvailable(command: string): boolean {
  return spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
};

export const DEFAULT_UI_PORT = 4311;
export const UI_PORT_RETRY_BOUND = 20;
const MAX_PORT = 65535;

/** The handover seam: tests point this at a harmless binary so no suite ever launches a browser. */
export const UI_OPEN_COMMAND_ENV = `${ENV_PREFIX}UI_OPEN_COMMAND`;

/** Hands a URL to the desktop; rejects when the handover itself failed. */
export type BrowserOpener = (url: string) => Promise<void>;

/** The platform command that hands a URL to whatever browser the desktop already prefers. */
export function resolveOpenCommand(platform: NodeJS.Platform = process.platform): { command: string; args: string[] } {
  const override = readEnv("UI_OPEN_COMMAND")?.trim();
  if (override) return { command: override, args: [] };
  if (platform === "darwin") return { command: "open", args: [] };
  // `start` is a shell builtin, and its first quoted argument is the window title, not the URL.
  if (platform === "win32") return { command: "cmd", args: ["/c", "start", ""] };
  return { command: "xdg-open", args: [] };
}

/** Unreferenced so a handover that never exits cannot outlive the server it announced. */
const openInBrowser: BrowserOpener = (url) => new Promise<void>((settle, fail) => {
  const { command, args } = resolveOpenCommand();
  const child = spawn(command, [...args, url], { stdio: "ignore" });
  child.once("error", (error) => fail(new Error(`${command}: ${error.message}`)));
  child.once("close", (status) => (status === 0 || status === null ? settle() : fail(new Error(`${command} exited with ${status}.`))));
  child.unref();
});

/** 0 stays legal: it asks the OS for an ephemeral port, which callers and tests rely on. */
export function validateUiPort(port: number): void {
  if (!Number.isInteger(port) || port < 0 || port > MAX_PORT) throw new Error(`--port must be an integer between 0 and ${MAX_PORT}; got '${port}'.`);
}

export function isAddressInUse(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === "EADDRINUSE";
}

/** Explicit ports are tried once; an omitted port walks upwards from `start` within the retry bound. */
export function uiPortCandidates(requested?: number, start = DEFAULT_UI_PORT): number[] {
  if (requested !== undefined) return [requested];
  const candidates: number[] = [];
  for (let index = 0; index < UI_PORT_RETRY_BOUND; index += 1) {
    const candidate = start + index;
    if (candidate > MAX_PORT) break;
    candidates.push(candidate);
  }
  return candidates;
}

function listenOnce(server: Server, host: string, port: number): Promise<void> {
  return new Promise<void>((resolvePromise, reject) => {
    const onError = (error: Error) => { server.removeListener("listening", onListening); reject(error); };
    const onListening = () => { server.removeListener("error", onError); resolvePromise(); };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

/** Binds `server`, falling back to the next port only for EADDRINUSE on an omitted `--port`. */
export async function bindUiServer(server: Server, host: string, requested?: number, start = DEFAULT_UI_PORT): Promise<{ port: number; fallback: boolean }> {
  if (requested !== undefined) validateUiPort(requested);
  const candidates = uiPortCandidates(requested, start);
  for (const candidate of candidates) {
    try {
      await listenOnce(server, host, candidate);
      // An explicit 0 asks for an ephemeral port, so report what the OS actually gave us.
      const bound = (server.address() as { port: number } | null)?.port ?? candidate;
      return { port: bound, fallback: requested === undefined && candidate !== start };
    } catch (error) {
      if (!isAddressInUse(error)) throw error;
      if (requested !== undefined) throw new Error(`Port ${requested} on ${host} is already in use. Stop the process holding it, or run 'kotta ui' without --port to take the next free port.`);
    }
  }
  const last = candidates[candidates.length - 1] ?? start;
  throw new Error(`Ports ${start}-${last} on ${host} are all in use. Free one of them, or run 'kotta ui --port <port>' with a port you know is free.`);
}

/** Returns the listening server so callers — tests above all — can shut it down. */
export async function uiCommand(options: { workspace: string; port?: number; host: string; json?: boolean; open?: boolean }, open: BrowserOpener = openInBrowser): Promise<Server> {
  const initial = readWorkspace(options.workspace);
  const projectRoot = resolveWorkspaceLocation(options.workspace).projectRoot;
  const agents = { codex: commandAvailable("codex"), claude: commandAvailable("claude") };
  const staticRoot = fileURLToPath(new URL("../../ui-dist", import.meta.url));
  if (!existsSync(join(staticRoot, "index.html"))) throw new Error("UI assets are missing. Run npm run build first.");
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const requestMethod = String(request.method ?? "GET");
    if (requestMethod !== "GET" && requestMethod !== "HEAD") {
      json(response, 405, { ok: false, error: "The Kotta board is read-only. Use the calling chat's Kotta tools for actions and approvals." });
      return;
    }
    if (url.pathname === "/api/workspace") {
      try { json(response, 200, readWorkspace(initial.workspace)); }
      catch (error) { json(response, 500, { error: error instanceof Error ? error.message : String(error) }); }
      return;
    }
    if (url.pathname === "/api/agents") {
      json(response, 200, agents);
      return;
    }
    if (url.pathname === "/api/source" && request.method === "GET") {
      try {
        const requestedId = url.searchParams.get("id")?.trim() ?? "";
        let sourceFile = url.searchParams.get("path")?.trim() ?? "";
        if (requestedId && !sourceFile) {
          const migrationPath = join(initial.workspace, "migration.json");
          if (existsSync(migrationPath)) {
            const migration = JSON.parse(readFileSync(migrationPath, "utf8")) as Record<string, unknown>;
            const records = ["tickets", "findings", "excluded_terminal"].flatMap((key) => Array.isArray(migration[key]) ? migration[key] as Array<Record<string, unknown>> : []);
            const record = records.find((candidate) => candidate.id === requestedId || candidate.legacy_id === requestedId);
            if (typeof record?.source_file === "string") sourceFile = record.source_file;
          }
        }
        sourceFile = sourceFile.replace(/^source:/, "").replace(/^\/+/, "");
        if (!sourceFile) throw new Error(`No historical source is recorded for ${requestedId || "this reference"}.`);
        let target = resolve(projectRoot, sourceFile);
        if (!existsSync(target) && sourceFile.startsWith("tasks/")) target = resolve(projectRoot, "scrum", sourceFile);
        const projectRelative = relative(projectRoot, target);
        if (!projectRelative || projectRelative.startsWith("..") || projectRelative.includes("\0") || extname(target) !== ".md") throw new Error("Only Markdown sources inside the project can be opened.");
        if (!existsSync(target) || !statSync(target).isFile()) throw new Error(`Source file not found: ${sourceFile}`);
        const parsed = matter(readFileSync(target, "utf8"));
        json(response, 200, { ok: true, path: projectRelative, title: parsed.data.title ?? basename(target), id: parsed.data.id ?? (requestedId || null), content: parsed.content.trim() });
      } catch (error) {
        json(response, 404, { ok: false, error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }
    const requested = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
    const path = normalize(join(staticRoot, requested));
    const safePath = path.startsWith(staticRoot) && existsSync(path) && statSync(path).isFile() ? path : join(staticRoot, "index.html");
    response.writeHead(200, { "content-type": MIME[extname(safePath)] ?? "application/octet-stream", "cache-control": "no-store" });
    createReadStream(safePath).pipe(response);
  });
  const { port, fallback } = await bindUiServer(server, options.host, options.port);
  const url = `http://${options.host}:${port}`;
  const note = fallback ? `Port ${DEFAULT_UI_PORT} was busy; selected ${port}.\n` : "";
  process.stdout.write(options.json
    ? `${JSON.stringify({ ok: true, command: "ui", data: { url, host: options.host, port, workspace: initial.workspace, fallback } })}\n`
    : `Kotta UI: ${url}\nWorkspace: ${initial.workspace}\n${note}Press Ctrl+C to stop.\n`);
  // --json is for automation, so it never steals focus. A failed handover is a note, not a startup failure.
  if (!options.json && options.open !== false) {
    try {
      await open(url);
    } catch (error) {
      process.stderr.write(`Warning: could not open ${url} in a browser (${error instanceof Error ? error.message : String(error)}). Open it yourself.\n`);
    }
  }
  return server;
}
