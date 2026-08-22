---
id: F-01kztt3mce0yk9pm7jd9dex3w5
title: >-
  Kotta's branch name is hardcoded and nothing decides who wins when the host
  names the branch first
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-12'
disposition: attach-existing
resolved_at: '2026-08-12T12:06:24.833Z'
---
# F-01kztt3mce0yk9pm7jd9dex3w5 — Kotta's branch name is hardcoded and nothing decides who wins when the host names the branch first

## Observation

Kotta's branch name is hardcoded and nothing decides who wins when the host names the branch first.

## Evidence

Reported by the operator on 2026-08-12: Claude Code running in the cloud works with its own branch names, and asked which naming takes priority.

Nothing in Kotta answers that, and the setting that looks like the answer is dead. `.kotta/config.yaml` carries `git.branch_pattern: "{prefix}/{id}-{slug}"`, and schemas/config.schema.json:28 makes it a required field with a pattern constraint on its placeholders. It is written once by `initializeWorkspace` (src/filesystem/workspace.ts:192) and read nowhere: `readWorkspaceConfig` (src/core/config.ts:33-36) parses only `base_branch` and `protected_branches`, and `branchName` (src/commands/contract.ts:19) builds the name from a hardcoded `${BRANCH_PREFIXES[type] ?? "feat"}/${id}-${slug}`. An operator who sets the pattern to match their host's convention gets a validated config field that changes nothing.

The collision is worse than cosmetic. `startContract` refuses when the branch it wants already exists — `Branch already exists: ${branch}` (src/commands/contract.ts) — and otherwise creates its own with `git worktree add <path> -b <branch> HEAD`. An environment that has already checked out a branch of its own choosing therefore gets a second branch and a second worktree for the same work, and the claim records Kotta's name while the code is being written on the host's. Every later step reads the claim: `review` asserts the execution worktree is clean, `close` verifies the recorded branch is merged, `cancel` preserves it. All of them will be looking at the wrong branch.

There are two separable questions here, and only the operator can settle the second. (1) `branch_pattern` should either be read or removed; a required, schema-validated setting that does nothing is worse than an absent one. (2) When the execution environment names the branch first, either Kotta adopts the existing branch into the claim, or it insists on its own and the host must follow — and today neither is chosen, stated, or detectable before the work has already started on the wrong one.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
