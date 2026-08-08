---
id: F-01kzhm96dymxx589h9pxwst12g
title: The skills-sync feature shipped without a CHANGELOG entry
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-08'
---
# F-01kzhm96dymxx589h9pxwst12g — The skills-sync feature shipped without a CHANGELOG entry

## Observation

The skills-sync feature shipped without a CHANGELOG entry.

## Evidence

Found on 2026-08-08 while checking how two review branches would merge. Commit 5e2e50a ('kotta sync installs the skills Kotta ships', merged as 332f092) added the sync command, the skill-drift check in status and a 156-line test file, but no CHANGELOG entry: the Unreleased section on main was empty, which is how the omission surfaced — a trial merge of an unrelated branch produced a CHANGELOG containing only that branch's lines. A shipped user-facing command is therefore absent from the release notes, and nothing in the workflow observed the gap.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
