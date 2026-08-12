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

  test("writes nothing inside a repository that has no workspace", () => {
    const before = readdirSync(repository).sort();

    run(["sync"]);

    expect(readdirSync(repository).sort()).toEqual(before);
  });
});

describe("the workspace rules file", () => {
  const rules = () => join(repository, ".kotta/AGENTS.md");
  const projectAgents = () => join(repository, "AGENTS.md");

  test("init writes it, naming the package and version an agent cannot guess from the binary", () => {
    const result = run(["init"]) as { data: { agents: { state: string; path: string }; pointer: string } };

    expect(result.data.agents.state).toBe("created");
    const written = readFileSync(rules(), "utf8");
    const manifest = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { name: string; version: string };
    expect(written).toContain(`${manifest.name}@${manifest.version}`);
    expect(written).not.toContain("{{");
    expect(result.data.pointer).toBe("@.kotta/AGENTS.md");
  });

  test("sync refreshes its own copy and leaves an edited one alone", () => {
    run(["init"]);
    writeFileSync(rules(), "shortened by hand\n");

    const drifted = run(["sync"]) as { data: { agents: { state: string } } };
    expect(drifted.data.agents.state).toBe("drifted");
    expect(readFileSync(rules(), "utf8")).toBe("shortened by hand\n");

    // An outdated but untouched copy is Kotta's to refresh; the manifest is what tells them apart.
    const rendered = readFileSync(rules(), "utf8");
    writeFileSync(join(repository, ".kotta/.kotta-generated.json"), JSON.stringify({
      files: { "AGENTS.md": createHash("sha256").update(rendered).digest("hex") },
    }));
    const refreshed = run(["sync"]) as { data: { agents: { state: string } } };
    expect(refreshed.data.agents.state).toBe("updated");
    expect(readFileSync(rules(), "utf8")).toContain("## The tool these rules assume");
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

  test("--link-agents appends one line and keeps every prior byte in order", () => {
    const own = "# Our rules\n\nRun the linter before pushing.\n";
    writeFileSync(projectAgents(), own);
    run(["init"]);

    const linked = run(["sync", "--link-agents"]) as { data: { projectAgents: { state: string; line: string } } };

    expect(linked.data.projectAgents.state).toBe("linked");
    const after = readFileSync(projectAgents(), "utf8");
    expect(after.startsWith(own)).toBe(true);
    expect(after.trimEnd().endsWith("@.kotta/AGENTS.md")).toBe(true);
    expect(after.split("\n").filter((line) => line.trim()).length).toBe(own.split("\n").filter((line) => line.trim()).length + 1);
  });

  test("--link-agents creates the file when the project has none", () => {
    run(["init"]);
    expect(existsSync(projectAgents())).toBe(false);

    const created = run(["sync", "--link-agents"]) as { data: { projectAgents: { state: string } } };

    expect(created.data.projectAgents.state).toBe("created");
    expect(readFileSync(projectAgents(), "utf8")).toBe("@.kotta/AGENTS.md\n");
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
    // A regression guard for a defect this contract introduced and then fixed: `init` installs
    // skills, most tests call `init`, and the first full run wrote into ~/.claude/skills.
    expect(process.env.KOTTA_SKILLS_HOME).toBeTruthy();
    expect(process.env.KOTTA_SKILLS_HOME).not.toContain(join(homedir(), ".claude"));
  });
});
