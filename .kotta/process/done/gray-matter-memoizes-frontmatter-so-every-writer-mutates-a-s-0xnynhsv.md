---
id: T-01m0f27dqfp9xzgmbe0xnynhsv
title: 'gray-matter memoizes frontmatter, so every writer mutates a shared object'
status: done
origin: observation
types:
  - fix
profiles: []
priority: high
risk: low
batch: null
depends_on: []
blocks: []
branch: >-
  feat/T-01m0f27dqfp9xzgmbe0xnynhsv-gray-matter-memoizes-frontmatter-so-every-writer-mutates-a-s
pull_request: null
created_at: '2026-08-20'
updated_at: '2026-08-20'
source_observation: F-01kz294gj4sy9gcc56s8j3h62g
assigned_agent: claude
worktree: .worktrees/T-01m0f27dqfp9xzgmbe0xnynhsv
execution_mode: inherited
branch_origin: created
start_ref: HEAD
start_commit: 32ab9f0eaae11b8214036cea3fcff48914422824
resolution: completed
---
## Outcome

Two parses of the same file yield two independent objects. `parseMarkdown` hands every caller its
own frontmatter, so one command's in-place edit can never be observed by the next parse inside the
same process, and no caller has to remember to clone defensively.

## Scope

`parseMarkdown` in `src/core/markdown.ts`: return frontmatter the caller owns, defeating
gray-matter's memoization of `matter(source)`. The private `structuredClone` that
`src/commands/migrate.ts` added to work around this, which becomes redundant once the shared
parser is safe.

## Non-goals

Replacing gray-matter, changing the frontmatter format, or altering `renderMarkdown`. Auditing
every existing mutation site — the point is that the parser stops handing out shared state, not
that callers stop mutating.

## Acceptance

- Parsing the same source twice returns objects that are not the same reference, and mutating the
  first leaves the second unchanged.
- `kotta migrate` plans the same file twice with the same reported change list both times.
- `migrate.ts` no longer carries its own clone of parsed frontmatter.

## Verification

- A unit test parses one source twice, mutates the first result, and asserts the second is
  unaffected.
- A test plans a migration twice in one process and asserts both runs report the same changes.
- `npm test` passes.

## Constraints

Nested frontmatter values must be copied too, not shared one level down.

## Open decisions

None.

## Execution notes

Reported as F-01kz294gj4sy9gcc56s8j3h62g. It bit `kotta migrate` during T-023: planning a file
twice reported an empty change list the second time. Single-command CLI runs mostly hide it; the
UI server is long-lived and parses repeatedly, so it is exposed there.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Parsing the same source twice returns objects that are not the same reference, and mutating the | Acceptance 1 (two parses are independent): tests/unit/markdown.test.ts, 'hands every caller its own object, so one caller's edit cannot reach the next parse' — parses one source twice, asserts the two data objects are not the same reference, then mutates a top-level key and a nested array element on the first and asserts the second is untouched.  Acceptance 2 (migrate plans the same file twice identically): tests/integration/migrate.test.ts, 'planning twice in one process reports the same changes both times (F-01kz294gj4sy9gcc56s8j3h62g)' — calls migrateWorkspace({dryRun:true}) twice in one process against the legacy fixture and asserts both runs report the same ids and the same change list. Before the fix the second run reported an empty change list.  Acceptance 3 (migrate.ts carries no clone of its own): src/commands/migrate.ts planEntity now reads parsed.data directly; the structuredClone call and the comment explaining it are gone. 'grep -n structuredClone src/commands/migrate.ts' returns nothing.  Constraint (nested values copied, not shared one level down): covered by the nested depends_on array assertion in the unit test.  Suite: npm test — 47 test files, 329 passed, 1 skipped, exit 0. npm run typecheck — clean. Commit bdb4df6 on feat/T-01m0f27dqfp9xzgmbe0xnynhsv-gray-matter-memoizes-frontmatter-so-every-writer-mutates-a-s. |
| `kotta migrate` plans the same file twice with the same reported change list both times. | Acceptance 1 (two parses are independent): tests/unit/markdown.test.ts, 'hands every caller its own object, so one caller's edit cannot reach the next parse' — parses one source twice, asserts the two data objects are not the same reference, then mutates a top-level key and a nested array element on the first and asserts the second is untouched.  Acceptance 2 (migrate plans the same file twice identically): tests/integration/migrate.test.ts, 'planning twice in one process reports the same changes both times (F-01kz294gj4sy9gcc56s8j3h62g)' — calls migrateWorkspace({dryRun:true}) twice in one process against the legacy fixture and asserts both runs report the same ids and the same change list. Before the fix the second run reported an empty change list.  Acceptance 3 (migrate.ts carries no clone of its own): src/commands/migrate.ts planEntity now reads parsed.data directly; the structuredClone call and the comment explaining it are gone. 'grep -n structuredClone src/commands/migrate.ts' returns nothing.  Constraint (nested values copied, not shared one level down): covered by the nested depends_on array assertion in the unit test.  Suite: npm test — 47 test files, 329 passed, 1 skipped, exit 0. npm run typecheck — clean. Commit bdb4df6 on feat/T-01m0f27dqfp9xzgmbe0xnynhsv-gray-matter-memoizes-frontmatter-so-every-writer-mutates-a-s. |
| `migrate.ts` no longer carries its own clone of parsed frontmatter. | Acceptance 1 (two parses are independent): tests/unit/markdown.test.ts, 'hands every caller its own object, so one caller's edit cannot reach the next parse' — parses one source twice, asserts the two data objects are not the same reference, then mutates a top-level key and a nested array element on the first and asserts the second is untouched.  Acceptance 2 (migrate plans the same file twice identically): tests/integration/migrate.test.ts, 'planning twice in one process reports the same changes both times (F-01kz294gj4sy9gcc56s8j3h62g)' — calls migrateWorkspace({dryRun:true}) twice in one process against the legacy fixture and asserts both runs report the same ids and the same change list. Before the fix the second run reported an empty change list.  Acceptance 3 (migrate.ts carries no clone of its own): src/commands/migrate.ts planEntity now reads parsed.data directly; the structuredClone call and the comment explaining it are gone. 'grep -n structuredClone src/commands/migrate.ts' returns nothing.  Constraint (nested values copied, not shared one level down): covered by the nested depends_on array assertion in the unit test.  Suite: npm test — 47 test files, 329 passed, 1 skipped, exit 0. npm run typecheck — clean. Commit bdb4df6 on feat/T-01m0f27dqfp9xzgmbe0xnynhsv-gray-matter-memoizes-frontmatter-so-every-writer-mutates-a-s. |

### Verification performed

Acceptance 1 (two parses are independent): tests/unit/markdown.test.ts, 'hands every caller its own object, so one caller's edit cannot reach the next parse' — parses one source twice, asserts the two data objects are not the same reference, then mutates a top-level key and a nested array element on the first and asserts the second is untouched.

Acceptance 2 (migrate plans the same file twice identically): tests/integration/migrate.test.ts, 'planning twice in one process reports the same changes both times (F-01kz294gj4sy9gcc56s8j3h62g)' — calls migrateWorkspace({dryRun:true}) twice in one process against the legacy fixture and asserts both runs report the same ids and the same change list. Before the fix the second run reported an empty change list.

Acceptance 3 (migrate.ts carries no clone of its own): src/commands/migrate.ts planEntity now reads parsed.data directly; the structuredClone call and the comment explaining it are gone. 'grep -n structuredClone src/commands/migrate.ts' returns nothing.

Constraint (nested values copied, not shared one level down): covered by the nested depends_on array assertion in the unit test.

Suite: npm test — 47 test files, 329 passed, 1 skipped, exit 0. npm run typecheck — clean. Commit bdb4df6 on feat/T-01m0f27dqfp9xzgmbe0xnynhsv-gray-matter-memoizes-frontmatter-so-every-writer-mutates-a-s.

### Deviations

None.

### Observations created

None.

### Known concerns

Not declared.
