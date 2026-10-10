---
id: QA-01m4gmdm6r7t4ajnxa3515ccvd
form: quality-attribute
title: "The hierarchy can be found around in"
capability: technical-model
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/bejarhato-hierarchia/conversation.md · SZ1"
    - "chat · rp, 2026-10-09, answers to structured questions: „Igen, így” (the measures as proposed) and „Igen, egyben” (the design critic's other findings in the same change)"
  quote: "rp, 2026-10-09: „alig navigálható a hierarchia... nekem”"
  inferred: "2026-10-09 (termek-elobb): the gaps become a count in the process line and the drop control moves into the row of tools, to fit *The board tells the product before the process*; the agent's. The operator said the hierarchy is barely navigable and accepted the measures the agent proposed. After two critics the agent added reaching a requirement, the phone width, the outline from anywhere, closed goals, the drop in the outline and the arrangement by actor; these additions and the wording are the agent's, put to the operator at the gate."
---
# The hierarchy can be found around in

## Source

A human reading a specification of a few hundred nodes on the board.

## Stimulus

Opening the hierarchy and looking for one goal, one use case or one requirement.

## Environment

A desktop browser at 1312 × 735 CSS pixels, and a phone at 390 pixels wide, on a model with many goals, many overall requirements and gaps in its structure.

## Artifact

The hierarchy view of `kotta ui`.

## Response

The hierarchy SHALL show an outline of its top level — every goal, nested ones under the goal they serve, or every actor in the arrangement by actor — that leads to each, and the outline SHALL stay one action away from anywhere in the view. The gaps in the structure SHALL be a count in the view's process line until the reader opens them; opened, they say all that *The tree names the gaps in its structure* requires. The requirements that hold for the whole product and those with no place SHALL start closed, showing only how many there are. Goals SHALL start closed, showing how many use cases serve them; a goal reached from the outline opens; the view SHALL offer to open and to close them all. Simulating a drop SHALL be one control in the view's row of tools, where a use case is chosen, not a control on every row; while a drop is simulated, the outline SHALL show for each goal how many of its requirements fall out, and those goals SHALL open. The outline, the closed gaps and the drop control SHALL sit in the page's flow, never in its fixed part.

## Measure

At 1312 × 735, the start of the outline is on the first screen; the closed gaps are a count in the process line; from anywhere in the view any goal is reached in at most two actions and any requirement in at most three (a click, a key, or a search over titles and text). Goals, the whole-product requirements and those with no place start closed with their count. At 390 pixels wide the outline is reached in one action from anywhere in the view and the tree needs no sideways scrolling. No row of the tree carries a drop control. Checked by the board's browser suite on the intimity fixture and on a fixture whose goals are nested by serves.

