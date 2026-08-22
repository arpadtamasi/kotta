---
id: T-01kzm8xg1hmp20dgy545rgq6mc
title: Contracts and observations can be listed
status: done
origin: human
types:
  - feature
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
branch: feat/T-01kzm8xg1hmp20dgy545rgq6mc-contracts-and-observations-can-be-listed
pull_request: 'https://github.com/arpadtamasi/kotta/pull/32'
created_at: '2026-08-09'
updated_at: '2026-08-10'
assigned_agent: claude
worktree: .worktrees/T-01kzm8xg1hmp20dgy545rgq6mc
execution_mode: inherited
resolution: completed
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

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| `kotta contract list`, `kotta observation list`, `kotta decision list` and `kotta batch list` each | Acceptance 1-2: listCommand in src/commands/list.ts over listEntities in src/filesystem/entities.ts; contract, observation, decision and batch each print state, title and id plus a count (formatList), verified by tests/integration/list.test.ts 'lists contracts and observations with their state and title' and 'decisions and batches list too'. Acceptance 3: --state narrows and repeats union — asserted for defined, backlog, their union, and an empty review. Acceptance 4: an unknown state is refused naming the states that exist ('backlog, defined, active, review, done'); --state on decision list is refused with the reason, and the option is registered on that command precisely so commander cannot answer 'unknown option' and leave the reason unstated. Acceptance 5: --json returns the entities as structured data and prints nothing else. Acceptance 6: an empty result says so ('No batches.', 'No contracts in review.') and exits 0. Acceptance 7-8: one test snapshots every file under .kotta/ before and after running all four commands and asserts byte equality, and asserts a repeated run produces identical stdout; listing opens files and writes nothing, including the index. Acceptance 9: all four are registered as read-only MCP tools alongside workspace_status, asserted in tests/integration/mcp.test.ts including a narrowed call. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 41 files, 252 passed, 1 skipped. Constraint 'one listing implementation': entityStateDirectories is the single mapping, listIds is now derived from listEntities, and status and the index read the same source. Constraint 'title leads': formatList prints state, then title, then displayId. |
| `--state <state>` narrows on contracts, observations and batches, and repeating it unions the | Acceptance 1-2: listCommand in src/commands/list.ts over listEntities in src/filesystem/entities.ts; contract, observation, decision and batch each print state, title and id plus a count (formatList), verified by tests/integration/list.test.ts 'lists contracts and observations with their state and title' and 'decisions and batches list too'. Acceptance 3: --state narrows and repeats union — asserted for defined, backlog, their union, and an empty review. Acceptance 4: an unknown state is refused naming the states that exist ('backlog, defined, active, review, done'); --state on decision list is refused with the reason, and the option is registered on that command precisely so commander cannot answer 'unknown option' and leave the reason unstated. Acceptance 5: --json returns the entities as structured data and prints nothing else. Acceptance 6: an empty result says so ('No batches.', 'No contracts in review.') and exits 0. Acceptance 7-8: one test snapshots every file under .kotta/ before and after running all four commands and asserts byte equality, and asserts a repeated run produces identical stdout; listing opens files and writes nothing, including the index. Acceptance 9: all four are registered as read-only MCP tools alongside workspace_status, asserted in tests/integration/mcp.test.ts including a narrowed call. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 41 files, 252 passed, 1 skipped. Constraint 'one listing implementation': entityStateDirectories is the single mapping, listIds is now derived from listEntities, and status and the index read the same source. Constraint 'title leads': formatList prints state, then title, then displayId. |
| An unknown state is refused, naming the states that exist. `--state` on `decision list` is refused, | Acceptance 1-2: listCommand in src/commands/list.ts over listEntities in src/filesystem/entities.ts; contract, observation, decision and batch each print state, title and id plus a count (formatList), verified by tests/integration/list.test.ts 'lists contracts and observations with their state and title' and 'decisions and batches list too'. Acceptance 3: --state narrows and repeats union — asserted for defined, backlog, their union, and an empty review. Acceptance 4: an unknown state is refused naming the states that exist ('backlog, defined, active, review, done'); --state on decision list is refused with the reason, and the option is registered on that command precisely so commander cannot answer 'unknown option' and leave the reason unstated. Acceptance 5: --json returns the entities as structured data and prints nothing else. Acceptance 6: an empty result says so ('No batches.', 'No contracts in review.') and exits 0. Acceptance 7-8: one test snapshots every file under .kotta/ before and after running all four commands and asserts byte equality, and asserts a repeated run produces identical stdout; listing opens files and writes nothing, including the index. Acceptance 9: all four are registered as read-only MCP tools alongside workspace_status, asserted in tests/integration/mcp.test.ts including a narrowed call. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 41 files, 252 passed, 1 skipped. Constraint 'one listing implementation': entityStateDirectories is the single mapping, listIds is now derived from listEntities, and status and the index read the same source. Constraint 'title leads': formatList prints state, then title, then displayId. |
| `--json` returns the entities as structured data and prints nothing else. | Acceptance 1-2: listCommand in src/commands/list.ts over listEntities in src/filesystem/entities.ts; contract, observation, decision and batch each print state, title and id plus a count (formatList), verified by tests/integration/list.test.ts 'lists contracts and observations with their state and title' and 'decisions and batches list too'. Acceptance 3: --state narrows and repeats union — asserted for defined, backlog, their union, and an empty review. Acceptance 4: an unknown state is refused naming the states that exist ('backlog, defined, active, review, done'); --state on decision list is refused with the reason, and the option is registered on that command precisely so commander cannot answer 'unknown option' and leave the reason unstated. Acceptance 5: --json returns the entities as structured data and prints nothing else. Acceptance 6: an empty result says so ('No batches.', 'No contracts in review.') and exits 0. Acceptance 7-8: one test snapshots every file under .kotta/ before and after running all four commands and asserts byte equality, and asserts a repeated run produces identical stdout; listing opens files and writes nothing, including the index. Acceptance 9: all four are registered as read-only MCP tools alongside workspace_status, asserted in tests/integration/mcp.test.ts including a narrowed call. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 41 files, 252 passed, 1 skipped. Constraint 'one listing implementation': entityStateDirectories is the single mapping, listIds is now derived from listEntities, and status and the index read the same source. Constraint 'title leads': formatList prints state, then title, then displayId. |
| A workspace with no matching entity reports an empty result explicitly and exits 0. | Acceptance 1-2: listCommand in src/commands/list.ts over listEntities in src/filesystem/entities.ts; contract, observation, decision and batch each print state, title and id plus a count (formatList), verified by tests/integration/list.test.ts 'lists contracts and observations with their state and title' and 'decisions and batches list too'. Acceptance 3: --state narrows and repeats union — asserted for defined, backlog, their union, and an empty review. Acceptance 4: an unknown state is refused naming the states that exist ('backlog, defined, active, review, done'); --state on decision list is refused with the reason, and the option is registered on that command precisely so commander cannot answer 'unknown option' and leave the reason unstated. Acceptance 5: --json returns the entities as structured data and prints nothing else. Acceptance 6: an empty result says so ('No batches.', 'No contracts in review.') and exits 0. Acceptance 7-8: one test snapshots every file under .kotta/ before and after running all four commands and asserts byte equality, and asserts a repeated run produces identical stdout; listing opens files and writes nothing, including the index. Acceptance 9: all four are registered as read-only MCP tools alongside workspace_status, asserted in tests/integration/mcp.test.ts including a narrowed call. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 41 files, 252 passed, 1 skipped. Constraint 'one listing implementation': entityStateDirectories is the single mapping, listIds is now derived from listEntities, and status and the index read the same source. Constraint 'title leads': formatList prints state, then title, then displayId. |
| Two runs on an unchanged workspace produce identical bytes. | Acceptance 1-2: listCommand in src/commands/list.ts over listEntities in src/filesystem/entities.ts; contract, observation, decision and batch each print state, title and id plus a count (formatList), verified by tests/integration/list.test.ts 'lists contracts and observations with their state and title' and 'decisions and batches list too'. Acceptance 3: --state narrows and repeats union — asserted for defined, backlog, their union, and an empty review. Acceptance 4: an unknown state is refused naming the states that exist ('backlog, defined, active, review, done'); --state on decision list is refused with the reason, and the option is registered on that command precisely so commander cannot answer 'unknown option' and leave the reason unstated. Acceptance 5: --json returns the entities as structured data and prints nothing else. Acceptance 6: an empty result says so ('No batches.', 'No contracts in review.') and exits 0. Acceptance 7-8: one test snapshots every file under .kotta/ before and after running all four commands and asserts byte equality, and asserts a repeated run produces identical stdout; listing opens files and writes nothing, including the index. Acceptance 9: all four are registered as read-only MCP tools alongside workspace_status, asserted in tests/integration/mcp.test.ts including a narrowed call. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 41 files, 252 passed, 1 skipped. Constraint 'one listing implementation': entityStateDirectories is the single mapping, listIds is now derived from listEntities, and status and the index read the same source. Constraint 'title leads': formatList prints state, then title, then displayId. |
| No command writes anything: the workspace is byte-identical afterwards, including the index. | Acceptance 1-2: listCommand in src/commands/list.ts over listEntities in src/filesystem/entities.ts; contract, observation, decision and batch each print state, title and id plus a count (formatList), verified by tests/integration/list.test.ts 'lists contracts and observations with their state and title' and 'decisions and batches list too'. Acceptance 3: --state narrows and repeats union — asserted for defined, backlog, their union, and an empty review. Acceptance 4: an unknown state is refused naming the states that exist ('backlog, defined, active, review, done'); --state on decision list is refused with the reason, and the option is registered on that command precisely so commander cannot answer 'unknown option' and leave the reason unstated. Acceptance 5: --json returns the entities as structured data and prints nothing else. Acceptance 6: an empty result says so ('No batches.', 'No contracts in review.') and exits 0. Acceptance 7-8: one test snapshots every file under .kotta/ before and after running all four commands and asserts byte equality, and asserts a repeated run produces identical stdout; listing opens files and writes nothing, including the index. Acceptance 9: all four are registered as read-only MCP tools alongside workspace_status, asserted in tests/integration/mcp.test.ts including a narrowed call. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 41 files, 252 passed, 1 skipped. Constraint 'one listing implementation': entityStateDirectories is the single mapping, listIds is now derived from listEntities, and status and the index read the same source. Constraint 'title leads': formatList prints state, then title, then displayId. |
| All four are reachable from the calling chat. | Acceptance 1-2: listCommand in src/commands/list.ts over listEntities in src/filesystem/entities.ts; contract, observation, decision and batch each print state, title and id plus a count (formatList), verified by tests/integration/list.test.ts 'lists contracts and observations with their state and title' and 'decisions and batches list too'. Acceptance 3: --state narrows and repeats union — asserted for defined, backlog, their union, and an empty review. Acceptance 4: an unknown state is refused naming the states that exist ('backlog, defined, active, review, done'); --state on decision list is refused with the reason, and the option is registered on that command precisely so commander cannot answer 'unknown option' and leave the reason unstated. Acceptance 5: --json returns the entities as structured data and prints nothing else. Acceptance 6: an empty result says so ('No batches.', 'No contracts in review.') and exits 0. Acceptance 7-8: one test snapshots every file under .kotta/ before and after running all four commands and asserts byte equality, and asserts a repeated run produces identical stdout; listing opens files and writes nothing, including the index. Acceptance 9: all four are registered as read-only MCP tools alongside workspace_status, asserted in tests/integration/mcp.test.ts including a narrowed call. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 41 files, 252 passed, 1 skipped. Constraint 'one listing implementation': entityStateDirectories is the single mapping, listIds is now derived from listEntities, and status and the index read the same source. Constraint 'title leads': formatList prints state, then title, then displayId. |
| `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass. | Acceptance 1-2: listCommand in src/commands/list.ts over listEntities in src/filesystem/entities.ts; contract, observation, decision and batch each print state, title and id plus a count (formatList), verified by tests/integration/list.test.ts 'lists contracts and observations with their state and title' and 'decisions and batches list too'. Acceptance 3: --state narrows and repeats union — asserted for defined, backlog, their union, and an empty review. Acceptance 4: an unknown state is refused naming the states that exist ('backlog, defined, active, review, done'); --state on decision list is refused with the reason, and the option is registered on that command precisely so commander cannot answer 'unknown option' and leave the reason unstated. Acceptance 5: --json returns the entities as structured data and prints nothing else. Acceptance 6: an empty result says so ('No batches.', 'No contracts in review.') and exits 0. Acceptance 7-8: one test snapshots every file under .kotta/ before and after running all four commands and asserts byte equality, and asserts a repeated run produces identical stdout; listing opens files and writes nothing, including the index. Acceptance 9: all four are registered as read-only MCP tools alongside workspace_status, asserted in tests/integration/mcp.test.ts including a narrowed call. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 41 files, 252 passed, 1 skipped. Constraint 'one listing implementation': entityStateDirectories is the single mapping, listIds is now derived from listEntities, and status and the index read the same source. Constraint 'title leads': formatList prints state, then title, then displayId. |

### Verification performed

Acceptance 1-2: listCommand in src/commands/list.ts over listEntities in src/filesystem/entities.ts; contract, observation, decision and batch each print state, title and id plus a count (formatList), verified by tests/integration/list.test.ts 'lists contracts and observations with their state and title' and 'decisions and batches list too'. Acceptance 3: --state narrows and repeats union — asserted for defined, backlog, their union, and an empty review. Acceptance 4: an unknown state is refused naming the states that exist ('backlog, defined, active, review, done'); --state on decision list is refused with the reason, and the option is registered on that command precisely so commander cannot answer 'unknown option' and leave the reason unstated. Acceptance 5: --json returns the entities as structured data and prints nothing else. Acceptance 6: an empty result says so ('No batches.', 'No contracts in review.') and exits 0. Acceptance 7-8: one test snapshots every file under .kotta/ before and after running all four commands and asserts byte equality, and asserts a repeated run produces identical stdout; listing opens files and writes nothing, including the index. Acceptance 9: all four are registered as read-only MCP tools alongside workspace_status, asserted in tests/integration/mcp.test.ts including a narrowed call. Acceptance 10: kotta validate, npm run typecheck, npm run build and the full suite pass — 41 files, 252 passed, 1 skipped. Constraint 'one listing implementation': entityStateDirectories is the single mapping, listIds is now derived from listEntities, and status and the index read the same source. Constraint 'title leads': formatList prints state, then title, then displayId.

### Deviations

Two, both small and both declared rather than silent. (1) The scope did not include documentation; README and CHANGELOG entries were added anyway, because shipping a user-facing command with no release note is the defect recorded this morning as F-01kzhnb1kesarhg9j0epxwst12g, and reproducing it while adding a command would be worse than the scope addition. (2) Human output prints displayId rather than a short id: shortId returns null for a sequential id like F-007 or T-024, and the first run of the command printed 'null' beside those titles. Fixed before submission; the contract's constraint that the id is present but never first is unaffected.

### Observations created

None during execution. Two were recorded in the calling chat while this contract ran, both about other workspaces and neither discovered through this work.

### Known concerns

This branch adds four CLI commands and four MCP tools without touching the two surface tables' structure, so it lands before T-01kzda6nj9hd2z45tt06fw8n0g ('One operation registry derives both the CLI and the MCP surface'). That contract's surface-snapshot tests must therefore be written against 44 CLI subcommands and 14 MCP tools, not the counts that held when it was defined. Batch list reads the batches/<state> directories directly through the shared mapping; batches whose state directories a merge left duplicated are listed once per copy, the same way status reports them, and deduplication stays batch dedupe's job.
