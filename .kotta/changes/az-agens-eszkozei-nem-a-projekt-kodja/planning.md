---
change: az-agens-eszkozei-nem-a-projekt-kodja
generated_at: 2026-10-02T09:08:52.964Z
delta_hash: sha256:1329d944fe6ea7217a9a8518590014a5d6b0494b6398d91efe114ba080c8410c
ready_for_approval: false
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
<!-- /kotta:judged -->

## (d) Silences

- Open: A copy of the specification is not evidence (BR-ky1kcx0n) BR-ky1kcx0n/Q1 — A `kotta gap` jelentés a projekt kódjában keres bizonyítékot az ígéretekre, és megnevezi, amit a kód specifikáció nélkül kényszerít ki. Ma a repóba bemásolt ügynök-skilleket (például a `.claude/skills/` alatti idegen készletet) is a projekt kódjának nézi: a health-ai-ban 145 találatból 141 onnan jön. A kérdés: mely könyvtárakat hagyja ki? (a) A gyökérben lévő `.claude/` és `.codex/` könyvtárat egészében - ezekbe ír a Kotta maga is (skillek, MCP-beállítás), és ügynök-eszközön kívül más nem szokott bennük lenni. (b) Csak a `.claude/skills/` könyvtárat - szűkebb, de a hookok és más host-fájlok továbbra is a projekt kódjának számítanak. (c) A projekt maga sorolja fel a `config.yaml`-ban - rugalmas, de minden projektnek be kell állítania, különben marad a zaj. Az én javaslatom az (a). (.kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/model/business-rules/a-copy-of-the-specification-is-not-evidence-ky1kcx0n.md:30)

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

3 delta nodes: 0 stated, 3 partly-inferred, 0 inferred.
Decided by: 0 human, 0 agent-proposed-human-approved, 3 agent-decided.

What the machine decided alone:

- A copy of the specification is not evidence (BR-ky1kcx0n) — The operator asked for the defect to be fixed; that the fix is a seventh excluded source, which directories it names, and that the same filter bounds the reverse search were proposed by the agent.
- The report names what it did not count (BR-y0565652) — The seventh class and its name follow from the changed exclusion rule; both were chosen by the agent.
- A vendored skill is neither evidence nor unspecified enforcement (EX-6d1cr41k) — The scene is the health-ai repository, reduced to one file; the wording is the agent's.

Conversation: .kotta/changes/az-agens-eszkozei-nem-a-projekt-kodja/conversation.md, cited 0 times. Read it for the why before calling anything inferred.
