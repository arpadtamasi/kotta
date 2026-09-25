---
id: BR-01m3cqmtvgmsdxnf78babstw2c
form: business-rule
title: Migration skips operating-system metadata and nothing else
capability: migration
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Requirement: A migráció nem bukik rendszer-metaadaton"
    - "openspec/changes/bizonyitek-csak-kodbol/proposal.md · Why"
  quote: "A `kotta migrate` SHALL figyelmen kívül hagyni az operációs rendszer metaadatfájljait (`.DS_Store`, `Thumbs.db`, `desktop.ini`) a régi alak könyvtárainak olvasásánál"
---

## Rule

`kotta migrate` SHALL ignore the operating system's metadata files — `.DS_Store`, `Thumbs.db`, `desktop.ini` — when it reads the directories of an older workspace shape, SHALL NOT carry them into the archive, and SHALL name in its plan each file it ignored. On any other entry it does not know it SHALL still stop, name the entry, and write nothing.

## Rationale

On 2026-09-25 a migration stopped on a `.DS_Store` in a v2 workspace directory ("unexpected entry") and wrote nothing. Operating-system metadata is not part of the workspace; the migration cannot fail on it. The stop on an unknown entry stays, because it is what keeps a migration from losing something it did not understand.

## Scope

The flattening of older-shape directories in `kotta migrate`, in the dry run and in the applied run.

## Open decisions

- Is the list exactly `.DS_Store`, `Thumbs.db` and `desktop.ini`, or does it also take other operating-system metadata — AppleDouble `._*` files, `.Spotlight-V100`, `.Trashes`, `.fseventsd`, `ehthumbs.db` —, and is it fixed or configurable?
- What happens to an ignored file on disk: is it left where it is, removed with the old directory, or moved? The narrative only says it does not go into the archive.
