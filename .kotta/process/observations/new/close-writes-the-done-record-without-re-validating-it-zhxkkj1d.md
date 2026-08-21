---
id: F-01m0jd80x094rbjb3xzhxkkj1d
title: close writes the done record without re-validating it
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-21'
---
# F-01m0jd80x094rbjb3xzhxkkj1d — close writes the done record without re-validating it

## Observation

close writes the done record without re-validating it.

## Evidence

closeTask (src/commands/task.ts:466-514) checks state, --approve and branch ancestry, then writes the done file (:490) and commits (:510) with no assertValid(validateTaskFile(...)) in between — unlike cancelTask, which validates its destination (:601). A review file whose evidence section was hand-stripped closes cleanly, and MISSING_REVIEW_EVIDENCE only surfaces on the next full validate. Found during the 2026-08-21 audit.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
