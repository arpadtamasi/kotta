---
id: EX-01m40e0bs4dbanbw4ypr86pf0x
form: example
title: "A change left in OpenSpec's folder moves into the workspace"
capability: planning-phase
subjects:
  - UC-01m0f0wn89x00jkpqpqc2esx9h
  - BR-01m40e0afjevd5jy04135bh7fj
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · J2"
    - ".kotta/changes/a-valtozas-a-kottae/conversation.md · J4"
  quote: "rp, 2026-09-29: „mehet” — „igen” (to: sync and migrate every project)"
  inferred: "What the migration rewrites and what it leaves byte-identical was the agent's design."
---

# A change left in OpenSpec's folder moves into the workspace

## Given

A version-6 workspace with an open change under `openspec/changes/add-pause/` whose nodes cite `openspec/changes/add-pause/proposal.md`, an approved change beside it, and OpenSpec specs under `openspec/specs/` with no `narrative:` setting.

## When

`kotta migrate` runs.

## Then

Both changes move to `.kotta/changes/` with `git mv`; the open change's sources now cite `.kotta/changes/add-pause/proposal.md`, the approved one is moved byte-identical and the report says why; the config gains `narrative: generated`; `.kotta/spec/` is byte-identical, and a second run has nothing to do.
