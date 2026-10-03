---
id: UC-01m0f0wn89x00jkpqpqc2esx9h
form: use-case
title: "Migrate a workspace"
actor:
  - A-01m0f0wn89ewnpex9n4tq0s0rg
goal:
  - G-01m0f0wn89zx3nr6h1vtd9jg9h
interfaces:
  - IF-01m0f0wn8994dzf9z1sdygxa04
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
capability: migration
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · P6"
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · J1"
    - ".kotta/changes/archive/2026-10-03-a-valtozas-a-kottae/conversation.md · J4"
  quote: "rp, 2026-10-03: „minden a-team örökség mehet, migrálni sem kell” — „és engedjük el, akkor lehessen a kotta csak a repóban” — „1”"
  inferred: "What is left of the use case — the move out of OpenSpec's folder that 1.0.0-alpha.3 added — is the agent's reading of „migrálni sem kell” as the pre-1.0 migration only."
---

## Intent

Carry a current workspace's changes out of OpenSpec's folder into its own, without changing any identity.

## Preconditions

A workspace on the current shape whose changes an earlier release kept under `openspec/changes/`. A workspace on an older shape is refused (BR-01m0q89b16xcfasfj1z8mc2hgg).

## Main success scenario

A dry run lists every move without writing. The migration moves every open change, and every archived one that carries a model or a receipt, into `.kotta/changes/` with `git mv`, rewrites the sources of a change not yet approved to the new folder, moves an approved one byte-identical and says so, and writes `narrative: generated` where OpenSpec specs exist and nothing sets the narrative. The specification is left byte-identical, and a second run has nothing to do.

## Alternatives

A destination already exists: the migration names it and writes nothing. A workspace on an older shape, or one still under `.a-team/`, is not migrated: the refusal names the last release that migrates it.
