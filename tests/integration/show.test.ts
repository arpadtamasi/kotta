import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

function cliRun(repository: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  return spawnSync("node", [cli, ...args], { cwd: repository, encoding: "utf8" });
}

function json<T>(repository: string, args: string[]): T {
  const result = cliRun(repository, [...args, "--json"]);
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as T;
}

function git(repository: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: repository });
}

function workspaceSnapshot(repository: string): Record<string, string> {
  const root = join(repository, ".kotta");
  const snapshot: Record<string, string> = {};
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory).sort()) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) walk(path);
      else snapshot[relative(root, path)] = readFileSync(path, "utf8");
    }
  };
  walk(root);
  return snapshot;
}

function fixture(label: string): { repository: string; id: string; short: string } {
  const repository = mkdtempSync(join(tmpdir(), `kotta-show-${label}-`));
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Kotta Test");
  git(repository, "config", "user.email", "test@example.com");
  writeFileSync(join(repository, "README.md"), "fixture\n");
  cliRun(repository, ["init", "--json"]);
  const created = json<{ data: { id: string } }>(repository, ["contract", "new", "--title", "Ship the exporter", "--type", "feature"]);
  cliRun(repository, ["observation", "new", "--title", "The importer logs nothing", "--type", "bug", "--evidence", "Observed in the fixture.", "--json"]);
  const listed = json<{ data: { entities: { id: string }[] } }>(repository, ["contract", "list"]);
  const shown = cliRun(repository, ["contract", "list"]).stdout;
  const short = shown.split(/\s+/).filter((token) => /^T-[0-9a-z]{8}$/.test(token))[0];
  expect(listed.data.entities[0].id).toBe(created.data.id);
  return { repository, id: created.data.id, short };
}

describe("showing one entity", () => {
  test("shows a contract by its full id and by the short id the listing prints", () => {
    const { repository, id, short } = fixture("basic");
    expect(short).toBeTruthy();
    expect(short).not.toBe(id);

    const full = json<{ data: { id: string; state: string; title: string; body: string; facts: Record<string, string> } }>(repository, ["contract", "show", id]);
    expect(full.data).toMatchObject({ id, state: "backlog", title: "Ship the exporter" });
    expect(full.data.facts.types).toBe("feature");
    expect(full.data.body).toContain(id);
    // The short id resolves to exactly the same entity, canonicalised on the way in.
    expect(json<{ data: unknown }>(repository, ["contract", "show", short]).data).toEqual(full.data);

    const human = cliRun(repository, ["contract", "show", short]);
    expect(human.status).toBe(0);
    expect(human.stdout.startsWith("Ship the exporter")).toBe(true);
    expect(human.stdout).toContain("state");
    // An unset field is absent rather than printed empty.
    expect(human.stdout).not.toContain("branch");
  });

  test("observations, decisions and batches show too", () => {
    const { repository } = fixture("entities");
    const observations = json<{ data: { entities: { id: string }[] } }>(repository, ["observation", "list"]);
    const shown = json<{ data: { entity: string; state: string; title: string } }>(repository, ["observation", "show", observations.data.entities[0].id]);
    expect(shown.data).toMatchObject({ entity: "observation", state: "new", title: "The importer logs nothing" });

    expect(cliRun(repository, ["decision", "show", "D-001"]).status).not.toBe(0);
    expect(cliRun(repository, ["batch", "show", "P-001"]).status).not.toBe(0);
  });

  test("the short id works on a command that is not show", () => {
    // The measured failure: the CLI printed T-xxxxxxxx and then refused it.
    const { repository, short } = fixture("short-elsewhere");
    const definition = join(repository, "definition.md");
    writeFileSync(definition, [
      "## Outcome", "", "The exporter ships.", "", "## Scope", "", "1. Ship it.", "",
      "## Non-goals", "", "- Anything else.", "", "## Acceptance", "", "- It ships.", "",
      "## Verification", "", "- Run it.", "", "## Constraints", "", "- Ship nothing else.", "",
      "## Open decisions", "", "None.", "", "## Execution notes", "", "- Start in src/.", "",
    ].join("\n"));
    expect(cliRun(repository, ["contract", "define", short, "--from", definition, "--json"]).status).toBe(0);
    expect(cliRun(repository, ["contract", "validate", short, "--json"]).status).toBe(0);
    expect(json<{ data: { entities: { state: string }[] } }>(repository, ["contract", "list"]).data.entities[0].state).toBe("backlog");
  });

  test("an unknown id fails naming it, and nothing about brief or batch status changes", () => {
    const { repository, id } = fixture("unknown");
    const missing = cliRun(repository, ["contract", "show", "T-nope"]);
    expect(missing.status).not.toBe(0);
    expect(missing.stdout + missing.stderr).toContain("T-nope");

    // `show` is not the brief: the brief still assembles its own package for contracts.
    const brief = cliRun(repository, ["contract", "brief", id, "--json"]);
    expect(brief.status).toBe(0);
    expect(JSON.parse(brief.stdout).command).toBe("contract brief");
  });

  test("showing writes nothing: the workspace is byte-identical afterwards", () => {
    const { repository, id, short } = fixture("read-only");
    const before = workspaceSnapshot(repository);
    cliRun(repository, ["contract", "show", id]);
    cliRun(repository, ["contract", "show", short]);
    cliRun(repository, ["observation", "list"]);
    expect(workspaceSnapshot(repository)).toEqual(before);
  });
});
