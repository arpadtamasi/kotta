---
id: BR-01m3cqmtnnwxz7fkyr6d5ch9e6
form: business-rule
title: The import drafts nothing from a comment
capability: migration
provenance:
  level: stated
  decided_by: agent-decided
  sources:
    - "openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Requirement: Az import nem vázol node-ot megjegyzésből"
    - "openspec/changes/bizonyitek-csak-kodbol/design.md · 4. Import: megjegyzés nélkül mérve"
    - "openspec/changes/bizonyitek-csak-kodbol/proposal.md · Why"
  quote: "A `kotta import openspec` SHALL a narratív spec szakaszainak szövegét a Markdown-megjegyzések levágása után mérni. Egy szakasz, amelyben ezután nincs szöveg, SHALL NOT node-vázlatot adni;"
---

## Rule

`kotta import openspec` SHALL measure the text of every narrative section — a capability's Purpose, a requirement, a scenario — after removing its Markdown comments. A section with no text left SHALL NOT yield a node draft. Where a capability's Purpose is left empty, the import SHALL name that capability among its warnings as one whose purpose is not stated, for the planning phase to ask about.

## Rationale

The generator writes a comment into the Purpose of a capability no goal node names. The import read that comment as prose and drafted a goal from it, found on 2026-09-25. A comment is not text; a node cannot come from it.

## Scope

`kotta import openspec` and the capability parser it reads through. Not the generator, whose comment stays as it is.

## Open decisions

- A requirement or scenario whose text is only a comment: does the import warn about it too, and name what, or does it only draft nothing? The narrative names a warning for the empty Purpose alone.
