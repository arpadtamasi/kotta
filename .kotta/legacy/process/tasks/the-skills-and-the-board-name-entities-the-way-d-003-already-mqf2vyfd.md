---
id: T-01kzeafjnrmdy4av76mqf2vyfd
title: The skills and the board name entities the way D-003 already decided
status: done
origin: human
types:
  - bug
profiles:
  - bug
priority: medium
risk: low
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-07'
updated_at: '2026-08-23'
resolution: duplicate
cancellation_reason: >-
  The same intent, written again fourteen days later and better: entities are
  named to a human by title, with an identifier only where a title is absent or
  genuinely collides. Keeping both would split one change across two tasks.
superseded_by: T-01m0jdnv5fjechrfqwphvrrgqx
approved_by: cli
approved_at: '2026-08-23T08:28:50.074Z'
approval_basis: 'CLI --approve: task.cancel'
---
# T-01kzeafjnrmdy4av76mqf2vyfd — The skills and the board name entities the way D-003 already decided

## Outcome

Entities are named to a human by their **title**, written out in full. An identifier appears only
when there is no title, or when two titles genuinely collide. The rule is stated once, and the
board's correct implementation stops being a private copy.

## Actual behaviour

D-003 (2026-07-26) decided that machine identity is a coordination-free ULID and **humans reference
by title**. One surface implements that; the rest were never told.

**The board is right, but privately.** `ui/src/App.tsx` follows `titleOf(id) ?? displayId(id)` at all
12 of its reference sites — title first, short identifier only as a fallback. It reaches that
behaviour through its own `displayId` declared at `ui/src/App.tsx:74`, rather than importing the one
in `src/core/identity.ts:81`. The core function has **zero callers under `src/`**; every use in the
repository is the board's copy.

**The skills have no rule.** `displayId` and `shortId` occur nowhere under `skills/`. The skills
compose the messages a human actually reads — batch starts, hand-offs, summaries — and nothing tells
them how to name an entity, so they lead with whatever identifier is at hand.

**Titles are truncated where they differ.** Observed 2026-08-07 in a neighbouring workspace, a
listing shown to the operator:

```
replace-the-home-page-hero-...        status: backlog
recompose-the-home-page-around-...    status: defined
```

Both titles are cut with an ellipsis before the point at which they diverge. The operator signed the
wrong contract, then had to retype two identifiers by hand to recover:

```
T-01kze8q493ct95ep59snxk84vt
T-01kze82m2e6jzwc2embfb297er
```

A ULID is time-ordered, so entities minted minutes apart share a long leading run — here the first
eight characters. The eye reads left to right and sees the same string twice; what distinguishes
them is the tail, which is exactly what `displayId()` returns and what nothing calls.

The identifier only became load-bearing because the title had been truncated out of usefulness.

## Expected behaviour

- Every surface that names an entity to a human leads with the **title, in full**, and does not
  truncate it before the point where similar titles diverge.
- An identifier is a fallback, not a companion: shown when there is no title, or appended to
  disambiguate two entities whose titles are identical.
- When an identifier is shown, it is the short `slug-hash` form, never a bare 26-character ULID.
- The board's rendered output does not change. It already behaves this way; only the source of its
  implementation moves.

## Reproduction steps

Board:

1. `grep -n "function displayId" src/core/identity.ts ui/src/App.tsx` — two declarations.
2. `grep -rn "displayId" src | grep -v identity.ts` — no results.

Skills:

1. `grep -rn "displayId\|shortId\|slug-hash" skills/` — no results.
2. Read any batch-start or hand-off message a skill produces and observe identifiers leading the
   titles.

## Environment

Any Kotta checkout. Static properties of the source tree; not host-, agent- or platform-dependent.

## Frequency

Board: permanent, present in every build.

Skills: every message that names an entity.

## Impact

The operator's stated requirement, 2026-08-07: identifiers should not be visible at all except as a
last resort. Today they are the leading token in most text surfaces, and because of ULID prefix
sharing they are frequently indistinguishable from one another — so the surface that is supposed to
identify an entity is the one least able to.

The concrete cost already paid: a contract signed in error, and a manual recovery through three
retyped identifiers.

This is also the first thing anyone shown the tool encounters, which makes it the cheapest available
improvement to how Kotta reads to someone who has not seen it before.

## Regression-test expectation

- A test asserts no file under `ui/src/` declares a function named `displayId`.
- A test asserts the board renders the title when one is known and the short form when it is not,
  satisfied by the core implementation.
- Both fail against the current tree.

## Scope

1. Import `displayId` from `src/core/identity.ts` into `ui/src/App.tsx` and delete the local
   declaration at `:74`. All 12 call sites and their rendered output stay exactly as they are.
2. State the entity-reference rule once, in a form every skill under `skills/` can carry: title in
   full, never truncated before the point of divergence; identifier only when there is no title or
   when titles collide; short `slug-hash` form when an identifier is shown.
3. Apply that rule to the skills that compose human-facing messages naming entities.
4. Add the regression tests above.

## Non-goals

- **CLI output.** Printing the short form from the CLI is the larger half of this problem and
  belongs after `T-01kzda6nj9hd2z45tt06fw8n0g`, which rewrites `src/cli/index.ts` and pins its
  surface with snapshots. Touching it here would collide.
- Accepting the short form as command **input**. Resolution still requires the full ULID even though
  `filenameMatchesId()` already matches on the suffix; that is a separate change to the resolver.
- Any change to `displayId`, `entityFilename`, `filenameMatchesId` or `SHORT_ID_LENGTH`. This
  contract starts using the existing implementation; it does not revisit it.
- Any change to the board's layout, styling, data flow, or what it renders.
- Truncation behaviour in surfaces this repository does not own. The rule is stated so those
  surfaces can adopt it; it is not enforced here.
- Renaming or restructuring any skill.

## Acceptance

- `ui/src/App.tsx` declares no `displayId` and imports it from core; `grep -rn "function displayId"
  ui/src/` returns nothing.
- The board's rendered entity references are identical to a capture taken before the change.
- The entity-reference rule is stated in the skills that name entities, and is greppable in them.
- The two regression tests exist and fail when their fix is reverted.
- No file under `src/cli/` and no file under `src/core/` is modified.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run` on the new board-import and no-local-declaration tests.
- `npm run build` — the board must still build with the core import.
- `npm run typecheck`.
- `npx vitest run --exclude '.worktrees/**'` for the full suite.
- Manual: open `kotta ui` and compare entity references against a screenshot taken before the
  change — identical.
- Manual: take the two colliding titles from the Impact section, apply the rule by hand, and confirm
  the result distinguishes them without showing an identifier.

## Constraints

- Behaviour-preserving on the board. It already renders correctly; any visible difference is a
  defect, not an improvement.
- Do not touch `src/cli/index.ts` or `src/core/identity.ts`. The first belongs to
  `T-01kzda6nj9hd2z45tt06fw8n0g`; the second is correct as written and is what this contract exists
  to start using.
- The skills change is a rule, not a rewrite. Existing skill procedures stay as they are.

## Open decisions

None.

## Execution notes

- The rule is "title, in full" rather than "short identifier". An earlier draft of this contract had
  it backwards — it treated the short form as the goal, when the operator's requirement is not to see
  identifiers at all unless nothing else will do. The short form is the fallback's fallback.
- The truncation finding is the more valuable half. In the observed incident the identifiers were a
  symptom: the two titles differed at a point past the ellipsis, so the only distinguishing
  information left on screen was a pair of near-identical ULIDs. A rule that only shortened the
  identifiers would not have prevented it.
- The board is the only surface that already gets this right, and it gets it right through a copy —
  the ordinary way a good decision stops spreading. Reversing the direction of the dependency is
  most of the value here, and the rendered output does not change at all.
- The CLI half is deferred for sequencing, not doubt. It is the larger prize, it is cheap once the
  command table is derived from a registry, and it is conflict-prone before that.
