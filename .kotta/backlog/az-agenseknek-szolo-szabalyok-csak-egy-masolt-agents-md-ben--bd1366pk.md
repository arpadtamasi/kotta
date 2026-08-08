---
id: T-01kz3kx1ex19tjw82tbd1366pk
title: >-
  Az agenseknek szolo szabalyok csak egy masolt AGENTS.md-ben elnek, pedig a
  termeknek kellene hordoznia oket (brief header + kotta guide)
status: backlog
origin: observation
types:
  - feature
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-03'
updated_at: '2026-08-08'
source_observation: F-01kz3k2axqqy6r4rgqmgt5ybtt
resolution: null
---
# T-01kz3kx1ex19tjw82tbd1366pk — The execution brief carries the agent rules, so they do not depend on the caller

> The frontmatter title is inherited from observation F-01kz3k2axqqy6r4rgqmgt5ybtt and still names
> `kotta guide`. This contract deliberately excludes it (see Non-goals); `define` cannot correct a
> title, so the heading above states the actual scope.

## Outcome

`kotta contract brief <id>` emits a fixed, CLI-owned rules section, so every agent that executes a
contract receives the execution-time rules on the same deterministic channel as the intent — whatever
host it runs on, whether or not the Kotta skills are installed, and whether or not the repository has
an `AGENTS.md`. Because `contract execute` sends the brief as the agent's entire stdin prompt
(src/commands/execute.ts:143-145, 215), the caller can no longer weaken, forget or paraphrase the
rules by writing a different prompt.

## Scope

1. A fixed rules section in the brief assembled by `briefContract()` (src/commands/contract.ts:347-373),
   emitted for every contract, independent of profiles, claim presence and workspace contents. It states
   the six rules that bind an agent already holding the claim:
   - stay inside Scope; anything noticed outside it is recorded with
     `kotta observation new … --discovered-during <id>`, not fixed;
   - do not invent product intent or accepted trade-offs — missing intent is a contract defect, record
     it and stop;
   - `--approve` is a human gate, on every command;
   - finish at `kotta contract review <id> --evidence "…"`, mapping each Acceptance item to its
     evidence; do not close the contract;
   - never hand-edit files under the workspace directory; every state change is a `kotta` command;
   - the claim, branch and worktree already exist for this run — do not create another, and never work
     on a protected branch.
2. The existing header paragraph is folded into that section rather than duplicated: it already states
   the seventh rule ("if the work cannot start from this brief plus the code in the worktree, that gap
   is a contract defect").
3. `largestSection` (src/commands/contract.ts:374-375) is computed over the variable sections only, so
   the token warning never names the fixed header.

## Non-goals

- `kotta guide` and the missing `contract` subcommand descriptions. Separate contract: help is consulted
  by an agent already inside the workflow, the brief reaches one that never asks.
- A short `AGENTS.md` written by `kotta init`. Separate contract, and it is the open question of
  F-01kz24pa29b5yhhzpcpky2an1x. Entry-time rules ("this repository runs on Kotta", "no change without a
  contract") stay there on purpose: an agent that receives a brief is already past them.
- Making the rules configurable per workspace. See Constraints.
- Reaching agents started by hand after `kotta contract start`. They receive no brief; that gap is real
  and stays open.
- The two observations found during the investigation: the `attach-existing` / `attach-to-existing-contract`
  enum drift (F-01kz3k6tn1mnv74fd5dm37tkv3) and entity-creating commands not printing the identifier
  (F-01kz3k7e3a6g28h5j29mg56yk6).

## Acceptance

- `kotta contract brief <id>` output contains the rules section for a contract with no profiles, no
  claim and no referenced decisions.
- The six rules are present and each names the exact command an agent needs to obey it: the observation
  command with `--discovered-during`, and the review command.
- `largestSection` never reports the fixed header: for a contract whose body is smaller than the header,
  the reported largest section is a variable one.
- The brief stays deterministic: two runs on the same workspace produce identical bytes.
- The prompt `contract execute` writes to the agent's stdin contains the rules section.
- The fixed part of the brief stays under 400 tokens as reported by the command's own estimate.

## Verification

- `npx vitest run tests/integration/brief.test.ts` — extended with a case asserting the rules section is
  present for a bare contract, and a case asserting `largestSection` is never `header` when the header is
  the largest block.
- `npx vitest run tests/integration/contract-execute.test.ts` — the existing `KOTTA_AGENT_COMMAND` script
  double records its stdin; assert the rules section appears in it.
- `npx vitest run` — the whole suite, to show no other brief consumer regressed.
- Manual: `kotta contract brief <this contract's id>` before and after, reporting both token counts.

## Constraints

- The rules are fixed, not configurable. A workspace that could switch them off would return the
  guarantee to the caller, which is the defect being fixed. Per-project variation belongs in `AGENTS.md`.
- The brief stays deterministic and offline: no clock, no network, no state outside the workspace.
- English, matching every other CLI surface.
- The added text is prose an agent acts on, not a legal preamble: no rule without the command that
  satisfies it.

## Open decisions

None.

## Execution notes

- The insertion point is `briefContract()` in src/commands/contract.ts:347-373. The `parts` array already
  models the brief as named sections with measured sizes; the rules belong in it as a named part so the
  size report stays honest.
- Measured beforehand with the estimator at src/commands/contract.ts:313 (`chars/4`): the current fixed
  prose is 337 characters ≈ 85 tokens, a drafted rules block 776 characters ≈ 194 tokens — together 2.3%
  of the 12000-token default warning budget.
- `tests/integration/brief.test.ts` asserts `tokens > 0` and `warning === null` at the default threshold,
  not an exact count, so the addition does not break it. The `--warn-tokens 10` case asserts only that the
  warning names the section it reports, which stays true either way.
- Source: observation F-01kz3k2axqqy6r4rgqmgt5ybtt, dispositioned after investigation.
- Downstream, and out of scope here: three neighbouring repositories carry the same rules in their own
  `AGENTS.md` today — oneanda, crm-kit and flowbench. Once this contract is done those blocks are
  duplicated text that will drift from the brief. They live in other repositories, so this contract
  neither edits nor mentions them there; the debt is recorded as F-01kz3swfa5xh6rvxzq10cpc3k3, and
  closing this contract is what makes that observation actionable. Say so in the review evidence.
