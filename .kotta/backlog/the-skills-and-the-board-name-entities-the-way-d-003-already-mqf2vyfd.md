---
id: T-01kzeafjnrmdy4av76mqf2vyfd
title: The skills and the board name entities the way D-003 already decided
status: backlog
origin: human
types:
  - bug
profiles:
  - bug
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-07'
updated_at: '2026-08-07'
---
# T-01kzeafjnrmdy4av76mqf2vyfd — The skills and the board name entities the way D-003 already decided

## Outcome

The short human form of an entity id is produced by one function, and the two surfaces that write
entity references outside the CLI — the board and the shipped skills — both use it. The decision
recorded in D-003 stops being a design note and becomes the behaviour.

## Actual behaviour

D-003 (2026-07-26) separated two jobs a sequential id conflates: machine identity is a
coordination-free ULID, and humans reference by title. The code already implements the human half:

- `src/core/identity.ts:20` — `SHORT_ID_LENGTH = 8`, commented "Filename and display tail".
- `src/core/identity.ts:81` — `displayId()`, the short human-facing form.
- `src/core/identity.ts:90` — `entityFilename()`, the disk form: `slug-<short id>.md`.
- `src/core/identity.ts:100` — `filenameMatchesId()`, which matches on the **suffix**.

Two surfaces do not use it.

**The board re-declares it.** `ui/src/App.tsx:74` defines its own `displayId` rather than importing
the one in core. There are 12 call sites in that file, all of them following the correct pattern
`titleOf(id) ?? displayId(id)` — title first, short id as fallback. The board's *behaviour* is
right; its *source of truth* is a second copy that can drift from core silently.

**The skills carry no output rule.** The strings `displayId` and `shortId` do not occur anywhere
under `skills/`. The skills compose the messages a human reads when a batch starts or a contract is
handed over, and nothing tells them how to name an entity.

`displayId()` has **zero callers under `src/`**. Every one of its 12 uses is the board's own copy.

## Expected behaviour

- The board imports `displayId` from core and declares no local equivalent.
- Every skill that writes an entity reference states the rule it follows: title first, short
  `slug-hash` form as the fallback, never a bare 26-character ULID as the leading token.
- The board's rendered output is unchanged, because it already follows the rule.

## Reproduction steps

Board:

1. `grep -n "function displayId" src/core/identity.ts ui/src/App.tsx` — two declarations.
2. `grep -rn "displayId" src | grep -v identity.ts` — no results.

Skills:

1. `grep -rn "displayId\|shortId" skills/` — no results.
2. Read any batch-start message a skill produces and observe bare ULIDs leading the titles.

## Environment

Any Kotta checkout. Not host-, agent- or platform-dependent: both gaps are static properties of the
source tree.

## Frequency

Board: permanent — the duplicate declaration exists in every build.

Skills: every message a skill writes that names an entity.

## Impact

A ULID is time-ordered, so entities minted in the same session share a long leading run of
characters. Two contracts created minutes apart in a neighbouring workspace on 2026-08-07:

```
T-01kze8q493ct95ep59snxk84vt
T-01kze82m2e6jzwc2embfb297er
```

The first eight characters are identical. The eye reads left to right and sees the same string
twice; the distinguishing part is the tail — which is exactly what `displayId()` returns and what
nothing calls. Printing the full ULID is therefore not merely verbose, it is **actively
misleading**.

The observed consequence in that session: the operator signed the wrong contract of two
similarly-titled ones, and then had to retype three 26-character ids by hand to recover. An operator
request from 2026-08-03 already stated the need directly: "nem tudom, melyik id mihez kell, adj
slug+hash alakú id-ket."

This is also the first thing anyone shown the tool will see, which makes it the cheapest available
improvement to how Kotta reads to a newcomer.

## Regression-test expectation

- A component or unit test asserts the board renders the short form for a minted id and the title
  when one is known, and that assertion is satisfied by the core implementation rather than a local
  copy.
- A test asserts no file under `ui/src/` declares a function named `displayId`.
- Both fail against the current tree.

## Scope

1. Import `displayId` from `src/core/identity.ts` in `ui/src/App.tsx` and delete the local
   declaration at `:74`, leaving all 12 call sites and their rendered output unchanged.
2. Add an entity-reference output rule to every skill under `skills/` that writes entity references:
   title first, `slug-hash` short form as the fallback, never a bare full ULID as the leading token.
   State it once in a form each skill can carry, rather than restating it differently per file.
3. Add the regression tests above.

## Non-goals

- **Changing CLI output.** Printing the short form from the CLI is the larger half of this problem
  and belongs after `T-01kzda6nj9hd2z45tt06fw8n0g`, which rewrites `src/cli/index.ts` wholesale and
  pins its surface with snapshots. Touching it here would collide.
- Accepting the short form as command *input*. Resolution today requires the full ULID even though
  `filenameMatchesId()` already implements suffix matching on disk. That is a separate, larger
  change to the resolver.
- Any change to `displayId`, `entityFilename`, `filenameMatchesId`, `SHORT_ID_LENGTH`, or the
  identity model. This contract wires the existing implementation up; it does not revisit it.
- Any change to the board's layout, styling, data flow, or what it renders.
- Renaming or restructuring any skill.

## Acceptance

- `ui/src/App.tsx` contains no `displayId` declaration and imports the symbol from core.
- `grep -rn "function displayId" ui/src/` returns nothing.
- The board's rendered entity references are unchanged, verified against a capture taken before the
  change.
- Every skill under `skills/` that writes an entity reference states the output rule, and
  `grep -rl "slug-hash" skills/` lists them.
- The two regression tests exist and fail when their fix is reverted.
- No file under `src/cli/` and no file under `src/core/` is modified.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run` on the new board-import and no-local-declaration tests.
- `npm run build` — the board must still build with the core import.
- `npm run typecheck`.
- `npx vitest run --exclude '.worktrees/**'` for the full suite.
- Manual: open `kotta ui`, compare the entity references against a screenshot taken before the
  change, and confirm they are identical.
- Manual: read one skill's output rule and confirm it produces the intended form for a worked
  example.

## Constraints

- Behaviour-preserving on the board. The board already renders correctly; any visible difference is
  a defect, not an improvement.
- Do not touch `src/cli/index.ts` or `src/core/identity.ts`. The first belongs to
  `T-01kzda6nj9hd2z45tt06fw8n0g`; the second is correct as written and is what this contract exists
  to start using.
- The skills rule must be a rule, not a rewrite. Existing skill procedures stay as they are.

## Open decisions

None.

## Execution notes

- The board is the only surface in the repository that already gets this right, and it gets it right
  through a copy. That is the ordinary way a good decision stops spreading: the surface that needed
  it implemented it locally, and nothing pulled the implementation back to the middle. Fixing the
  direction of the dependency is most of the value here; the rendered output does not change at all.
- The skills half is deliberately a written rule rather than a helper, because skills are prose read
  by an agent, not code. The check that it landed is that the rule is greppable in the files that
  need it.
- The two halves are one contract because they are the two non-CLI writers of entity references and
  they share one acceptance question: does an entity reference lead with something a human can tell
  apart. Splitting them would produce two branches for four files.
- The CLI half is the larger prize and is deliberately deferred, not forgotten. Its blocker is
  sequencing, not doubt: `T-01kzda6nj9hd2z45tt06fw8n0g` rewrites the command table and pins it with
  surface snapshots, so the output change is cheap after it and conflict-prone before it.
