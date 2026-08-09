---
id: F-01kzm9v8gsa8zcaj1a8b91d24j
title: Nothing notices when a contract's premise expires before it is executed
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-09'
---
# F-01kzm9v8gsa8zcaj1a8b91d24j — Nothing notices when a contract's premise expires before it is executed

## Observation

Nothing notices when a contract's premise expires before it is executed.

## Evidence

Two instances on 2026-08-09 and 2026-08-10. In goschool-web, a contract was defined for an 'npm ci' EUSAGE failure caused by a lockfile out of sync; by the time it was executed the lockfile had come right on its own and 'npm ci --dry-run' passed on main. The defect the contract exists to fix no longer existed, and only the workflow half of its scope remained real. In this repository, T-01kzdhtqw01nbgdg5dd9cw3zpr was implemented with a hardcoded 'bypassPermissions' whose justification — that a headless agent otherwise cannot write — stopped being the whole story once it was clear the agent's own project settings already reach a spawned run. In both cases the contract still read as valid: it validates, it signs, its acceptance conditions are checkable. Nothing in the workflow asks whether its premise still holds. A contract records when it was created and updated, and Kotta reports its state, but staleness is neither measured nor surfaced: 'kotta status' shows a two-week-old defined contract and a two-hour-old one identically. The cost is asymmetric — a contract executed against an expired premise either delivers something nobody needs, or quietly delivers something other than what it says, which is the failure F-01kzhnpeadvsq1yxhkcdtrdt8d describes from the other end.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
