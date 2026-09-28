---
change: kod-a-kapu-utan
generated_at: 2026-09-28T07:13:26.905Z
delta_hash: sha256:b488582a200435e1ef3ca860f2f6d692781b720f112d67694987f1b4987ce33c
ready_for_approval: true
---

# Planning: kod-a-kapu-utan

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- Code follows the gate (BR-n9q6hsr2) — business-rule, openspec/changes/kod-a-kapu-utan/model/business-rules/code-follows-the-gate-n9q6hsr2.md
- A change that touches no promise says so and proceeds (EX-587hhk1d) — example, openspec/changes/kod-a-kapu-utan/model/examples/a-change-that-touches-no-promise-says-so-and-proceeds-587hhk1d.md
- An unapproved change is planned before it is applied (EX-rkb7tgy4) — example, openspec/changes/kod-a-kapu-utan/model/examples/an-unapproved-change-is-planned-before-it-is-applied-rkb7tgy4.md

Changed: none

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

No accepted node shares an edge with, is named by, or contrasts with the delta.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: *Code follows the gate* asks for the delta to be approved **and archived** before any task is implemented; the shipped `plan-change` skill says "After the yes there is no second gate: implement, then `kotta archive`". Not a node, but the two orders contradict; the archived changes so far went approve → archive → implement. Task 1.3 aligns the skill if the gate keeps "and archived".
- judged: *Kotta owns its rules file, never the project's* states the create-when-absent / report-when-present policy for the project's `AGENTS.md` only. The `CLAUDE.md` behaviour that `init` and `sync` now have rests on it by extension ("rules nobody reads are not installed") but no accepted node names `CLAUDE.md`, and *What the tool enforces the spec states* asks that every enforced rule be written. This delta leaves that node unchanged; reword it here or in a follow-up change.
- judged: *A task executes accepted spec, and nothing else* and *The spec is the agreement* still speak of 0.x tasks; the new rule says the 1.0 equivalent for changes. No contradiction in substance — both say execution waits for accepted spec — but the older two describe a process layer that no longer exists. Outside this change.
- judged: *Consequential transitions are human gates* — no contradiction: its gate stays the only one ("landing asks nothing again"), and its scope already exempts the shaping of a draft, which is what the planning phase the new rule requires is.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

- openspec/changes/kod-a-kapu-utan/specs/planning-phase/spec.md:3 — requirement 'A kód a kapu után jön' says “Az ügynök SHALL NOT egy change feladatait implementálni — sem `opsx:apply`-jal, sem kézzel —, amíg a change modell-deltáját az ember jóvá nem hagyta és a delta archiválva nincs. Az ügynök, akit egy jóvá nem hagyott change alkalmazására kérnek, SHALL előbb a tervezési fázist lefuttatni és a deltát az ember elé vinni, és SHALL kimondani, hogy ezt teszi. Egy change, amely egyetlen ígéretet sem érint, mehet tovább; az ügynök SHALL egy sorban kimondani, hogy ilyen.”; Code follows the gate (BR-n9q6hsr2, openspec/changes/kod-a-kapu-utan/model/business-rules/code-follows-the-gate-n9q6hsr2.md) says “An agent SHALL NOT implement a change's tasks — through the OpenSpec `opsx:apply` skill or by hand — before the change's model delta has been approved by the human and archived. An agent asked to apply a change whose delta is not yet approved and archived SHALL first run the planning phase (`plan-change`), put the delta to the human at the one gate, and say that this is what it is doing. A change that adds, changes and removes no accepted promise — documentation, a pure refactor — MAY proceed without a delta; the agent SHALL say so in one line before it does.”.

Reported, not repaired: the model is the accepted truth, and which side moves is a human's call.

## (f) Provenance

3 delta nodes: 2 stated, 1 partly-inferred, 0 inferred.
Decided by: 0 human, 0 agent-proposed-human-approved, 3 agent-decided.

What the machine decided alone:

- Code follows the gate (BR-n9q6hsr2) — The operator asked whether the instruction files should say Kotta must be used; the rule's wording — approved and archived before any task is implemented, the planning phase run first and said aloud, the one-line exception for a change that touches no promise — was supplied by the agent.
- A change that touches no promise says so and proceeds (EX-587hhk1d) — from “az ügynök egy sorban kimondja, hogy a change nem érint ígéretet, és implementál” (openspec/changes/kod-a-kapu-utan/specs/planning-phase/spec.md · Scenario: Ígéretet nem érintő change)
- An unapproved change is planned before it is applied (EX-rkb7tgy4) — from “nem ír kódot a feladataihoz, hanem megmondja, hogy előbb a tervezési fázis jön” (openspec/changes/kod-a-kapu-utan/specs/planning-phase/spec.md · Scenario: Jóvá nem hagyott change alkalmazása)

Conversation: none distilled for this change (`kotta narrative`).
