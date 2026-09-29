---
change: a-folyamatmotor-igeretei-kikerulnek
generated_at: 2026-09-26T19:17:26.813Z
delta_hash: sha256:9a4e7dfbbdfd863fd10f149845a54f71469fa61fda6d7ad0e2cdb8d2fe1d879a
ready_for_approval: true
---

# Planning: a-folyamatmotor-igeretei-kikerulnek

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- The accepted model promises only what a shipped command does (BR-wv0pwgc3) — business-rule, openspec/changes/a-folyamatmotor-igeretei-kikerulnek/model/business-rules/the-accepted-model-promises-only-what-a-shipped-command-does-wv0pwgc3.md
- A promise of a removed command leaves the model with it (EX-87pfzmgx) — example, openspec/changes/a-folyamatmotor-igeretei-kikerulnek/model/examples/a-promise-of-a-removed-command-leaves-the-model-with-it-87pfzmgx.md

Changed:
- Consequential transitions are human gates (BR-3y4d20a7) — business-rule, openspec/changes/a-folyamatmotor-igeretei-kikerulnek/model/business-rules/consequential-transitions-are-human-gates-3y4d20a7.md
- An approval leaves a receipt (EX-3wmn4brs) — example, openspec/changes/a-folyamatmotor-igeretei-kikerulnek/model/examples/an-approval-leaves-a-receipt-3wmn4brs.md
- An unanswered question refuses the approval by name (EX-q6vwzxb6) — example, openspec/changes/a-folyamatmotor-igeretei-kikerulnek/model/examples/an-unanswered-question-refuses-defining-by-name-6vwzxb6.md

Removed:
- One operation, one declaration (BR-3r8zb33j) — business-rule, .kotta/spec/business-rules/one-operation-one-declaration-r8zb33j.md
- A surface name without a declaration fails the build (EX-banbt8mz) — example, .kotta/spec/examples/a-surface-name-without-a-declaration-fails-nbt8mz.md
- Task lifecycle (SM-j6fjpv6j) — state-machine, .kotta/spec/state-machines/task-lifecycle-j6fjpv6j.md
- A captured task is drafted in place (EX-8v7387n3) — example, .kotta/spec/examples/a-captured-task-is-drafted-in-place-8v7387n3.md
- A declared check is run, not transcribed (BR-qc186ssy) — business-rule, .kotta/spec/business-rules/a-declared-check-is-run-not-transcribed-qc186ssy.md
- A failing declared check refuses the review (EX-rd5tk8f3) — example, .kotta/spec/examples/a-failing-declared-check-refuses-the-review-xrd5tk8f3.md
- A disposition asks what the specification should have said (BR-0p6c7a46) — business-rule, .kotta/spec/business-rules/a-disposition-asks-what-the-spec-should-have-said-p6c7a46.md
- A remedy that adds a capability amends the specification (EX-p8n22hjh) — example, .kotta/spec/examples/a-remedy-that-adds-a-capability-amends-the-spec-n22hjh.md
- Disposition (GT-n1nf1kkc) — glossary-term, .kotta/spec/glossary-terms/disposition-n1nf1kkc.md
- Observation lifecycle (SM-y9gwednb) — state-machine, .kotta/spec/state-machines/observation-lifecycle-y9gwednb.md
- An approval carries only the payload its action needs (BR-z8qwnpkj) — business-rule, .kotta/spec/business-rules/an-approval-carries-only-the-payload-its-action-needs-z8qwnpkj.md
- A retirement without its supersession never reaches the human (EX-9h722qk7) — example, .kotta/spec/examples/a-retirement-without-its-supersession-never-reaches-the-human-9h722qk7.md
- An approval is decided once, and its outcome is durable (BR-pjy6rky9) — business-rule, .kotta/spec/business-rules/an-approval-is-decided-once-and-its-outcome-is-durable-pjy6rky9.md
- A yes that could not be applied is recorded as a failure, not a transition (EX-b536e3j2) — example, .kotta/spec/examples/a-yes-that-could-not-be-applied-is-recorded-as-a-failure-not-a-transition-b536e3j2.md
- One entity carries one undecided approval (BR-0ns2qa6a) — business-rule, .kotta/spec/business-rules/one-entity-carries-one-undecided-approval-0ns2qa6a.md
- A second question about the same task is refused (EX-rw7akt6c) — example, .kotta/spec/examples/a-second-question-about-the-same-task-is-refused-rw7akt6c.md
- Retired work is not shown as delivered (EX-pefb13ed) — example, .kotta/spec/examples/retired-work-is-not-shown-as-delivered-fb13ed.md

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **Observation lifecycle (SM-y9gwednb)** — the accepted transition new → resolved goes with the removed node (transition-removed; because of Observation lifecycle (SM-y9gwednb)). Awaits judgement.
2. **Task lifecycle (SM-j6fjpv6j)** — the accepted transition backlog → defined goes with the removed node (transition-removed; because of Task lifecycle (SM-j6fjpv6j)). Awaits judgement.
3. **Task (E-13zjx3ye)** — names the changed node in 'used_by' (references-changed; because of Consequential transitions are human gates (BR-3y4d20a7)). Awaits judgement.
4. **An open question names the answer it waits for (BR-96gwsbry)** — is named by the changed node (referenced-by-changed; because of An unanswered question refuses the approval by name (EX-q6vwzxb6)). Awaits judgement.
5. **Approve a gate in conversation (UC-5vg5012n)** — is named by the changed node (referenced-by-changed; because of An approval leaves a receipt (EX-3wmn4brs)). Awaits judgement.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: Task lifecycle and Observation lifecycle take every accepted transition with them. Intended: no shipped command performs any of them since 1.0.0-alpha.1 (CHANGELOG, Removed — BREAKING).
- judged: Task (entity) names Consequential transitions are human gates in `used_by`, and the reworded rule no longer speaks of tasks. The edge is stale, not contradictory; the Task entity is a 0.x node kept by a structural admission and is outside this change.
- judged: An open question names the answer it waits for keeps an example through the rewording, but its Scope still says "what the defining gate and orientation read". The gate that reads it is now `kotta approve`; the rule's wording is stale, its promise holds (cited in `src/core/questions.ts`).
- judged: An approval leaves a receipt still names Approve a gate in conversation, a 0.x use case with a structural admission. Its intent - the human's yes relayed from chat - is the one gate's; kept as a subject.
- judged: A rendering never claims more than the result carries loses its task example (Retired work is not shown as delivered) but keeps its sentence about task resolutions and batch summaries. That clause promises nothing a shipped command renders; it is cited and stays for a follow-up.
- judged: The new rule (The accepted model promises only what a shipped command does) is not yet true of the model it lands in: the other 0.x nodes that `kotta gap` counts as admitted - use cases, the batch lifecycle, the Task and Observation entities and their kin - stay. This change removes only what `gap` refused; the rest needs its own change.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

5 delta nodes: 0 stated, 5 partly-inferred, 0 inferred.
Decided by: 0 human, 0 agent-proposed-human-approved, 5 agent-decided.

What the machine decided alone:

- Consequential transitions are human gates (BR-3y4d20a7) — The accepted rule named the 0.x gates (task close, cancel and reopen, batch close, observation resolution, decision creation), which the release removed; the agent restated the same rule for the one gate that remains, keeping its standard of a yes and its receipt.
- The accepted model promises only what a shipped command does (BR-wv0pwgc3) — That a removed behaviour's promises leave the model through a change rather than staying as admitted gaps was chosen by the agent from the evidence rule; the release itself only removed the code.
- A promise of a removed command leaves the model with it (EX-87pfzmgx) — The scenario is this change itself, generalised by the agent.
- An approval leaves a receipt (EX-3wmn4brs) — The accepted example closed a task in review, a transition the release removed; the agent restated it for the planning gate, keeping who, when and on what basis, and the counter-cases.
- An unanswered question refuses the approval by name (EX-q6vwzxb6) — The accepted example refused defining a task, a command the release removed; the agent restated it for the gate that now reads the enumeration, keeping the three questions and which of them is named.

Conversation: none distilled for this change (`kotta narrative`).
