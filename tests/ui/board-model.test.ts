// The derivations behind the board's diagrams, as data: what each diagram asks Mermaid to draw,
// how a state machine is read from its Transitions section, and when it cannot be.
import { describe, expect, it } from "vitest";
import {
  byCapability, entityDiagram, entityGraph, entityMentions, mermaidLabel, narrativeSection, parseSource, parseStateMachine,
  parseTransitionLine, stateDiagram, stateGraph, titleStem, useCaseDiagram, useCaseGraph, type SpecNode,
} from "../../ui/src/model";
import { ARCHIVE, COSTS, EXPORT, GOAL, INVOICE, ORDER, PAYMENT, REVIEW, modelWorkspace } from "./model-fixture";

const spec = modelWorkspace.spec as SpecNode[];
const withoutCapabilities = spec.map(({ capability: _dropped, ...node }) => node as SpecNode);

describe("the use case diagram", () => {
  it("draws in UML terms: goals apart and dotted, use cases inside the system, actors on plain lines (BR-01m4gg8wd62m9h75yczmmzphs7)", () => {
    const { source, nodes } = useCaseDiagram(spec);
    expect(source.split("\n")[0]).toBe("flowchart LR");
    expect(source).toContain('subgraph goals["Goals"]');
    expect(source).toContain('subgraph system["System"]');
    const short = (id: string) => [...nodes].find(([, node]) => node === id)![0];
    expect(source).toContain(`${short(EXPORT)} --- A0`);
    expect(source).toContain(`${short(GOAL)} -.- ${short(EXPORT)}`);
    expect(source).toContain(`${short(COSTS)} -.- ${short(REVIEW)}`);
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

  it("draws «include» and «extend» as labelled dotted links, and keeps the capability out of the boundary", () => {
    const included = spec.map((node) => node.id === EXPORT ? { ...node, edges: { ...node.edges, includes: [REVIEW] } } : node.id === ARCHIVE ? { ...node, edges: { ...node.edges, extends: [EXPORT] } } : node);
    const { source, nodes } = useCaseDiagram(included);
    const short = (id: string) => [...nodes].find(([, node]) => node === id)![0];
    expect(source).toContain(`${short(EXPORT)} -.->|"«include»"| ${short(REVIEW)}`);
    expect(source).toContain(`${short(ARCHIVE)} -.->|"«extend»"| ${short(EXPORT)}`);
    expect(source).not.toContain("subgraph cap");
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
    const source = stateDiagram({ drawable: true, terminal: [], prose: [], conditions: [], transitions: [{ from: "a", to: "b", why: "x: y; #z \"q\"" }] });
    expect(source).toContain("S0 --> S1 : x y z q");
  });
});

// BR-01m414skt0pcqb668azj7czkeq, proven by EX-01m414smebtmh18j4jxxsbabhh.
describe("a state machine written as one paragraph", () => {
  const sections = {
    states: "backlog - defined - active - done.",
    transitions: "backlog -> defined: validate - the batch becomes defined. Validation refuses otherwise. "
      + "defined -> active: start creates the branch. last member terminal -> done: automatic, whether or not it was started.",
  };
  it("reads each transition the paragraph holds, cut where a sentence ends and the next begins with A -> B:", () => {
    const machine = parseStateMachine(sections);
    expect(machine.transitions.map(({ from, to }) => `${from}>${to}`)).toEqual(["backlog>defined", "defined>active", "last member terminal>done"]);
    expect(machine.transitions[0].why).toBe("validate - the batch becomes defined. Validation refuses otherwise.");
    expect(machine.prose).toEqual([]);
  });
  it("calls an end the States section does not name a condition, not a state", () => {
    expect(parseStateMachine(sections).conditions).toEqual(["last member terminal"]);
    const graph = stateGraph(parseStateMachine(sections));
    expect(graph.nodes.find((node) => node.id === "state:last member terminal")).toMatchObject({ shape: "condition", label: "when last member terminal" });
    expect(parseStateMachine({ transitions: sections.transitions }).conditions).toEqual([]);
  });
});

// BR-01m414skfbftb3zv6z2f1tzzsq: what the board's own renderer draws.
describe("the graphs the drawn renderer lays out", () => {
  it("draws entities top-down, and two entities that name each other with one two-headed edge", () => {
    expect(entityGraph(spec)).toMatchObject({ direction: "DOWN", groups: [], edges: [{ from: ORDER, to: PAYMENT, both: false }, { from: INVOICE, to: ORDER, both: false }] });
    const mutual = spec.map((node) => (node.id === PAYMENT ? { ...node, sections: { ...node.sections, meaning: "Settles an order." } } : node));
    expect(entityGraph(mutual).edges.filter((edge) => edge.both)).toHaveLength(1);
    const grouped = spec.map((node) => (node.id === ORDER ? { ...node, capability: "commerce" } : node));
    expect(entityGraph(grouped).groups.map((group) => group.label)).toEqual(["commerce", "no capability"]);
  });
  it("draws goals first and dotted, use cases inside the system boundary, actors on plain lines, include and extend as open arrows", () => {
    const included = withoutCapabilities.map((node) => node.id === ARCHIVE ? { ...node, edges: { ...node.edges, extends: [EXPORT] } } : node);
    const graph = useCaseGraph(included);
    expect(graph.direction).toBe("RIGHT");
    expect(graph.groups).toEqual([{ id: "system", label: "System", boundary: true }]);
    expect(graph.nodes.filter((node) => node.shape === "use-case").every((node) => node.group === "system")).toBe(true);
    expect(graph.nodes.filter((node) => node.shape !== "use-case").every((node) => !node.group)).toBe(true);
    expect(graph.nodes[0].shape).toBe("goal");
    expect(graph.edges.find((edge) => edge.from === GOAL && edge.to === EXPORT)).toMatchObject({ dotted: true });
    expect(graph.edges.find((edge) => edge.from === EXPORT && edge.plain)).toBeTruthy();
    expect(graph.edges.find((edge) => edge.from === ARCHIVE && edge.to === EXPORT)).toMatchObject({ dashed: true, open: true, label: "«extend»" });
    expect(graph.nodes.every((node) => node.opens === node.id)).toBe(true);
  });
  it("draws a machine's start, its states, its transitions labelled by their reason, and its end", () => {
    const graph = stateGraph(parseStateMachine(spec.find((node) => node.title === "Order lifecycle")!.sections));
    expect(graph.nodes.map((node) => node.shape)).toEqual(["start", "state", "state", "state", "state", "state", "end"]);
    expect(graph.nodes.find((node) => node.label === "closed")).toMatchObject({ terminal: true });
    expect(graph.edges[0]).toMatchObject({ from: "start", to: "state:draft", label: "the customer starts" });
    expect(graph.edges.at(-1)).toMatchObject({ from: "state:closed", to: "end" });
  });
});

describe("a node's sources", () => {
  it("fetches only a change folder's Markdown narrative, and cites the section it names", () => {
    expect(parseSource(".kotta/changes/checkout/conversation.md · Accounting")).toEqual({ file: ".kotta/changes/checkout/conversation.md", section: "Accounting", narrative: true });
    expect(parseSource("proposal.md · Why").narrative).toBe(false);
    expect(parseSource(".kotta/changes/../secret.md").narrative).toBe(false);
    expect(parseSource("openspec/specs/x/spec.md").narrative).toBe(false);
  });

  it("reads a `#` anchor as the cited section, as `kotta narrative` suggests", () => {
    expect(parseSource(".kotta/changes/checkout/conversation.md#J2")).toEqual({ file: ".kotta/changes/checkout/conversation.md", section: "J2", narrative: true });
    expect(narrativeSection("## Javaslatok\n\n### J1 · 10:04\n\nigen\n\n### J2 · 10:09\n\n> mehet\n", "J2")).toBe("### J2 · 10:09\n\n> mehet");
  });

  it("finds the cited section down to the next heading at its level", () => {
    const text = "# T\n\n## Accounting\n\nyes\n\n### Detail\n\nalso\n\n## Other\n\nno\n";
    expect(narrativeSection(text, "accounting")).toBe("## Accounting\n\nyes\n\n### Detail\n\nalso");
    expect(narrativeSection(text, "missing")).toBeNull();
    expect(narrativeSection(text, null)).toBeNull();
  });
});
