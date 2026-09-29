---
change: kod-a-kapu-utan
generated_at: 2026-09-28T07:30:39.639Z
delta_hash: sha256:b1f72769011ab20544295687c518f8ff5218748aee64054a759f3facdc1ae277
ready_for_approval: true
---

# Planning: kod-a-kapu-utan

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- Say when the code runs ahead of the spec (BR-n9q6hsr2) — business-rule, openspec/changes/kod-a-kapu-utan/model/business-rules/say-when-the-code-runs-ahead-of-the-spec-n9q6hsr2.md
- Code ahead of the model is named in one line (EX-rkb7tgy4) — example, openspec/changes/kod-a-kapu-utan/model/examples/code-ahead-of-the-model-is-named-in-one-line-rkb7tgy4.md
- Work that touches no promise says nothing about the spec (EX-587hhk1d) — example, openspec/changes/kod-a-kapu-utan/model/examples/work-that-touches-no-promise-says-nothing-about-the-spec-587hhk1d.md

Changed:
- Kotta owns its rules file, never the project's (BR-zq4x3ffh) — business-rule, openspec/changes/kod-a-kapu-utan/model/business-rules/kotta-owns-its-rules-file-never-the-projects-zq4x3ffh.md

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **The rules ship; the project file stays yours (EX-4dd2qamd)** — names the changed node in 'subjects' (references-changed; because of Kotta owns its rules file, never the project's (BR-zq4x3ffh)). Awaits judgement.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: the shipped `plan-change` skill said "implement, then `kotta archive`". Resolved in this change (task 1.3): the skill now names plan → gate → archive → implement as the natural order, and *Say when the code runs ahead of the spec* makes it a signal, not a barrier, as the operator asked on 2026-09-28.
- judged: *Kotta owns its rules file, never the project's* named only the project's `AGENTS.md`, while `init` and `sync` now also create or report its `CLAUDE.md`, and *What the tool enforces the spec states* asks that every enforced rule be written. Resolved in this change: the node is modified to promise the `CLAUDE.md` behaviour.
- judged: the example *The rules ship; the project file stays yours* (machine candidate 1) still holds: it concerns the rules file and the project's `AGENTS.md`, both unchanged by the modification; it says nothing about `CLAUDE.md`, whose cases the integration tests prove instead.
- judged: *A task executes accepted spec, and nothing else* and *The spec is the agreement* still speak of 0.x tasks and say execution waits for accepted spec; the new rule deliberately does not wait, it signals. They describe the removed process layer; outside this change, to retire in the next clean-up.
- judged: *Consequential transitions are human gates* — no contradiction: the gate stays the only one and still decides what the model accepts; the new rule gates no code.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

- openspec/changes/kod-a-kapu-utan/specs/planning-phase/spec.md:3 — requirement 'Jelezze, ha a kód elhagyja a specet' says “Az ügynök MAY egy change-et implementálni — `opsx:apply`-jal vagy kézzel — akkor is, ha a modell-deltája még nem ment át a kapun. Ha az általa írt kód olyan ígéretet tart, változtat vagy ejt, amelyet az elfogadott modell nem mond ki, az ügynök SHALL ezt egy sorban jelezni az embernek, az ígéretet közérthetően megnevezve, és SHALL felajánlani a tervezési fázist. SHALL NOT emiatt megállni, elutasítani vagy késleltetni a munkát. Ha a munka egyetlen ígéretet sem érint, a specről nem szól.”; Say when the code runs ahead of the spec (BR-n9q6hsr2, openspec/changes/kod-a-kapu-utan/model/business-rules/say-when-the-code-runs-ahead-of-the-spec-n9q6hsr2.md) says “An agent MAY implement a change — through the OpenSpec `opsx:apply` skill or by hand — whether or not its model delta has been through the gate. When the code it writes keeps, changes or drops a promise the accepted model does not state, the agent SHALL say so to the human in one line, naming the promise in plain words, and SHALL offer the planning phase (`plan-change`) to bring the model up to the code. It SHALL NOT stop, refuse or delay the work for this. When the work touches no promise — documentation, a pure refactor — it says nothing about the spec.”.

Reported, not repaired: the model is the accepted truth, and which side moves is a human's call.

## (f) Provenance

4 delta nodes: 0 stated, 4 partly-inferred, 0 inferred.
Decided by: 3 human, 0 agent-proposed-human-approved, 1 agent-decided.

What the machine decided alone:

- Kotta owns its rules file, never the project's (BR-zq4x3ffh) — The operator asked whether the instruction files should say Kotta must be used; that the project's CLAUDE.md follows the same create-when-absent, report-when-present policy as its AGENTS.md, and includes AGENTS.md rather than Kotta's rules directly, was supplied by the agent.

Conversation: none distilled for this change (`kotta narrative`).
