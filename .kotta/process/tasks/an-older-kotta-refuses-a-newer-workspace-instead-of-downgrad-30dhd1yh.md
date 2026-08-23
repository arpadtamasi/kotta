---
id: T-01m0jdnw5e2b43bngn30dhd1yh
title: An older Kotta refuses a newer workspace instead of downgrading it
status: active
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
  - BR-01m0q89b16xcfasfj1z8mc2hgg
  - EX-01m0q89b1693yvwzx0j8tr5zjp
  - IF-01m0f0wn897newtcbva7xqgvx6
  - UC-01m0f0wn89x00jkpqpqc2esx9h
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-21'
updated_at: '2026-08-23'
coverage:
  'A newer workspace is refused by name. Every command that reads a workspace whose recorded shape version is higher than the one this Kotta implements refuses, naming both versions and saying the workspace was written by a newer Kotta; the remedy it names is upgrading Kotta.':
    - BR-01m0q89b16xcfasfj1z8mc2hgg
    - EX-01m0q89b1693yvwzx0j8tr5zjp
    - IF-01m0f0wn897newtcbva7xqgvx6
  'The newer refusal never says legacy and never names migrate, because neither is true of that direction.':
    - BR-01m0q89b16xcfasfj1z8mc2hgg
    - EX-01m0q89b1693yvwzx0j8tr5zjp
  '`migrate` loses its exemption in the newer direction only. `kotta migrate` and `kotta migrate --dry-run` refuse a newer workspace and print no plan; both still read and carry an older workspace exactly as before.':
    - BR-01m0q89b16xcfasfj1z8mc2hgg
    - EX-01m0q89b1693yvwzx0j8tr5zjp
    - UC-01m0f0wn89x00jkpqpqc2esx9h
  'An unreadable version is refused on its own terms, as neither older nor newer, naming the file that could not be read.':
    - BR-01m0q89b16xcfasfj1z8mc2hgg
    - IF-01m0f0wn897newtcbva7xqgvx6
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 29e9ba9a290e49b71b5f1532b98e1082b662bc2c
---
## Outcome

A Kotta that meets a workspace written for a shape version it does not implement says so truthfully and does nothing. Today it does the opposite, and the failure is live: the published 0.7.0 implements version 5, and against a workspace recording version 6 it calls the workspace a "legacy Kotta workspace shape" that "predates the flat process layout", then directs the reader to `kotta migrate`. Migrate is exempt from the shape check so that it can read old workspaces at all, so it accepts, and `migrate --dry-run` plans `rewrite config.yaml: version: 6 → 5`. Following the tool's own advice rewrites a newer workspace backwards.

This is reachable the ordinary way a team moves: one person upgrades Kotta and migrates a checkout, another has not upgraded yet.

## Scope

- `assertCurrentWorkspaceShape` in `src/filesystem/workspace.ts:194` splits by direction. Older than this Kotta keeps today's wording and keeps naming `migrate`. Newer names both versions and the upgrade. Unreadable is its own case.
- `migrate` keeps its exemption for the older direction and loses it for the newer one, so `migrate` and `migrate --dry-run` refuse a newer workspace before planning anything.
- The board's own notice path (`readNotices` in `src/commands/ui.ts`) already distinguishes a version it cannot read from a legacy layout; its wording follows the same split so the two surfaces do not disagree.

## Non-goals

- Reading a newer shape. The compatibility window stays one version wide and refusing stays the mechanism; nothing here adds a compatibility layer.
- Changing the version field, the config schema, or `WORKSPACE_SCHEMA_VERSION` itself.
- Any change to how an older workspace migrates. That path is correct and stays byte-for-byte as it is.
- Detecting the installed Kotta's package version, or advising which version to install. The refusal names the workspace's version and this Kotta's, and leaves the choice of release to the reader.

## Constraints

The older direction must not regress: its message, its exemption for `migrate`, and the resulting migration plan stay exactly as they are, and the existing migration tests are the proof.

The refusal must reach the reader through both renderings. `kotta migrate` prints through the CLI's own formatter rather than the shared result path, so the newer-direction refusal has to be an error that formatter surfaces, not a result field a human rendering could drop.

## Open decisions

None.

## Execution notes

`workspaceSchemaVersion` already returns `NaN` for an unreadable config and `null` when there is no workspace, so the three cases are distinguishable at `src/filesystem/workspace.ts:199` without reading the file again.

The exemption lives in `SHAPE_EXEMPT` in `src/cli/index.ts`, which skips `assertCurrentWorkspaceShape` entirely for `init`, `migrate`, `ui` and `mcp`. The newer-direction check therefore cannot live only behind that gate; `migrate` needs its own refusal at the point it reads the version.

## Acceptance

- A newer workspace is refused by name. Every command that reads a workspace whose recorded shape version is higher than the one this Kotta implements refuses, naming both versions and saying the workspace was written by a newer Kotta; the remedy it names is upgrading Kotta.
- The newer refusal never says legacy and never names migrate, because neither is true of that direction.
- `migrate` loses its exemption in the newer direction only. `kotta migrate` and `kotta migrate --dry-run` refuse a newer workspace and print no plan; both still read and carry an older workspace exactly as before.
- An unreadable version is refused on its own terms, as neither older nor newer, naming the file that could not be read.

## Verification

- `run: npx vitest run tests/integration/version-boundary.test.ts` — the new suite: a newer workspace refused by every reading command and by both migrate forms, the wording assertions, and an older workspace still migrating unchanged.
- `run: npm test` — the full suite, since the refusal sits on the path every command takes.
