---
id: F-01kz2arn0v8smvsnvv4e63se3v
title: >-
  No before-baseline is obtainable: kotta validate refuses a pre-vocabulary
  workspace
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: T-022
created_at: '2026-08-02'
---
# F-01kz2arn0v8smvsnvv4e63se3v — No before-baseline is obtainable: kotta validate refuses a pre-vocabulary workspace

## Observation

No before-baseline is obtainable: kotta validate refuses a pre-vocabulary workspace.

## Evidence

T-022's Verification says 'capture kotta validate --json before, run migrate, capture validate after, diff the two'. That is not executable with kotta 0.3.0: in all three neighbour repositories 'kotta validate' exits 1 with 'is a pre-vocabulary Kotta workspace ... Run kotta migrate'. No pre-migration validate output exists, so the required diff cannot be produced by the tool that performs the migration. Two workarounds were used for T-022: (a) the previously released @arpadtamasi/a-team@0.2.2, which validates the old shape but under the old rule set and only counts tickets+decisions -- it reported 13 errors for oneanda, not the 42 the contract names; (b) copying .a-team into a scratch git repo, migrating the copy and validating there, which reproduced oneanda's 42 exactly (35 DEVIATION_MISMATCH + 7 MISSING_PROFILE_SECTION) and 0/0 for crm-kit and flowbench. (b) is the only comparison that is apples-to-apples. Suggestion: have 'kotta migrate --dry-run' emit the validate result it predicts for the migrated workspace, so before/after is a single tool's output and no operator has to reconstruct a baseline from a de-published CLI.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
