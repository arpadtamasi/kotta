---
change: a-link-agents-orokseg-megy
generated_at: 2026-10-03T15:51:35.049Z
delta_hash: sha256:46ec8b1d8b160c08f04a2ed2cb3d19acff90a5cc3832ed2ab8fe8322fd930531
ready_for_approval: false
---

# Planning: a-link-agents-orokseg-megy

Written by `kotta plan`. Every conflict below is a candidate awaiting a human's judgement, not a verdict; nothing here was decided by the machine except what section (f) lists.

## Delta

Added: none

Changed:
- Kotta owns its rules file, never the project's (BR-zq4x3ffh) — business-rule, .kotta/changes/a-link-agents-orokseg-megy/model/business-rules/kotta-owns-its-rules-file-never-the-projects-zq4x3ffh.md
- The accepted model promises only what a shipped command does (BR-wv0pwgc3) — business-rule, .kotta/changes/a-link-agents-orokseg-megy/model/business-rules/the-accepted-model-promises-only-what-a-shipped-command-does-wv0pwgc3.md

Removed: none

## (a) Structure of the delta

Every delta node satisfies its form: sections, required edges, id and provenance.

## (b) The merged view

The accepted model with this delta applied validates as a whole.

## (c) Conflict candidates

1. **The rules ship; the project file stays yours (EX-4dd2qamd)** — names the changed node in 'subjects' (references-changed; because of Kotta owns its rules file, never the project's (BR-zq4x3ffh)). Awaits judgement.
2. **A promise of a removed command leaves the model with it (EX-87pfzmgx)** — names the changed node in 'subjects' (references-changed; because of The accepted model promises only what a shipped command does (BR-wv0pwgc3)). Awaits judgement.

The machine's candidates are mechanical and narrow. Contradictions the agent found by comparing every claim of the delta with the accepted nodes it touches, each marked `judged`:

<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
<!-- /kotta:judged -->

## (d) Silences

- Open: Kotta owns its rules file, never the project's (BR-zq4x3ffh) BR-zq4x3ffh/Q1 — **A `--link-agents` kapcsoló egésze megy, vagy csak a régi bevezető átalakítása?** A kapcsoló két dolgot csinál. (1) Ha nincs ember, aki jóváhagyna, egy terminálból vagy CI-ból futó `kotta sync` is be tudja írni a projekt saját `AGENTS.md`-jébe a Kotta-szabályokra mutató hivatkozást (a szakasz végére, egyszer). A szabály ezt ma kifejezetten ígéri: „egy determinisztikus út megmarad az ügynök nélküli környezetekre”. (2) Egy 0.x-es Kotta által a projekt `AGENTS.md`-jébe írt régi bevezetőt felismer és lecserél. (a) Csak a (2) megy: az A-Team-örökség. (b) Az egész kapcsoló megy: a hivatkozást ezentúl mindig az ügynök teszi be, a te igeneddel, és CI-ból nem lehet. Én az (a)-t javaslom, mert az (1) nem örökség, hanem az egyetlen út, ahogy egy ügynök nélküli telepítés eléri az ügynököket. (.kotta/changes/a-link-agents-orokseg-megy/model/business-rules/kotta-owns-its-rules-file-never-the-projects-zq4x3ffh.md:30)

## (e) Narrative drift

No narrative requirement bound to a node says something else than the node.

## (f) Provenance

2 delta nodes: 0 stated, 2 partly-inferred, 0 inferred.
Decided by: 2 human, 0 agent-proposed-human-approved, 0 agent-decided.

What the machine decided alone:

- nothing

Conversation: .kotta/changes/a-link-agents-orokseg-megy/conversation.md, cited 4 times. Read it for the why before calling anything inferred.
- Unresolved: Kotta owns its rules file, never the project's (BR-zq4x3ffh) cites “.kotta/changes/archive/2026-10-03-az-a-team-oroksege-megy/conversation.md · P6” — name the conversation as .kotta/changes/a-link-agents-orokseg-megy/conversation.md, the repository-relative path the board opens.
- Unresolved: The accepted model promises only what a shipped command does (BR-wv0pwgc3) cites “.kotta/changes/archive/2026-10-03-az-a-team-oroksege-megy/conversation.md · P6” — name the conversation as .kotta/changes/a-link-agents-orokseg-megy/conversation.md, the repository-relative path the board opens.
