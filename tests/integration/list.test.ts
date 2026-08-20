import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { retainLegacySignGate } from "../helpers/legacy-sign.js";

const cli = resolve("dist/cli/index.js");

function cliRun(repository: string, args: string[]): { status: number | null; stdout: string; stderr: string } {
  return spawnSync("node", [cli, ...args], { cwd: repository, encoding: "utf8" });
}

function json(repository: string, args: string[]): { data: { entity: string; states: string[]; count: number; entities: { id: string; state: string; title: string; path: string }[] } } {
  const result = cliRun(repository, [...args, "--json"]);
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as ReturnType<typeof json>;
}

function git(repository: string, ...args: string[]): void {
  execFileSync("git", args, { cwd: repository });
}

/** Every file under the workspace with its bytes, so "read-only" can be asserted rather than asserted about. */
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

function fixture(label: string): { repository: string; contracts: string[] } {
  const repository = mkdtempSync(join(tmpdir(), `kotta-list-${label}-`));
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.name", "Kotta Test");
  git(repository, "config", "user.email", "test@example.com");
  writeFileSync(join(repository, "README.md"), "fixture\n");
  cliRun(repository, ["init", "--json"]);
  retainLegacySignGate(repository);
  const contracts = ["Ship the exporter", "Retire the old importer"].map((title) => {
    const created = cliRun(repository, ["contract", "new", "--title", title, "--type", "feature", "--json"]);
    return (JSON.parse(created.stdout) as { data: { id: string } }).data.id;
  });
  cliRun(repository, ["observation", "new", "--title", "The importer logs nothing", "--type", "bug", "--evidence", "Observed in the fixture.", "--json"]);
  return { repository, contracts };
}

describe("listing every entity", () => {
  test("lists contracts and observations with their state and title", () => {
    const { repository, contracts } = fixture("basic");

    const listed = json(repository, ["contract", "list"]).data;
    expect(listed.entity).toBe("contract");
    expect(listed.count).toBe(2);
    expect(listed.entities.map(({ id }) => id).sort()).toEqual([...contracts].sort());
    expect(listed.entities.every(({ state }) => state === "backlog")).toBe(true);
    expect(listed.entities.map(({ title }) => title).sort()).toEqual(["Retire the old importer", "Ship the exporter"]);

    const observations = json(repository, ["observation", "list"]).data;
    expect(observations.count).toBe(1);
    expect(observations.entities[0]).toMatchObject({ state: "new", title: "The importer logs nothing" });

    // The title leads in human output; the id is present but never first.
    const human = cliRun(repository, ["contract", "list"]);
    expect(human.status).toBe(0);
    expect(human.stdout).toContain("Ship the exporter");
    expect(human.stdout.trim().endsWith("2 contracts.")).toBe(true);
  });

  test("decisions and batches list too, and batches read their own directories", () => {
    const { repository } = fixture("all-entities");
    expect(json(repository, ["decision", "list"]).data).toMatchObject({ entity: "decision", count: 0 });
    expect(json(repository, ["batch", "list"]).data).toMatchObject({ entity: "batch", count: 0 });
    expect(cliRun(repository, ["batch", "list"]).stdout).toContain("No batches.");
  });

  test("--state narrows, repeats union, and an unknown state is refused naming the states that exist", () => {
    const { repository, contracts } = fixture("states");
    const definition = join(repository, "definition.md");
    writeFileSync(definition, [
      "## Outcome", "", "The exporter ships.", "", "## Scope", "", "1. Ship it.", "",
      "## Acceptance", "", "- It ships.", "", "## Verification", "", "- Run it.", "",
      "## Open decisions", "", "None.", "",
    ].join("\n"));
    cliRun(repository, ["contract", "define", contracts[0], "--from", definition, "--json"]);
    cliRun(repository, ["contract", "sign", contracts[0], "--approve", "--json"]);

    expect(json(repository, ["contract", "list", "--state", "defined"]).data).toMatchObject({ count: 1 });
    expect(json(repository, ["contract", "list", "--state", "backlog"]).data).toMatchObject({ count: 1 });
    expect(json(repository, ["contract", "list", "--state", "backlog", "--state", "defined"]).data).toMatchObject({ count: 2 });
    expect(json(repository, ["contract", "list", "--state", "review"]).data).toMatchObject({ count: 0 });
    expect(cliRun(repository, ["contract", "list", "--state", "review"]).stdout).toContain("No contracts in review.");

    const refused = cliRun(repository, ["contract", "list", "--state", "nope"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout + refused.stderr).toContain("backlog, defined, active, review, done");
  });

  test("--state on decisions is refused with the reason, not with 'unknown option'", () => {
    const { repository } = fixture("decision-state");
    const refused = cliRun(repository, ["decision", "list", "--state", "recorded"]);
    expect(refused.status).not.toBe(0);
    const output = refused.stdout + refused.stderr;
    expect(output).toContain("Decisions have no lifecycle states");
    expect(output).not.toContain("unknown option");
  });

  test("listing writes nothing: the workspace is byte-identical afterwards, and repeats produce identical bytes", () => {
    const { repository } = fixture("read-only");
    const before = workspaceSnapshot(repository);
    const first = cliRun(repository, ["contract", "list"]).stdout;
    for (const entity of ["contract", "observation", "decision", "batch"]) cliRun(repository, [entity, "list"]);
    expect(workspaceSnapshot(repository)).toEqual(before);
    expect(cliRun(repository, ["contract", "list"]).stdout).toBe(first);
  });
});
