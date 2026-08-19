---
id: F-006
title: >-
  a-team ui reads state from a churning working tree, so findings flicker/vanish
  from the UI
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-26'
disposition: create-contract
resolved_at: '2026-07-26T20:13:07.495Z'
contract: T-016
---
# F-006 — a-team ui reads state from a churning working tree, so findings flicker/vanish from the UI

## Observation

a-team ui reads state from a churning working tree, so findings flicker/vanish from the UI.

## Evidence

Discovered 2026-07-26 while dogfooding on the real one&a workspace (/Users/rp/Dev/ezchops/oneanda), which runs 'a-team ui --workspace .' (PID 86590) against a primary checkout that is constantly re-branched.

SYMPTOM: findings appear to vanish from the workspace/UI and later reappear. During this session a scan of .a-team/findings/resolved/ showed only 52 legacy O- findings and 0 native F- findings; minutes later the same directory showed 6 F- + 52 O-, with a CLEAN git status both times.

ROOT CAUSE: the UI/read layer derives state from the primary working tree's current git HEAD, but that working directory is used as a shared branch-switching surface.
- git reflog (one&a): 'checkout: moving from pkg/P-015-android-beta to main' then 'pull --ff-only'. While HEAD sat on the package branch, the F- findings dispositioned on main (commit e8915596) were absent from the tree — so the UI could not see them.
- Transcripts for the project show pervasive rebranching of the MAIN dir: many 'git checkout main && git pull --ff-only', 'git reset --hard origin/main', and 'git checkout -b claude/...' invocations. Work is supposed to stay in .worktrees/T-*, leaving the primary dir on main, but that invariant is violated.
- 10 separate session transcripts mention findings missing/disappearing — this is recurring, not a one-off.

All 8 native findings are in fact accounted for in git history (F-001..F-006 resolved, F-007 new, F-008 resolved via T-048/PR#122); nothing is permanently deleted. The defect is that derived state is read from an UNSTABLE reference instead of a canonical one.

IMPACT: violates the product's foundational 'truth from derivation' principle (ui/UX-SPEC.md §2 and §7 state-drift). The operator cannot trust the UI's entity list; my own analysis of the workspace was corrupted by reading a transient branch state (reported 61 backlog/4 done and '0 native findings'; clean counts from main are 65 backlog/7 done, 6+1 native F- findings).

FIX DIRECTION: derive .a-team state from a fixed ref (e.g. 'git show main:.a-team/...', a dedicated read-only checkout, or the index regenerated on commit) rather than the primary working tree's momentary HEAD; and/or enforce that the primary working directory stays pinned to main with all work isolated in worktrees. The drift-aware union of main + active worktrees (UX-SPEC §7) is the deliberate design that should replace the accidental current behavior.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
