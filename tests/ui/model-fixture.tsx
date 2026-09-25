// A fifteen-odd node workspace that every diagram view has something to draw from: two actors,
// two goals, three use cases in two capabilities and one without, four stories, three entities
// whose prose names one another, one state machine written as transitions and one written as prose.
import { node, workspace } from "./fixtures";

export const ACTOR = "A-01m0f0wn89ewnpex9n4tq0s0rg";
export const REVIEWER = "A-01m0f0wn89ewnpex9n4tq0s0r2";
export const GOAL = "G-01m0f0wn89bsqrswjac57sdzez";
export const COSTS = "G-01m0f0wn89bsqrswjac57sdze2";
export const EXPORT = "UC-01m0fpqfxjvet99wbz0v1ag64q";
export const REVIEW = "UC-01m0fpqfxjvet99wbz0v1ag642";
export const ARCHIVE = "UC-01m0fpqfxjvet99wbz0v1ag643";
export const STORY = "US-01m0ggd2pyczw6k9206zregq59";
export const ORDER = "E-01m0f0wn89mpzqng8411pkartq";
export const PAYMENT = "E-01m0f0wn89mpzqng8411pkart2";
export const INVOICE = "E-01m0f0wn89mpzqng8411pkart3";
export const ORDER_MACHINE = "SM-01m0f0wn89m2xwd4z4mk9p71d5";
export const PAYMENT_MACHINE = "SM-01m0f0wn89m2xwd4z4mk9p71d2";
export const CONVERSATION = "openspec/changes/checkout/conversation.md";

export const modelWorkspace = workspace({
  spec: [
    node(ACTOR, "actor", "Operator", { provenance: { level: "stated", decided_by: "human", sources: [] } }),
    node(REVIEWER, "actor", "Reviewer"),
    node(GOAL, "goal", "Work is accounted for", {
      provenance: {
        level: "partly-inferred", decided_by: "agent-proposed-human-approved",
        sources: [`${CONVERSATION} · Accounting`, "proposal.md · Why"], quote: "Anna, 10:02: every hour has an owner", inferred: "the monthly cadence",
      },
    }),
    node(COSTS, "goal", "Costs \"stay\" visible (monthly) [ops]", {
      provenance: { level: "inferred", decided_by: "agent-decided", sources: [], inferred: "the whole goal" },
    }),
    node(EXPORT, "use-case", "Export a report", { edges: { actor: [ACTOR], goal: [GOAL] }, capability: "reporting/export" }),
    node(REVIEW, "use-case", "Review a change", {
      edges: { actor: [REVIEWER], goal: [COSTS] }, capability: "review",
      provenance: { level: "inferred", decided_by: "agent-decided", sources: [] },
    }),
    node(ARCHIVE, "use-case", "Archive the month", { edges: { actor: [ACTOR], goal: [GOAL] } }),
    node(STORY, "user-story", "See every open hour", { edges: { actor: [ACTOR] }, sections: { story: "As an operator I want every open hour listed.", value: "Nothing slips.", notes: "" } }),
    node("US-01m0ggd2pyczw6k9206zregq52", "user-story", "Download the report", { edges: { actor: [ACTOR] }, sections: { story: "As an operator I want a file.", value: "It travels." } }),
    node("US-01m0ggd2pyczw6k9206zregq53", "user-story", "Comment on a change", {
      edges: { actor: [REVIEWER] }, sections: { story: "As a reviewer I comment.", value: "Faster review." },
      provenance: { level: "partly-inferred", decided_by: "agent-decided", sources: [] },
    }),
    node("US-01m0ggd2pyczw6k9206zregq54", "user-story", "Nobody's story", { sections: { story: "Unowned.", value: "None yet." } }),
    node(ORDER, "entity", "Order", { sections: { meaning: "What a customer asked for; settled by payments.", identity: "O-", attributes: "lines, total", invariants: "Total is the sum of lines." } }),
    node(PAYMENT, "entity", "Payment", { sections: { meaning: "Money received.", identity: "P-", attributes: "amount", invariants: "Never negative." } }),
    node(INVOICE, "entity", "Invoice", { sections: { meaning: "The bill for one order.", identity: "I-", attributes: "number", invariants: "One per order." } }),
    node(ORDER_MACHINE, "state-machine", "Order lifecycle", {
      edges: { entity: [ORDER] },
      sections: {
        "governed lifecycle": "How an order moves.",
        states: "draft, held, placed, paid. closed is terminal.",
        transitions: [
          "- **(none) → draft**: the customer starts",
          "- **draft | held → placed**: submitted",
          "placed -> paid: payment captured",
          "- paid → closed: settled",
          "Nothing else moves an order.",
        ].join("\n"),
      },
    }),
    node(PAYMENT_MACHINE, "state-machine", "Payment lifecycle", {
      edges: { entity: [PAYMENT] },
      sections: {
        "governed lifecycle": "How a payment moves.", states: "pending, captured, refunded.",
        transitions: "pending -> captured: the bank answers - and later captured -> refunded when the customer asks.",
      },
    }),
  ],
});
