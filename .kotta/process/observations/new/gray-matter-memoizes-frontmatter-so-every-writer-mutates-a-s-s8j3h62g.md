---
id: F-01kz294gj4sy9gcc56s8j3h62g
title: 'gray-matter memoizes frontmatter, so every writer mutates a shared object'
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-023
created_at: '2026-08-02'
---
# F-01kz294gj4sy9gcc56s8j3h62g — gray-matter memoizes frontmatter, so every writer mutates a shared object

## Observation

gray-matter memoizes frontmatter, so every writer mutates a shared object.

## Evidence

core/markdown.ts parseMarkdown() calls matter(source), which memoizes on the source string and returns the SAME data object for identical input. Every command mutates it in place (contract.ts entity.data.status = ..., batch.ts data.status = ..., observation.ts entity.data.disposition = ...), so a second parse of an identical file inside one process sees the first caller's edits. It bit kotta migrate during T-023: planning a file twice reported an empty change list the second time, because the first plan had already renamed the keys on the cached object. migrate.ts now structuredClones parsed.data; nothing else does. Single-command CLI runs mostly hide it, but the UI server is long-lived and parses repeatedly.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
