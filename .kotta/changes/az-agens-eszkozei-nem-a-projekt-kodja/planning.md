---
change: az-agens-eszkozei-nem-a-projekt-kodja
generated_at: 2026-10-03T08:34:47.279Z
delta_hash: sha256:a3274ef64635352ecceacc827b7649a4ac89cfaa57b2d44561eaba894d536fa4
ready_for_approval: true
---

# Planning: az-agens-eszkozei-nem-a-projekt-kodja

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- Evidence is sought where the project says its code is (BR-80aa9a08) — business-rule, .kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/model/business-rules/evidence-is-sought-where-the-project-says-its-code-is-80aa9a08.md
- A vendored skill is neither evidence nor unspecified enforcement (EX-6d1cr41k) — example, .kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/model/examples/a-vendored-skill-is-neither-evidence-nor-unspecified-enforce-6d1cr41k.md

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
- judged: *A copy of the specification is not evidence* stays as it is: its six excluded sources stay excluded, inside the named paths too. The new rule narrows the search further only when the caller names paths; it removes no exclusion.
- judged: *The report names what it did not count* still holds: the excluded classes are named as before, and the head additionally names the paths read when `--in` is given.
- judged: *Analyze the implementation gap* says the analysis "looks only where a promise can be kept or checked"; reading only where the caller says the code is agrees with it. Its sentence that the analysis needs "a readable repository. Nothing else" stays true: the parameter is optional.
- judged: *Archive refuses a change with an unaccounted promise* seeks evidence "as the gap report seeks it for an open change". With `--in`, the gap report may read less than archive; the delta says archive keeps reading the whole repository, so the two agree when no paths are given and archive is the more lenient otherwise. The accepted example is not changed.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

2 delta nodes: 0 stated, 2 partly-inferred, 0 inferred.
Decided by: 1 human, 0 agent-proposed-human-approved, 1 agent-decided.

What the machine decided alone:

- A vendored skill is neither evidence nor unspecified enforcement (EX-6d1cr41k) — The scene is the health-ai repository, reduced to one file; the wording is the agent's.

Conversation: .kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md, cited 6 times. Read it for the why before calling anything inferred.
