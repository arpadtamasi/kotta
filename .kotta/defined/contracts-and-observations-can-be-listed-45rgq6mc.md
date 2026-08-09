---
id: T-01kzm8xg1hmp20dgy545rgq6mc
title: Contracts and observations can be listed
status: defined
origin: human
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
created_at: '2026-08-09'
updated_at: '2026-08-09'
---
# T-01kzm8xg1hmp20dgy545rgq6mc — Every entity can be listed

## Outcome

`list` answers "what is in this workspace" for every entity Kotta stores: contracts, observations,
decisions and batches. An agent orienting itself stops reading `.kotta/` directories directly — the
one thing `AGENTS.md` tells it never to do — because a supported command now answers the question.

## Actual behaviour

`kotta claim list` exists. Nothing else does.

```
$ kotta contract list
error: unknown command 'list'
$ kotta observation list
error: unknown command 'list'
```

`decision` offers only `create`. `batch` offers `status <id>` — one batch, named by an id the
operator must already know. Claims, the least interesting entity in the workspace, are the only ones
that can be enumerated.

`kotta status` returns counts and bare ids:

```
Defined 3, active 0, review 1, new observations 65.
```

Sixty-five observations, each addressable only by an id that nothing prints next to its title.

Measured on 2026-08-08 and again on 2026-08-10 in this repository: agents reached for
`kotta contract list` and `kotta observation list` unprompted, took the error, and fell back to
`ls .kotta/...` — which is what the workspace rule forbids. The reach is not a wrong guess at a
differently-named command. `claim list` establishes both the verb and its shape; the other entities
simply never got one.

## Expected behaviour

- `kotta contract list`, `kotta observation list`, `kotta decision list` and `kotta batch list` each
  print their entities with id, state and title.
- Each accepts `--state <state>` to narrow, repeatable, and `--json`, like `claim list` already does.
- All read canonical state from the control plane, in a deterministic order.
- None mutates anything.

## Reproduction steps

1. `kotta contract list` → `error: unknown command 'list'`. Same for `observation`, `decision` and
   `batch`.
2. `kotta claim list` → works, proving the verb and its output shape already exist.
3. `kotta status` → counts and ids, no titles, no way to narrow.

## Impact

The workspace's own rule — never hand-read or hand-edit `.kotta/` — is unenforceable for the most
common question an arriving agent asks. Every orientation either burns turns on a failed command and
a directory listing, or silently normalises reading the canonical store by hand. Sixty-five open
observations are effectively invisible: `status` proves they exist and nothing shows what they say.

The inconsistency is its own cost. An agent that finds `claim list` reasonably infers the others
exist, and the failure teaches it that the CLI is not to be trusted for orientation.

## Scope

1. One shared listing function over the workspace's state directories, returning entities with id,
   state and title, built on the enumeration `kotta status` and the index already use rather than a
   second directory walk.
2. `contract list`, `observation list`, `decision list` and `batch list` registered on the CLI, each
   with `--state <state>` (repeatable) and `--json`, matching `claim list`'s existing shape.
   Decisions have no state directories; theirs lists the recorded decisions and ignores `--state`
   by refusing it, rather than accepting a flag that means nothing.
3. Human output: one line per entity — state, short id, title — aligned, and a final count. An empty
   result says so rather than printing nothing.
4. `--json` returns the entities as structured data and prints nothing else.
5. Expose all of them to the calling chat alongside `workspace_status`, read-only, so an agent in
   chat has the same answer as one in a terminal.
6. Tests for each command: every state, a narrowed state, a repeated `--state`, an unknown state, an
   empty result, and the `--json` shape.

## Non-goals

- Changing `kotta claim list`. It is the precedent this contract follows, not something to rework.
- Sorting, grouping or filtering beyond `--state`: no free-text search, no priority or type filters,
  no pagination. They are additions to a command that must first exist.
- Changing `kotta status`. Its counts stay what they are; `list` is the detail behind them.
- Any change to how entities are stored, named or indexed.
- Rendering anything on the board. The board already shows this; the gap is the CLI and the chat.
- A generic `kotta list <entity>` dispatcher. The verb lives under the entity, as `claim list`
  already does.

## Acceptance

- `kotta contract list`, `kotta observation list`, `kotta decision list` and `kotta batch list` each
  print their entities with state, id and title, and a count.
- `--state <state>` narrows on contracts, observations and batches, and repeating it unions the
  states.
- An unknown state is refused, naming the states that exist. `--state` on `decision list` is refused,
  naming why decisions have none.
- `--json` returns the entities as structured data and prints nothing else.
- A workspace with no matching entity reports an empty result explicitly and exits 0.
- Two runs on an unchanged workspace produce identical bytes.
- No command writes anything: the workspace is byte-identical afterwards, including the index.
- All four are reachable from the calling chat.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run` on new cases covering each command: all states, a narrowed state, a repeated
  `--state`, an unknown state, an empty result, and the `--json` shape.
- A test asserting the workspace is byte-identical after all four commands run.
- `npx vitest run --exclude '.worktrees/**'` — the full suite.
- `npm run typecheck` and `npm run build`.
- Manual: `kotta observation list` in this repository shows the open observations with their titles,
  and `kotta contract list --state review` shows only what is in review.

## Constraints

- Read-only. No command may write, commit or repair anything, including the index.
- Canonical state is the source: the listing reflects the control plane, not the working tree.
- Output stays deterministic — same workspace, same bytes — so it is usable in tests and diffs.
- The human output is scannable at a glance: the title leads, and the id is present but never the
  thing a human must read first.
- One listing implementation behind all four commands. Four hand-written walks would drift the way
  the two surface tables already do.

## Open decisions

None.

## Execution notes

- `kotta claim list` (`src/commands/claim.ts`) is the shape to match: option names, `--json`
  behaviour and output structure. Read it before writing anything.
- The state enumeration already exists for `kotta status` (`src/commands/status.ts`) and for index
  regeneration in `src/filesystem/workspace.ts`; keep one source for which states exist rather than
  restating the list a fifth time.
- Entity lookup lives in `src/filesystem/entities.js`, which already resolves an entity across state
  directories; listing is its plural.
- The chat surface is `src/commands/mcp.ts`. Read-only tools alongside `workspace_status`, read-only
  annotations, no approval gate.
- This contract touches the same two surface tables as `T-01kzda6nj9hd2z45tt06fw8n0g` ("One
  operation registry derives both the CLI and the MCP surface"), which is signed and not started.
  Neither blocks the other; whichever lands second adds these operations as registry entries rather
  than as hand-written pairs. Say in the review evidence which order happened.
- Evidence: `F-01kzhd1dptz40r9k9n6jxwxqgh`, recorded on 2026-08-08 for `contract list`. The second
  measurement on 2026-08-10 added `observation list`; this contract covers every entity, because the
  same argument applies to each and splitting it would leave the same inconsistency one entity
  smaller.
