---
id: T-01kz3kx1ex19tjw82tbd1366pk
title: >-
  Az agenseknek szolo szabalyok csak egy masolt AGENTS.md-ben elnek, pedig a
  termeknek kellene hordoznia oket (brief header + kotta guide)
status: done
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
updated_at: '2026-08-24'
source_observation: F-01kz3k2axqqy6r4rgqmgt5ybtt
resolution: obsolete
cancellation_reason: >-
  Written before the task rename and before the coverage gate: it asks for
  'kotta contract brief' and its six acceptance conditions are all uncovered, so
  it cannot start. Most of what it wanted has landed — the D-009 fixed header
  carries the scope boundary, and the reachability wave added the '- kotta:'
  invocation line. One sentence of it survives, captured as
  T-01m0v2d804h1pk95y4bmq7fk8m.
superseded_by: T-01m0v2d804h1pk95y4bmq7fk8m
approved_by: cli
approved_at: '2026-08-24T23:41:59.859Z'
approval_basis: 'CLI --approve: task.cancel'
---
# T-01kz3kx1ex19tjw82tbd1366pk — The execution brief carries the two rules an executing agent cannot infer

> The frontmatter title is inherited from observation F-01kz3k2axqqy6r4rgqmgt5ybtt and still names
> `kotta guide`. This contract deliberately excludes it (see Non-goals); `define` cannot correct a
> title, so the heading above states the actual scope.

> This is the narrowed form of a contract that was signed on 2026-08-03 with a seven-rule scope and
> resized on 2026-08-08 before it ever ran. The cancellation in its history is an artefact of the
> only revision path Kotta offers a signed contract (F-01kzhjhe5t9exnxr4fxvjsfgbq), not a decision
> to retire the work.

## Outcome

`kotta contract brief <id>` emits a fixed, CLI-owned rules section carrying the two rules an agent
executing a contract cannot derive from the brief itself: where its work ends, and where a problem
it notices outside its Scope goes. Every executing agent receives them on the same deterministic
channel as the intent — whatever host it runs on, whether or not the Kotta skills are installed, and
whether or not the repository has an `AGENTS.md`. Because `contract execute` sends the brief as the
agent's entire stdin prompt (src/commands/execute.ts:143-145, 215), the caller can no longer weaken,
forget or paraphrase them by writing a different prompt.

## Why two rules and not seven

The brief already contains the contract: Scope, Non-goals, Acceptance, Constraints. An agent holding
that text does not need to be told to obey it — "stay inside Scope" and "do not invent product
intent" restate what the agent is already reading, and cost tokens in every brief to say it.

Two things are genuinely absent from the brief, and no amount of reading the contract supplies them:

- **Where the work ends.** The brief describes what to build, never what to do when it is built.
  An agent that finishes and stops has not finished; one that closes its own contract has taken a
  human gate.
- **Where a discovery goes.** Every real execution turns up something outside its Scope. Without a
  named destination the agent either fixes it silently — the failure this channel exists to prevent
  — or drops it.

The remaining rules from the earlier scope are guardrails on an agent that has a shell, not
instructions for the task. They belong to the calling chat, whose channel is `AGENTS.md` and the
generated rules file owned by `T-01kzh5ta34v0b4q5mxatnxppcm`. Putting them in the brief as well
would place the same text in two hand-maintained places, which is the defect that contract exists
to remove.

## Scope

1. A fixed rules section in the brief assembled by `briefContract()` (src/commands/contract.ts:347-373),
   emitted for every contract, independent of profiles, claim presence and workspace contents. It
   states two rules, each naming the exact command that satisfies it:
   - finish at `kotta contract review <id> --evidence "…"`, mapping each Acceptance item to its
     evidence; do not close the contract — closing is a human gate;
   - anything noticed outside this contract's Scope is recorded with
     `kotta observation new --title "…" --type <type> --evidence "…" --discovered-during <id>`, not
     fixed and not dropped.
2. The existing header paragraph is folded into that section rather than duplicated: it already
   states the third thing an agent cannot infer ("if the work cannot start from this brief plus the
   code in the worktree, that gap is a contract defect").
3. `largestSection` (src/commands/contract.ts:374-375) is computed over the variable sections only, so
   the token warning never names the fixed header.

## Non-goals

- The four rules dropped from the earlier scope: staying inside Scope, not inventing product intent,
  `--approve` as a human gate, never hand-editing workspace files, and not creating a second claim,
  branch or worktree. They are either a restatement of the contract the brief already carries, or
  guardrails addressed to the calling chat. Their home is `AGENTS.md` and the generated rules file.
- Any coupling to `T-01kzh5ta34v0b4q5mxatnxppcm`. That contract gives the calling chat a generated
  rules file; this one gives the executing agent two rules phrased for a different audience and a
  different moment. Neither derives its text from the other, and this contract does not wait for it.
- `kotta guide` and the missing `contract` subcommand descriptions. Separate contract: help is consulted
  by an agent already inside the workflow, the brief reaches one that never asks.
- A short `AGENTS.md` written by `kotta init`. Separate contract, and it is the open question of
  F-01kz24pa29b5yhhzpcpky2an1x.
- Making the rules configurable per workspace. See Constraints.
- Reaching agents started by hand after `kotta contract start`. They receive no brief; that gap is real
  and stays open.
- The two observations found during the original investigation: the `attach-existing` /
  `attach-to-existing-contract` enum drift (F-01kz3k6tn1mnv74fd5dm37tkv3) and entity-creating
  commands not printing the identifier (F-01kz3k7e3a6g28h5j29mg56yk6).

## Acceptance

- `kotta contract brief <id>` output contains the rules section for a contract with no profiles, no
  claim and no referenced decisions.
- Exactly two rules are present, and each names the exact command an agent needs to obey it: the
  review command with `--evidence`, and the observation command with `--discovered-during`.
- The section states that closing the contract is not the executing agent's to do.
- `largestSection` never reports the fixed header: for a contract whose body is smaller than the header,
  the reported largest section is a variable one.
- The brief stays deterministic: two runs on the same workspace produce identical bytes.
- The prompt `contract execute` writes to the agent's stdin contains the rules section.
- The fixed part of the brief stays under 200 tokens as reported by the command's own estimate.
- `kotta validate`, `npm run typecheck` and the full suite pass.

## Verification

- `npx vitest run tests/integration/brief.test.ts` — extended with a case asserting the rules section is
  present for a bare contract, a case asserting it contains both commands and no third rule, and a case
  asserting `largestSection` is never `header` when the header is the largest block.
- `npx vitest run tests/integration/contract-execute.test.ts` — the existing `KOTTA_AGENT_COMMAND` script
  double records its stdin; assert the rules section appears in it.
- `npx vitest run --exclude '.worktrees/**'` — the whole suite, to show no other brief consumer regressed.
- Manual: `kotta contract brief <this contract's id>` before and after, reporting both token counts.

## Constraints

- The rules are fixed, not configurable. A workspace that could switch them off would return the
  guarantee to the caller, which is the defect being fixed. Per-project variation belongs in `AGENTS.md`.
- Two rules, not three. A section that grows back toward the original seven has reacquired the cost
  this narrowing removed; a third rule needs its own contract and its own argument for why the brief
  cannot supply it.
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
- Measured with the estimator at src/commands/contract.ts:313 (`chars/4`): the current fixed prose is
  337 characters ≈ 85 tokens. The seven-rule block drafted for the earlier scope was 776 characters
  ≈ 194 tokens; two rules with their commands should land near a third of that, so the whole fixed part
  stays well inside the 200-token acceptance and under 1.5% of the 12000-token default warning budget.
- `tests/integration/brief.test.ts` asserts `tokens > 0` and `warning === null` at the default threshold,
  not an exact count, so the addition does not break it. The `--warn-tokens 10` case asserts only that the
  warning names the section it reports, which stays true either way.
- Source: observation F-01kz3k2axqqy6r4rgqmgt5ybtt, dispositioned after investigation.
- Downstream, and out of scope here: three neighbouring repositories carry the older rules text in their
  own `AGENTS.md` today — oneanda, crm-kit and flowbench. That debt is recorded as
  F-01kz3swfa5xh6rvxzq10cpc3k3 and now belongs to `T-01kzh5ta34v0b4q5mxatnxppcm`, which owns the
  `AGENTS.md` channel. Say so in the review evidence.
