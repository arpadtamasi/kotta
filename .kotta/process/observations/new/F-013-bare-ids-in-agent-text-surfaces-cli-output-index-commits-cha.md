---
id: F-013
title: >-
  Bare ids in agent/text surfaces (CLI output, index, commits, chat) carry no
  meaning — the more painful half of F-012
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-28'
---
# F-013 — Bare ids in agent/text surfaces (CLI output, index, commits, chat) carry no meaning — the more painful half of F-012

## Observation

Bare ids in agent/text surfaces (CLI output, index, commits, chat) carry no meaning — the more painful half of F-012.

## Evidence

Operator feedback (2026-07-28): the bare-id pain hurts MORE in the agentic/text workflow than in the UI. T-018 gave the UI a title tooltip, but the UI has hover; the text surfaces do not — a bare 'T-042' in a commit message, chat line, CLI output, or index.md is opaque, and that is exactly where cross-session recall fails (the live 'T-042 megvan?' — nobody could tell what it was without a lookup). This is the textual half already named in F-012's evidence but deliberately left out of T-018's UI-only scope; the sibling that matters most. It is decision D-003 (human reference = title) applied to the agent/text layer, not just the UI. Concrete surfaces to fix: (1) CLI output — commands that emit an id (ticket/finding/package list, status, transition confirmations) should print 'T-042 · <title>'; (2) index.md regeneration — carry a readable title next to the id/slug; (3) convention for skills/agents — reference entities as 'title (id)' in prose and commit subjects, not a bare number. Sibling of F-012 (UI half, done in T-018); clusters with F-009/F-010/F-011 and reinforces D-003.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
