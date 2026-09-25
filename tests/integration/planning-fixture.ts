import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { stringify } from "yaml";

/**
 * A small accepted specification and one change against it, shared by the planning-phase tests.
 *
 * Accepted (six nodes): a goal, the quit-confirmation rule with the example that proves it, the game
 * entity, the game's lifecycle, and a glossary term that names "pause" as a non-example of "quit".
 * The change `add-pause` changes the rule and the lifecycle and adds a pause rule with its example —
 * which yields one conflict family, one open question and one narrative drift, on purpose.
 */

export const cli = resolve("dist/cli/index.js");

export const id = (prefix: string, tail: string) => `${prefix}-01m0p${"0".repeat(21 - tail.length)}${tail}`;

export const GOAL = id("G", "g1");
export const QUIT = id("BR", "b1");
export const PROMPT = id("EX", "e1");
export const GAME = id("E", "e2");
export const LIFECYCLE = id("SM", "s1");
export const TERM = id("GT", "t1");
export const PAUSE = id("BR", "b2");
export const HOLD = id("EX", "e3");

export function node(frontmatter: Record<string, unknown>, sections: Record<string, string>): string {
  const body = Object.entries(sections).map(([heading, text]) => `## ${heading}\n\n${text}\n`).join("\n");
  return `---\n${stringify(frontmatter)}---\n\n# ${String(frontmatter.title)}\n\n${body}`;
}

export function write(root: string, path: string, content: string): string {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
  return full;
}

export const run = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
export const json = (cwd: string, args: string[]) => {
  const result = run(cwd, [...args, "--json"]);
  return { status: result.status, body: JSON.parse(result.stdout) as { ok: boolean; data: any; errors?: Array<{ code: string; message: string; path?: string }> } };
};

export const QUIT_RULE_AFTER = "The game SHALL ask “Quit? Y/N” before it ends a running game; a paused game quits at once.";

const stated = (source: string) => ({ level: "stated", decided_by: "human", sources: [source], quote: "a paused game should just quit — operator, 2026-09-25 10:02" });

/** A fresh repository with an accepted specification and the `add-pause` change. */
export function planningWorkspace(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-planning-${label}-`));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  const spec = ".kotta/spec";
  write(root, `${spec}/goals/finish-games-${GOAL.slice(-8)}.md`, node(
    { id: GOAL, form: "goal", title: "Players finish the games they start", capability: "game/session", measured_by: [PROMPT] },
    { Outcome: "Fewer games end by accident.", Context: "Players quit by mistake.", "Baseline and target": "From 12% accidental quits to 2%." }));
  write(root, `${spec}/business-rules/quit-confirmation-${QUIT.slice(-8)}.md`, node(
    { id: QUIT, form: "business-rule", title: "Quitting asks for confirmation", capability: "game/session" },
    { Rule: "The game SHALL ask “Quit? Y/N” before it ends a running game.", Rationale: "An accidental quit loses the game.", Scope: "Every running game." }));
  write(root, `${spec}/examples/quit-prompt-${PROMPT.slice(-8)}.md`, node(
    { id: PROMPT, form: "example", title: "The quit prompt appears", subjects: [QUIT] },
    { Given: "a running game", When: "the player presses Q", Then: "the game asks “Quit? Y/N”" }));
  write(root, `${spec}/entities/game-${GAME.slice(-8)}.md`, node(
    { id: GAME, form: "entity", title: "Game", used_by: [QUIT] },
    { Meaning: "One play-through.", Identity: "A session id.", Attributes: "Score, clock.", Invariants: "The clock never runs backwards." }));
  write(root, `${spec}/state-machines/game-lifecycle-${LIFECYCLE.slice(-8)}.md`, node(
    { id: LIFECYCLE, form: "state-machine", title: "Game lifecycle", entity: [GAME] },
    { "Governed lifecycle": "A game from start to end.", States: "running, paused, over", Transitions: "- running -> paused\n- paused -> running\n- running -> over" }));
  write(root, `${spec}/glossary-terms/quit-${TERM.slice(-8)}.md`, node(
    { id: TERM, form: "glossary-term", title: "Quit" },
    { Definition: "Ending a game before it is over.", Usage: "The player quits.", "Non-examples": "- pause — stops the clock, but does not end the game" }));

  const change = "openspec/changes/add-pause";
  write(root, `${change}/proposal.md`, "# Add pause\n\n## Why\n\nA paused game should just quit.\n");
  write(root, `${change}/model/business-rules/quit-confirmation-${QUIT.slice(-8)}.md`, node(
    { id: QUIT, form: "business-rule", title: "Quitting asks for confirmation", capability: "game/session", provenance: stated("openspec/changes/add-pause/proposal.md · Why") },
    { Rule: QUIT_RULE_AFTER, Rationale: "An accidental quit loses the game; a paused one is already stopped.", Scope: "Every running or paused game." }));
  write(root, `${change}/model/state-machines/game-lifecycle-${LIFECYCLE.slice(-8)}.md`, node(
    { id: LIFECYCLE, form: "state-machine", title: "Game lifecycle", entity: [GAME], provenance: { level: "partly-inferred", decided_by: "agent-decided", sources: ["openspec/changes/add-pause/proposal.md · Why"], inferred: "that a finished game can be restarted" } },
    { "Governed lifecycle": "A game from start to end.", States: "running, paused, over", Transitions: "- running -> paused\n- paused -> over\n- over -> running" }));
  write(root, `${change}/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`, node(
    { id: PAUSE, form: "business-rule", title: "Pause freezes the timer", capability: "game/session", provenance: stated("openspec/changes/add-pause/proposal.md · Why") },
    { Rule: "While a game is paused its clock SHALL NOT advance.", Rationale: "A pause is not play.", Scope: "Timed games.", "Open decisions": "- How long may a pause last?" }));
  write(root, `${change}/model/examples/timer-holds-${HOLD.slice(-8)}.md`, node(
    { id: HOLD, form: "example", title: "The timer holds while paused", subjects: [PAUSE], provenance: stated("openspec/changes/add-pause/proposal.md · Why") },
    { Given: "a game paused at 01:10", When: "a minute passes", Then: "the clock still shows 01:10" }));
  write(root, `${change}/specs/session/spec.md`, [
    "## ADDED Requirements", "", "### Requirement: Quit confirmation", `<!-- kotta: ${QUIT} -->`, "The game SHALL quit immediately.", "",
  ].join("\n"));
  return root;
}

/** Answer the open question the fixture leaves, the way an agent records the human's answer. */
export function answerPause(root: string): void {
  write(root, `openspec/changes/add-pause/model/business-rules/pause-freezes-${PAUSE.slice(-8)}.md`, node(
    { id: PAUSE, form: "business-rule", title: "Pause freezes the timer", capability: "game/session", provenance: stated("openspec/changes/add-pause/proposal.md · Why") },
    { Rule: "While a game is paused its clock SHALL NOT advance.", Rationale: "A pause is not play.", Scope: "Timed games.", "Open decisions": "None." }));
}
