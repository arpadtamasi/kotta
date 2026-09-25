import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { createServer, type Server, type ServerResponse } from "node:http";
import { basename, dirname, extname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { parse } from "yaml";
import { sections } from "../core/markdown.js";
import { MINTED_BODY } from "../core/identity.js";
import { ENV_PREFIX, readEnv } from "../core/env.js";
import { SPEC_DIRECTORY, WORKSPACE_DIRECTORIES, WORKSPACE_SCHEMA_VERSION, WorkspaceShapeError, assertCurrentWorkspaceShape, hasWorkspace, workspaceDirectoryName } from "../filesystem/workspace.js";

function git(root: string, args: string[]): { ok: boolean; out: string } {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  return { ok: result.status === 0, out: result.stdout ?? "" };
}
function listFilesFromRef(root: string, ref: string, directory: string, subpath: string, extension: string): string[] {
  const result = git(root, ["ls-tree", "-r", "--name-only", ref, `${directory}/${subpath}`]);
  return result.ok ? result.out.split("\n").map((line) => line.trim()).filter((line) => line.endsWith(extension)) : [];
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
// subprocess and cached on the commit hash: identical hash between reloads means no batch read.
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
    const directory = workspaceDirectoryName(projectRoot);
    return { workspace: join(projectRoot, directory), projectRoot, directory };
  }
  return { workspace: candidate, projectRoot: candidate, directory: basename(candidate) };
}

/** Where a node came from and who settled it — the frontmatter contract of phase 2, carried as written. */
export interface BoardProvenance {
  level?: "stated" | "partly-inferred" | "inferred";
  decided_by?: "human" | "agent-proposed-human-approved" | "agent-decided";
  sources: string[];
  quote?: string;
  inferred?: string;
}

export interface BoardSpecNode {
  id: string;
  form: string;
  title: string;
  path: string;
  accepted: string[];
  edges: Record<string, string[]>;
  sections: Record<string, string>;
  /** Present only when the node records it; a node without one is shown without a mark. */
  provenance?: BoardProvenance;
  /** The optional capability path (`identity/user-auth`) the diagrams group by. */
  capability?: string;
}

const PROVENANCE_LEVELS = ["stated", "partly-inferred", "inferred"] as const;
const PROVENANCE_DECIDERS = ["human", "agent-proposed-human-approved", "agent-decided"] as const;

/**
 * The provenance block as the board shows it. Only the enumerated values are carried as a level or
 * a decider: an unknown word is not guessed into one of the three, it is left unmarked.
 */
export function readProvenance(value: unknown): BoardProvenance | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  const text = (field: unknown) => (typeof field === "string" && field.trim() ? field.trim() : undefined);
  const level = PROVENANCE_LEVELS.find((candidate) => candidate === raw.level);
  const decider = PROVENANCE_DECIDERS.find((candidate) => candidate === raw.decided_by);
  const sources = (Array.isArray(raw.sources) ? raw.sources : raw.sources === undefined ? [] : [raw.sources])
    .filter((source): source is string => typeof source === "string" && source.trim() !== "").map((source) => source.trim());
  const provenance: BoardProvenance = { sources };
  if (level) provenance.level = level;
  if (decider) provenance.decided_by = decider;
  const quote = text(raw.quote);
  if (quote) provenance.quote = quote;
  const inferred = text(raw.inferred);
  if (inferred) provenance.inferred = inferred;
  return provenance.level || provenance.decided_by || sources.length || quote || inferred ? provenance : undefined;
}

export interface BoardWorkspace {
  workspace: string;
  project: string;
  spec: BoardSpecNode[];
  specForms: Array<{ id: string; directory: string; title: string }>;
  notices: string[];
  generatedAt: string;
}

const MINTED_REFERENCE = new RegExp(`^[A-Za-z]{1,4}-${MINTED_BODY}$`);

/**
 * The specification as the board shows it: every node of every registered form, read from the
 * configured base ref through Git plumbing. A pre-1.0 workspace is refused, not explained — the
 * board is a command like any other and no command runs on the old shape.
 */
export function readWorkspace(workspaceOption: string): BoardWorkspace {
  const { workspace, projectRoot, directory: workspaceDirectory } = resolveWorkspaceLocation(workspaceOption);
  if (!existsSync(join(workspace, "config.yaml"))) throw new Error(`No Kotta workspace found at ${workspace}.`);
  if (hasWorkspace(projectRoot)) assertCurrentWorkspaceShape(projectRoot);
  const config = parse(readFileSync(join(workspace, "config.yaml"), "utf8")) as { version?: unknown; project?: { name?: string }; git?: { base_branch?: string } };
  if (Number(config.version) !== WORKSPACE_SCHEMA_VERSION) {
    throw new WorkspaceShapeError("older", `${workspace} records workspace shape version ${String(config.version)}, and this build implements version ${WORKSPACE_SCHEMA_VERSION}. Run 'kotta migrate --dry-run', then 'kotta migrate'; no other command reads the old shape.`);
  }
  const base = config.git?.base_branch ?? "main";
  // Read from the base ref only when this workspace IS a git repo root with that ref; otherwise (non-git
  // fixtures, example dirs, a nested/uncommitted workspace) fall back to reading the working tree directly.
  const baseInfo = baseRefInfo(projectRoot, base);
  const useBase = baseInfo !== null && resolve(baseInfo.toplevel) === resolve(projectRoot);
  const onBase = useBase && baseInfo.branch === base;
  const refFiles = useBase ? refSnapshot(projectRoot, baseInfo.commit, workspaceDirectory) : null;
  const uncommittedAdds = onBase ? uncommittedMdAdds(projectRoot, workspaceDirectory) : [];

  const readRepoFile = (repoPath: string, fromRef: boolean): string =>
    (fromRef ? (refFiles?.get(repoPath) ?? readFileFromRef(projectRoot, base, repoPath)) : readFileSync(join(projectRoot, repoPath), "utf8")) ?? "";
  const listRefMd = (subpath: string): string[] => refFiles
    ? [...refFiles.keys()].filter((path) => path.startsWith(`${workspaceDirectory}/${subpath}/`) && path.endsWith(".md"))
    : listFilesFromRef(projectRoot, base, workspaceDirectory, subpath, ".md");
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

  // The form registry decides which directories hold nodes, exactly as it does for the CLI — no
  // form name is compiled here.
  const specForms = (useBase
    ? (refFiles ? [...refFiles.keys()].filter((path) => path.startsWith(`${workspaceDirectory}/${SPEC_DIRECTORY}/forms/`) && path.endsWith(".yaml"))
      : listFilesFromRef(projectRoot, base, workspaceDirectory, `${SPEC_DIRECTORY}/forms`, ".yaml"))
    : (() => {
        const directory = join(workspace, SPEC_DIRECTORY, "forms");
        return existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith(".yaml")).map((name) => `${workspaceDirectory}/${SPEC_DIRECTORY}/forms/${name}`) : [];
      })())
    .map((path) => parse(readRepoFile(path, useBase) || "{}") as Record<string, unknown>)
    .flatMap((form) => {
      const id = String(form.id ?? "").trim();
      const directory = String((form.directory ?? "") as string).trim();
      return id && directory ? [{ id, directory, title: String(form.description ?? id).trim() }] : [];
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const spec: BoardSpecNode[] = specForms.flatMap((form) => gather(`${SPEC_DIRECTORY}/${form.directory}`).map((entry) => {
    const parsed = matter(readRepoFile(entry.repoPath, entry.fromRef));
    const id = String(parsed.data.id ?? "").trim();
    const provenance = readProvenance(parsed.data.provenance);
    const capability = typeof parsed.data.capability === "string" && parsed.data.capability.trim() ? parsed.data.capability.trim() : undefined;
    return {
      ...(provenance ? { provenance } : {}),
      ...(capability ? { capability } : {}),
      id,
      form: String(parsed.data.form ?? form.id).trim(),
      title: String(parsed.data.title ?? id).trim(),
      path: entry.repoPath,
      // The admission, kept as written: which kind of gap it records and why, or nothing at all.
      accepted: Array.isArray(parsed.data.accepted) ? parsed.data.accepted.map(String) : [],
      // Every frontmatter field that names other nodes, under the name its form gave it.
      edges: Object.fromEntries(Object.entries(parsed.data as Record<string, unknown>)
        .filter(([field]) => !["id", "form", "title", "accepted", "provenance", "capability"].includes(field))
        .map(([field, value]) => [field, (Array.isArray(value) ? value : [value])
          .filter((candidate): candidate is string => typeof candidate === "string" && MINTED_REFERENCE.test(candidate))])
        .filter(([, ids]) => (ids as string[]).length)) as Record<string, string[]>,
      sections: sectionObject(parsed.content),
    };
  })).filter((node) => node.id).sort((left, right) => left.title.localeCompare(right.title) || left.id.localeCompare(right.id));

  const notices = readNotices(workspace, useBase, base, spec.length);
  return { workspace, project: config.project?.name ?? "Kotta workspace", spec, specForms, notices, generatedAt: new Date().toISOString() };
}

/** Specification files sitting in the working tree — the counterweight to the ref read. */
function workingTreeNodeCount(workspace: string): number {
  const spec = join(workspace, SPEC_DIRECTORY);
  if (!existsSync(spec)) return 0;
  let total = 0;
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) { if (entry.name !== "forms") walk(join(directory, entry.name)); }
      else if (entry.name.endsWith(".md")) total += 1;
    }
  };
  walk(spec);
  return total;
}

/**
 * What the board must say out loud instead of rendering an empty page. The board reads the
 * configured base ref through git plumbing, not the working tree, so a specification that has not
 * reached that ref yet produces a header above no content at all.
 */
export function readNotices(workspace: string, useBase: boolean, base: string, fromRef: number): string[] {
  if (!useBase || fromRef > 0) return [];
  const onDisk = workingTreeNodeCount(workspace);
  if (onDisk === 0) return [];
  return [`The board reads ${basename(workspace)}/ from the '${base}' ref, not from the working tree. That ref has no specification nodes while the working tree has ${onDisk} — a change that has not reached '${base}' yet. Commit it and merge it into '${base}'; the board is empty until then, and the workspace is not.`];
}

/** The one folder the narrative endpoint reads, relative to the served project root. */
export const NARRATIVE_ROOT = "openspec";
const NARRATIVE_MAX_BYTES = 1024 * 1024;

export class NarrativeError extends Error {
  constructor(readonly status: 400 | 404, message: string) { super(message); }
}

/**
 * One Markdown file under the project's `openspec/` folder, read from the working tree — the
 * narrative a node's provenance cites. Refuses, rather than normalises, anything that could leave
 * that folder: an absolute path, a `..` segment, a backslash, a NUL byte, a non-Markdown file, and
 * a symbolic link whose target resolves outside it.
 */
export function readNarrative(projectRoot: string, requested: unknown): { path: string; content: string } {
  if (typeof requested !== "string" || !requested.trim()) throw new NarrativeError(400, "Name a file: ?path=openspec/changes/<change>/conversation.md.");
  const path = requested.trim();
  if (path.includes("\0") || path.includes("\\") || isAbsolute(path) || /^[A-Za-z]:/.test(path)) {
    throw new NarrativeError(400, `'${path}' is not a repository-relative path.`);
  }
  const segments = path.split("/");
  if (segments[0] !== NARRATIVE_ROOT || segments.length < 2 || segments.some((segment) => segment === ".." || segment === "." || segment === "")) {
    throw new NarrativeError(400, `Only files under ${NARRATIVE_ROOT}/ are served, named without '.' or '..' segments; got '${path}'.`);
  }
  if (extname(path).toLowerCase() !== ".md") throw new NarrativeError(400, `Only Markdown narrative is served; '${path}' is not a .md file.`);
  const folder = join(projectRoot, NARRATIVE_ROOT);
  const candidate = join(projectRoot, ...segments);
  if (!existsSync(folder) || !existsSync(candidate)) throw new NarrativeError(404, `No such file: ${path}.`);
  // The lexical checks above keep the name inside the folder; the real path keeps a link from leaving it.
  const realFolder = realpathSync(folder);
  const realFile = realpathSync(candidate);
  const inside = relative(realFolder, realFile);
  if (!inside || inside.startsWith("..") || isAbsolute(inside) || !realFile.startsWith(realFolder + sep)) {
    throw new NarrativeError(400, `'${path}' resolves outside ${NARRATIVE_ROOT}/.`);
  }
  const stat = statSync(realFile);
  if (!stat.isFile()) throw new NarrativeError(404, `No such file: ${path}.`);
  if (stat.size > NARRATIVE_MAX_BYTES) throw new NarrativeError(400, `'${path}' is larger than the narrative limit of ${NARRATIVE_MAX_BYTES} bytes.`);
  return { path, content: readFileSync(realFile, "utf8") };
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  response.end(JSON.stringify(value));
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
  const { projectRoot } = resolveWorkspaceLocation(initial.workspace);
  const staticRoot = fileURLToPath(new URL("../../ui-dist", import.meta.url));
  if (!existsSync(join(staticRoot, "index.html"))) throw new Error("UI assets are missing. Run npm run build first.");
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    const requestMethod = String(request.method ?? "GET");
    if (requestMethod !== "GET" && requestMethod !== "HEAD") {
      json(response, 405, { ok: false, error: "The Kotta board is read-only. It shows the specification; nothing is changed from here." });
      return;
    }
    if (url.pathname === "/api/workspace") {
      try { json(response, 200, readWorkspace(initial.workspace)); }
      catch (error) { json(response, 500, { error: error instanceof Error ? error.message : String(error) }); }
      return;
    }
    if (url.pathname === "/api/narrative") {
      try { json(response, 200, readNarrative(projectRoot, url.searchParams.get("path"))); }
      catch (error) {
        if (error instanceof NarrativeError) json(response, error.status, { error: error.message });
        else json(response, 500, { error: error instanceof Error ? error.message : String(error) });
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
