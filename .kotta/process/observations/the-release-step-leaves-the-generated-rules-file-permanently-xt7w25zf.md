---
id: F-01m0tnv8vmjjjack09xt7w25zf
title: The release step leaves the generated rules file permanently drifted
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-24'
---
# F-01m0tnv8vmjjjack09xt7w25zf — The release step leaves the generated rules file permanently drifted

## Observation

The release step leaves the generated rules file permanently drifted.

## Evidence

Commit 90edd48 (release: 0.9.0) rewrote .kotta/AGENTS.md — the version line the template interpolates — without updating the AGENTS.md hash in .kotta/.kotta-generated.json. From then on 'kotta sync' reported agents.state 'drifted' and left the file alone, so the shipped rules file silently stopped tracking templates/AGENTS.md. Measured here: sha256 of .kotta/AGENTS.md was a193beb5..., the record held 13dfa2d0.... Refreshing the record made the very next sync write the file again ('updated'). Every project that runs the release path has the same stale record, and drift is exactly the signal that should be loud.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
