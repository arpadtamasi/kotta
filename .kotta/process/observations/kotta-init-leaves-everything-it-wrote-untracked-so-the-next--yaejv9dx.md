---
id: F-01m14bxc55dpeg5zbjyaejv9dx
title: >-
  kotta init leaves everything it wrote untracked, so the next command that
  checks the tree refuses
status: new
origin: agent
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-28'
---
# F-01m14bxc55dpeg5zbjyaejv9dx — kotta init leaves everything it wrote untracked, so the next command that checks the tree refuses

## Observation

kotta init leaves everything it wrote untracked, so the next command that checks the tree refuses.

## Evidence

Measured on 2026-08-27 in a fresh repository: after kotta init, git status --porcelain lists .gitattributes, .gitignore, .kotta/ and now AGENTS.md, all untracked. Every other Kotta mutation commits the state it writes - task.ts calls commitControlState six times, observation.ts four, and batch.ts was repaired this morning for exactly this (F-01m0zn0d24hjbva47xdp1kb6m1) - but init commits nothing, so the command that follows it and checks cleanliness refuses over files Kotta created seconds earlier. It surfaced now because init writes one more file than it used to: a test fixture that committed the two dotfiles by name started failing. The rule landed this morning says a service that writes canonical state commits it and never reports the operator's checkout as unclean when the uncommitted change is its own; init is the one path still outside that. Whether Kotta may commit the project's own AGENTS.md, as opposed to the workspace it created, is the part that needs deciding rather than assuming.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
