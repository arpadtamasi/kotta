---
id: BR-01m0f0wn89c50fe1mz5yn1nw85
form: business-rule
title: "Identifiers are permanent"
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Rule

An identifier, once minted, never changes - not in renames, not in migrations, not in vocabulary changes. New identifiers are minted coordination-free (time-sortable ULIDs) so concurrent branches cannot collide; identifiers created before that rule keep their sequential form forever.

Permanence is what makes an identifier unreadable, so it is never what a human is shown. Every rendering a human reads - a terminal result, a summary returned to a calling chat, a gate question, the board - names the entity it is about by its title. An identifier may accompany that title where the reader will type it back, and it may stand alone only where no title exists to name. A rendering that reports work without naming what the work was is the same failure in its weakest form: the reader is told something happened and not what.

## Rationale

Measured on 2026-08-26: eight of the nine sentences this tool returns to a calling chat name a bare identifier and no title, five of the six gate descriptions read `task.close T-01m0vqr...`, and every lifecycle command in the terminal prints `kotta task close completed.` - naming neither. The operator's requirement, in their words: unreadable identifiers should not appear on the surfaces, the chat included.

Links target identity. Retargeting identity is pure cost and pure risk: collision-freedom needs new mints only, and history keeps resolving as written (D-003, D-010).

## Scope

Every entity kind, every workspace, indefinitely. A workspace with both id shapes is the end state, not a transition. Human prose references entities by title; the id is the machine's and the CLI's.
