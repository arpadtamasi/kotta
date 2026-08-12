import { initializeWorkspace } from "../filesystem/workspace.js";
import { linkProjectAgents, pointerLine, syncWorkspaceAgents } from "./agents.js";
import { syncSkills } from "./sync.js";

/**
 * `init` also installs the skills and writes the workspace rules file. A new project should need
 * one command, not three, and both are parts nobody discovers on their own — the rules tell agents
 * to prefer the skills and to use the CLI, so both have to exist by the time the first agent reads
 * them.
 *
 * The skills install is global and idempotent, so running `init` in a second repository costs
 * nothing. The project's own `AGENTS.md` is touched only with `linkAgents`, and only ever by one
 * appended line (D-01kztp2epe4sehb25mpv7hc33b).
 */
export function initCommand(projectName?: string, options: { linkAgents?: boolean } = {}) {
  const result = initializeWorkspace({ projectName });
  const skills = syncSkills();
  const agents = syncWorkspaceAgents(result.root);
  const projectAgents = options.linkAgents ? linkProjectAgents(result.root) : null;
  return { ok: true, command: "init", data: { root: result.root, skills: skills.data, agents, projectAgents, pointer: pointerLine(result.root) } };
}
