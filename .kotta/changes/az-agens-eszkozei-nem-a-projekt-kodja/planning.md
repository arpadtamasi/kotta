---
change: az-agens-eszkozei-nem-a-projekt-kodja
generated_at: 2026-10-03T08:28:47.164Z
delta_hash: sha256:a319cdef4b3d6c1008be7936f35934b21e7f3c5dedbf644ab843826213c783d4
ready_for_approval: true
---

# Planning: az-agens-eszkozei-nem-a-projekt-kodja

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added:
- A vendored skill is neither evidence nor unspecified enforcement (EX-6d1cr41k) — example, .kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/model/examples/a-vendored-skill-is-neither-evidence-nor-unspecified-enforce-6d1cr41k.md

Changed:
- A copy of the specification is not evidence (BR-ky1kcx0n) — business-rule, .kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/model/business-rules/a-copy-of-the-specification-is-not-evidence-ky1kcx0n.md
- The report names what it did not count (BR-y0565652) — business-rule, .kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/model/business-rules/the-report-names-what-it-did-not-count-y0565652.md

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **An archived change cites nothing (EX-1jcf80np)** — names the changed node in 'subjects' (references-changed; because of A copy of the specification is not evidence (BR-ky1kcx0n)). Awaits judgement.
2. **A generated binding is neither cited nor a test (EX-40kqm294)** — names the changed node in 'subjects' (references-changed; because of A copy of the specification is not evidence (BR-ky1kcx0n)). Awaits judgement.
3. **A project's own specs directory still holds tests (EX-nbfdzwzz)** — names the changed node in 'subjects' (references-changed; because of A copy of the specification is not evidence (BR-ky1kcx0n)). Awaits judgement.
4. **A node named only in the specification belongs to no module (EX-34zfdx6p)** — names the changed node in 'subjects' (references-changed; because of A copy of the specification is not evidence (BR-ky1kcx0n)). Awaits judgement.
5. **A node named only in an excluded source says which (EX-jpvk80dx)** — names the changed node in 'subjects' (references-changed; because of The report names what it did not count (BR-y0565652)). Awaits judgement.
6. **An uncommitted specification file is not offered as evidence (EX-5h170c3n)** — names the changed node in 'subjects' (references-changed; because of A copy of the specification is not evidence (BR-ky1kcx0n)). Awaits judgement.
7. **A package's own openspec tree is not excluded (EX-p4y88nga)** — names the changed node in 'subjects' (references-changed; because of A copy of the specification is not evidence (BR-ky1kcx0n)). Awaits judgement.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: *A copy of the specification is not evidence* says "The exclusion MUST name the specification sources Kotta itself knows, never a directory name pattern". `.claude/` and `.codex/` at the repository root are named places Kotta itself writes to (skills, the Codex MCP configuration), not a pattern matched anywhere in the tree; a `.claude/` below the root is not excluded, as a package's own `openspec/` is not. The rule's title speaks of copies of the specification while it already excludes somebody else's code (`node_modules/`); the new source sits beside that one.
- judged: *A project's own specs directory still holds tests* and *A package's own openspec tree is not excluded* still hold: neither path is under the root `.claude/` or `.codex/`.
- judged: *What the tool enforces, the spec states* asks every enforced rule to be written in the specification; leaving vendored agent tooling out of the reverse search narrows what counts as "the tool" to the project's own code, which is what the rule meant by it.
- judged: *Analyze the implementation gap* says the analysis "looks only where a promise can be kept or checked"; the agent's tooling keeps no promise of the product, so the new exclusion agrees with it.
<!-- /kotta:judged -->

## (d) Silences

No open decision, and no question a form asks is left unanswered.

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

3 delta nodes: 0 stated, 3 partly-inferred, 0 inferred.
Decided by: 0 human, 2 agent-proposed-human-approved, 1 agent-decided.

What the machine decided alone:

- A vendored skill is neither evidence nor unspecified enforcement (EX-6d1cr41k) — The scene is the health-ai repository, reduced to one file; the wording is the agent's.

Conversation: .kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md, cited 2 times. Read it for the why before calling anything inferred.
