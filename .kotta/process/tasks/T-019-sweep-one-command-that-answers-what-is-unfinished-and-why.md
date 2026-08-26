---
id: T-019
title: 'Sweep: one command that answers what is unfinished and why'
status: active
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-26'
spec:
  - UC-01m0f0wn89m98wpkqq8e5c9p6p
  - IF-01m0f0wn8994dzf9z1sdygxa04
coverage:
  'Every category is derived, not guessed, and each item names the reason it stopped and the one action that would move it. Each category is proven by a test that builds the state and asserts the item appears there and nowhere else.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
  'The default output fits a screen and a still workspace says so in one line. Categories with nothing in them are omitted rather than printed as zeros, and `--json` is where completeness lives.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'Sweep writes nothing and runs where validate refuses. Two runs produce identical output, the workspace is untouched after both, and a workspace that fails validation is still swept — the failure is reported, not fatal.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
  'A heuristic says so. Every item an age threshold produced names that threshold in its reason, and both thresholds are overridable, so a wrong default is visible rather than silently filtering.':
    - UC-01m0f0wn89m98wpkqq8e5c9p6p
    - IF-01m0f0wn8994dzf9z1sdygxa04
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 49606150d9c1bae8a82e62d02b0d6b1906148ba6
---
## Outcome

`kotta sweep` answers, in one command and a screenful, the question this workspace's owner asks most: *what is not finished, and why*. Asked six times in one session on 2026-08-26 alone — "hogy áll a backlog", "mi van nyitva", "observations és backlog" — and answered six times by hand, with ad-hoc scripts over `.kotta/`, because `kotta status` gives three counts and nothing else. Re-improvised on every ask is slow, costs a full workspace read, and gives a different answer each time.

Written as T-019 on 2026-08-01 in the pre-rename vocabulary. The categories survive the rename; one does not survive the code, and is replaced by what is actually readable rather than kept as a guess.

## Scope

- A derivation module that answers the question from tasks, batches, observations, claims and Git, with no stored state and no writes.
- `kotta sweep`, printing a ranked short report, and `--json` carrying the full structure so the board and agents call one code path rather than two.
- The seven categories below, each landed with its test.

## The categories

The category is the reason:

1. **`waiting-on-you`** — a task in `review`, or an approval proposed and never decided. The second half was unreadable when T-019 was written and is readable now: an approval event in `proposed` with no terminal phase after it.
2. **`stalled`** — `active`, claim held, no commit on its branch for longer than the threshold.
3. **`undeclared-deviation`** — `done`, its review declared a deviation, and its `Observations created` says nothing was recorded. T-019 asked for "deviations never dispositioned"; deviations have no disposition, so this is the same blind spot in terms the record actually carries.
4. **`never-started`** — `defined`, a member of an `active` batch, with no claim and no branch. Work a batch promised and skipped.
5. **`drift`** — the workspace and Git disagree: a claim whose worktree is gone, a feature branch with no task, a task `active` with no claim.
6. **`undispositioned`** — an observation `new` for longer than the threshold.
7. **`dangling-batch`** — a batch `active` while every member is `done`. It finished and nobody closed it.

## Ranking

By what standing still costs: `waiting-on-you`, `stalled`, `undeclared-deviation`, `dangling-batch`, `never-started`, `drift`, `undispositioned`. Oldest first inside a category — age is what distinguishes forgotten from in flight.

## Non-goals

- The board. It consumes this command's JSON in its own task rather than deriving the same truth twice.
- New stored state, new task states, and any write at all.
- Replacing `validate`. Validate answers whether the workspace is well-formed; sweep answers what has stopped.
- Tuning the thresholds. The first honest run with the defaults is the only unbiased reading of whether four hours and seven days are right.

## Acceptance

- Every category is derived, not guessed, and each item names the reason it stopped and the one action that would move it. Each category is proven by a test that builds the state and asserts the item appears there and nowhere else.
- The default output fits a screen and a still workspace says so in one line. Categories with nothing in them are omitted rather than printed as zeros, and `--json` is where completeness lives.
- Sweep writes nothing and runs where validate refuses. Two runs produce identical output, the workspace is untouched after both, and a workspace that fails validation is still swept — the failure is reported, not fatal.
- A heuristic says so. Every item an age threshold produced names that threshold in its reason, and both thresholds are overridable, so a wrong default is visible rather than silently filtering.

## Verification

- `run: npx vitest run tests/integration/sweep.test.ts` — the seven categories, the ranking, the empty workspace, the read-only guarantee and the thresholds.
- `run: npx vitest run tests/integration/surface-snapshot.test.ts tests/integration/operation-registry.test.ts` — the command reaches the declared surface once.

## Constraints

Strictly read-only: sweep is what an operator runs when they do not yet trust the state, so it must never write, move or delete anything — asserted by a clean git status after a run, not by inspection.

It must survive a workspace that fails `validate`, because that is exactly when it is needed. A malformed entity is reported as one item, never a crash.

Derivable from what already exists. A category that needs a new stored field is out of scope, not invented.

## Open decisions

None.

## Execution notes

The derivation goes in its own module and the CLI calls it, so the board's own task can consume the same function.

`listClaims` (`src/commands/claim.ts`), `linkedWorktrees` and `branchExists` (`src/git/coordinator.ts`), `readEvents` (`src/core/events.ts`) and `listEntities` (`src/filesystem/entities.ts`) are what the categories read; the board's `readNotices` in `src/commands/ui.ts` already derives part of `drift` and must be reused rather than rewritten.

Land the categories one at a time with their tests. Four categories reported honestly beat seven guessed — the instruction is T-019's own, and it was right.
