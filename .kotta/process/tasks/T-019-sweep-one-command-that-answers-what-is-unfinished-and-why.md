---
id: T-019
title: 'Sweep: one command that answers what is unfinished and why'
status: backlog
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-01'
---
# T-019 — Sweep: one command that answers what is unfinished and why

## Outcome

`a-team sweep` answers, in one command and a screenful of text, the question the operator asked five times in two days: *what is not finished, and why*. Every item names the reason it is stuck and the one action that would unstick it. Output is short by default; `--json` carries the full structure for the UI and for agents.

This ticket delivers the derivation and the CLI. The UI view is a separate ticket and must consume this command's JSON rather than re-deriving the same logic.

## Context

From F-024. The operator does not work one ticket at a time — they sweep the workspace and then decide on many tickets in one sentence. A-Team has no verb for the sweep, so it is re-improvised by an agent on every ask, which is slow, costs a full workspace read, and gives inconsistent answers between asks (the question was repeated 24 minutes later because the first answer was incomplete).

## Scope

- A new `a-team sweep` command that derives unfinished work from the workspace and from git, and prints a ranked short report.
- `--json` for the full structure.
- The derivation lives in a reusable module so the UI ticket and agents call the same code path.

## Non-goals

- No UI. No new stored state. No writes of any kind — sweep is strictly read-only.
- No new ticket states, no schema change.
- Not a replacement for `validate`. Validate answers "is the workspace well-formed"; sweep answers "what is unfinished". A malformed workspace is validate's business.

## The categories

Each item is one of these, and the category IS the reason:

1. **`waiting-on-you`** — a ticket sitting at a human gate: `review` status, or `blocked` with an open decision request. The operator's own recurring question is *"mi a teendőm?"*; this category is the answer.
2. **`stalled`** — `active`, claim held, but no commit on its branch for longer than a threshold. This is what *"de 4 órája kezdted el, mi történt?"* was asking.
3. **`undelivered`** — `done`, but the ticket records deviations that were never dispositioned. Named here deliberately: it surfaces F-020's blind spot without needing F-020's fix, because it only reads what the ticket already says.
4. **`never-started`** — `ready`, in an `active` package, with no claim and no branch. Work the package promised and skipped.
5. **`drift`** — the state on disk and the state in git disagree (claim without worktree, branch without ticket, and so on). This derivation already exists for the UI's diagnostics; sweep reuses it rather than duplicating it.
6. **`undispositioned`** — findings sitting in `findings/new/` beyond a threshold. In a live workspace this reached 35.
7. **`dangling-package`** — a package that is `active` while all of its members are `done`. It finished and nobody closed it.

## Ranking

Sorted by what costs the operator most if ignored: `waiting-on-you` first (nothing moves without them), then `stalled`, `undelivered`, `dangling-package`, `never-started`, `drift`, `undispositioned`. Within a category, oldest first — age is the signal that something was forgotten rather than in flight.

## Output contract

Default output is a short report: one header line per non-empty category with a count, then one line per item — id, title truncated, the age, and the single next action. Empty categories are omitted entirely, not printed as zeros. A clean workspace prints one line.

The default must fit on a screen. F-024 records that long structured dumps are unusable for this operator, and a sweep that has to be scrolled fails at the thing it exists for. `--json` is where completeness lives.

## Thresholds

`stalled` and `undispositioned` need age thresholds. Defaults: 4 hours for a stalled active ticket, 7 days for an undispositioned finding. Both overridable by flag. They are heuristics, not truths — the report must say which threshold produced an item so a wrong default is visible rather than silently filtering.

## Acceptance

1. `a-team sweep` in a workspace with unfinished work prints every applicable category, ranked as specified, with counts, and stays within one screen for a workspace the size of oneanda (117 tickets, 99 findings).
2. `a-team sweep` in a workspace where nothing is unfinished prints a single line saying so, and exits 0.
3. `a-team sweep --json` emits every item with its category, id, age, the reason string, and the next action, and is valid JSON.
4. Each of the seven categories is proven by a test that constructs the state and asserts the item appears in that category and no other.
5. Running sweep twice in a row produces identical output and changes no file in the workspace — proven by a git-clean assertion after the run.
6. The command runs against the oneanda workspace and its output is checked by hand against what the operator was told in conversation on 2026-07-31; discrepancies are recorded as findings, not silently fixed.

## Constraints

- Strictly read-only. Sweep must never write, move or delete anything in the workspace — it is the command an operator runs when they do not yet trust the state.
- No new stored fields. Every category must be derivable from what tickets, packages, findings and git already contain; if a category needs new state, it does not belong in this ticket.
- Reuse the existing drift derivation rather than writing a second one. Two implementations of the same truth is the defect this tool exists to prevent.
- Must run in a workspace that fails `validate`. A broken workspace is exactly when the operator needs the sweep, so a validation error may be reported but must not abort the run.

## Execution notes

Derivation module first, CLI second, so the UI ticket can consume the same function without going through the CLI. Land the categories one at a time with their tests rather than all seven at once — each category is independently useful, and a half-finished sweep that reports four categories honestly is better than seven that are guessed.

Do not tune the thresholds against the oneanda workspace until acceptance 6 has been run once with the defaults; the first honest run is the only unbiased reading of whether 4 hours and 7 days are right.

## Verification

Unit tests per category; a snapshot test for the short output; a git-status assertion for read-only behaviour; and one real run against the oneanda workspace, since that is the workspace the finding came from.

## Open decisions

None.
