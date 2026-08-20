---
id: F-01m0fqy11da1bj6r0880e02tt6
title: >-
  batch sign commit nélkül írja át az állapotot, és a következő parancsot
  blokkolja
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
---
# F-01m0fqy11da1bj6r0880e02tt6 — batch sign commit nélkül írja át az állapotot, és a következő parancsot blokkolja

## Observation

batch sign commit nélkül írja át az állapotot, és a következő parancsot blokkolja.

## Evidence

2026-08-20, ez a workspace: 'kotta batch sign P-01m0fq77101axprvcjwrq3bs61 --approve' után a batch fájl backlog→defined mozgása és az index módosítása a munkafában maradt (git status: D backlog/…wrq3bs61.md, M index.md, ?? defined/). A közvetlenül utána futó 'kotta batch start --agent claude' emiatt 'Repository is dirty' hibával elutasított. Ugyanaz a minta, mint az F-4rarvy6y (observation new commit nélkül) — a canonical writer nem atomikus: ír, de nem commitol, így saját magát blokkolja.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
