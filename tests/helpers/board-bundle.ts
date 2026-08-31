import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";

/**
 * The board bundle carried in the repository, against a build of its source
 * (IF-01m0f0wn898ggsdxa0kh6t6tnw).
 *
 * `ui-dist/` is tracked so a checkout runs the board without a build step, and `kotta ui` serves
 * that copy — so a correction that reaches `ui/src` and not the bundle has not reached the reader.
 * On 2026-08-29 exactly that happened: a removed string was still in the served page. This reads
 * both sides; it never writes to the tracked copy.
 */

export const BOARD_BUNDLE = "ui-dist";
export const REGENERATE = "npm run build:ui";

/** Every file under a directory, by path relative to it, in a stable order. */
function tree(directory: string): string[] {
  const found: string[] = [];
  const walk = (current: string): void => {
    for (const entry of readdirSync(current).sort()) {
      const path = join(current, entry);
      if (statSync(path).isDirectory()) walk(path);
      else found.push(relative(directory, path).split(sep).join("/"));
    }
  };
  walk(directory);
  return found.sort();
}

/**
 * One difference between a built bundle and the committed one, in the reader's terms. `differs`
 * carries no diff: these are minified bundles, and a line of them says less than the filename does.
 */
export interface BundleDrift {
  kind: "missing" | "extra" | "differs";
  file: string;
}

/** What the committed bundle at `committed` fails to say about a build sitting at `built`. */
export function bundleDrift(built: string, committed: string): BundleDrift[] {
  const fromSource = tree(built);
  const inRepository = new Set(tree(committed));
  const drift: BundleDrift[] = [];
  for (const file of fromSource) {
    if (!inRepository.has(file)) {
      drift.push({ kind: "missing", file });
      continue;
    }
    if (!readFileSync(join(built, file)).equals(readFileSync(join(committed, file)))) {
      drift.push({ kind: "differs", file });
    }
  }
  const emitted = new Set(fromSource);
  for (const file of inRepository) if (!emitted.has(file)) drift.push({ kind: "extra", file });
  return drift;
}

/** The report a reader acts on: what is wrong, then the one command that fixes all of it. */
export function describeDrift(drift: BundleDrift[]): string {
  if (!drift.length) return "";
  const said: Record<BundleDrift["kind"], string> = {
    missing: "built from the source and absent from the bundle",
    extra: "in the bundle and not built from the source",
    differs: "in both, with different content",
  };
  return [
    `${BOARD_BUNDLE}/ no longer matches a build of ui/:`,
    ...drift.map(({ kind, file }) => `  ${file} — ${said[kind]}`),
    `Run '${REGENERATE}' and commit the result; the board serves this copy, not the source.`,
  ].join("\n");
}

/**
 * Build `ui/` into a scratch directory and hand back its path and a cleanup.
 *
 * The build is the point: a check that trusted a `pretest` step would pass for anyone who ran the
 * suite without building, which is the very silence this exists to break.
 */
export function buildBoardBundle(repositoryRoot = resolve(".")): { path: string; remove: () => void } {
  const path = mkdtempSync(join(tmpdir(), "kotta-board-bundle-"));
  // NODE_ENV decides which React build is bundled, and a test runner sets it to `test` — so a
  // build inherited from one produces a different file, with a different content hash, from the
  // one `npm run build:ui` produces. Comparing that against the committed bundle would report
  // drift on a bundle that is perfectly current: a checker that cries wolf gets switched off. The
  // variable is removed rather than set, so this build sees exactly what the npm script sees.
  const environment = { ...process.env };
  delete environment.NODE_ENV;
  execFileSync("npx", ["vite", "build", "--config", "ui/vite.config.ts", "--outDir", path, "--emptyOutDir", "--logLevel", "error"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return { path, remove: () => rmSync(path, { recursive: true, force: true }) };
}
