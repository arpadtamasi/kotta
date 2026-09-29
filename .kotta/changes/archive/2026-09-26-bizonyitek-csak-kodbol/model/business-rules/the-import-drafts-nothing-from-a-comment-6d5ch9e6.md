---
id: BR-01m3cqmtnnwxz7fkyr6d5ch9e6
form: business-rule
title: The import drafts nothing from a comment
capability: migration
provenance:
  level: stated
  decided_by: agent-proposed-human-approved
  sources:
    - "chat · rp, 2026-09-26 (the operator's answers to the planning questions)"
    - "openspec/changes/bizonyitek-csak-kodbol/specs/migration/spec.md · Requirement: Az import nem vázol node-ot megjegyzésből"
    - "openspec/changes/bizonyitek-csak-kodbol/design.md · 4. Import: megjegyzés nélkül mérve"
    - "openspec/changes/bizonyitek-csak-kodbol/proposal.md · Why"
  quote: "rp, 2026-09-26, chat: a comment-only requirement or scenario gets a warning naming the capability and the section, not only a silent skip."
---

## Rule

`kotta import openspec` SHALL measure the text of every narrative section — a capability's Purpose, a requirement, a scenario — after removing its Markdown comments. A section with no text left SHALL NOT yield a node draft. Where a capability's Purpose is left empty, the import SHALL name that capability among its warnings as one whose purpose is not stated, for the planning phase to ask about. Where a requirement or a scenario is left empty, the import SHALL warn as well, naming the capability and the section: it does not skip it in silence.

## Rationale

The generator writes a comment into the Purpose of a capability no goal node names. The import read that comment as prose and drafted a goal from it, found on 2026-09-25. A comment is not text; a node cannot come from it.

## Scope

`kotta import openspec` and the capability parser it reads through. Not the generator, whose comment stays as it is.

## Open decisions

None
