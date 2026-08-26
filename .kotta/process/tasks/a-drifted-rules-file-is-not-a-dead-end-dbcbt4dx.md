---
id: T-01m0xp4sph61ykf0y0dbcbt4dx
title: A drifted rules file is not a dead end
status: defined
origin: human
types:
  - bug
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0f1djtb5dkb76tjzq4x3ffh
  - IF-01m0f0wn8994dzf9z1sdygxa04
branch: null
pull_request: null
created_at: '2026-08-26'
updated_at: '2026-08-26'
coverage:
  'A drifted rules file names the way back. `kotta sync` and `kotta status` report the drift with the exact command that resolves it, instead of reporting only that the file was left alone.':
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'Taking Kotta''s copy is a command, not a hand-edit of Kotta-owned state. One explicit flag rewrites the rules file from the template, records it, and says what it replaced; without that flag an edited file is still never replaced.':
    - BR-01m0f1djtb5dkb76tjzq4x3ffh
  'The release stops causing drift it cannot clear. The maintainer-release path refreshes the rules file through Kotta rather than editing it, and a test reproduces the 90edd48 edit and clears it in one command.':
    - BR-01m0f1djtb5dkb76tjzq4x3ffh
  'No test reaches past the tool to reconcile. The suite no longer writes `.kotta/.kotta-generated.json` by hand to leave drift, because it no longer has to.':
    - BR-01m0f1djtb5dkb76tjzq4x3ffh
---
## Outcome

Drift stops being a one-way door. `BR-01m0f1djtb5dkb76tjzq4x3ffh` promises Kotta writes the workspace rules file, keeps it current, and reports a *hand-edited* copy as drifted rather than replacing it. Both halves failed at once on 2026-08-24: commit 90edd48 bumped the version and edited the one interpolated line in `.kotta/AGENTS.md` directly instead of letting Kotta write it, so Kotta's own edit read as a hand edit, the recorded hash went stale, and every `kotta sync` since reported `drifted` and left the file behind the template. Kotta stopped keeping its own rules file current and blamed the operator for it.

There was no supported way back. `IF-01m0f0wn8994dzf9z1sdygxa04` promises a refusal names the violated rule *and the corrective action*; the drift report names neither — "was edited; it was left alone and not refreshed" is a verdict with no remedy. The two exits that exist are undiscoverable: delete the file so `sync` recreates it, or rewrite the hash in `.kotta/.kotta-generated.json` by hand. The second is hand-editing Kotta-owned state, which the rules forbid — and it is what `tests/integration/sync.test.ts:206-210` does today, and what repairing this workspace required.

## Scope

- `kotta sync` gains one explicit flag that takes Kotta's copy: rewrite the rules file from the template, record it, and report what it replaced.
- The drift report — in `sync` and in `status` — names that command.
- `tests/integration/sync.test.ts` reconciles through the command instead of writing the manifest by hand.
- The maintainer-release section of the README: the version bump refreshes the rules file through Kotta, never by editing it.

## Non-goals

- Silently replacing an edited file. The promise that a hand-edited copy survives is the point; this adds a deliberate way to override it, not an automatic one.
- The skills installer's ownership manifest. It answers the same question a different way and is not drifting.
- Reconciling edits. Taking Kotta's copy discards local edits by definition; merging them is the operator's job, in the template.

## Acceptance

- A drifted rules file names the way back. `kotta sync` and `kotta status` report the drift with the exact command that resolves it, instead of reporting only that the file was left alone.
- Taking Kotta's copy is a command, not a hand-edit of Kotta-owned state. One explicit flag rewrites the rules file from the template, records it, and says what it replaced; without that flag an edited file is still never replaced.
- The release stops causing drift it cannot clear. The maintainer-release path refreshes the rules file through Kotta rather than editing it, and a test reproduces the 90edd48 edit and clears it in one command.
- No test reaches past the tool to reconcile. The suite no longer writes `.kotta/.kotta-generated.json` by hand to leave drift, because it no longer has to.

## Verification

- `run: npx vitest run tests/integration/sync.test.ts` — drift, the named remedy, and the reconciliation without a hand-written manifest.
- `run: npx vitest run tests/integration/surface-snapshot.test.ts tests/integration/operation-registry.test.ts` — the new flag reaches the declared surface.
- `run: npm test` — the whole suite.

## Constraints

The flag is a deliberate override of a promise the same rule makes, so its name and its report must say that it discards edits; a name that reads like a refresh would make the override look routine.

`sync` is one operation with one declaration: a flag changes the command's shape, not the registry's set of operations.

## Open decisions

None.

## Execution notes

`syncWorkspaceAgents` in `src/commands/agents.ts` holds the three-way decision: identical content is adopted, a recorded hash means Kotta's to refresh, anything else is drift. The override belongs there, as a parameter, not as a second writer.

The drift sentence the operator reads is `src/cli/index.ts:50`; `status` reports the same state through `agentsDrift`.

`tests/integration/sync.test.ts:199-214` is both the test to change and the clearest statement of the defect: it hand-writes the manifest to move a drifted file back under Kotta's ownership.
