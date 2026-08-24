import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * How to reach this Kotta, proved from the running process rather than hoped of someone's PATH
 * (BR-01m0qyxvz954ay2rbm00bazrd5, BR-01m0r52vex4j22266nepm5yq8s).
 *
 * Two callers need the same fact and must not answer it differently: `integrate` writes it into a
 * host's configuration, and the brief states it to the agent about to work. Naming the entry script
 * alone would not do — its `#!/usr/bin/env node` shebang defers the same hope to `env`.
 */
export interface KottaInvocation {
  /** The interpreter executing Kotta, absolute. */
  readonly command: string;
  /** Kotta's own entry point, absolute. */
  readonly entry: string;
}

export function kottaInvocation(): KottaInvocation {
  return { command: process.execPath, entry: fileURLToPath(new URL("../cli/index.js", import.meta.url)) };
}

/** The invocation as a reader would type it: two absolute paths, nothing to resolve. */
export function invocationLine(invocation: KottaInvocation = kottaInvocation()): string {
  return `${invocation.command} ${invocation.entry}`;
}

/**
 * Whether the bare name `kotta` resolves in a shell started without the operator's profile — the
 * kind of shell a host or an agent worktree actually gets. PATH is read from the environment the
 * caller passes, so the diagnostic reports the caller's situation and not a guess about it.
 */
export function bareNameResolves(environment: NodeJS.ProcessEnv = process.env): string | null {
  const path = environment.PATH ?? "";
  if (!path) return null;
  for (const directory of path.split(":").filter(Boolean)) {
    const candidate = `${directory}/kotta`;
    if (existsSync(candidate)) return candidate;
  }
  return null;
}
