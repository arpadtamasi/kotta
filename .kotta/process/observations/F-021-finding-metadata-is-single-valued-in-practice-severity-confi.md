---
id: F-021
title: >-
  Finding metadata is single-valued in practice — severity, confidence and
  origin carry no information, and discovered_during is empty 62% of the time
status: new
origin: agent
observation_type: process
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-01'
---
# F-021 — Finding metadata is single-valued in practice — severity, confidence and origin carry no information, and discovered_during is empty 62% of the time

## Observation

The finding schema asks for severity, confidence, origin, type and provenance. In a real workspace three of those fields have effectively one value, and the provenance field is usually null. A field with one value is not a field — it is a required ritual.

## Evidence

oneanda workspace, 99 findings:

```
confidence: high        99 / 99   (100%)
severity:   medium      92 / 99   (93%)   high: 1   low: 6
origin:     agent       99 / 99   (100%)
finding_type: bug       55 / 99   (56%)   — 15 other types share the rest
discovered_during: null 61 / 99   (62%)
```

Three consequences worth separating:

1. **Severity does not rank.** oneanda F-041 — a whole package delivering non-working software — carries `severity: medium`, the same as a typo-level observation. When everything is medium, the queue cannot be triaged, and the operator has to read all 99 to find the one that matters.
2. **No human ever files a finding.** 99 of 99 are `origin: agent`. The operator's own observations — including a numbered eight-item defect list delivered in chat on 2026-07-31 — never entered the workspace. The most valuable findings evaporate in the conversation.
3. **Provenance is mostly missing.** `discovered_during` is null in 62% of findings. This is an empirical warning for [[F-017]]: adding a `caused_by` field will not fill itself. The weaker, already-existing link is not being filled either.

The mechanism is the same as [[F-018]]: the schema demands a value, the agent supplies the safe default, and the default is indistinguishable from a real judgement.

## Impact hypothesis

The findings queue grows without becoming rankable. Human observation stays outside the system. The provenance chain that write-back and regeneration depend on is absent in most records.

## Confidence

High: counted across the full findings directory.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval. Candidate directions: force severity to be argued against a stated scale rather than picked; make `origin: human` a first-class, one-command path so operator observations land in the workspace; require `discovered_during` when a ticket is active rather than accepting null.
