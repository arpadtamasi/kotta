---
change: fejlesztes-az-archive-elott
generated_at: 2026-10-02T07:12:37.575Z
delta_hash: sha256:0a8e87f329fff28098e6a7d1914c690739339cb42f913a800db3cee28b258b17
ready_for_approval: true
---

# Planning: fejlesztes-az-archive-elott

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- A change is built before it is archived (BR-97dmry35) — business-rule, .kotta/changes/fejlesztes-az-archive-elott/model/business-rules/a-change-is-built-before-it-is-archived-97dmry35.md
- After the yes the agent offers the work, not the archive (EX-0m2pgw8m) — example, .kotta/changes/fejlesztes-az-archive-elott/model/examples/after-the-yes-the-agent-offers-the-work-not-the-archive-0m2pgw8m.md
- Archive refuses a change with an unaccounted promise (EX-rdab0wn9) — example, .kotta/changes/fejlesztes-az-archive-elott/model/examples/archive-refuses-a-change-with-an-unaccounted-promise-rdab0wn9.md
- Building an approved change needs no signal (EX-n48rz5e0) — example, .kotta/changes/fejlesztes-az-archive-elott/model/examples/building-an-approved-change-needs-no-signal-n48rz5e0.md
- The gap report measures an approved open change (EX-katqef96) — example, .kotta/changes/fejlesztes-az-archive-elott/model/examples/the-gap-report-measures-an-approved-open-change-katqef96.md

Changed:
- Every accepted promise is kept or admitted (BR-51zm9svr) — business-rule, .kotta/changes/fejlesztes-az-archive-elott/model/business-rules/every-accepted-promise-is-kept-or-admitted-zm9svr.md
- Say when the code runs ahead of the spec (BR-n9q6hsr2) — business-rule, .kotta/changes/fejlesztes-az-archive-elott/model/business-rules/say-when-the-code-runs-ahead-of-the-spec-n9q6hsr2.md
- The spec is the agreement (BR-84jsrqbe) — business-rule, .kotta/changes/fejlesztes-az-archive-elott/model/business-rules/the-spec-is-the-agreement-84jsrqbe.md
- Analyze the implementation gap (UC-0v1ag64q) — use-case, .kotta/changes/fejlesztes-az-archive-elott/model/use-cases/analyze-the-implementation-gap-0v1ag64q.md

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **An uncovered need becomes an observation (EX-f5xp540x)** — names the changed node in 'subjects' (references-changed; because of The spec is the agreement (BR-84jsrqbe)). Awaits judgement.
2. **A noticing amends the spec (EX-byyc9sd2)** — names the changed node in 'subjects' (references-changed; because of The spec is the agreement (BR-84jsrqbe)). Awaits judgement.
3. **The gap report names the unimplemented promise (EX-jdk7rtk6)** — names the changed node in 'subjects' (references-changed; because of Analyze the implementation gap (UC-0v1ag64q)). Awaits judgement.
4. **An unadmitted promise fails the gap check (EX-zhfg56b2)** — names the changed node in 'subjects' (references-changed; because of Every accepted promise is kept or admitted (BR-51zm9svr)). Awaits judgement.
5. **A node named only in an excluded source says which (EX-jpvk80dx)** — names the changed node in 'subjects' (references-changed; because of Every accepted promise is kept or admitted (BR-51zm9svr)). Awaits judgement.
6. **A node named only in an excluded source says which (EX-jpvk80dx)** — names the changed node in 'subjects' (references-changed; because of Analyze the implementation gap (UC-0v1ag64q)). Awaits judgement.
7. **An uncommitted specification file is not offered as evidence (EX-5h170c3n)** — names the changed node in 'subjects' (references-changed; because of Analyze the implementation gap (UC-0v1ag64q)). Awaits judgement.
8. **Code ahead of the model is named in one line (EX-rkb7tgy4)** — names the changed node in 'subjects' (references-changed; because of Say when the code runs ahead of the spec (BR-n9q6hsr2)). Awaits judgement.
9. **Work that touches no promise says nothing about the spec (EX-587hhk1d)** — names the changed node in 'subjects' (references-changed; because of Say when the code runs ahead of the spec (BR-n9q6hsr2)). Awaits judgement.
10. **Operator (A-4tq0s0rg)** — is named by the changed node (referenced-by-changed; because of Analyze the implementation gap (UC-0v1ag64q)). Awaits judgement.

118 lower-ranked candidates are not listed; the 10 above rank highest.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: *Say when the code runs ahead of the spec* would have fired on every line written for an approved, still open change. The operator chose to change it (2026-10-01, "4 ok"): the delta now adds that a promise an approved open change states is not ahead of the spec.
- judged: *The spec is the agreement* did not say which text binds the code between a change's approval and its archive. The operator chose (2026-10-01, "5 ok"): the approved delta, for the nodes it touches; the delta adds that sentence.
- judged: *Analyze the implementation gap* said "The subject is the accepted agreement, so the analysis reads the base branch". The delta narrows that sentence to the accepted agreement and says an open change is read from the checked-out commit ("2 ok").
- judged: *Every accepted promise is kept or admitted* says "There is no third state". It still holds as written, for accepted nodes: a node of an open change that is neither evidenced nor admitted is not accepted yet, and archive now refuses to make it so.
- judged: *The spec is the agreement* still speaks of tasks and observations in its Rule and Scope; the delta leaves those sentences as they are, because removing the process engine's wording is not this change.
- judged: the machine's candidates about *The gap report names the unimplemented promise*, *An unadmitted promise fails the gap check*, *A node named only in an excluded source says which* and *An uncommitted specification file is not offered as evidence* all speak of accepted nodes and still hold unchanged; the candidates that share only an actor, a goal or an admission text with a changed node contradict nothing.
- judged: *Code ahead of the model is named in one line* and *Work that touches no promise says nothing about the spec* still hold: neither scene has an approved open change stating the promise.
- judged: *A copy of the specification is not evidence* and *An archived change cites nothing* are untouched: an open change's own `model/` directory stays excluded from the evidence search, and the new example says so.
- judged: *An uncovered need becomes an observation* and *A noticing amends the spec* illustrate *The spec is the agreement* through the removed process engine; the sentence the delta adds is about the time between approval and archive and contradicts neither.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

9 delta nodes: 0 stated, 9 partly-inferred, 0 inferred.
Decided by: 1 human, 6 agent-proposed-human-approved, 2 agent-decided.

What the machine decided alone:

- After the yes the agent offers the work, not the archive (EX-0m2pgw8m) — The scene is the health-ai exchange the operator objected to, turned around; that the agent says the change stays open is the agent's wording.
- The gap report measures an approved open change (EX-katqef96) — The three nodes, that the report counts the change apart from the accepted model, and that it does not refuse over an open change's unbuilt promises were chosen by the agent; that the plain run shows the change and that the working branch is read were accepted by the operator ('1 ok', '2 ok', conversation P3).

Conversation: .kotta/changes/fejlesztes-az-archive-elott/conversation.md, cited 12 times. Read it for the why before calling anything inferred.
