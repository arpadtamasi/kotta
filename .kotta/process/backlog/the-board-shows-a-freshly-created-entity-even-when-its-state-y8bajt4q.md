---
id: T-01m0fkxgv28zs00mnyy8bajt4q
title: >-
  The board shows a freshly created entity even when its state directory has
  never been committed
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
spec: []
branch: null
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
---
# T-01m0fkxgv28zs00mnyy8bajt4q — The board shows a freshly created entity even when its state directory has never been committed

## Outcome

The board and the CLI agree about a young workspace. An entity created in a state directory that
git has never tracked — the normal shape of a workspace whose first contracts were just minted —
appears on the board immediately, exactly as it already does once that directory holds one committed
file.

## Actual behaviour

`kotta ui` reports zero entities for a state directory that contains no committed file, while
`kotta contract list` reports them correctly. The two surfaces silently disagree and the board shows
a confident `0` on its backlog chip: no notice, no diagnostic.

Measured on 2026-08-20 with the published `kotta@0.6.1`, in a temporary repository created with
`git init`, `kotta init`, one commit, then `kotta contract new --title x --type feature`:

| surface | result |
| --- | --- |
| `kotta contract list` | `backlog x T-thkjcr05` — 1 contract |
| `GET /api/workspace` from `kotta ui` | `contracts: []`, `batches: 0` |

The cause is in [`uncommittedMdAdds`](src/commands/ui.ts) (`src/commands/ui.ts:32-38`). It calls

```
git status --porcelain -- <workspace-directory>
```

which defaults to `--untracked-files=normal`, and normal mode collapses a wholly untracked directory
into a single entry naming the directory rather than its contents:

```
?? .kotta/process/backlog/
```

That line does not end in `.md`, so the `.endsWith(".md")` filter discards it, and with it every
file underneath. The union at `src/commands/ui.ts:133` — the line whose whole purpose is to make
freshly created intake visible on the base branch — then sees nothing.

The mechanism was confirmed rather than inferred: `git add -N .kotta/process/backlog`, which makes
the same files individually visible to `git status` without committing anything, made the contract
appear in `/api/workspace` on the next read.

The same function has a second, latent defect. `line.slice(3)` assumes an unquoted path, but with
`core.quotePath` at its default git emits `?? "\303\251..."` for a path with non-ASCII characters or
spaces; the resulting string matches no real file. Kotta's own slugs are ASCII today, so nothing
trips it yet.

## Expected behaviour

- `readWorkspace` lists every `.md` file under a workspace state directory on the base branch,
  whether that directory holds committed files or not.
- The board and `kotta contract list` never disagree about which entities exist.
- A path git chooses to quote is read as the file it names.
- The reads stay within their current subprocess budget: one `status` call per reload, alongside
  `rev-parse` and the cached `archive`.

## Reproduction steps

1. `git init`, one commit, `kotta init`, commit the workspace. `.kotta/process/backlog/` now exists
   and is empty — git does not track empty directories, so nothing in it is committed.
2. `kotta contract new --title "x" --type feature`.
3. `git status --porcelain -- .kotta` → `?? .kotta/process/backlog/`, one collapsed entry.
4. `kotta contract list` → the contract is listed, state `backlog`. ✅
5. `kotta ui --no-open`, then `curl http://127.0.0.1:<port>/api/workspace` → `contracts: []`. ❌
6. `git add -N .kotta/process/backlog`, re-read `/api/workspace` → the contract appears. Reversible
   with `git reset`; this is the workaround, not the fix.

The same steps in a workspace whose backlog already holds one committed file work correctly. That
difference is the whole defect.

## Environment

Any Kotta workspace on its base branch whose state directory holds no committed file, read through
`kotta ui` or `readWorkspace`. Reproduced against the published `kotta@0.6.1`; the same code stands
at `main` (`f585d63`, `4da1690`) and in the `0.6.0` dist. Independent of OS and host: it follows
from git's default `--untracked-files=normal`, not from anything Kotta configures.

## Frequency

Deterministic. Every board read of such a directory, for as long as it holds no committed file —
and it holds none until someone commits work into it.

## Impact

The board is blank precisely when someone is setting a project up and is most likely to be looking
at it to confirm that their work landed. The first impression of Kotta is a tool whose own two
surfaces contradict each other, and the failing one fails silently: an empty board with a filter
chip reading `0` is indistinguishable from an empty workspace.

It is not backlog-only. Any state directory in this shape is affected — `defined/`, `active/`,
`batches/*`, `observations/new/`, `decisions/` — so a workspace can lose whole categories of entity
from the board while the CLI keeps showing them.

## Regression-test expectation

New tests alongside the existing base-ref read tests, each failing against the current
implementation:

- A workspace on its base branch whose `process/backlog/` holds **no committed file**: a contract
  written there is returned by `readWorkspace` with status `backlog`.
- The same for a batch under `process/batches/backlog/` and an observation under
  `process/observations/new/`, so the fix is not asserted at one path only.
- A contract file whose name contains a non-ASCII character is returned correctly with git's default
  `core.quotePath`.
- The subprocess-count assertion still holds: the read makes `rev-parse`, `archive` and exactly one
  `status` call.

## Scope

1. Pass `--untracked-files=all` to the status call in `uncommittedMdAdds`
   (`src/commands/ui.ts:32-38`), so git lists untracked files individually instead of collapsing a
   directory.
2. Make the same function's path parse quote-safe — `-z` output, or `-c core.quotePath=false` — so a
   quoted path is not silently turned into a non-existent one.
3. Add the regression tests above, with a fixture whose state directories are genuinely untracked.
4. Add the sentence explaining why the flag is required to the function, next to the code it
   protects, so a later simplification does not remove it.

## Non-goals

- Making `kotta init` create a `.gitkeep`, or commit the state directories. That would hide this
  defect behind a workspace shape instead of fixing the read, and would leave every existing
  workspace broken.
- Any change to `src/git/control-plane.ts:132`, which issues the same defaulted status call but only
  tests it for emptiness before `git add <directory>`, and is therefore unaffected.
- The base-ref read path, the `archive` cache, or the worktree overlay.
- A general diagnostic surface for git failures on the board. This contract removes one silent
  disagreement; it does not add reporting for the class.
- Backporting to the published `0.6.0` or `0.5.x`.

## Acceptance

- In a repository on its base branch whose `process/backlog/` holds no committed file, a contract
  created there is present in `readWorkspace(...).contracts` with status `backlog`, and
  `/api/workspace` and `kotta contract list` name the same entities.
- The same holds for a batch under `batches/backlog/` and an observation under `observations/new/`.
- A workspace file whose name contains a non-ASCII character is read correctly with `core.quotePath`
  left at its default.
- `readWorkspace` still makes exactly one `status` subprocess per reload, and the existing
  `rev-parse` / `archive` / `status` call-count assertions pass unchanged.
- `kotta validate`, `npm run typecheck`, `npm run build` and the full suite pass.

## Verification

- `npx vitest run tests/integration/ui-batch-read.test.ts` — the new tests fail against the current
  implementation and pass after the change; the existing subprocess-budget tests keep passing.
- `npx vitest run --exclude '.worktrees/**'` for the full suite.
- `npm run typecheck` and `npm run build`.
- Manual, on the built CLI: fresh temp repository, `kotta init`, commit, `kotta contract new`,
  then `curl /api/workspace` — the contract is present while `git status --porcelain -- .kotta` still
  reports the collapsed `?? .kotta/process/backlog/` entry, proving the fix is in the read and not in
  the workspace's shape.

## Constraints

- One `status` subprocess per reload. `--untracked-files=all` is scoped to the workspace directory,
  so it enumerates workspace files only and adds no measurable cost; it must not become a second
  call.
- The board stays read-only. Nothing in the fix may write to the repository or the index —
  `git add -N` is a human's workaround, never Kotta's behaviour.
- Working-tree state stays uncached, as it is today; only ref-side content is cached.

## Open decisions

None.

## Execution notes

- `tests/integration/ui-batch-read.test.ts:105` already asserts that uncommitted additions show on
  the base branch, and it passes today — because its fixture commits contracts into `defined/`
  first, which is exactly the condition that makes git list untracked files individually. A new test
  that reuses that fixture will pass against the unfixed code and prove nothing. The fixture must
  leave the state directory with no committed file.
- Until this ships, the workaround for a blank board is `git add -N .kotta/process/backlog
  .kotta/process/batches/backlog`, reversed with `git reset`.
- Captured as `F-01m0fk8azq6k7j3bm9vptnvk5g`, with the measurements above.
