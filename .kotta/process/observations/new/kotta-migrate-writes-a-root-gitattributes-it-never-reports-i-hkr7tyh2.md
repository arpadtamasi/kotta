---
id: F-01kz2ar8fk0nfvxgd7hkr7tyh2
title: >-
  kotta migrate writes a root .gitattributes it never reports, in dry-run or
  after
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-022
created_at: '2026-08-02'
---
# F-01kz2ar8fk0nfvxgd7hkr7tyh2 — kotta migrate writes a root .gitattributes it never reports, in dry-run or after

## Observation

kotta migrate writes a root .gitattributes it never reports, in dry-run or after.

## Evidence

src/commands/migrate.ts:293 calls ensureIndexMergeAttribute(root), which writes '<root>/.gitattributes' containing '.kotta/index.md merge=union' (src/filesystem/workspace.ts:234). The write is never pushed onto the 'changes' list, so neither 'kotta migrate --dry-run' nor the applied run mentions it: grep -c gitattributes over the oneanda/crm-kit/flowbench dry-run outputs and the applied oneanda output returns 0 in all four. In /Users/rp/Dev/ezchops/oneanda the file did not exist before, so the migration commit 2d0e937c contains 313 renames plus one addition OUTSIDE the workspace directory. T-022's acceptance 6 demands 'nothing outside the workspace directory changed', and an operator who reviewed the dry-run has no way to anticipate a root-level file. The write itself is correct (the merge=union attribute must follow .a-team/index.md -> .kotta/index.md); only the silence is wrong. Fix: add the .gitattributes write to the change plan so it appears in --dry-run and in the applied output.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
