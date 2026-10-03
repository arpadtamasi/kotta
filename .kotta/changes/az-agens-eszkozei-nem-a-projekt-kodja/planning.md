---
change: az-agens-eszkozei-nem-a-projekt-kodja
generated_at: 2026-10-03T08:30:13.181Z
delta_hash: sha256:7d4712bde291e32ae339c8c1633f53bc0f059e79e68a7b93d74bdadfa28b0dde
ready_for_approval: false
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
- judged: *A copy of the specification is not evidence* SHALL exclude six named sources from every search. Depending on the third open decision, the new rule leaves it as it is, makes it the behaviour while no list is set, or retires it; either of the last two changes that rule in this change.
- judged: *The report names what it did not count* names the six excluded classes in the head of the report. With a list set, what lies outside it is neither read nor counted; whether that is said by class or only by naming the paths read follows from the third decision.
- judged: *Analyze the implementation gap* says the analysis "looks only where a promise can be kept or checked"; reading where the project says its code is agrees with it.
<!-- /kotta:judged -->

## (d) Silences

- Open: Evidence is sought where the project says its code is (BR-80aa9a08) BR-80aa9a08/Q1 — Honnan tudja a Kotta, hol van a projekt kódja és tesztje? (a) A projekt sorolja fel a `.kotta/config.yaml`-ban (például `evidence: [src/, tests/]`); a `kotta init` és a `kotta migrate` a repó alapján javasol egy listát, amit az ember átír. (b) A Kotta a csomagleírókból (package.json, pyproject és társaik) vezeti le - de egy gyökérben lévő leíró az egész repót jelenti, így a bemásolt skillek is benne maradnának. (c) Az ügynök javasolja a beszélgetésben, és a lista a specifikáció része lesz, egy change kapuján átmenve. Az én javaslatom az (a): egyszerű, látható, és a projekt maga dönt. (.kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/model/business-rules/evidence-is-sought-where-the-project-says-its-code-is-80aa9a08.md:31)
- Open: Evidence is sought where the project says its code is (BR-80aa9a08) BR-80aa9a08/Q2 — Mi legyen, amíg egy projekt nem mondta meg (minden mai projekt ilyen)? (a) A jelentés az egész repót olvassa, ahogy ma, és a feje egy sorban jelzi, hogy a lista hiányzik és hol adható meg. (b) A `kotta gap` megáll, és kéri a listát. Az én javaslatom az (a): semmi nem törik el a frissítéskor, és a zajos projekt egy sorból megtudja, mit tegyen. (.kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/model/business-rules/evidence-is-sought-where-the-project-says-its-code-is-80aa9a08.md:32)
- Open: Evidence is sought where the project says its code is (BR-80aa9a08) BR-80aa9a08/Q3 — Ma hat rögzített kizárás van: a Kotta munkaterülete, az OpenSpec könyvtárai, a csomagok közzétett specifikáció-másolata és a `node_modules`. Ezek a te elved szerint is determinisztikus tiltások. Mi legyen velük? (a) Maradnak mindenhol, a megadott útvonalakon belül is. (b) Csak addig érvényesek, amíg a projekt nem adta meg a listát; utána csak a lista számít. (c) Megszűnnek. Az én javaslatom a (b): a megadott lista az igen, és amíg nincs, a mai viselkedés véd a specifikáció másolatai ellen. (.kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/model/business-rules/evidence-is-sought-where-the-project-says-its-code-is-80aa9a08.md:33)

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

2 delta nodes: 0 stated, 2 partly-inferred, 0 inferred.
Decided by: 1 human, 0 agent-proposed-human-approved, 1 agent-decided.

What the machine decided alone:

- A vendored skill is neither evidence nor unspecified enforcement (EX-6d1cr41k) — The scene is the health-ai repository, reduced to one file; the wording is the agent's.

Conversation: .kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md, cited 2 times. Read it for the why before calling anything inferred.
