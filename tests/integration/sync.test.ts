import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { beforeEach, describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");
const shipped = resolve("skills");

/** Every run gets its own skills home, so no test can touch the real `~/.claude/skills`. */
let skillsHome: string;
let repository: string;

function run(args: string[], cwd = repository): unknown {
  return JSON.parse(
    execFileSync("node", [cli, ...args, "--json"], {
      cwd,
      encoding: "utf8",
      env: { ...process.env, KOTTA_SKILLS_HOME: skillsHome },
    }),
  );
}

/** The human rendering, where a remedy either reaches the operator or does not. */
function human(args: string[], cwd = repository): string {
  return execFileSync("node", [cli, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, KOTTA_SKILLS_HOME: skillsHome },
  });
}

function shippedNames(): string[] {
  return readdirSync(shipped, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(shipped, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

beforeEach(() => {
  skillsHome = mkdtempSync(join(tmpdir(), "kotta-skills-"));
  repository = mkdtempSync(join(tmpdir(), "kotta-sync-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: repository });
});

describe("kotta sync", () => {
  test("installs every shipped skill as a real directory", () => {
    const result = run(["sync"]) as { ok: boolean; data: { created: string[] } };

    expect(result.ok).toBe(true);
    expect(result.data.created).toEqual(shippedNames());
    expect(result.data.created.length).toBeGreaterThan(0);

    for (const name of shippedNames()) {
      const installed = join(skillsHome, name);
      expect(lstatSync(installed).isDirectory()).toBe(true); // a copy, never a symlink
      expect(readFileSync(join(installed, "SKILL.md"), "utf8")).toEqual(
        readFileSync(join(shipped, name, "SKILL.md"), "utf8"),
      );
    }
  });

  test("is idempotent: a second run changes nothing and says so", () => {
    run(["sync"]);
    const before = shippedNames().map((name) => readFileSync(join(skillsHome, name, "SKILL.md"), "utf8"));

    const second = run(["sync"]) as { data: { created: string[]; updated: string[]; unchanged: string[] } };

    expect(second.data.created).toEqual([]);
    expect(second.data.updated).toEqual([]);
    expect(second.data.unchanged).toEqual(shippedNames());
    const after = shippedNames().map((name) => readFileSync(join(skillsHome, name, "SKILL.md"), "utf8"));
    expect(after).toEqual(before);
  });

  test("replaces a dangling symlink, because nothing is lost by doing so", () => {
    const name = shippedNames()[0];
    symlinkSync(join(skillsHome, "gone"), join(skillsHome, name));
    expect(existsSync(join(skillsHome, name))).toBe(false);

    const result = run(["sync"]) as { data: { created: string[]; skipped: string[] } };

    expect(result.data.created).toContain(name);
    expect(result.data.skipped).toEqual([]);
    expect(lstatSync(join(skillsHome, name)).isDirectory()).toBe(true);
  });

  test("leaves another tool's skill of the same name alone, and reports it", () => {
    const name = shippedNames()[0];
    mkdirSync(join(skillsHome, name), { recursive: true });
    writeFileSync(join(skillsHome, name, "SKILL.md"), "---\nname: someone-else\n---\nNot Kotta's.\n");

    const result = run(["sync"]) as { data: { created: string[]; skipped: string[] } };

    expect(result.data.skipped).toEqual([name]);
    expect(result.data.created).not.toContain(name);
    expect(readFileSync(join(skillsHome, name, "SKILL.md"), "utf8")).toContain("Not Kotta's.");
  });

  test("updates its own copy after it was edited", () => {
    run(["sync"]);
    const name = shippedNames()[0];
    writeFileSync(join(skillsHome, name, "SKILL.md"), "edited by hand\n");

    const result = run(["sync"]) as { data: { updated: string[] } };

    expect(result.data.updated).toContain(name);
    expect(readFileSync(join(skillsHome, name, "SKILL.md"), "utf8")).toEqual(
      readFileSync(join(shipped, name, "SKILL.md"), "utf8"),
    );
  });

  test("replaces Kotta-owned legacy task skill names without touching unowned directories", () => {
    const ownedLegacy = "define-contract";
    const unownedLegacy = "start-contract";
    for (const name of [ownedLegacy, unownedLegacy]) {
      mkdirSync(join(skillsHome, name), { recursive: true });
      writeFileSync(join(skillsHome, name, "SKILL.md"), `legacy ${name}\n`);
    }
    writeFileSync(join(skillsHome, ".kotta-installed.json"), `${JSON.stringify({ skills: [ownedLegacy] })}\n`);

    const result = run(["sync"]) as { data: { removed: string[] } };

    expect(result.data.removed).toEqual([ownedLegacy]);
    expect(existsSync(join(skillsHome, ownedLegacy))).toBe(false);
    expect(existsSync(join(skillsHome, "define-task/SKILL.md"))).toBe(true);
    expect(readFileSync(join(skillsHome, unownedLegacy, "SKILL.md"), "utf8")).toContain("legacy");
  });

  test("writes nothing inside a repository that has no workspace", () => {
    const before = readdirSync(repository).sort();

    run(["sync"]);

    expect(readdirSync(repository).sort()).toEqual(before);
  });
});

describe("the workspace rules file", () => {
  const rules = () => join(repository, ".kotta/AGENTS.md");
  const projectAgents = () => join(repository, "AGENTS.md");
  const legacyInlineAgents = (projectInstructions: string) => [
    "# AGENTS.md",
    "",
    "This repository runs on **Kotta**. Work is defined, executed, reviewed and closed as plain files",
    "in `.kotta/`, and every state change goes through the `kotta` CLI.",
    "",
    "## The rule everything else follows from",
    "",
    "`.kotta/` is the canonical source of truth for work.",
    "",
    "## Orient yourself first",
    "",
    "Run `kotta status`.",
    "",
    "## The lifecycle",
    "",
    "backlog → defined → active → review → done",
    "",
    "## Rules for agents",
    "",
    "1. **No change without an active task you hold the claim for.**",
    "",
    "## Skills",
    "",
    "A defect in Kotta itself is not a task here: report it.",
    "",
    projectInstructions,
  ].join("\n");

  test("init writes it, naming the package and version an agent cannot guess from the binary", () => {
    const result = run(["init"]) as { data: { agents: { state: string; path: string }; pointer: string } };

    expect(result.data.agents.state).toBe("created");
    const written = readFileSync(rules(), "utf8");
    const manifest = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { name: string; version: string };
    expect(written).toContain(`${manifest.name}@${manifest.version}`);
    expect(written).not.toContain("{{");
    expect(result.data.pointer).toBe("@.kotta/AGENTS.md");
  });

  test("renders the accepted-commitment threshold and the spec/process ownership boundary", () => {
    run(["init"]);
    const status = run(["status"]) as { data: { activeTasks: unknown[] } };

    expect(status.data.activeTasks).toEqual([]);
    const written = readFileSync(rules(), "utf8").toLowerCase().replace(/\s+/g, " ");
    expect(written).not.toContain("no change without an active task");
    expect(written).toContain("a task gates execution of an accepted commitment");
    expect(written).toContain("a human has accepted");
    expect(written).toContain("checked against acceptance conditions");
    expect(written).toContain("shaping, exploration, and specification may run without a task");
    expect(written).toContain("specification itself is the accepted deliverable");
    expect(written).toContain("crosses into executing the accepted outcome");
    // Absorbing one task into another already dropped this clause once; the rule is only
    // complete when it also says that maintaining Kotta is not the project's work.
    expect(written).toContain("keeping kotta itself working");
    expect(written).toContain("kotta is the project's tool, not its deliverable");
    expect(written).toContain("active task you hold the claim for");
    expect(written).toContain("ask one focused question");
    expect(written).toContain("project-owned specification knowledge");
    expect(written).toContain("kotta-owned execution and lifecycle state");
    expect(written).toContain("never hand-edit kotta-owned `process/` records");
  });

  test("sync refreshes its own copy and leaves an edited one alone", () => {
    run(["init"]);
    writeFileSync(rules(), "shortened by hand\n");

    const drifted = run(["sync"]) as { data: { agents: { state: string } } };
    expect(drifted.data.agents.state).toBe("drifted");
    expect(readFileSync(rules(), "utf8")).toBe("shortened by hand\n");

    // The way back is a command, not a hand-written manifest: this test used to reach past the
    // tool and rewrite .kotta-generated.json, which is the hand-edit the rules forbid.
    const replaced = run(["sync", "--replace-rules"]) as { data: { agents: { state: string; discardedLines: number } } };
    expect(replaced.data.agents.state).toBe("replaced");
    expect(replaced.data.agents.discardedLines).toBeGreaterThan(0);
    expect(readFileSync(rules(), "utf8")).toContain("## The tool these rules assume");

    // And having taken Kotta's copy, the file is Kotta's again: the next plain sync is a no-op.
    expect((run(["sync"]) as { data: { agents: { state: string } } }).data.agents.state).toBe("unchanged");
  });

  test("a drifted rules file names the command that resolves it, in sync and in status", () => {
    run(["init"]);
    writeFileSync(rules(), "shortened by hand\n");

    for (const args of [["sync"], ["status"]]) {
      const said = human(args);
      expect(said, `${args[0]} names the remedy`).toContain("kotta sync --replace-rules");
      // A verdict with no remedy is what left this repository behind its own template for two days.
      expect(said, `${args[0]} names what keeping the edits costs`).toContain("project's own AGENTS.md");
    }
    expect(readFileSync(rules(), "utf8"), "naming the remedy changes nothing").toBe("shortened by hand\n");
  });

  test("the release edit that caused F-01m0tnv8vmjjjack09xt7w25zf is cleared in one command", () => {
    run(["init"]);
    // Exactly what commit 90edd48 did: edit the one interpolated line rather than let Kotta write
    // it. Kotta's own edit then read as a hand edit, and every sync since reported drift.
    const current = readFileSync(rules(), "utf8");
    const bumped = current.replace(/@arpadtamasi\/kotta@[0-9.]+/g, "@arpadtamasi/kotta@9.9.9");
    expect(bumped, "the fixture reproduces the edit").not.toBe(current);
    writeFileSync(rules(), bumped);

    expect((run(["sync"]) as { data: { agents: { state: string } } }).data.agents.state).toBe("drifted");
    expect((run(["sync", "--replace-rules"]) as { data: { agents: { state: string } } }).data.agents.state).toBe("replaced");
    expect(readFileSync(rules(), "utf8")).toBe(current);
    expect((run(["sync"]) as { data: { agents: { state: string } } }).data.agents.state).toBe("unchanged");
  });

  /**
   * The suite used to leave drift by rewriting Kotta's generated-file manifest — the hand-edit of
   * Kotta-owned state the rules forbid, performed by the very tests that check those rules
   * (F-01m0tnv8vmjjjack09xt7w25zf). `--replace-rules` is the supported way, so nothing needs to
   * reach past the tool. Read over a three-line window, which is what the removed call spanned.
   *
   * The needle is assembled rather than written, so this check does not match its own source.
   */
  test("no test reconciles drift by writing Kotta's own manifest", () => {
    const needle = `${"kotta"}-generated.json`;
    const writes = /write(?:File)?Sync|cpSync|appendFileSync/;
    const suite = resolve("tests");
    const files: string[] = [];
    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (/\.tsx?$/.test(entry.name)) files.push(path);
      }
    };
    walk(suite);
    expect(files.length, "the walk found the suite").toBeGreaterThan(20);

    const offenders = files.filter((path) => {
      const lines = readFileSync(path, "utf8").split(/\r?\n/);
      return lines.some((_line, index) => {
        const window = lines.slice(index, index + 3).join("\n");
        return window.includes(needle) && writes.test(window);
      });
    });
    expect(offenders.map((path) => path.slice(suite.length + 1))).toEqual([]);
  });

  test("status names a missing and then a drifted rules file", () => {
    run(["init"]);
    rmSync(rules());
    expect((run(["status"]) as { data: { rules: { present: boolean } } }).data.rules.present).toBe(false);

    run(["sync"]);
    writeFileSync(rules(), "edited\n");
    expect((run(["status"]) as { data: { rules: { drifted: boolean } } }).data.rules.drifted).toBe(true);
  });

  test("init alone leaves an existing AGENTS.md byte-identical and reports the line to add", () => {
    const own = "# Our rules\n\nRun the linter before pushing.\n";
    writeFileSync(projectAgents(), own);

    const result = run(["init"]) as { data: { projectAgents: unknown; pointer: string } };

    expect(readFileSync(projectAgents(), "utf8")).toBe(own);
    expect(result.data.projectAgents).toBe(null);
    expect(result.data.pointer).toBe("@.kotta/AGENTS.md");
  });

  test("--link-agents appends a section that says what the reference is, and keeps every prior byte in order", () => {
    const own = "# Our rules\n\nRun the linter before pushing.\n";
    writeFileSync(projectAgents(), own);
    run(["init"]);

    const linked = run(["sync", "--link-agents"]) as { data: { projectAgents: { state: string; line: string } } };

    expect(linked.data.projectAgents.state).toBe("linked");
    const after = readFileSync(projectAgents(), "utf8");
    expect(after.startsWith(own), "every prior byte survives in order").toBe(true);
    expect(after.trimEnd().endsWith("@.kotta/AGENTS.md")).toBe(true);
    // Never a bare pointer: a reader who meets the line alone has been told nothing
    // (BR-01m0f1djtb5dkb76tjzq4x3ffh, D-01m13v4eqfhv5213paeqdn4tbm).
    expect(after).toContain("## Kotta");
    expect(after).toMatch(/rules its\n?agents follow/);
  });

  test("--link-agents migrates a legacy inline Kotta prelude and preserves the project section byte-for-byte", () => {
    const projectInstructions = "## This repository\n\n# Product rules\n\nRun our checks.\nDo not reformat this section.";
    const legacy = legacyInlineAgents(projectInstructions);
    writeFileSync(projectAgents(), legacy);
    run(["init"]);

    const migrated = run(["sync", "--link-agents"]) as { data: { projectAgents: { state: string; line: string } } };

    expect(migrated.data.projectAgents.state).toBe("migrated");
    expect(readFileSync(projectAgents(), "utf8")).toBe(`@.kotta/AGENTS.md\n\n${projectInstructions}`);
  });

  test("legacy inline migration is opt-in and idempotent", () => {
    const projectInstructions = "## This repository\n\nKeep this exact project text.\n";
    const legacy = legacyInlineAgents(projectInstructions);
    writeFileSync(projectAgents(), legacy);

    run(["init"]);
    run(["sync"]);
    expect(readFileSync(projectAgents(), "utf8")).toBe(legacy);

    run(["sync", "--link-agents"]);
    const once = readFileSync(projectAgents(), "utf8");
    const again = run(["sync", "--link-agents"]) as { data: { projectAgents: { state: string } } };
    expect(again.data.projectAgents.state).toBe("already-linked");
    expect(readFileSync(projectAgents(), "utf8")).toBe(once);
  });

  test("migration removes the legacy prelude when an earlier sync already appended the pointer", () => {
    const projectInstructions = "## This repository\n\nKeep this project section.\n\n@.kotta/AGENTS.md\n";
    writeFileSync(projectAgents(), legacyInlineAgents(projectInstructions));
    run(["init"]);

    const migrated = run(["sync", "--link-agents"]) as { data: { projectAgents: { state: string } } };

    expect(migrated.data.projectAgents.state).toBe("migrated");
    expect(readFileSync(projectAgents(), "utf8")).toBe(projectInstructions);
  });

  test("a project-owned file that merely mentions Kotta is linked without deleting any content", () => {
    const own = "# Our rules\n\nWe use Kotta.\n\n## This repository\n\nKeep everything here.\n";
    writeFileSync(projectAgents(), own);
    run(["init"]);

    const linked = run(["sync", "--link-agents"]) as { data: { projectAgents: { state: string } } };

    expect(linked.data.projectAgents.state).toBe("linked");
    expect(readFileSync(projectAgents(), "utf8").startsWith(own)).toBe(true);
  });

  test("init creates the project file when there is none, without a flag and without asking", () => {
    expect(existsSync(projectAgents())).toBe(false);

    const initialised = run(["init"]) as { data: { projectAgents: { state: string; line: string } | null } };

    // Nothing was protected, and rules nobody reads are not installed
    // (BR-01m0f1djtb5dkb76tjzq4x3ffh, D-01m13v4eqfhv5213paeqdn4tbm).
    expect(initialised.data.projectAgents?.state).toBe("created");
    const written = readFileSync(projectAgents(), "utf8");
    expect(written).toContain("@.kotta/AGENTS.md");
    expect(written).toContain("## Kotta");
  });

  test("Kotta writes the project's file and calls on the operator to commit it", () => {
    // Writing it finishes Kotta's own installation; committing it is a change in the project's
    // history under the operator's name (D-01m14ccbcvntfbkwxty56sybak).
    const printed = execFileSync("node", [cli, "init"], { cwd: repository, encoding: "utf8" });
    expect(printed).toContain("Commit it");
    expect(execFileSync("git", ["status", "--porcelain", "--", "AGENTS.md"], { cwd: repository, encoding: "utf8" }).trim())
      .toBe("?? AGENTS.md");
  });

  test("init leaves an existing project file alone, and names what would join it", () => {
    const own = "# Our rules\n\nRun the linter before pushing.\n";
    writeFileSync(projectAgents(), own);

    const initialised = run(["init"]) as { data: { projectAgents: unknown; pointer: string } };

    expect(initialised.data.projectAgents, "an existing file is never written unasked").toBeNull();
    expect(readFileSync(projectAgents(), "utf8"), "byte for byte").toBe(own);
    expect(initialised.data.pointer).toBe("@.kotta/AGENTS.md");
  });

  test("--link-agents over the file init created changes nothing", () => {
    // init now creates an absent project file itself, so this flag meets a file that already
    // points at the rules; the case it used to cover is asserted above.
    run(["init"]);
    const before = readFileSync(projectAgents(), "utf8");

    const linked = run(["sync", "--link-agents"]) as { data: { projectAgents: { state: string } } };

    expect(linked.data.projectAgents.state).toBe("already-linked");
    expect(readFileSync(projectAgents(), "utf8")).toBe(before);
  });

  test("linking twice changes nothing, and a reworded pointer is not duplicated", () => {
    run(["init"]);
    run(["sync", "--link-agents"]);
    const once = readFileSync(projectAgents(), "utf8");

    const again = run(["sync", "--link-agents"]) as { data: { projectAgents: { state: string } } };
    expect(again.data.projectAgents.state).toBe("already-linked");
    expect(readFileSync(projectAgents(), "utf8")).toBe(once);

    writeFileSync(projectAgents(), "See .kotta/AGENTS.md for the workflow rules.\n");
    const reworded = run(["sync", "--link-agents"]) as { data: { projectAgents: { state: string } } };
    expect(reworded.data.projectAgents.state).toBe("already-linked");
    expect(readFileSync(projectAgents(), "utf8")).toBe("See .kotta/AGENTS.md for the workflow rules.\n");
  });
});

describe("kotta status reports the skills", () => {
  test("names a drifted skill and does not repair it", () => {
    run(["init"]);
    const name = shippedNames()[0];
    writeFileSync(join(skillsHome, name, "SKILL.md"), "edited by hand\n");

    const result = run(["status"]) as { data: { skills: { drifted: string[]; installed: number } } };

    expect(result.data.skills.drifted).toEqual([name]);
    expect(readFileSync(join(skillsHome, name, "SKILL.md"), "utf8")).toEqual("edited by hand\n");
  });

  test("reports nothing installed before sync has run", () => {
    execFileSync("node", [cli, "init", "--json"], {
      cwd: repository,
      encoding: "utf8",
      env: { ...process.env, KOTTA_SKILLS_HOME: join(skillsHome, "untouched") },
    });

    const result = run(["status"]) as { data: { skills: { installed: number; shipped: number; drifted: string[] } } };

    expect(result.data.skills.installed).toBe(0);
    expect(result.data.skills.shipped).toBeGreaterThan(0);
    expect(result.data.skills.drifted).toEqual([]);
  });
});

describe("kotta init", () => {
  test("leaves the skills installed", () => {
    const result = run(["init"]) as { data: { skills: { created: string[] } } };

    expect(result.data.skills.created).toEqual(shippedNames());
    expect(existsSync(join(skillsHome, shippedNames()[0], "SKILL.md"))).toBe(true);
  });
});

describe("test isolation", () => {
  test("the suite never installs into the operator's real home", () => {
    // A regression guard for a defect this task introduced and then fixed: `init` installs
    // skills, most tests call `init`, and the first full run wrote into ~/.claude/skills.
    expect(process.env.KOTTA_SKILLS_HOME).toBeTruthy();
    expect(process.env.KOTTA_SKILLS_HOME).not.toContain(join(homedir(), ".claude"));
  });
});
