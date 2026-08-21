---
id: F-01m0fk8azq6k7j3bm9vptnvk5g
title: The board hides backlog entities whose state directory is entirely untracked
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:06:38.880Z'
approved_by: cli
approved_at: '2026-08-21T15:06:38.880Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0fk8azq6k7j3bm9vptnvk5g — The board hides backlog entities whose state directory is entirely untracked

## Observation

The board hides backlog entities whose state directory is entirely untracked.

## Evidence

Reproduced with the published kotta 0.6.1 in a fresh workspace (git init, kotta init, commit, then 'kotta contract new --title x --type feature'). 'kotta contract list' shows 1 contract in backlog; 'curl 127.0.0.1:PORT/api/workspace' from 'kotta ui' on the same workspace returns contracts: [] and batches: 0, so the board's backlog chip reads a confident 0 with no diagnostic. Root cause in src/commands/ui.ts:32-38 uncommittedMdAdds(): 'git status --porcelain -- <dir>' defaults to --untracked-files=normal, which collapses a fully untracked directory into one entry '?? .kotta/process/backlog/'; that line does not end in .md, so the .endsWith('.md') filter drops it and every file inside it, and the union at ui.ts:133 sees nothing. Verified the mechanism: 'git add -N .kotta/process/backlog' (which makes the paths individually visible without committing) immediately makes the same contract appear in /api/workspace. Passing --untracked-files=all to that one status call is the fix. This only bites while a state directory holds no committed file at all -- exactly a young workspace whose first contracts were just created, when someone is most likely watching the board to confirm their work landed. Same function, latent adjacent defect: line.slice(3) assumes an unquoted path, but with core.quotePath on (the default) git emits '?? "..."' for non-ASCII or spaced paths; -z output or -c core.quotePath=false would make the parse robust. Kotta's own slugs are ASCII today. Reported against main @ f585d63 (package 0.6.1); the same code is present at main @ 4da1690.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
