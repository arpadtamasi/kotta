import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { readChanges, readNarrative } from "../../src/commands/ui.js";
import { dropImpact } from "../../src/spec/hierarchy.js";
import type { SpecNode } from "../../src/spec/registry.js";
import { planningWorkspace, write } from "./planning-fixture.js";

/**
 * What the board reads when the files are not where a node says: an archived change's citation
 * (BR-01m4gmdmhz5zs80j07660yjaeq), an unreadable file in a change (BR-01m4gmdmy4keq12tj73ahtskx0),
 * and the order a dropped use case's requirements are listed in (BR-01m4gmdmr2h33x4cr7t217yr9t).
 */
describe("the board reads what the nodes cite", () => {
  test("a source in an archived change opens, and says it is archived (EX-01m4gmdnf1ntar1hs65r743t0b)", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-archived-source-"));
    write(root, ".kotta/config.yaml", "version: 6\n");
    write(root, ".kotta/changes/archive/2026-10-08-web-push/proposal.md", "# Older\n");
    write(root, ".kotta/changes/archive/2026-10-09-web-push/proposal.md", "# Web push\n\n## What changes\n\n- Notifications reach only devices that opted in.\n");
    const read = readNarrative(root, ".kotta/changes/web-push/proposal.md");
    expect(read.archived).toBe("2026-10-09-web-push");
    expect(read.content).toContain("Notifications reach only devices that opted in.");
    // An open change of that name wins.
    write(root, ".kotta/changes/web-push/proposal.md", "# Web push again\n");
    expect(readNarrative(root, ".kotta/changes/web-push/proposal.md")).toEqual({ path: ".kotta/changes/web-push/proposal.md", content: "# Web push again\n" });
    // Neither open nor archived: a broken citation that says what closes it.
    expect(() => readNarrative(root, ".kotta/changes/never/proposal.md")).toThrow(/neither open nor archived.*Correct the source in the node's provenance, in a change/);
  });

  test("a change with an unreadable node names the file and why (EX-01m4gmdp0mehp38zeye60apv59)", () => {
    const root = planningWorkspace("board-unreadable", null);
    write(root, ".kotta/changes/add-pause/model/business-rules/bad-00000bad.md", "---\nid: [unclosed\n---\n# Bad\n");
    const change = readChanges(root, new Set()).find((entry) => entry.name === "add-pause")!;
    expect(change.unreadable.map((file) => file.path)).toContain(".kotta/changes/add-pause/model/business-rules/bad-00000bad.md");
    expect(change.unreadable[0].reason).toMatch(/unreadable frontmatter/);
    expect(change.nodes.length).toBeGreaterThan(0);
  });

  test("what falls out with a dropped use case is listed in the order it names its requirements (EX-01m4gmdnmh5q4860ep2aff9evc)", () => {
    const node = (id: string, form: string, data: Record<string, unknown> = {}): SpecNode => ({ id, form, path: id, data: { title: id, ...data } });
    const nodes = [
      node("UC-1", "use-case", { refines: ["BR-z", "BR-a", "BR-m"] }),
      node("BR-a", "business-rule"), node("BR-m", "business-rule"), node("BR-z", "business-rule"),
    ];
    expect(dropImpact(nodes, "UC-1").out).toEqual(["BR-z", "BR-a", "BR-m"]);
  });
});
