---
id: BR-01m3cqmtvgmsdxnf78babstw2c
form: business-rule
title: Migration skips operating-system metadata and nothing else
capability: migration
provenance:
  level: stated
  decided_by: agent-proposed-human-approved
  sources:
    - "chat · rp, 2026-09-26 (the operator's answers to the planning questions)"
    - "openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Requirement: A migráció nem bukik rendszer-metaadaton"
    - "openspec/changes/bizonyitek-csak-kodbol/proposal.md · Why"
  quote: "rp, 2026-09-26, chat: the list is fixed and wider (.DS_Store, ._*, .Spotlight-V100, .Trashes, .fseventsd, Thumbs.db, ehthumbs.db, desktop.ini); the file is deleted with the old directory."
---

## Rule

`kotta migrate` SHALL ignore the operating system's metadata files when it reads the directories of an older workspace shape. The list is fixed and not configurable: `.DS_Store`, `._*`, `.Spotlight-V100`, `.Trashes`, `.fseventsd`, `Thumbs.db`, `ehthumbs.db`, `desktop.ini`. Such a file SHALL NOT be carried into the archive; it is deleted with the old directory it sits in, and the plan SHALL name each file it left out. This is the only thing a migration deletes without carrying it over. On any other entry it does not know it SHALL still stop, name the entry, and write nothing.

## Rationale

On 2026-09-25 a migration stopped on a `.DS_Store` in a v2 workspace directory ("unexpected entry") and wrote nothing. Operating-system metadata is not part of the workspace; the migration cannot fail on it. The stop on an unknown entry stays, because it is what keeps a migration from losing something it did not understand.

## Scope

The flattening of older-shape directories in `kotta migrate`, in the dry run and in the applied run.

## Open decisions

None
