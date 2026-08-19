import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";

const cli = resolve("dist/cli/index.js");

const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });

function repository(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-nesting-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  run(root, ["init"]);
  git(root, "add", ".");
  git(root, "commit", "-m", "kotta");
  return root;
}

function contract(root: string, title: string): { id: string; path: string } {
  const created = (run(root, ["contract", "new", "--title", title, "--type", "feature"]) as { data: { id: string; path: string } }).data;
  writeFileSync(created.path, readFileSync(created.path, "utf8")
    .replace("Describe the observable outcome.", `${title} works.`)
    .replace("- Define an observable condition.", `- ${title} is observable.`)
    .replace("- Explain how acceptance will be checked.", "- Read it."));
  return created;
}

const batch = (root: string, title: string): string =>
  (run(root, ["batch", "new", "--title", title, "--goal", `Deliver ${title}`]) as { data: { id: string } }).data.id;

describe("a batch that groups other batches", () => {
  test("reads as one work list, with dependencies ordered across children", () => {
    const root = repository("tree");
    const parser = contract(root, "Build parser");
    const command = contract(root, "Expose command");
    // The dependency crosses the two children: ordering is a property of the tree, not of a batch.
    writeFileSync(command.path, readFileSync(command.path, "utf8").replace("depends_on: []", `depends_on:\n  - ${parser.id}`));

    const core = batch(root, "Core");
    const surface = batch(root, "Surface");
    const product = batch(root, "Product");
    run(root, ["batch", "add", core, parser.id]);
    run(root, ["batch", "add", surface, command.id]);
    // Children are added by the same command that adds a contract, routed by the id it is given.
    expect(run(root, ["batch", "add", product, surface])).toMatchObject({ ok: true, data: { batches: [surface] } });
    run(root, ["batch", "add", product, core]);

    const shown = run(root, ["batch", "status", product]) as { data: { children: Array<{ id: string }>; contracts: Array<{ id: string }> } };
    expect(shown.data.children.map((child) => child.id).sort()).toEqual([core, surface].sort());
    expect(shown.data.contracts.map((member) => member.id).sort()).toEqual([parser.id, command.id].sort());

    const validated = run(root, ["batch", "validate", product]) as { data: { waves: string[][] } };
    expect(validated.data.waves).toEqual([[parser.id], [command.id]]);
  });

  test("refuses a cycle at any depth, a second parent, and itself", () => {
    const root = repository("shape");
    const work = contract(root, "Only work");
    const leaf = batch(root, "Leaf");
    const middle = batch(root, "Middle");
    const top = batch(root, "Top");
    const other = batch(root, "Other");
    run(root, ["batch", "add", leaf, work.id]);
    run(root, ["batch", "add", middle, leaf]);
    run(root, ["batch", "add", top, middle]);

    const deepCycle = attempt(root, ["batch", "add", leaf, top]);
    expect(deepCycle.status).not.toBe(0);
    expect(deepCycle.stdout).toContain("cyclic");

    const itself = attempt(root, ["batch", "add", leaf, leaf]);
    expect(itself.status).not.toBe(0);
    expect(itself.stdout).toContain("cannot contain itself");

    const secondParent = attempt(root, ["batch", "add", other, leaf]);
    expect(secondParent.status).not.toBe(0);
    expect(secondParent.stdout).toContain(`already belongs to ${middle}`);

    // Nothing was written by any of the three refusals.
    expect(readFileSync(join(root, ".kotta/process/index.md"), "utf8")).toBeTruthy();
    expect(run(root, ["batch", "status", top]) as { data: { children: unknown[] } }).toMatchObject({ data: { children: [{ id: middle }] } });
  });

  test("is not run directly: execution stays a leaf operation", () => {
    const root = repository("start");
    const work = contract(root, "Only work");
    run(root, ["contract", "sign", work.id, "--approve"]);
    const leaf = batch(root, "Leaf");
    const parent = batch(root, "Parent");
    run(root, ["batch", "add", leaf, work.id]);
    run(root, ["batch", "add", parent, leaf]);
    run(root, ["batch", "sign", leaf, "--approve"]);
    run(root, ["batch", "sign", parent, "--approve"]);
    git(root, "add", ".");
    git(root, "commit", "-m", "define batches");

    const refused = attempt(root, ["batch", "start", parent, "--agent", "codex"]);
    expect(refused.status).not.toBe(0);
    expect(refused.stdout).toContain("groups other batches and is not run directly");
    expect(refused.stdout).toContain(leaf);
  });

  test("closes only when every child batch and every contract underneath is done", () => {
    const root = repository("close");
    const work = contract(root, "Only work");
    const leaf = batch(root, "Leaf");
    const parent = batch(root, "Parent");
    run(root, ["batch", "add", leaf, work.id]);
    run(root, ["batch", "add", parent, leaf]);
    git(root, "add", ".");
    git(root, "commit", "-m", "compose the tree");
    run(root, ["contract", "cancel", work.id, "--resolution", "cancelled", "--reason", "Retired to finish the leaf", "--approve"]);

    // The contract is done, so the leaf completed itself; the parent still waits on nothing else.
    const openChild = attempt(root, ["batch", "close", parent, "--approve"]);
    if (openChild.status !== 0) expect(openChild.stdout).toContain("child batch");

    run(root, ["batch", "close", leaf, "--approve"]);
    expect(run(root, ["batch", "close", parent, "--approve"])).toMatchObject({ ok: true, data: { status: "done" } });
  });

  test("removing a child returns it to a root with its own members intact", () => {
    const root = repository("remove");
    const work = contract(root, "Only work");
    const leaf = batch(root, "Leaf");
    const parent = batch(root, "Parent");
    run(root, ["batch", "add", leaf, work.id]);
    run(root, ["batch", "add", parent, leaf]);

    expect(run(root, ["batch", "remove", parent, leaf])).toMatchObject({ ok: true, data: { batches: [] } });
    expect(run(root, ["batch", "status", leaf]) as { data: { contracts: unknown[] } }).toMatchObject({ data: { contracts: [{ id: work.id }] } });
    // Freed from its parent, it may be grouped again — the one-parent rule was the only obstacle.
    expect(run(root, ["batch", "add", parent, leaf])).toMatchObject({ ok: true, data: { batches: [leaf] } });
  });

  test("kotta validate reports a hand-made cycle", () => {
    const root = repository("validate");
    const work = contract(root, "Only work");
    const first = batch(root, "First");
    const second = batch(root, "Second");
    run(root, ["batch", "add", first, work.id]);
    run(root, ["batch", "add", first, second]);

    // Written by hand, which is exactly the state `kotta validate` exists to catch.
    const secondPath = join(root, ".kotta/process/batches/backlog", `second-${second.slice(-8)}.md`);
    writeFileSync(secondPath, readFileSync(secondPath, "utf8").replace("contracts: []", `contracts: []\nbatches:\n  - ${first}`));

    const report = attempt(root, ["validate"]);
    expect(report.status).not.toBe(0);
    expect(report.stdout).toContain("cyclic");
  });
});
