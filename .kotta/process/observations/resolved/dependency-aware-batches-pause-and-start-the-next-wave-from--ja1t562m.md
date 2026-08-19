---
id: F-01kzw13qka26pq2jgjja1t562m
title: Dependency-aware batches pause and start the next wave from main
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-12'
disposition: create-contract
resolved_at: '2026-08-12T22:23:21.874Z'
contract: T-01kzw15bre7s0wms8d42xfajx0
---
# F-01kzw13qka26pq2jgjja1t562m — Dependency-aware batches pause and start the next wave from main

## Observation

Dependency-aware batches pause and start the next wave from main.

## Evidence

https://github.com/arpadtamasi/kotta/issues/36 — In Kotta 0.5.0, a reviewed contract merged into its batch coordinator does not satisfy a dependent contract until human close, and the dependent worktree is then created from the control checkout HEAD rather than the coordinator head.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
