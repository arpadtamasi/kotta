---
id: F-01kz1kb601ce79vwj48et554b5
title: >-
  schemas/package.schema.json rejects every started package and is wired to
  nothing
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-01kz1g2vvgqvvzef92qdtczv8w
created_at: '2026-08-02'
---
# F-01kz1kb601ce79vwj48et554b5 — schemas/package.schema.json rejects every started package and is wired to nothing

## Observation

schemas/package.schema.json rejects every started package and is wired to nothing.

## Evidence

schemas/package.schema.json sets additionalProperties: false and declares no 'coordinator' property, but 'package start' writes a coordinator block (src/commands/package.ts establishCoordinator/recordCleaned) into the package frontmatter. The schema is also referenced nowhere in the codebase: grep for 'package.schema' outside the file itself returns no hits, and validatePackage (src/commands/package.ts) performs hand-written checks instead. So the shipped schema is both unused and, if a consumer used it, would reject every package the CLI has started. Noticed while adding 'package close'.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
