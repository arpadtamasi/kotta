import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";

export function git(root: string, args: string[]): string {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(stderr || `git ${args.join(" ")} failed.`);
  }
}

export function assertClean(root: string): void {
  if (git(root, ["status", "--porcelain"])) throw new Error("Repository is dirty. Commit or remove pending changes before starting a task.");
}

export function assertSafeWorktreePath(path: string): void {
  if (existsSync(path) && readdirSync(path).length > 0) throw new Error(`Refusing to reuse non-empty worktree path: ${path}`);
}
