---
id: F-01kz36jpn7japyysdhnkb8sbc4
title: >-
  Renaming the workspace drops tracked-but-now-ignored files out of version
  control, unreported
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-022
created_at: '2026-08-03'
---
# F-01kz36jpn7japyysdhnkb8sbc4 — Renaming the workspace drops tracked-but-now-ignored files out of version control, unreported

## Observation

Renaming the workspace drops tracked-but-now-ignored files out of version control, unreported.

## Evidence

In /Users/rp/Dev/thalesnano/flowbench, three .DS_Store files were tracked inside the workspace (.a-team/.DS_Store, .a-team/findings/.DS_Store, .a-team/packages/.DS_Store) from before that repository's .gitignore grew its '.DS_Store' rule. 'kotta migrate' moved the bytes to .kotta/ intact (all three are present on disk, 6148 bytes each), but .gitignore line 3 now matches them at the new path, so git cannot track them there. Migration commit 9a000ce therefore contains 59 renames, 1 addition and 3 DELETIONS -- three files leave version control as a side effect of a rename that the command presents as lossless. 'kotta migrate --dry-run' plans '48 changes' and prints 'move .a-team -> .kotta' with no hint that anything stops being tracked; the applied output says the same. oneanda and crm-kit were unaffected only because neither had a tracked file inside the workspace that its own .gitignore matches -- this is latent in any workspace that does. Nothing was lost here (.DS_Store is macOS junk and the bytes survive), but the same mechanism would silently untrack a real file. Fix: have migrate detect paths that are tracked at the old location and ignored at the new one, and report them before writing.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
