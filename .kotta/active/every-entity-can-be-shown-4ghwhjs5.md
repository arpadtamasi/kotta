---
id: T-01kzn4jcktrv988d0n4ghwhjs5
title: Every entity can be shown
status: active
origin: human
types:
  - feature
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
branch: feat/T-01kzn4jcktrv988d0n4ghwhjs5-every-entity-can-be-shown
pull_request: null
created_at: '2026-08-10'
updated_at: '2026-08-10'
assigned_agent: claude
worktree: .worktrees/T-01kzn4jcktrv988d0n4ghwhjs5
execution_mode: inherited
---
# T-01kzn4jcktrv988d0n4ghwhjs5 — Every entity can be shown, and named the way it is printed

## Outcome

An entity the CLI printed can be read by the name the CLI printed. `show` returns one entity's stored
facts and body for every kind, and every command that takes an id accepts the short form that
`list`, `status` and the commit trailers already display.

## Actual behaviour

There is no `show`. `kotta contract show <id>` and `kotta batch show <id>` both answer
`error: unknown command 'show'`, measured on 2026-08-10 in a calling chat that reached for both
unprompted, one after the other, and fell back to reading `.kotta/` files.

`brief` is not it. `kotta contract brief <id>` assembles the execution package — the contract plus its
referenced decisions, profiles and claim, sized and warned about in tokens — for an agent that is
about to implement. It is the wrong thing to hand a human asking what a contract says, and it exists
for contracts only.

The second half is worse, because Kotta caused it. The CLI displays short ids everywhere —
`displayId` in `list`, in `status`, in human output — and refuses them on input:

```
$ kotta contract list --state defined
  defined  A contract that proves incomplete has a way back  T-rf5d4tfp
$ kotta contract validate T-rf5d4tfp
Error: Contract T-rf5d4tfp was not found.
```

`filenameMatchesId` (src/core/identity.ts:100-105) derives the short form from a full id to match a
filename; nothing resolves the short form back to an entity. Every id Kotta prints is therefore
unusable in the command it was printed for. `T-01kzm8xg1hmp20dgy545rgq6mc` shipped `list`, which
made this visible on every row of every listing rather than occasionally.

## Expected behaviour

- `kotta contract show <id>`, `kotta observation show <id>`, `kotta decision show <id>` and
  `kotta batch show <id>` print the entity's stored facts and its body.
- Each supports `--json`, and none writes anything.
- Every command taking an id accepts the short form as well as the full one, and says so when a short
  form is ambiguous rather than guessing.

## Reproduction steps

1. `kotta contract show <id>` → `error: unknown command 'show'`. Same for `batch`.
2. `kotta contract list --state defined` → prints `T-rf5d4tfp`.
3. `kotta contract validate T-rf5d4tfp` → `Contract T-rf5d4tfp was not found`.

## Impact

The two halves compound. Without `show`, reading an entity means opening a file under `.kotta/`,
which the workspace rule forbids. With short ids unresolvable, even a human who has the listing in
front of them must go and find the full id first — by reading the same directory. Kotta prints an
identifier as an invitation and then declines it, which teaches every reader that the CLI's output
is not the CLI's input.

## Scope

1. `showEntity(root, entity, id)` over the existing lookup, returning the entity's frontmatter facts,
   its body, its state and its path.
2. `contract show`, `observation show`, `decision show` and `batch show` on the CLI, each with
   `--json`, registered next to their `list` siblings.
3. Human output: the title as a heading, the facts that are set as a short block — state, type,
   priority, risk, branch, pull request, batch, dependencies — and then the body verbatim. Unset
   fields are omitted rather than printed empty.
4. Short-id resolution in the shared entity lookup: an id that matches the displayed short form
   resolves to its entity, on every command that takes an id, not only on `show`.
5. An ambiguous short form is refused, listing the full ids it matched. A short form that matches
   nothing fails as an unknown id does today.
6. Expose `show` to the calling chat as read-only tools alongside the `list` ones.
7. Tests for each command, for the short-id path on a command other than `show`, and for the
   ambiguous and unknown cases.

## Non-goals

- Changing `kotta contract brief`. It stays the execution package, and `show` never becomes a second
  one: no token accounting, no decisions, no profiles, no claim.
- Changing `kotta batch status`. It reports member progress; `show` prints the batch entity. Both
  stay, and the descriptions say which answers which.
- Rendering lifecycle events or conversation. What happened to an entity is a real question and a
  separate command; `show` prints what the entity is.
- Minting shorter ids, changing `displayId`, or changing how ids are generated or stored.
- Accepting title fragments, prefixes other than the displayed short form, or fuzzy matching.

## Acceptance

- `kotta contract show <id>` prints the contract's title, its set facts and its body, for a full id
  and for the short id `list` prints for it.
- The same holds for `observation show`, `decision show` and `batch show`.
- `--json` returns the entity as structured data and prints nothing else.
- A command that is not `show` — `kotta contract validate` is the case measured — accepts the short
  id and acts on the right entity.
- An ambiguous short id is refused, naming every full id it matched, and nothing is read or written
  on that path.
- An unknown id fails exactly as it does today, naming the id.
- No command writes anything: the workspace is byte-identical afterwards.
- Both are reachable from the calling chat.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run` on new cases: each `show`, the short-id path through `contract validate`, an
  ambiguous short id, an unknown id, and the `--json` shape.
- A test asserting the workspace is byte-identical after every `show` runs.
- A test asserting `brief` and `batch status` are unchanged.
- `npx vitest run --exclude '.worktrees/**'` — the full suite.
- `npm run typecheck` and `npm run build`.
- Manual: `kotta contract list`, then `kotta contract show` on a short id copied from that output.

## Constraints

- Read-only. No `show` may write, commit or repair anything, including the index.
- One lookup. Short-id resolution belongs in the shared entity lookup, not in each command, or the
  commands will disagree about which ids exist.
- Ambiguity is refused, never guessed. Two entities behind one short form is a question for the
  operator, and picking one silently is the worse failure.
- Canonical state is the source: `show` reflects the control plane, not the working tree.

## Open decisions

None.

## Execution notes

- The lookup to extend is `findContract` and `filenameMatchesId` (src/core/identity.ts:100-105); the
  short form is already computed there for the forward direction, so the reverse belongs beside it.
- `listEntities` and `entityStateDirectories` (src/filesystem/entities.ts) landed with
  `T-01kzm8xg1hmp20dgy545rgq6mc` and already enumerate every entity kind; `show` resolves one within
  the same mapping rather than introducing a second walk.
- `src/commands/list.ts` is the shape to match for the command module, the result envelope and the
  human formatter.
- The chat surface is `src/commands/mcp.ts`, where the four `*_list` tools now sit; `show` joins them
  with the same read-only annotations.
- This contract touches the same two surface tables as `T-01kzda6nj9hd2z45tt06fw8n0g` ("One
  operation registry derives both the CLI and the MCP surface"), which is signed and not started.
  Neither blocks the other; whichever lands second adds these operations as registry entries. Say in
  the review evidence which order happened.
- Short-id collisions are unlikely but not impossible: the short form is the last 8 characters of a
  26-character ULID suffix. The refusal path is cheap to build and cannot be retrofitted quietly
  once a command has silently picked a winner, which is why it is in scope rather than deferred.
