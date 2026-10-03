---
id: BR-01m413z0y4dtjs9rs718bdnm4j
form: business-rule
title: Kotta knows one workspace name
capability: migration
provenance:
  level: stated
  decided_by: human
  sources:
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · SZ2"
    - "chat · rp, 2026-10-03 ~14:55 UTC, sent while the agent was working (not in the distillate): „ez már egyik sem kell” — answering whether discovery and migrate should still know .a-team/"
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · P6"
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · J1"
  quote: "rp, 2026-10-03: „minden a-team örökség mehet, migrálni sem kell” — „és engedjük el, akkor lehessen a kotta csak a repóban” — „1”"
---

# Kotta knows one workspace name

## Rule

Kotta SHALL find a workspace only under its own name, `.kotta/` at the root of the repository it specifies, and SHALL NOT look for the pre-rename name `.a-team/`. `kotta migrate` SHALL NOT rename an `.a-team/` directory.

## Rationale

`.a-team/` is the name Kotta had before 0.3.0. No workspace under it is left on the operator's machines, and the operator let the whole pre-1.0 heritage go.

## Scope

Workspace discovery and `kotta migrate`. A project still on the old name renames the directory by hand, or migrates with 1.0.0-alpha.4 or earlier.
