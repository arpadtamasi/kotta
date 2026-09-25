---
id: F-01m144jf15sczhjd1hb0dyqct4
title: kotta migrate carries the workspace forward and leaves the rules file behind
status: resolved
origin: human
observation_type: defect
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-28'
disposition: amend-spec
resolved_at: '2026-08-28T13:32:45.337Z'
approved_by: cli
approved_at: '2026-08-28T13:32:45.337Z'
approval_basis: 'CLI --approve: observation.resolve'
spec:
  - UC-01m0f0wn89x00jkpqpqc2esx9h
---
# F-01m144jf15sczhjd1hb0dyqct4 — kotta migrate carries the workspace forward and leaves the rules file behind

## Observation

kotta migrate carries the workspace forward and leaves the rules file behind.

## Evidence

Reported from a migrated project on 2026-08-27: 'A telepitett Kotta 0.10.0, de a .kotta/AGENTS.md egy regebbi, 0.6.0-as szabalyvaltozattol szarmazik.' Measured here: src/commands/migrate.ts contains no reference to the rules file, syncWorkspaceAgents or AGENTS at all, so migrate never refreshes it. The rules file is the one document every agent in a project reads, and it carries the install line for the running package, so a workspace migrated to a new Kotta keeps instructing its agents from the version it left. Refreshing it needs a separate kotta sync, and where the file was ever touched by hand it needs sync --replace-rules, neither of which migrate names.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
