---
id: T-01m0qwh1jpyc8wbkpbvrd02tyb
title: Every accepted promise is kept or admitted
status: active
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0qtshfqhcrrqtz051zm9svr
  - EX-01m0qtshfq4gx91qt7zhfg56b2
  - UC-01m0fpqfxjvet99wbz0v1ag64q
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-23'
updated_at: '2026-08-23'
coverage:
  '`kotta gap` refuses an unadmitted promise. A workspace holding a node with neither evidence nor an admitted implementation gap makes the command name each such node, say where evidence was sought, and exit non-zero.':
    - BR-01m0qtshfqhcrrqtz051zm9svr
    - EX-01m0qtshfq4gx91qt7zhfg56b2
    - UC-01m0fpqfxjvet99wbz0v1ag64q
  'Evidence and an admission both satisfy it, and neither is counted as the other. A node a test names by id passes as evidenced; a node whose frontmatter admits the gap with a reason passes as admitted and is reported with that reason; adding the missing admission is enough to turn a refusal into a pass.':
    - BR-01m0qtshfqhcrrqtz051zm9svr
    - EX-01m0qtshfq4gx91qt7zhfg56b2
  'This workspace passes its own check. Every accepted node in `.kotta/spec/` is evidenced or admitted, so `kotta gap` exits zero here, and the report separates the two columns rather than reporting an empty gap.':
    - BR-01m0qtshfqhcrrqtz051zm9svr
    - UC-01m0fpqfxjvet99wbz0v1ag64q
  'An inherited admission says it is inherited. Each admission written for a node that predates this rule states that it was not examined individually, so no reader mistakes the bulk admission for a judgement about that node.':
    - BR-01m0qtshfqhcrrqtz051zm9svr
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 1d1bdcbcc91ba91474631175bdb206abfa37c2f3
---
## Outcome

`kotta gap` stops being only a report and becomes the place a promise cannot hide. A node has evidence, or its own frontmatter says why it does not yet; the command refuses anything else.

Coverage already binds the front of the lifecycle: no task becomes defined until every acceptance condition cites a landed node. Nothing bound the other end. Measured on the base branch today, 108 of 119 accepted nodes have no evidence naming them and 11 do, and nothing in the workflow could ever have made that number fall on purpose.

## Scope

- `gapReport` classifies every node into evidenced, admitted, or neither, and the result carries the third group; the command exits non-zero when it is non-empty.
- The human rendering names each unadmitted node and where evidence was sought, the way every other refusal does.
- The 108 nodes that predate this rule receive an admission in their own frontmatter, worded so that it says what it is: inherited, dated, and not the result of examining that node.

## Non-goals

- Reducing the number of admissions. Writing node ids into comments to make the count fall is the failure this rule exists to prevent; nothing here touches a node that is genuinely uncovered except to make it say so.
- Any new evidence semantics. What counts as evidence — the node's id appearing in code, a test, or a command definition — is unchanged, including its known bluntness for use-case and interface nodes that many sites realise and none name.
- A gate anywhere else. `validate` never reads the repository tree and is not asked to start; no lifecycle gate moves; a task's coverage map means what it meant before.
- Deciding which admissions should become evidence. That is the work the admissions make visible, one node at a time, and it is not this task.

## Constraints

The admission wording must not read as a judgement that was never made. These 108 nodes are being admitted in bulk, and the text has to say so, or the workspace will claim 108 considered decisions where one decision was taken.

`gap` is a read: it must stay one. Refusing is an exit code and a message, never a write, and the command still prints its full report when it refuses.

## Open decisions

None.

## Execution notes

The mechanism already exists and is unused: `acceptedImplementationReason` in `src/commands/gap.ts:133` reads a node's frontmatter `accepted` list for an `implementation:`, `implementation-gap:` or `verification:` entry and returns the reason, and `gapReport` already routes such nodes into `acceptedGaps` instead of `promises`. Zero nodes use it today, which is why `acceptedGaps` is 0 and `promises` is 108.

`validate` accepts an unknown `accepted` frontmatter field on a spec node — verified by adding one and running `kotta validate --json`, which stayed `ok: true`.

`gapReport` reads the spec and the repository from the base branch ref, not the working tree, so a fixture test has to commit before asserting.

## Acceptance

- `kotta gap` refuses an unadmitted promise. A workspace holding a node with neither evidence nor an admitted implementation gap makes the command name each such node, say where evidence was sought, and exit non-zero.
- Evidence and an admission both satisfy it, and neither is counted as the other. A node a test names by id passes as evidenced; a node whose frontmatter admits the gap with a reason passes as admitted and is reported with that reason; adding the missing admission is enough to turn a refusal into a pass.
- This workspace passes its own check. Every accepted node in `.kotta/spec/` is evidenced or admitted, so `kotta gap` exits zero here, and the report separates the two columns rather than reporting an empty gap.
- An inherited admission says it is inherited. Each admission written for a node that predates this rule states that it was not examined individually, so no reader mistakes the bulk admission for a judgement about that node.

## Verification

- `run: npx vitest run tests/integration/gap-ratchet.test.ts` — the new suite: refusal on an unadmitted node, a pass for an evidenced one and for an admitted one, and the report keeping the two columns apart.
- `run: npm test` — the full suite.
- `run: node dist/cli/index.js gap` — this workspace against its own rule, exiting zero.
