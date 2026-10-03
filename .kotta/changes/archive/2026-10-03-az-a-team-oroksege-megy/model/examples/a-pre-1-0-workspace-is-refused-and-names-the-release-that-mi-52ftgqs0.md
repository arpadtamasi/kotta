---
id: EX-01m415fx4jbbqpyqqa52ftgqs0
form: example
title: A pre-1.0 workspace is refused and names the release that migrates it
capability: migration
subjects:
  - BR-01m0q89b16xcfasfj1z8mc2hgg
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · P6"
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · J1"
  quote: "rp, 2026-10-03: „minden a-team örökség mehet, migrálni sem kell” — „és engedjük el, akkor lehessen a kotta csak a repóban” — „1”"
  inferred: "The case is the agent's illustration."
---
# A pre-1.0 workspace is refused and names the release that migrates it

## Given

A repository whose `.kotta/config.yaml` records shape version 5, with its process state under `.kotta/process/`.

## When

`kotta validate`, then `kotta migrate` is run with this Kotta.

## Then

Both refuse, name the workspace as older, and give `npx -y -p @arpadtamasi/kotta@1.0.0-alpha.4 kotta migrate` as the way to bring it over; nothing is written.

## Open edges

- What does this example prove? Answer in frontmatter 'subjects'.

Delete this section once they are answered.
