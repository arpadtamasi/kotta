import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix, relative, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { parseMarkdown } from "./markdown.js";
import { parseToml, tomlGet, tomlTable, type TomlTable, type TomlValue } from "./toml.js";
import { evidenceKind, evidenceLevel, type EvidenceKind, type EvidenceLevel } from "./evidence.js";
import { workspaceDirectoryName } from "../filesystem/workspace.js";
import { readFormRegistry, readSpecNodes } from "../spec/registry.js";

/**
 * Modules are what the project's manifests declare, and nothing else (design decision 6): no
 * registry to keep, no `module:` field on an ordinary node. A node belongs to the module its evidence
 * sits in. The one declared exception is an interface node's `module:` — "this is that module's
 * surface" — and its `reference:` block, which names a module in another repository.
 */

export type ModuleKind = "node" | "python" | "dart" | "rust" | "go" | "root";
export type ReferenceResolution = "file" | "package" | "git";

/** Files outside every declared module belong here. */
export const ROOT_MODULE = "(root)";
/** The directory a module ships its promises in, beside its code: `kotta modules publish-spec` writes it. */
export const PUBLISHED_SPEC_DIRECTORY = "kotta-spec";
export const PUBLISHED_SPEC_MANIFEST = "manifest.json";
/** Share of identical wording above which an interface is a copy of a foreign one, not its own promise. */
export const COPY_THRESHOLD = 0.8;

export interface ModuleDependency {
  name: string;
  /** False when another module of this repository is the target. */
  external: boolean;
  /** The dependency exactly as the manifest writes it. */
  spec: string;
  resolve?: ReferenceResolution;
  /** Absolute directory, for a `file:`/`path` dependency. */
  path?: string;
  url?: string;
  ref?: string;
}

export interface RepoModule {
  name: string;
  /** Repository-relative directory; `.` for the root. */
  path: string;
  kind: ModuleKind;
  manifest: string | null;
  version: string | null;
  /** What the manifest or layout declares as public, empty when nothing is. */
  surface: string[];
  dependencies: ModuleDependency[];
}

export interface ModuleIssue { code: string; message: string; path?: string }

/** A repository as a list of paths and a reader: the working tree, or a commit. */
export interface RepositoryFiles {
  root: string;
  paths: string[];
  read(path: string): string | null;
}

function isPublishedSpec(path: string): boolean {
  return path.split("/").includes(PUBLISHED_SPEC_DIRECTORY);
}

/**
 * The paths evidence and manifests are read from. A module's published `kotta-spec/` is a copy of the
 * specification, so it is never evidence that the module keeps what it copies.
 */
export function isEvidencePath(path: string, workspace: string): boolean {
  return !path.startsWith(`${workspace}/`) && !isPublishedSpec(path) && !path.split("/").includes("node_modules");
}

function readable(text: string): string | null {
  return text.includes("\0") || text.length > 1_000_000 ? null : text;
}

/** Tracked and untracked-but-not-ignored files — what the project calls its source, as it stands now. */
export function workingTreeFiles(root: string): RepositoryFiles {
  let listed: string[];
  try {
    listed = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 * 1024 * 1024 })
      .split("\0").filter(Boolean);
  } catch {
    listed = [];
  }
  const paths = [...new Set(listed)].filter((path) => {
    try { return statSync(join(root, path)).isFile(); }
    catch { return false; }
  }).sort();
  const cache = new Map<string, string | null>();
  return {
    root,
    paths,
    read(path) {
      if (!cache.has(path)) {
        try { cache.set(path, readable(readFileSync(join(root, path), "utf8"))); }
        catch { cache.set(path, null); }
      }
      return cache.get(path) ?? null;
    },
  };
}

/** Files already read by the caller, as `gap` holds the committed tree. */
export function listedFiles(root: string, files: Array<{ path: string; text: string }>): RepositoryFiles {
  const byPath = new Map(files.map((file) => [file.path, file.text]));
  return { root, paths: [...byPath.keys()].sort(), read: (path) => byPath.get(path) ?? null };
}

// ── Globs ────────────────────────────────────────────────────────────────────────────────────────

function globPattern(glob: string): RegExp {
  const pattern = glob.trim().replace(/^\.\//, "").replace(/\/+$/, "");
  let out = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "*" && pattern[index + 1] === "*") {
      index += 1;
      if (pattern[index + 1] === "/") { index += 1; out += "(?:.*/)?"; }
      else out += ".*";
    } else if (char === "*") out += "[^/]*";
    else if (char === "?") out += "[^/]";
    else out += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`);
}

function matchesGlobs(directory: string, globs: string[]): boolean {
  const include = globs.filter((glob) => !glob.trim().startsWith("!"));
  const exclude = globs.filter((glob) => glob.trim().startsWith("!")).map((glob) => glob.trim().slice(1));
  return include.some((glob) => globPattern(glob).test(directory)) && !exclude.some((glob) => globPattern(glob).test(directory));
}

// ── Manifest readers ─────────────────────────────────────────────────────────────────────────────

function manifestDirectories(files: RepositoryFiles, filename: string): string[] {
  return files.paths.filter((path) => posix.basename(path) === filename && !path.split("/").includes("node_modules"))
    .map((path) => posix.dirname(path));
}

function joinPath(directory: string, file: string): string {
  return directory === "." ? file : `${directory}/${file}`;
}

function readJson(files: RepositoryFiles, path: string, issues: ModuleIssue[]): Record<string, unknown> | null {
  const text = files.read(path);
  if (text === null) return null;
  try { return JSON.parse(text) as Record<string, unknown>; }
  catch (error) { issues.push({ code: "MODULE_MANIFEST_UNREADABLE", message: `${path} is not valid JSON: ${String(error)}`, path }); return null; }
}

function readYamlFile(files: RepositoryFiles, path: string, issues: ModuleIssue[]): Record<string, unknown> | null {
  const text = files.read(path);
  if (text === null) return null;
  try { return (parseYaml(text) ?? {}) as Record<string, unknown>; }
  catch (error) { issues.push({ code: "MODULE_MANIFEST_UNREADABLE", message: `${path} is not valid YAML: ${String(error)}`, path }); return null; }
}

function readTomlFile(files: RepositoryFiles, path: string, issues: ModuleIssue[]): TomlTable | null {
  const text = files.read(path);
  if (text === null) return null;
  try { return parseToml(text); }
  catch (error) { issues.push({ code: "MODULE_MANIFEST_UNREADABLE", message: `${path} could not be read as TOML: ${error instanceof Error ? error.message : String(error)}`, path }); return null; }
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : typeof value === "number" ? String(value) : null;
}

/** A raw dependency before the repository-wide pass decides whether it is internal. */
interface RawDependency { name: string; spec: string; path?: string; url?: string; ref?: string; git?: boolean }

interface Declared { module: Omit<RepoModule, "surface" | "dependencies">; raw: RawDependency[]; publicFields: string[] }

function nodeDependencies(manifest: Record<string, unknown>, directory: string, root: string): RawDependency[] {
  const raw: RawDependency[] = [];
  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    const entries = manifest[field];
    if (!entries || typeof entries !== "object") continue;
    for (const [name, value] of Object.entries(entries as Record<string, unknown>)) {
      const spec = String(value);
      if (/^(?:file|link):/.test(spec)) raw.push({ name, spec, path: resolve(root, directory, spec.replace(/^(?:file|link):/, "")) });
      else if (/^(?:git\+|git:|github:|gitlab:|bitbucket:)|\.git(?:#|$)/.test(spec)) {
        const [url, ref] = spec.replace(/^git\+/, "").split("#");
        raw.push({ name, spec, git: true, url, ref });
      } else raw.push({ name, spec });
    }
  }
  return raw;
}

function discoverNode(files: RepositoryFiles, issues: ModuleIssue[]): Declared[] {
  const root = readJson(files, "package.json", issues);
  const globs: string[] = [];
  const workspaces = root?.workspaces;
  if (Array.isArray(workspaces)) globs.push(...stringList(workspaces));
  else if (workspaces && typeof workspaces === "object") globs.push(...stringList((workspaces as { packages?: unknown }).packages));
  const pnpm = readYamlFile(files, "pnpm-workspace.yaml", issues);
  globs.push(...stringList(pnpm?.packages));

  const declared: Declared[] = [];
  const add = (directory: string, manifest: Record<string, unknown>) => {
    const path = joinPath(directory, "package.json");
    declared.push({
      module: { name: text(manifest.name) ?? directory, path: directory, kind: "node", manifest: path, version: text(manifest.version) },
      raw: nodeDependencies(manifest, directory, files.root),
      publicFields: ["exports", "main", "types", "typings"].filter((field) => manifest[field] !== undefined).map((field) => `package.json "${field}"`),
    });
  };
  if (globs.length) {
    for (const directory of manifestDirectories(files, "package.json")) {
      if (directory === "." || !matchesGlobs(directory, globs)) continue;
      const manifest = readJson(files, joinPath(directory, "package.json"), issues);
      if (manifest) add(directory, manifest);
    }
  } else if (root && text(root.name)) add(".", root);
  return declared;
}

function pep508Name(requirement: string): string | null {
  return /^\s*([A-Za-z0-9][A-Za-z0-9._-]*)/.exec(requirement)?.[1] ?? null;
}

export function normalizePythonName(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, "-");
}

function pythonDependencies(manifest: TomlTable, rootManifest: TomlTable | null, directory: string, root: string): RawDependency[] {
  const sources = { ...tomlTable(tomlGet(rootManifest ?? {}, "tool", "uv", "sources")), ...tomlTable(tomlGet(manifest, "tool", "uv", "sources")) };
  const requirements = [
    ...stringList(tomlGet(manifest, "project", "dependencies")),
    ...Object.values(tomlTable(tomlGet(manifest, "project", "optional-dependencies"))).flatMap(stringList),
    ...Object.values(tomlTable(tomlGet(manifest, "dependency-groups"))).flatMap(stringList),
  ];
  const raw: RawDependency[] = [];
  for (const requirement of requirements) {
    const name = pep508Name(requirement);
    if (!name) continue;
    const source = Object.entries(sources).find(([key]) => normalizePythonName(key) === normalizePythonName(name))?.[1];
    const table = tomlTable(source);
    if (typeof table.path === "string") raw.push({ name, spec: requirement, path: resolve(root, directory, table.path) });
    else if (typeof table.git === "string") raw.push({ name, spec: requirement, git: true, url: table.git, ref: text(table.rev) ?? text(table.tag) ?? text(table.branch) ?? undefined });
    else raw.push({ name, spec: requirement });
  }
  return raw;
}

function pythonSurface(files: RepositoryFiles, directory: string): string[] {
  const prefix = directory === "." ? "" : `${directory}/`;
  const init = files.paths.find((path) => path.startsWith(prefix) && posix.basename(path) === "__init__.py" && evidenceKind(path) !== "test");
  return init ? [init.slice(prefix.length)] : [];
}

function discoverPython(files: RepositoryFiles, issues: ModuleIssue[]): Declared[] {
  const rootManifest = files.paths.includes("pyproject.toml") ? readTomlFile(files, "pyproject.toml", issues) : null;
  const members = stringList(tomlGet(rootManifest ?? {}, "tool", "uv", "workspace", "members"));
  const excluded = stringList(tomlGet(rootManifest ?? {}, "tool", "uv", "workspace", "exclude"));
  const declared: Declared[] = [];
  for (const directory of manifestDirectories(files, "pyproject.toml")) {
    const isRoot = directory === ".";
    // A uv workspace root is where the members are declared, not a module of its own.
    if (isRoot && members.length) continue;
    const member = !isRoot && members.length > 0 && matchesGlobs(directory, [...members, ...excluded.map((glob) => `!${glob}`)]);
    const manifest = isRoot ? rootManifest : readTomlFile(files, joinPath(directory, "pyproject.toml"), issues);
    if (!manifest) continue;
    const name = text(tomlGet(manifest, "project", "name"));
    if (!name && !member) continue;
    declared.push({
      module: { name: name ?? directory, path: directory, kind: "python", manifest: joinPath(directory, "pyproject.toml"), version: text(tomlGet(manifest, "project", "version")) },
      raw: pythonDependencies(manifest, rootManifest, directory, files.root),
      publicFields: [],
    });
  }
  return declared;
}

function discoverDart(files: RepositoryFiles, issues: ModuleIssue[]): Declared[] {
  const declared: Declared[] = [];
  for (const directory of manifestDirectories(files, "pubspec.yaml")) {
    const manifest = readYamlFile(files, joinPath(directory, "pubspec.yaml"), issues);
    if (!manifest) continue;
    // A pub workspace root lists its packages; it is not one.
    if (directory === "." && Array.isArray(manifest.workspace)) continue;
    const name = text(manifest.name);
    if (!name) continue;
    const raw: RawDependency[] = [];
    for (const field of ["dependencies", "dev_dependencies"]) {
      const entries = manifest[field];
      if (!entries || typeof entries !== "object") continue;
      for (const [dependency, value] of Object.entries(entries as Record<string, unknown>)) {
        if (value && typeof value === "object") {
          const table = value as Record<string, unknown>;
          if (typeof table.path === "string") raw.push({ name: dependency, spec: `path: ${table.path}`, path: resolve(files.root, directory, table.path) });
          else if (table.git !== undefined) {
            const git = typeof table.git === "string" ? { url: table.git } : table.git as Record<string, unknown>;
            raw.push({ name: dependency, spec: `git: ${String(git.url ?? "")}`, git: true, url: text(git.url) ?? undefined, ref: text(git.ref) ?? undefined });
          } else if (table.sdk === undefined) raw.push({ name: dependency, spec: String(table.version ?? "any") });
        } else raw.push({ name: dependency, spec: value === null || value === undefined ? "any" : String(value) });
      }
    }
    declared.push({ module: { name, path: directory, kind: "dart", manifest: joinPath(directory, "pubspec.yaml"), version: text(manifest.version) }, raw, publicFields: [] });
  }
  return declared;
}

function discoverRust(files: RepositoryFiles, issues: ModuleIssue[]): Declared[] {
  if (!files.paths.includes("Cargo.toml")) return [];
  const rootManifest = readTomlFile(files, "Cargo.toml", issues);
  if (!rootManifest) return [];
  const members = stringList(tomlGet(rootManifest, "workspace", "members"));
  const excluded = stringList(tomlGet(rootManifest, "workspace", "exclude")).map((glob) => `!${glob}`);
  const shared = tomlTable(tomlGet(rootManifest, "workspace", "dependencies"));
  const directories = new Set<string>();
  if (tomlGet(rootManifest, "package", "name") !== undefined) directories.add(".");
  if (members.length) for (const directory of manifestDirectories(files, "Cargo.toml")) if (directory !== "." && matchesGlobs(directory, [...members, ...excluded])) directories.add(directory);

  const declared: Declared[] = [];
  for (const directory of [...directories].sort()) {
    const manifest = directory === "." ? rootManifest : readTomlFile(files, joinPath(directory, "Cargo.toml"), issues);
    if (!manifest) continue;
    const name = text(tomlGet(manifest, "package", "name"));
    if (!name) continue;
    const raw: RawDependency[] = [];
    for (const field of ["dependencies", "dev-dependencies", "build-dependencies"]) {
      for (const [dependency, value] of Object.entries(tomlTable(manifest[field]))) {
        let entry: TomlValue = value;
        let base = directory;
        if (tomlTable(entry).workspace === true) { entry = shared[dependency] ?? entry; base = "."; }
        const table = tomlTable(entry);
        const crate = text(table.package) ?? dependency;
        if (typeof entry === "string") raw.push({ name: crate, spec: entry });
        else if (typeof table.path === "string") raw.push({ name: crate, spec: `path = "${table.path}"`, path: resolve(files.root, base, table.path) });
        else if (typeof table.git === "string") raw.push({ name: crate, spec: `git = "${table.git}"`, git: true, url: table.git, ref: text(table.rev) ?? text(table.tag) ?? text(table.branch) ?? undefined });
        else raw.push({ name: crate, spec: text(table.version) ?? "*" });
      }
    }
    const version = tomlGet(manifest, "package", "version");
    declared.push({
      module: { name, path: directory, kind: "rust", manifest: joinPath(directory, "Cargo.toml"), version: text(version) ?? text(tomlGet(rootManifest, "workspace", "package", "version")) },
      raw,
      publicFields: [],
    });
  }
  return declared;
}

function discoverGo(files: RepositoryFiles): Declared[] {
  const declared: Declared[] = [];
  for (const directory of manifestDirectories(files, "go.mod")) {
    const source = files.read(joinPath(directory, "go.mod"));
    if (source === null) continue;
    const name = /^\s*module\s+(\S+)/m.exec(source)?.[1];
    if (!name) continue;
    const requires = new Map<string, string>();
    for (const block of source.matchAll(/^\s*require\s*\(([\s\S]*?)\)/gm)) {
      for (const line of block[1].split(/\r?\n/)) {
        const match = /^\s*(\S+)\s+(\S+)/.exec(line.replace(/\/\/.*$/, ""));
        if (match) requires.set(match[1], match[2]);
      }
    }
    for (const match of source.matchAll(/^\s*require\s+([^\s(]\S*)\s+(\S+)/gm)) requires.set(match[1], match[2]);
    const replaced = new Map<string, string>();
    for (const match of source.matchAll(/^\s*(?:replace\s+)?(\S+)(?:\s+\S+)?\s+=>\s+(\.{1,2}\/\S*|\/\S*)\s*$/gm)) replaced.set(match[1], match[2]);
    const raw: RawDependency[] = [...requires].map(([dependency, version]) => {
      const local = replaced.get(dependency);
      return local ? { name: dependency, spec: `${version} => ${local}`, path: resolve(files.root, directory, local) } : { name: dependency, spec: version };
    });
    declared.push({ module: { name, path: directory, kind: "go", manifest: joinPath(directory, "go.mod"), version: null }, raw, publicFields: [] });
  }
  return declared;
}

export interface DiscoveryOptions {
  /** Version-range dependencies worth listing: a pinned reference or a shipped `kotta-spec/` names them. */
  externalNames?: Set<string>;
}

/** Which declared module a repository path belongs to: the deepest one containing it, else the root. */
export function moduleOf(path: string, modules: RepoModule[]): string {
  let best: RepoModule | undefined;
  for (const module of modules) {
    if (module.kind === "root") continue;
    const inside = module.path === "." || path === module.path || path.startsWith(`${module.path}/`);
    if (inside && (!best || module.path.length > best.path.length || best.path === ".")) best = module;
  }
  return best?.name ?? ROOT_MODULE;
}

function installedSpec(root: string, moduleDirectory: string, name: string): string | null {
  for (const base of [join(root, moduleDirectory), root]) {
    const candidate = join(base, "node_modules", name, PUBLISHED_SPEC_DIRECTORY);
    if (existsSync(join(candidate, PUBLISHED_SPEC_MANIFEST))) return candidate;
  }
  return null;
}

/** Every module the manifests declare, and the root pseudo-module for the code between them. */
export function discoverModules(files: RepositoryFiles, options: DiscoveryOptions = {}): { modules: RepoModule[]; issues: ModuleIssue[] } {
  const issues: ModuleIssue[] = [];
  const declared: Declared[] = [];
  const claimed = new Set<string>();
  for (const found of [...discoverNode(files, issues), ...discoverPython(files, issues), ...discoverDart(files, issues), ...discoverRust(files, issues), ...discoverGo(files)]) {
    // One directory, one module: the first ecosystem that claims it wins, in the order above.
    if (claimed.has(found.module.path)) continue;
    claimed.add(found.module.path);
    declared.push(found);
  }

  const names = new Map<string, string>();
  for (const { module } of declared) {
    const previous = names.get(module.name);
    if (previous !== undefined) issues.push({ code: "MODULE_DUPLICATE_NAME", message: `Module name '${module.name}' is declared by both ${previous} and ${module.path}; a node can be placed in only one of them.`, path: module.manifest ?? undefined });
    else names.set(module.name, module.path);
  }
  /** The declared name a dependency means, matched exactly or by Python's normalized spelling. */
  const internal = (name: string) => names.has(name) ? name : [...names.keys()].find((known) => normalizePythonName(known) === normalizePythonName(name));
  const byDirectory = new Map(declared.map(({ module }) => [resolve(files.root, module.path), module.name]));

  const modules: RepoModule[] = declared.map(({ module, raw }) => ({ ...module, surface: [], dependencies: raw.flatMap((dependency): ModuleDependency[] => {
    const local = dependency.path ? byDirectory.get(resolve(dependency.path)) : undefined;
    const named = !dependency.path && !dependency.git ? internal(dependency.name) : undefined;
    if (local || named) return [{ name: (local ?? named)!, external: false, spec: dependency.spec }];
    if (dependency.path) return [{ name: dependency.name, external: true, spec: dependency.spec, resolve: "file", path: dependency.path }];
    if (dependency.git) return [{ name: dependency.name, external: true, spec: dependency.spec, resolve: "git", url: dependency.url, ref: dependency.ref }];
    if (options.externalNames?.has(dependency.name) || installedSpec(files.root, module.path, dependency.name)) return [{ name: dependency.name, external: true, spec: dependency.spec, resolve: "package" }];
    return [];
  }).sort((left, right) => left.name.localeCompare(right.name)) }));

  if (!modules.some((module) => module.path === ".")) {
    modules.push({ name: ROOT_MODULE, path: ".", kind: "root", manifest: null, version: null, surface: [], dependencies: [] });
  }

  // The surface is read after placement, so a nested module's files are not credited to its parent.
  const owned = new Map<string, string[]>();
  for (const path of files.paths) {
    const name = moduleOf(path, modules);
    owned.set(name, [...(owned.get(name) ?? []), path]);
  }
  for (const module of modules) {
    const found = declared.find((entry) => entry.module.path === module.path);
    const mine = owned.get(module.name) ?? [];
    const relativeTo = (path: string) => module.path === "." ? path : path.slice(module.path.length + 1);
    if (module.kind === "node") module.surface = found?.publicFields ?? [];
    else if (module.kind === "python") module.surface = pythonSurface({ ...files, paths: mine }, module.path);
    else if (module.kind === "dart") module.surface = mine.some((path) => relativeTo(path).startsWith("lib/")) ? ["lib/"] : [];
    else if (module.kind === "rust") module.surface = mine.some((path) => relativeTo(path) === "src/lib.rs") ? ["src/lib.rs"] : [];
    else if (module.kind === "go") {
      const library = mine.find((path) => path.endsWith(".go") && !path.endsWith("_test.go") && (/^\s*package\s+(\w+)/m.exec(files.read(path) ?? "")?.[1] ?? "main") !== "main");
      module.surface = library ? [`package ${/^\s*package\s+(\w+)/m.exec(files.read(library) ?? "")?.[1]} (${relativeTo(library)})`] : [];
    }
  }
  modules.sort((left, right) => Number(left.kind === "root") - Number(right.kind === "root") || left.path.localeCompare(right.path));
  return { modules, issues };
}

// ── Placement ────────────────────────────────────────────────────────────────────────────────────

export const INTERFACE_FORM = "interface";

export interface NodeEvidence { kind: EvidenceKind; path: string; module: string }

export interface NodePlacement {
  id: string;
  form: string;
  title: string;
  path: string;
  interface: boolean;
  /** An interface node's `module:`; null on every other node, whatever its frontmatter says. */
  declaredModule: string | null;
  /** Every module holding evidence for the node. */
  modules: string[];
  /** The one module the node belongs to; null when it straddles or has no evidence. */
  module: string | null;
  straddler: boolean;
  level: EvidenceLevel;
  evidence: NodeEvidence[];
}

/**
 * Where a node lives, from where it is kept. One module is the node's module; several make it a
 * straddler; none leaves it unplaced. An interface is exempt from straddling — a provider and its
 * consumers citing it is the point — and its `module:` names its home outright.
 */
export function placeNode(node: { id: string; form: string; title: string; path: string; data: Record<string, unknown> }, files: Array<{ path: string; text: string }>, modules: RepoModule[]): NodePlacement {
  const holding = files.filter((file) => file.text.includes(node.id));
  const evidence = holding.map((file) => ({ kind: evidenceKind(file.path), path: file.path, module: moduleOf(file.path, modules) }))
    .sort((left, right) => left.kind.localeCompare(right.kind) || left.path.localeCompare(right.path));
  const placed = [...new Set(evidence.map((entry) => entry.module))].sort();
  const isInterface = node.form === INTERFACE_FORM;
  const declaredModule = isInterface ? text(node.data.module) : null;
  const module = declaredModule ?? (placed.length === 1 ? placed[0] : null);
  return {
    id: node.id,
    form: node.form,
    title: node.title,
    path: node.path,
    interface: isInterface,
    declaredModule,
    modules: placed,
    module,
    straddler: !isInterface && placed.length > 1,
    level: evidenceLevel(holding, node.id),
    evidence,
  };
}

// ── The working-tree analysis ────────────────────────────────────────────────────────────────────

export interface SpecNodeRecord { id: string; form: string; title: string; path: string; data: Record<string, unknown>; body: string }

export interface ModuleAnalysis {
  root: string;
  workspace: string;
  modules: RepoModule[];
  nodes: NodePlacement[];
  specNodes: SpecNodeRecord[];
  issues: ModuleIssue[];
}

function specRecords(root: string): SpecNodeRecord[] {
  const { forms } = readFormRegistry(root);
  return readSpecNodes(root, forms).nodes.map((node) => {
    let body = "";
    try { body = parseMarkdown(readFileSync(node.path, "utf8")).content; }
    catch { /* validation names an unreadable node */ }
    return { id: node.id, form: node.form, title: text(node.data.title) ?? node.id, path: relative(root, node.path).split("\\").join("/"), data: node.data, body };
  });
}

function referenceBlock(data: Record<string, unknown>): Record<string, unknown> | null {
  return data.reference && typeof data.reference === "object" && !Array.isArray(data.reference) ? data.reference as Record<string, unknown> : null;
}

/** Modules, and every specification node placed by its evidence in the working tree. */
export function analyzeWorkingTree(root: string): ModuleAnalysis {
  const workspace = workspaceDirectoryName(root);
  const specNodes = specRecords(root);
  const externalNames = new Set(specNodes.flatMap((node) => {
    const reference = node.form === INTERFACE_FORM ? referenceBlock(node.data) : null;
    const name = text(reference?.module);
    return name ? [name] : [];
  }));
  const tree = workingTreeFiles(root);
  const { modules, issues } = discoverModules(tree, { externalNames });
  const evidenceFiles = tree.paths.filter((path) => isEvidencePath(path, workspace)).flatMap((path) => {
    const content = tree.read(path);
    return content === null ? [] : [{ path, text: content }];
  });
  const nodes = specNodes.map((node) => placeNode(node, evidenceFiles, modules));
  return { root, workspace, modules, nodes, specNodes, issues };
}

// ── Boundary checks ──────────────────────────────────────────────────────────────────────────────

export type FindingSeverity = "warning" | "error";

export interface ModuleFinding {
  code: string;
  severity: FindingSeverity;
  message: string;
  path?: string;
  module?: string;
  node?: string;
  modules?: string[];
}

function referencedIds(value: unknown): string[] {
  if (typeof value === "string") return [value.trim()];
  if (Array.isArray(value)) return value.flatMap(referencedIds);
  return [];
}

/**
 * The four boundary checks: (a) a module with a public surface and no interface for it, (b) a node
 * kept in two modules, (c) a node of one module naming another module's non-interface node, and
 * (d) an interface naming a module that does not exist — the one that is an error.
 */
export function boundaryFindings(analysis: ModuleAnalysis): ModuleFinding[] {
  const findings: ModuleFinding[] = [];
  const names = new Set(analysis.modules.map((module) => module.name));
  const interfaces = analysis.nodes.filter((node) => node.interface);

  for (const module of analysis.modules) {
    if (module.kind === "root" || !module.surface.length) continue;
    if (interfaces.some((node) => node.declaredModule === module.name)) continue;
    findings.push({
      code: "MODULE_INTERFACE_MISSING",
      severity: "warning",
      module: module.name,
      path: module.manifest ?? module.path,
      message: `Module '${module.name}' (${module.path}) declares a public surface — ${module.surface.join(", ")} — and no interface node says 'module: ${module.name}'. What other modules may rely on belongs in an interface node; write one for that surface.`,
    });
  }

  for (const node of analysis.nodes.filter((candidate) => candidate.straddler)) {
    const where = node.modules.map((name) => `${name} (${node.evidence.filter((entry) => entry.module === name).map((entry) => entry.path).join(", ")})`);
    findings.push({
      code: "MODULE_STRADDLER",
      severity: "warning",
      node: node.id,
      modules: node.modules,
      path: node.path,
      message: `${node.title} (${node.id}) is kept in ${node.modules.length} modules: ${where.join("; ")}. A promise no single module keeps alone is a boundary: move the part the modules share into an interface node with 'module:' naming its provider, and let each side cite that interface.`,
    });
  }

  const byId = new Map(analysis.nodes.map((node) => [node.id, node]));
  for (const record of analysis.specNodes) {
    const source = byId.get(record.id);
    if (!source || source.interface || !source.module) continue;
    const seen = new Set<string>();
    for (const [field, value] of Object.entries(record.data)) {
      if (field === "id") continue;
      for (const reference of referencedIds(value)) {
        const target = byId.get(reference);
        if (!target || target.interface || !target.module || target.module === source.module || seen.has(target.id)) continue;
        seen.add(target.id);
        findings.push({
          code: "MODULE_CROSS_REFERENCE",
          severity: "warning",
          node: source.id,
          modules: [source.module, target.module],
          path: source.path,
          message: `${source.title} (${source.id}, module ${source.module}) names ${target.title} (${target.id}, module ${target.module}) in '${field}'. A reference across a module boundary may point only at an interface: state what ${source.module} relies on in an interface node of ${target.module} and reference that instead.`,
        });
      }
    }
  }

  for (const node of interfaces) {
    if (node.declaredModule === null || names.has(node.declaredModule)) continue;
    findings.push({
      code: "MODULE_UNKNOWN",
      severity: "error",
      node: node.id,
      path: node.path,
      message: `${node.title} (${node.id}) says 'module: ${node.declaredModule}', and no manifest declares that module. Known modules: ${[...names].join(", ")}. Correct the name, or — for another repository's module — use a 'reference:' block instead.`,
    });
  }
  return findings;
}

// ── Cross-repository references ──────────────────────────────────────────────────────────────────

export interface ForeignInterface {
  id: string;
  title: string;
  module: string | null;
  body: string;
  /** Path inside the spec root it was read from. */
  file: string;
  origin: { resolve: ReferenceResolution; location: string };
}

interface SpecReader { list(directory: string): string[]; read(path: string): string | null }

/** Interface nodes in a specification tree laid out like `.kotta/spec/`: `forms/` names the directories. */
function readInterfaces(reader: SpecReader, origin: ForeignInterface["origin"]): ForeignInterface[] {
  const directories = new Set<string>();
  for (const form of reader.list("forms").filter((name) => name.endsWith(".yaml"))) {
    try {
      const data = parseYaml(reader.read(`forms/${form}`) ?? "") as Record<string, unknown> | null;
      if (data?.id === INTERFACE_FORM && typeof data.directory === "string") directories.add(data.directory);
    } catch { /* an unreadable foreign form is the foreign repository's to fix */ }
  }
  if (!directories.size) directories.add("interfaces");
  const found: ForeignInterface[] = [];
  for (const directory of directories) {
    for (const name of reader.list(directory).filter((entry) => entry.endsWith(".md"))) {
      const source = reader.read(`${directory}/${name}`);
      if (source === null) continue;
      try {
        const entity = parseMarkdown(source);
        const id = text(entity.data.id);
        if (!id || (entity.data.form !== undefined && entity.data.form !== INTERFACE_FORM)) continue;
        found.push({ id, title: text(entity.data.title) ?? id, module: text(entity.data.module), body: entity.content, file: `${directory}/${name}`, origin });
      } catch { /* as above */ }
    }
  }
  return found;
}

function directoryReader(specRoot: string): SpecReader {
  return {
    list(directory) {
      try { return readdirSync(join(specRoot, directory)).sort(); }
      catch { return []; }
    },
    read(path) {
      try { return readFileSync(join(specRoot, path), "utf8"); }
      catch { return null; }
    },
  };
}

function gitIn(directory: string, args: string[]): string | null {
  try { return execFileSync("git", args, { cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch { return null; }
}

function treeReader(repository: string, ref: string, prefix: string): SpecReader {
  return {
    list(directory) {
      const listed = gitIn(repository, ["ls-tree", "--name-only", `${ref}:${prefix}${directory}`]);
      return listed ? listed.split(/\r?\n/).filter(Boolean).sort() : [];
    },
    read(path) {
      return gitIn(repository, ["show", `${ref}:${prefix}${path}`]);
    },
  };
}

/** The repository a `file:` dependency lives in: the nearest directory up from it with a workspace. */
function foreignRepository(start: string): string | null {
  let current = resolve(start);
  for (;;) {
    if (existsSync(join(current, ".kotta", "spec"))) return current;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function manifestVersion(directory: string): string | null {
  try {
    if (existsSync(join(directory, "package.json"))) return text((JSON.parse(readFileSync(join(directory, "package.json"), "utf8")) as Record<string, unknown>).version);
    if (existsSync(join(directory, "pubspec.yaml"))) return text((parseYaml(readFileSync(join(directory, "pubspec.yaml"), "utf8")) as Record<string, unknown> | null)?.version);
    if (existsSync(join(directory, "Cargo.toml"))) return text(tomlGet(parseToml(readFileSync(join(directory, "Cargo.toml"), "utf8")), "package", "version"));
    if (existsSync(join(directory, "pyproject.toml"))) return text(tomlGet(parseToml(readFileSync(join(directory, "pyproject.toml"), "utf8")), "project", "version"));
  } catch { /* an unreadable version is reported as unknown */ }
  return null;
}

const COMMIT = /^[0-9a-f]{7,40}$/i;

interface Resolved {
  resolve: ReferenceResolution;
  location: string;
  target: ForeignInterface;
  version: string | null;
  commit: string | null;
  /** Did the target's text change after the pinned commit? Null when the pin is not a known commit. */
  changedSince(pin: string): boolean | null;
}

type Attempt = { ok: true; resolved: Resolved } | { ok: false; reason: string };

function pickTarget(candidates: ForeignInterface[], moduleName: string, wanted: { id: string | null; title: string }): ForeignInterface | string {
  const own = candidates.filter((candidate) => candidate.module === moduleName);
  if (wanted.id) return own.find((candidate) => candidate.id === wanted.id) ?? candidates.find((candidate) => candidate.id === wanted.id) ?? `no interface ${wanted.id}`;
  const titled = own.filter((candidate) => candidate.title === wanted.title);
  if (titled.length === 1) return titled[0];
  if (own.length === 1) return own[0];
  return own.length ? `${own.length} interfaces of ${moduleName} and none titled '${wanted.title}'; name the one meant with 'reference.id'` : `no interface node with 'module: ${moduleName}'`;
}

function changedInRepository(repository: string, file: string): (pin: string) => boolean | null {
  return (pin) => {
    if (gitIn(repository, ["cat-file", "-e", `${pin}^{commit}`]) === null) return null;
    const log = gitIn(repository, ["log", "-1", "--format=%H", `${pin}..HEAD`, "--", file]);
    if (log === null) return null;
    if (log) return true;
    // Uncommitted edits to the core's promise count too: the file is what a reader would read.
    const status = gitIn(repository, ["status", "--porcelain", "--", file]);
    return Boolean(status);
  };
}

export interface ReferenceContext {
  analysis: ModuleAnalysis;
  /** Where a `git` reference is cloned to; a parameter so tests keep it out of the shared temp dir. */
  cacheDirectory?: string;
}

function resolveByFile(context: ReferenceContext, moduleName: string, wanted: { id: string | null; title: string }): Attempt {
  const dependency = context.analysis.modules.flatMap((module) => module.dependencies).find((entry) => entry.name === moduleName && entry.resolve === "file" && entry.path);
  if (!dependency?.path) return { ok: false, reason: `file: no module declares a file: or path dependency on ${moduleName}` };
  const repository = foreignRepository(dependency.path);
  if (!repository) return { ok: false, reason: `file: ${dependency.path} is not inside a repository with a .kotta/spec` };
  const interfaces = readInterfaces(directoryReader(join(repository, ".kotta", "spec")), { resolve: "file", location: repository });
  const target = pickTarget(interfaces, moduleName, wanted);
  if (typeof target === "string") return { ok: false, reason: `file: ${repository}: ${target}` };
  const file = relative(repository, join(repository, ".kotta", "spec", target.file)).split("\\").join("/");
  return { ok: true, resolved: {
    resolve: "file",
    location: repository,
    target,
    version: manifestVersion(dependency.path),
    commit: gitIn(repository, ["rev-parse", "HEAD"]),
    changedSince: changedInRepository(repository, file),
  } };
}

function resolveByPackage(context: ReferenceContext, moduleName: string, wanted: { id: string | null; title: string }): Attempt {
  const { root, modules } = context.analysis;
  const specRoot = [...modules.map((module) => module.path), "."].map((path) => installedSpec(root, path, moduleName)).find(Boolean);
  if (!specRoot) return { ok: false, reason: `package: no installed node_modules/${moduleName}/${PUBLISHED_SPEC_DIRECTORY}/${PUBLISHED_SPEC_MANIFEST}` };
  let manifest: Record<string, unknown> = {};
  try { manifest = JSON.parse(readFileSync(join(specRoot, PUBLISHED_SPEC_MANIFEST), "utf8")) as Record<string, unknown>; }
  catch { return { ok: false, reason: `package: ${join(specRoot, PUBLISHED_SPEC_MANIFEST)} is not valid JSON` }; }
  const interfaces = readInterfaces(directoryReader(specRoot), { resolve: "package", location: specRoot });
  const target = pickTarget(interfaces, moduleName, wanted);
  if (typeof target === "string") return { ok: false, reason: `package: ${specRoot}: ${target}` };
  const commit = text(manifest.commit);
  return { ok: true, resolved: {
    resolve: "package",
    location: specRoot,
    target,
    version: text(manifest.version) ?? manifestVersion(dirname(specRoot)),
    commit,
    changedSince: (pin) => commit ? !commit.startsWith(pin) && !pin.startsWith(commit) : null,
  } };
}

function resolveByGit(context: ReferenceContext, moduleName: string, wanted: { id: string | null; title: string }, reference: Record<string, unknown>): Attempt {
  const dependency = context.analysis.modules.flatMap((module) => module.dependencies).find((entry) => entry.name === moduleName && entry.resolve === "git");
  const url = text(reference.url) ?? dependency?.url;
  if (!url) return { ok: false, reason: `git: no git dependency on ${moduleName} and no 'reference.url'` };
  const cache = join(context.cacheDirectory ?? join(tmpdir(), "kotta-references"), createHash("sha1").update(url).digest("hex").slice(0, 16));
  const cloned = existsSync(cache)
    ? gitIn(cache, ["fetch", "--quiet", url, "+HEAD:refs/kotta/head"])
    : gitIn(tmpdir(), ["clone", "--quiet", "--bare", url, cache]) !== null ? gitIn(cache, ["fetch", "--quiet", url, "+HEAD:refs/kotta/head"]) : null;
  if (cloned === null) return { ok: false, reason: `git: could not fetch ${url}` };
  const ref = "refs/kotta/head";
  const interfaces = readInterfaces(treeReader(cache, ref, ".kotta/spec/"), { resolve: "git", location: url });
  const target = pickTarget(interfaces, moduleName, wanted);
  if (typeof target === "string") return { ok: false, reason: `git: ${url}: ${target}` };
  const file = `.kotta/spec/${target.file}`;
  return { ok: true, resolved: {
    resolve: "git",
    location: url,
    target,
    version: null,
    commit: gitIn(cache, ["rev-parse", ref]),
    changedSince: (pin) => {
      if (gitIn(cache, ["cat-file", "-e", `${pin}^{commit}`]) === null) return null;
      const log = gitIn(cache, ["log", "-1", "--format=%H", `${pin}..${ref}`, "--", file]);
      return log === null ? null : Boolean(log);
    },
  } };
}

export interface ReferenceStatus {
  node: string;
  title: string;
  path: string;
  module: string;
  version: string;
  resolve: ReferenceResolution | null;
  resolved: { resolve: ReferenceResolution; location: string; target: string; version: string | null; commit: string | null } | null;
  stale: boolean | null;
  tried: string[];
}

const RESOLUTIONS: ReferenceResolution[] = ["file", "package", "git"];

/** Resolve every interface's `reference:` in order — file, package, git — or by the method it names. */
export function referenceFindings(context: ReferenceContext): { findings: ModuleFinding[]; references: ReferenceStatus[]; foreign: ForeignInterface[] } {
  const { analysis } = context;
  const findings: ModuleFinding[] = [];
  const references: ReferenceStatus[] = [];
  const foreign = new Map<string, ForeignInterface>();

  for (const record of analysis.specNodes.filter((node) => node.form === INTERFACE_FORM)) {
    const reference = referenceBlock(record.data);
    if (!reference) continue;
    const moduleName = text(reference.module);
    const version = text(reference.version);
    const method = text(reference.resolve);
    if (!moduleName || !version || (method !== null && !RESOLUTIONS.includes(method as ReferenceResolution))) {
      findings.push({
        code: "MODULE_REFERENCE_INVALID",
        severity: "error",
        node: record.id,
        path: record.path,
        message: `${record.title} (${record.id}) has a 'reference:' block that ${!moduleName ? "names no module" : !version ? "pins no version" : `says 'resolve: ${method}'`}. Write { module: <package name>, version: <semver or commit>, resolve: file | package | git }.`,
      });
      continue;
    }
    const wanted = { id: text(reference.id), title: record.title };
    const tried: string[] = [];
    let resolved: Resolved | null = null;
    for (const candidate of method ? [method as ReferenceResolution] : RESOLUTIONS) {
      const attempt = candidate === "file" ? resolveByFile(context, moduleName, wanted)
        : candidate === "package" ? resolveByPackage(context, moduleName, wanted)
          : resolveByGit(context, moduleName, wanted, reference);
      if (attempt.ok) { resolved = attempt.resolved; break; }
      tried.push(attempt.reason);
    }
    const status: ReferenceStatus = { node: record.id, title: record.title, path: record.path, module: moduleName, version, resolve: resolved?.resolve ?? null, resolved: null, stale: null, tried };
    references.push(status);
    if (!resolved) {
      findings.push({
        code: "MODULE_REFERENCE_UNRESOLVED",
        severity: "warning",
        node: record.id,
        path: record.path,
        message: `${record.title} (${record.id}) refers to ${moduleName}@${version}, and it could not be resolved: ${tried.join("; ")}.`,
      });
      continue;
    }
    foreign.set(`${resolved.location}#${resolved.target.id}`, resolved.target);
    status.resolved = { resolve: resolved.resolve, location: resolved.location, target: resolved.target.id, version: resolved.version, commit: resolved.commit };
    const pinnedCommit = COMMIT.test(version) && !/^\d+$/.test(version);
    if (pinnedCommit) {
      const changed = resolved.changedSince(version);
      status.stale = changed;
      if (changed === null) {
        findings.push({ code: "MODULE_REFERENCE_UNRESOLVED", severity: "warning", node: record.id, path: record.path, message: `${record.title} (${record.id}) pins ${moduleName} at commit ${version}, which ${resolved.location} does not know; the pin cannot be compared.` });
      } else if (changed) {
        findings.push({
          code: "MODULE_REFERENCE_STALE",
          severity: "warning",
          node: record.id,
          path: record.path,
          message: `The core changed since the pinned version: ${resolved.target.title} (${resolved.target.id}) in ${moduleName} was changed after ${version}${resolved.commit ? ` (now ${resolved.commit.slice(0, 12)})` : ""}. Whatever ${record.title} decided rests on the older promise; read the core's current text, then move the pin.`,
        });
      }
    } else {
      const current = resolved.version;
      const same = current !== null && current.replace(/^v/, "") === version.replace(/^v/, "");
      status.stale = current === null ? null : !same;
      if (current === null) {
        findings.push({ code: "MODULE_REFERENCE_UNRESOLVED", severity: "warning", node: record.id, path: record.path, message: `${record.title} (${record.id}) pins ${moduleName}@${version}, and the resolved ${resolved.resolve} source declares no version to compare it with.` });
      } else if (!same) {
        findings.push({
          code: "MODULE_REFERENCE_STALE",
          severity: "warning",
          node: record.id,
          path: record.path,
          message: `The core changed since the pinned version: ${record.title} (${record.id}) pins ${moduleName}@${version}, and the resolved ${resolved.resolve} source is at ${current}. Whatever it decided rests on the older promise; read ${resolved.target.title} (${resolved.target.id}) as it stands, then move the pin.`,
        });
      }
    }
  }

  // Every foreign interface a declared dependency makes readable is a candidate original.
  for (const dependency of analysis.modules.flatMap((module) => module.dependencies).filter((entry) => entry.external)) {
    if (dependency.resolve === "file" && dependency.path) {
      const repository = foreignRepository(dependency.path);
      if (repository) for (const found of readInterfaces(directoryReader(join(repository, ".kotta", "spec")), { resolve: "file", location: repository })) foreign.set(`${repository}#${found.id}`, found);
    } else if (dependency.resolve === "package") {
      const specRoot = [...analysis.modules.map((module) => module.path)].map((path) => installedSpec(analysis.root, path, dependency.name)).find(Boolean);
      if (specRoot) for (const found of readInterfaces(directoryReader(specRoot), { resolve: "package", location: specRoot })) foreign.set(`${specRoot}#${found.id}`, found);
    }
  }

  const candidates = [...foreign.values()];
  for (const record of analysis.specNodes.filter((node) => node.form === INTERFACE_FORM && !referenceBlock(node.data))) {
    let best: { target: ForeignInterface; ratio: number } | null = null;
    for (const target of candidates) {
      const ratio = similarity(record.body, target.body);
      if (ratio > COPY_THRESHOLD && (!best || ratio > best.ratio)) best = { target, ratio };
    }
    if (!best) continue;
    const owner = best.target.module ?? "another repository";
    findings.push({
      code: "MODULE_INTERFACE_COPY",
      severity: "warning",
      node: record.id,
      path: record.path,
      module: best.target.module ?? undefined,
      message: `${record.title} (${record.id}) is ${Math.round(best.ratio * 100)}% the same text as ${best.target.title} (${best.target.id}) of ${owner}, read from ${best.target.origin.location}. A copied promise drifts from its original; replace it with a reference: { module: ${owner}, version: <the version you rely on>, resolve: ${best.target.origin.resolve} }.`,
    });
  }
  return { findings, references, foreign: candidates };
}

function words(source: string): string[] {
  return source.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

/** Shared wording as a share of both texts: twice the longest common word sequence over their total. */
export function similarity(left: string, right: string): number {
  const a = words(left);
  const b = words(right);
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  let previous = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i += 1) {
    const current = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = a[i - 1] === b[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], current[j - 1]);
    }
    previous = current;
  }
  return (2 * previous[b.length]) / (a.length + b.length);
}
