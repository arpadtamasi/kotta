import { existsSync } from "node:fs";
import { join } from "node:path";
import { initializeWorkspace } from "../filesystem/workspace.js";
import { PROJECT_AGENTS_FILE, linkProjectAgents, pointerLine, syncProjectClaude, syncWorkspaceAgents } from "./agents.js";
import { syncSkills } from "./sync.js";

/**
 * `init` also installs the skills and writes the workspace rules file. A new project should need
 * one command, not three, and both are parts nobody discovers on their own — the rules tell agents
 * to prefer the skills and to use the CLI, so both have to exist by the time the first agent reads
 * them.
 *
 * The skills install is global and idempotent, so running `init` in a second repository costs
 * nothing. The project's own `AGENTS.md` is created when absent and otherwise only reported; so is
 * its `CLAUDE.md`, which Claude Code reads instead (BR-01m0f1djtb5dkb76tjzq4x3ffh).
 */
export function initCommand(projectName?: string) {
  const result = initializeWorkspace({ projectName });
  const skills = syncSkills();
  const agents = syncWorkspaceAgents(result.root);
  // An existing project file is never written: only a missing one is created, and the line is reported.
  const projectAgents = existsSync(join(result.root, PROJECT_AGENTS_FILE)) ? null : linkProjectAgents(result.root);
  const claudeFile = syncProjectClaude(result.root);
  return { ok: true, command: "init", data: { root: result.root, skills: skills.data, agents, projectAgents, claudeFile, pointer: pointerLine(result.root) } };
}
