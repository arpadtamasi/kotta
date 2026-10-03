---
id: EX-01m413z1x8vsfp6jncykrshbtc
form: example
title: A pre-rename workspace is not found
capability: migration
subjects:
  - BR-01m413z0y4dtjs9rs718bdnm4j
provenance:
  level: stated
  decided_by: human
  sources:
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · SZ2"
    - "chat · rp, 2026-10-03 ~14:55 UTC, sent while the agent was working (not in the distillate): „ez már egyik sem kell” — answering whether discovery and migrate should still know .a-team/"
  quote: "rp, 2026-10-03: „ez már egyik sem kell”"
---

# A pre-rename workspace is not found

## Given

A repository whose only workspace is a directory named `.a-team/`.

## When

`kotta validate`, then `kotta migrate` is run in it.

## Then

Both say no workspace exists here; `migrate` renames nothing.
