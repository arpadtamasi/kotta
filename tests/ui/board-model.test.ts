// The derivations behind the board's diagrams, as data: what each diagram asks Mermaid to draw,
// how a state machine is read from its Transitions section, and when it cannot be.
import { describe, expect, it } from "vitest";
import {
  byCapability, entityDiagram, entityMentions, mermaidLabel, narrativeSection, parseSource, parseStateMachine,
  parseTransitionLine, stateDiagram, titleStem, useCaseDiagram, type SpecNode,
} from "../../ui/src/model";
import { ARCHIVE, COSTS, EXPORT, GOAL, INVOICE, ORDER, PAYMENT, REVIEW, modelWorkspace } from "./model-fixture";

const spec = modelWorkspace.spec as SpecNode[];
const withoutCapabilities = spec.map(({ capability: _dropped, ...node }) => node as SpecNode);

describe("the use case diagram", () => {
  it("draws actors, use cases and goals in three groups, solid to a use case, dashed to a goal", () => {
    const { source, nodes } = useCaseDiagram(spec);
    expect(source.split("\n")[0]).toBe("flowchart LR");
    expect(source).toContain('subgraph actors["Actors"]');
    expect(source).toContain('subgraph goals["Goals"]');
    const short = (id: string) => [...nodes].find(([, node]) => node === id)![0];
    expect(source).toContain(`A0 --> ${short(EXPORT)}`);
    expect(source).toContain(`${short(EXPORT)} -.-> ${short(GOAL)}`);
    expect(source).toContain(`${short(REVIEW)} -.-> ${short(COSTS)}`);
    expect(nodes.size).toBe(7);
  });

  it("escapes quotes, parentheses and brackets so a title is only ever a label", () => {
    const { source } = useCaseDiagram(spec);
    expect(source).toContain('{{"Costs #quot;stay#quot; visible #40;monthly#41; #91;ops#93;"}}');
    expect(mermaidLabel('a "b" (c) [d] {e} <f> |g| #h `i` $$j$$')).toBe('"a #quot;b#quot; #40;c#41; #91;d#93; #123;e#125; #lt;f#gt; #124;g#124; #35;h #96;i#96; #36;#36;j#36;#36;"');
    expect(mermaidLabel("two\nlines")).toBe('"two lines"');
  });

  it("marks each level with its class, and leaves a node without provenance unclassed", () => {
    const { source, nodes } = useCaseDiagram(spec);
    const short = (id: string) => [...nodes].find(([, node]) => node === id)![0];
    expect(source).toContain("classDef partly stroke:#a35f00,stroke-width:2px,stroke-dasharray:6 4");
    expect(source).toContain("classDef inferred stroke:#ae1800,stroke-width:2px,stroke-dasharray:6 4");
    expect(source).toContain(`class ${short(GOAL)} partly`);
    expect(source).toMatch(new RegExp(`class [^\\n]*${short(REVIEW)}[^\\n]* inferred`));
    expect(source).not.toMatch(new RegExp(`class [^\\n]*\\b${short(ARCHIVE)}\\b`));
  });

  it("groups use cases by capability when nodes carry one, and draws one group otherwise", () => {
    const grouped = useCaseDiagram(spec).source;
    expect(grouped).toContain('subgraph cap0["reporting/export"]');
    expect(grouped).toContain('subgraph cap1["review"]');
    expect(grouped).toContain('subgraph cap2["no capability"]');
    expect(useCaseDiagram(withoutCapabilities).source).not.toContain("subgraph cap");
    expect(byCapability(withoutCapabilities)).toHaveLength(1);
  });
});

describe("the entity map", () => {
  it("draws an edge where one entity's prose names another's title stem, and no other", () => {
    expect(titleStem("Payments")).toBe("payment");
    expect(titleStem("Class")).toBe("class");
    expect(entityMentions(spec)).toEqual([{ from: ORDER, to: PAYMENT }, { from: INVOICE, to: ORDER }]);
    expect(entityDiagram(spec).source).not.toContain("subgraph");
    const grouped = spec.map((node) => (node.id === ORDER ? { ...node, capability: "commerce" } : node));
    expect(entityDiagram(grouped).source).toContain('subgraph cap0["commerce"]');
  });
});

describe("a state machine", () => {
  it("reads bold, listed and plain transition lines, alternatives, the start and the terminal state", () => {
    const machine = parseStateMachine(spec.find((node) => node.title === "Order lifecycle")!.sections);
    expect(machine.drawable).toBe(true);
    expect(machine.transitions).toEqual([
      { from: null, to: "draft", why: "the customer starts" },
      { from: "draft", to: "placed", why: "submitted" },
      { from: "held", to: "placed", why: "submitted" },
      { from: "placed", to: "paid", why: "payment captured" },
      { from: "paid", to: "closed", why: "settled" },
    ]);
    expect(machine.terminal).toEqual(["closed"]);
    expect(machine.prose).toEqual(["Nothing else moves an order."]);
    const source = stateDiagram(machine);
    expect(source.split("\n").slice(0, 2)).toEqual(["stateDiagram-v2", "  direction LR"]);
    expect(source).toContain('state "draft" as S0');
    expect(source).toContain("[*] --> S0 : the customer starts");
    expect(source).toMatch(/S\d --> \[\*\]$/);
  });

  it("is not drawable when its transitions are prose, and says nothing it did not read", () => {
    const machine = parseStateMachine(spec.find((node) => node.title === "Payment lifecycle")!.sections);
    expect(machine).toMatchObject({ drawable: false, transitions: [], terminal: [] });
    expect(machine.prose).toHaveLength(1);
    expect(parseStateMachine({})).toMatchObject({ drawable: false, prose: [] });
  });

  it("splits sources and targets on | and /, and knows a sentence from a transition", () => {
    expect(parseTransitionLine("a / b → c | d: why")).toHaveLength(4);
    expect(parseTransitionLine("(none) -> new")).toEqual([{ from: null, to: "new", why: "" }]);
    expect(parseTransitionLine("This is a sentence. And then x -> y: z")).toBeNull();
    expect(parseTransitionLine("Plain text with no arrow.")).toBeNull();
  });

  it("keeps a transition label inside Mermaid's grammar", () => {
    const source = stateDiagram({ drawable: true, terminal: [], prose: [], transitions: [{ from: "a", to: "b", why: "x: y; #z \"q\"" }] });
    expect(source).toContain("S0 --> S1 : x y z q");
  });
});

describe("a node's sources", () => {
  it("fetches only a change folder's Markdown narrative, and cites the section it names", () => {
    expect(parseSource("openspec/changes/checkout/conversation.md · Accounting")).toEqual({ file: "openspec/changes/checkout/conversation.md", section: "Accounting", narrative: true });
    expect(parseSource("proposal.md · Why").narrative).toBe(false);
    expect(parseSource("openspec/changes/../secret.md").narrative).toBe(false);
    expect(parseSource("openspec/specs/x/spec.md").narrative).toBe(false);
  });

  it("reads a `#` anchor as the cited section, as `kotta narrative` suggests", () => {
    expect(parseSource("openspec/changes/checkout/conversation.md#J2")).toEqual({ file: "openspec/changes/checkout/conversation.md", section: "J2", narrative: true });
    expect(narrativeSection("## Javaslatok\n\n### J1 · 10:04\n\nigen\n\n### J2 · 10:09\n\n> mehet\n", "J2")).toBe("### J2 · 10:09\n\n> mehet");
  });

  it("finds the cited section down to the next heading at its level", () => {
    const text = "# T\n\n## Accounting\n\nyes\n\n### Detail\n\nalso\n\n## Other\n\nno\n";
    expect(narrativeSection(text, "accounting")).toBe("## Accounting\n\nyes\n\n### Detail\n\nalso");
    expect(narrativeSection(text, "missing")).toBeNull();
    expect(narrativeSection(text, null)).toBeNull();
  });
});
