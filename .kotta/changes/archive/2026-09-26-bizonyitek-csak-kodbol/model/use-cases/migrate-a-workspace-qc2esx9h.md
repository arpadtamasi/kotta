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
  decided_by: agent-proposed-human-approved
  sources:
    - "chat · rp, 2026-09-26 (the operator's answers to the planning questions)"
    - "openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Requirement: A migráció nem bukik rendszer-metaadaton"
    - "openspec/changes/bizonyitek-csak-kodbol/proposal.md · Why"
  quote: "rp, 2026-09-26, chat: the skipped metadata file is deleted with the old directory; the plan names what it left out."
  inferred: "The wording inside the use case and the capability it now belongs to were chosen by the agent."
---

## Intent

Carry a workspace from any older shape - directory name, vocabulary, layout - to the current one without changing any identity.

## Preconditions

A workspace written under earlier names (.a-team/, findings/ready/packages, pre-namespace layout).

## Main success scenario

A dry run lists every change without writing. The migration renames directories, statuses, and frontmatter fields; the id set before and after is compared and must be identical. The result is committed so derived readers see it. A second run reports the workspace already current. A workspace arrives whole: the generated rules file is brought to the running package alongside the records, because it is the one document every agent in the project reads and a migration that leaves it behind keeps instructing them from the version it came from. And the migration says whether what it produced satisfies the rules of the shape it moved to — a report of success over a workspace its own validator would refuse claims more than the result carries.

## Alternatives

An older-shape directory holds an entry the migration does not know: it stops, names the entry, and writes nothing. Operating-system metadata - a fixed list, `.DS_Store`, `._*`, `.Spotlight-V100`, `.Trashes`, `.fseventsd`, `Thumbs.db`, `ehthumbs.db`, `desktop.ini` - is not such an entry: it is not part of the workspace, so the migration leaves it out of the archive, deletes it with the old directory, and names it in its plan. Nothing else is deleted without being carried over. The migration is interrupted: every step derives from disk, so running it again finishes the job. Every other command refuses a pre-migration workspace by naming the migrate command - there is deliberately no compatibility layer behind that refusal. A workspace newer than this Kotta is not this use case at all: migrate refuses it like every other command rather than planning a downgrade.
