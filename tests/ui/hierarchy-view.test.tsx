// @vitest-environment jsdom
//
// The hierarchy view (BR-01m4ee23zg0wx6hyvpkyj9qcr1): overall requirements on top, each actor's use
// cases with the requirements they refine, the unplaced apart, and one use case marked as dropped
// showing what falls out with it and what stays (EX-01m4ee25ey0g2x0bmj6v6rzrpq).
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { readBoard } from "../../ui/src/App";
import { TreeView } from "../../ui/src/Tree";
import { dropMarks, readHierarchy } from "../../ui/src/model";
import { node, workspace } from "./fixtures";

afterEach(cleanup);

const id = (prefix: string, n: number) => `${prefix}-01m4ee000000000000000000${String(n).padStart(2, "0")}`;
const [STUDENT, TEACHER, ADMIN] = [id("A", 1), id("A", 2), id("A", 3)];
const ASKS = id("UC", 1);
const TEST_CHAT = id("UC", 2);
const UPLOAD = id("UC", 3);
const PROCESS = id("UC", 4);
const SEARCHABLE = id("UC", 5);
const IMAGE_MODE = id("UC", 6);
const CITATION = id("BR", 1);
const OWN_CHAT = id("BR", 2);
const READS_ONLY = id("BR", 3);
const NO_SECRETS = id("BR", 4);
const SLUG = id("BR", 5);

const fillers = Array.from({ length: 7 }, (_, index) => node(id("UC", 10 + index), "use-case", `Admin task ${index + 1}`, { edges: { actor: [ADMIN] } }));

const spec = [
  node(STUDENT, "actor", "Student"),
  node(TEACHER, "actor", "Teacher"),
  node(ADMIN, "actor", "Administrator"),
  node(ASKS, "use-case", "A student asks and gets a cited answer", { level: "user-goal", edges: { actor: [STUDENT], refines: [CITATION] } }),
  node(TEST_CHAT, "use-case", "The teacher tries the course chat", { level: "user-goal", edges: { actor: [TEACHER], refines: [OWN_CHAT, CITATION] } }),
  node(UPLOAD, "use-case", "A teacher uploads a material and it becomes searchable", { level: "user-goal", edges: { actor: [TEACHER], includes: [PROCESS, SEARCHABLE] } }),
  node(PROCESS, "use-case", "The system processes the material", { level: "subfunction" }),
  node(SEARCHABLE, "use-case", "The material becomes searchable", { level: "subfunction" }),
  node(IMAGE_MODE, "use-case", "Choosing the image mode", { edges: { extends: [UPLOAD] } }),
  ...fillers,
  node(CITATION, "business-rule", "Citation to the place"),
  node(OWN_CHAT, "business-rule", "Own test chat"),
  node(READS_ONLY, "business-rule", "The browser only reads", { overall: true }),
  node(NO_SECRETS, "business-rule", "No secret reaches the model", { overall: true }),
  node(SLUG, "business-rule", "Slug format"),
];

describe("the hierarchy view", () => {
  it("reads overall on top, actors with nested use cases, and the unplaced apart", () => {
    const hierarchy = readHierarchy(spec);
    expect(spec.filter((entry) => entry.form === "use-case")).toHaveLength(13);
    expect(hierarchy.overall.map((entry) => entry.title)).toEqual(["No secret reaches the model", "The browser only reads"]);
    expect(hierarchy.actors.map((entry) => entry.actor?.title)).toEqual(["Administrator", "Student", "Teacher"]);
    expect(hierarchy.children.get(UPLOAD)).toEqual([{ id: PROCESS, how: "includes" }, { id: SEARCHABLE, how: "includes" }, { id: IMAGE_MODE, how: "extends" }]);
    // EX-01m4ee24q2jttknm7v1bxrtfn0: asked from the rule's side, both use cases refine it.
    expect(hierarchy.refiners.get(CITATION)).toEqual([ASKS, TEST_CHAT]);
    expect(hierarchy.unplaced.map((entry) => entry.title)).toEqual(["Slug format"]);
  });

  it("marks what falls out with a dropped use case and what stays", () => {
    const hierarchy = readHierarchy(spec);
    const marks = dropMarks(spec, hierarchy, TEST_CHAT);
    expect(marks.get(OWN_CHAT)).toBe("out");
    expect(marks.get(CITATION)).toBe("stays");
    // EX-01m4ee24wn2str3e4x5bw102cn: an overall requirement never falls out.
    for (const useCase of spec.filter((entry) => entry.form === "use-case")) {
      expect(dropMarks(spec, hierarchy, useCase.id).get(READS_ONLY)).toBeUndefined();
    }
  });

  it("draws the tree arranged by actor, with the drop highlight a simulation (EX-01m4ee25ey0g2x0bmj6v6rzrpq)", () => {
    const { container } = render(<TreeView board={readBoard(workspace({ spec }))} onOpen={() => {}} arrangement="actor" />);
    const heads = [...container.querySelectorAll(".spec-group__head")].map((head) => head.textContent);
    expect(heads[0]).toMatch(/^Holds for the whole product/);
    expect(heads.at(-1)).toMatch(/^No place yet/);
    expect(screen.getAllByText("«includes»")).toHaveLength(2);
    expect(screen.getAllByText("«extends»")).toHaveLength(1);

    const teacherChat = screen.getByText("The teacher tries the course chat").closest("summary")!;
    fireEvent.click(within(teacherChat).getByText("Simulate dropping it"));
    const status = screen.getByRole("status").textContent ?? "";
    expect(status).toContain("Simulation — nothing in the specification changes.");
    expect(status).toContain("1 requirement would fall out, 1 would stay");
    expect(container.querySelector(".tree-req--out")?.textContent).toContain("Own test chat");
    expect([...container.querySelectorAll(".tree-req--stays")].some((row) => row.textContent?.includes("Citation to the place"))).toBe(true);
  });
});
