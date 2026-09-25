import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, test, vi } from "vitest";
import { NarrativeError, readNarrative, readProvenance, readWorkspace, uiCommand } from "../../src/commands/ui.js";

const cli = resolve("dist/cli/index.js");
const GOAL = "G-01m0c0000000000000000000g1";
const RULE = "BR-01m0c0000000000000000000b1";
const CONVERSATION = "openspec/changes/checkout/conversation.md";

/** A version-6 workspace with provenance on its nodes and a change folder carrying the narrative. */
function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "kotta-ui-narrative-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: root });
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  writeFileSync(join(root, ".kotta/spec/goals/paid-00000g1.md"), ["---", `id: ${GOAL}`, "form: goal", "title: Orders are paid", "capability: commerce/checkout",
    "provenance:", "  level: partly-inferred", "  decided_by: agent-proposed-human-approved", `  sources: ["${CONVERSATION} · Payment"]`, '  quote: "Anna, 10:02: nobody ships unpaid"', "  inferred: the target number",
    "---", "", "## Outcome", "Paid.", ""].join("\n"));
  writeFileSync(join(root, ".kotta/spec/business-rules/card-00000b1.md"), ["---", `id: ${RULE}`, "form: business-rule", "title: A card is charged once", `goal: [${GOAL}]`,
    "provenance:", "  level: guessed", "  decided_by: agent-decided", "---", "", "## Rule", "Once.", ""].join("\n"));
  mkdirSync(join(root, "openspec/changes/checkout"), { recursive: true });
  writeFileSync(join(root, CONVERSATION), "# Conversation\n\n## Payment\n\nAnna: nobody ships unpaid.\n");
  writeFileSync(join(root, "openspec/changes/checkout/notes.txt"), "not markdown");
  writeFileSync(join(root, "secret.md"), "outside the narrative folder");
  symlinkSync(join(root, "secret.md"), join(root, "openspec/changes/checkout/escape.md"));
  return root;
}

describe("provenance on the board", () => {
  test("carries the frontmatter block and the capability, and leaves an unknown level unmarked", () => {
    const workspace = readWorkspace(fixture());
    const goal = workspace.spec.find((node) => node.id === GOAL)!;
    expect(goal.capability).toBe("commerce/checkout");
    expect(goal.provenance).toEqual({
      level: "partly-inferred", decided_by: "agent-proposed-human-approved",
      sources: [`${CONVERSATION} · Payment`], quote: "Anna, 10:02: nobody ships unpaid", inferred: "the target number",
    });
    // Neither field is mistaken for an edge.
    expect(goal.edges).toEqual({});
    const rule = workspace.spec.find((node) => node.id === RULE)!;
    expect(rule.provenance).toEqual({ decided_by: "agent-decided", sources: [] });
    expect(rule.edges).toEqual({ goal: [GOAL] });
  });

  test("a node without provenance carries none", () => {
    expect(readProvenance(undefined)).toBeUndefined();
    expect(readProvenance("stated")).toBeUndefined();
    expect(readProvenance({})).toBeUndefined();
  });
});

describe("the narrative endpoint", () => {
  test("reads a Markdown file under openspec/ from the working tree", () => {
    const root = fixture();
    expect(readNarrative(root, CONVERSATION)).toEqual({ path: CONVERSATION, content: expect.stringContaining("## Payment") });
  });

  test.each([
    ["nothing", undefined],
    ["a parent segment", "openspec/../secret.md"],
    ["a leading parent segment", "../secret.md"],
    ["an absolute path", join(tmpdir(), "secret.md")],
    ["a path outside openspec/", ".kotta/config.yaml"],
    ["a backslash", "openspec\\..\\secret.md"],
    ["a NUL byte", "openspec/changes/checkout/conversation.md\0.md"],
    ["a non-Markdown file", "openspec/changes/checkout/notes.txt"],
    ["a link that leaves the folder", "openspec/changes/checkout/escape.md"],
    ["a dot segment", "openspec/./changes/checkout/conversation.md"],
  ])("refuses %s", (_label, path) => {
    const root = fixture();
    expect(() => readNarrative(root, path)).toThrow(NarrativeError);
    try { readNarrative(root, path); } catch (error) { expect((error as NarrativeError).status).toBe(400); }
  });

  test("answers 404 for a file that is not there", () => {
    try { readNarrative(fixture(), "openspec/changes/checkout/missing.md"); expect.unreachable(); }
    catch (error) { expect((error as NarrativeError).status).toBe(404); }
  });

  describe("over HTTP", () => {
    let server: Server | undefined;
    afterEach(async () => { await new Promise<void>((done) => (server ? server.close(() => done()) : done())); server = undefined; vi.restoreAllMocks(); });

    test("serves the file, refuses traversal however it is spelled, and stays read-only", async () => {
      vi.spyOn(process.stdout, "write").mockImplementation(() => true);
      server = await uiCommand({ workspace: fixture(), port: 0, host: "127.0.0.1", json: true, open: false });
      const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
      const get = (path: string) => fetch(`${base}/api/narrative?path=${path}`);

      const ok = await get(encodeURIComponent(CONVERSATION));
      expect(ok.status).toBe(200);
      expect((await ok.json() as { content: string }).content).toContain("nobody ships unpaid");
      for (const path of ["openspec/..%2Fsecret.md", "%2E%2E%2Fsecret.md", "openspec%2F%2E%2E%2Fsecret.md", encodeURIComponent("openspec/changes/checkout/escape.md")]) {
        const refused = await get(path);
        expect(refused.status, path).toBe(400);
        expect(await refused.text()).not.toContain("outside the narrative folder");
      }
      expect((await get(encodeURIComponent("openspec/changes/checkout/missing.md"))).status).toBe(404);
      expect((await fetch(`${base}/api/narrative?path=${encodeURIComponent(CONVERSATION)}`, { method: "POST" })).status).toBe(405);
    });
  });
});
