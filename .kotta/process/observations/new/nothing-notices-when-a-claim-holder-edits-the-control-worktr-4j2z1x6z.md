---
id: F-01kzr7nkqjbv4v52024j2z1x6z
title: >-
  Nothing notices when a claim holder edits the control worktree instead of its
  execution worktree
status: new
origin: agent
observation_type: gap
confidence: high
severity: medium
discovered_during: T-01kzhnsncw8znqdn14rf5d4tfp
created_at: '2026-08-11'
---
# F-01kzr7nkqjbv4v52024j2z1x6z — Nothing notices when a claim holder edits the control worktree instead of its execution worktree

## Observation

Nothing notices when a claim holder edits the control worktree instead of its execution worktree.

## Evidence

Happened on 2026-08-11 while executing T-01kzhnsncw8znqdn14rf5d4tfp. The agent held the claim and its worktree at .worktrees/T-01kzhnsncw8znqdn14rf5d4tfp, but two source edits landed in the control checkout on main instead, because the shell's working directory had silently reset after an unrelated command ran in a temporary directory. The edits were syntactically fine, typechecked, and were only discovered because the built CLI under test lacked a field the source appeared to have. Kotta saw none of it: rule 6 says one active contract is one claim, one branch, one worktree, and rule 1 says no change without the claim you hold, but nothing observes where the changes actually land. A claim records its worktree, so a check is available — any command run while a claim exists could compare the caller's location against the claim, and 'kotta status' or 'validate' could report uncommitted source changes sitting on the base branch while a claim is open. Both were silent here. The recovery was manual: capture the diff, restore the control checkout, apply it in the worktree.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
