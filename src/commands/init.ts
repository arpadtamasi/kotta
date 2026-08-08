import { initializeWorkspace } from "../filesystem/workspace.js";
import { syncSkills } from "./sync.js";

/**
 * `init` also installs the skills. A new project should need one command, not two, and the skills
 * are the part nobody discovers on their own — `AGENTS.md` tells agents to prefer them, so they
 * have to exist by the time the first agent reads it.
 *
 * The install is global and idempotent, so running `init` in a second repository costs nothing.
 */
export function initCommand(projectName?: string) {
  const result = initializeWorkspace({ projectName });
  const skills = syncSkills();
  return { ok: true, command: "init", data: { root: result.root, skills: skills.data } };
}
