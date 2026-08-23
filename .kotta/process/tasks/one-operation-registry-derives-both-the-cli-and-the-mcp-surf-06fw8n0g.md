---
id: T-01kzda6nj9hd2z45tt06fw8n0g
title: One operation registry derives both the CLI and the MCP surface
status: done
origin: human
types:
  - refactor
profiles:
  - refactor
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: claude/graft-kottara-837884
pull_request: claude/graft-kottara-837884
created_at: '2026-08-07'
updated_at: '2026-08-23'
spec:
  - BR-01m0nsyasfnjc9s4073r8zb33j
  - IF-01m0f0wn8994dzf9z1sdygxa04
  - IF-01m0f0wn89cq1pnnsta9q8wqx9
coverage:
  'One registry module declares every Kotta operation with a surface-independent id, its service function, and its exposure on each surface, and every operation not exposed to chat carries a recorded reason.':
    - BR-01m0nsyasfnjc9s4073r8zb33j
  'Both surfaces are built from the declaration: the CLI command table and the MCP tool list are derived, and an entity-parameterised family expands deterministically over the entities it names.':
    - BR-01m0nsyasfnjc9s4073r8zb33j
    - IF-01m0f0wn89cq1pnnsta9q8wqx9
  'A totality test derives both surfaces from the code and compares them against the registry as sets, failing when either side carries an operation the other does not name; no surface count appears in the assertion.':
    - BR-01m0nsyasfnjc9s4073r8zb33j
  'An entry may carry a renderer, and every command whose output the CLI special-cases today keeps its exact human output through that field rather than through a switch beside the registry.':
    - BR-01m0nsyasfnjc9s4073r8zb33j
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'Every existing CLI command and MCP tool keeps its name, arguments, options, input schema, annotations, human output, --json output and exit code, proven against snapshots captured from the built surfaces before the change.':
    - IF-01m0f0wn8994dzf9z1sdygxa04
    - IF-01m0f0wn89cq1pnnsta9q8wqx9
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 7813c6fa33394ecb950b0689563cad0e279cf9e2
resolution: completed
approved_by: cli
approved_at: '2026-08-23T06:36:59.913Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

Which Kotta operations are reachable from a terminal and which are reachable from a calling chat is
stated once, in one declaration, and both surfaces are built from it. Adding an operation without
deciding its chat exposure becomes impossible rather than merely undocumented, and the asymmetry
between the two surfaces becomes readable instead of inferred by comparing two hand-written lists.

## Current structural problem

Kotta has two entry points over one service layer, and the layer is not the problem — the two
surface lists are. `src/cli/index.ts` registers its commands by hand; `src/commands/mcp.ts`
registers its tools by hand, two of them through loops that expand one call site into a tool per
entity. Both delegate to the same functions under `src/commands/`, but nothing relates the lists.

The knowledge of "what is exposed where" is spread across places kept in agreement by hand: the
command chain in the CLI, the `registerTool` calls in the MCP server, the server instruction string
that prose-lists which actions route through `approval_request`, and the `humanize` switch that
formats particular commands. Nothing fails when they disagree, so an operation reaching one surface
and not the other is indistinguishable from a deliberate omission.

## Demonstrated cost or risk

- A Claude Code session opened in this repository on 2026-08-07 started with zero Kotta tools while
  the CLI had a full surface, and the human was told to run a close command in a terminal — the
  exact round-trip an earlier task shipped to remove. Recorded as `F-01kzd9sh03y7hwwbeen5cp4s0q`.
- Counting the surfaces by hand produced acceptance conditions that were false when written and
  moved twice within four days: `F-01m0ahnn050zz0zr7yn9k18wbv` measured 44 and 18 against a text
  claiming 40 and 10, and the same surfaces read 43 and 19 after `dedupe` and the pre-rename MCP
  aliases were removed. The prose list of gated actions is stale in the same way — it says five
  where `APPROVAL_ACTIONS` now holds six.
- A new command lands in the CLI and silently never reaches chat: no error, no warning, no record.
- Answering "which operations are deliberately terminal-only" requires diffing two files by eye.

## Behavioural invariants

- Every existing CLI subcommand keeps its name, arguments, flags, human output, `--json` output and
  exit code; every existing MCP tool keeps its name, input schema, annotations and result shape.
- `approval_request` keeps eliciting through the host, gating exactly the actions
  `APPROVAL_ACTIONS` holds today; this task neither adds nor removes a gated action.
- The operations that are terminal-only stay terminal-only. This task makes the omissions explicit;
  it does not change them.
- Both surfaces keep calling the same service functions, whose behaviour and signatures are
  untouched.
- `kotta --version`, `kotta --help` and every subcommand's `--help` keep their current text.
- The `.a-team/` compatibility path and the workspace-shape assertion still run where they run now.

## Target structural property

One declarative registry of operations, following D-01m0nsz3vhrjkfv0r2y13mz0ys. Each entry carries a
surface-independent id, its service function, its exposure per surface, and optionally a renderer.
The CLI command table and the MCP tool list are both derived from it, so an operation cannot exist
on one surface without a recorded decision about the other. A mode of one service stays a flag on
its operation rather than a second entry, an entity-parameterised family is declared once and
expands over the entities it names, and per-operation output becomes a declared field rather than a
switch statement beside the registry. Omission from chat is a statement in the declaration, not the
result of nobody having written a tool.

## Excluded redesign

- No new operations, no renames, no removals on either surface.
- No change to what `approval_request` gates or to how elicitation works.
- No change to any service function's behaviour or signature.
- No plugin or third-party extension mechanism; no code-generation build step if a runtime registry
  is sufficient.
- No change to `kotta ui`, which stays a read-only projection and is not a third surface.
- No new host support for `integrate`. That gap is evidence for this task, not its scope.

## Behaviour-preserving verification

The surfaces are the observable behaviour here, so they are pinned before the registry lands and
compared after:

- A snapshot test captures the full CLI surface — every subcommand, argument, option and help text —
  from the built binary before the change, and must match afterwards unmodified.
- A snapshot test captures the MCP tool list with each tool's name, input schema and annotations,
  taken from the server rather than from the source, and must match afterwards.
- The existing integration and MCP suites run unchanged. A test that has to be edited to pass marks
  a behaviour change and fails this task.
- The totality test derives both surfaces and compares them against the registry as sets. It is
  written so that growing the surface cannot make it stale: no count is asserted.

## Scope

1. Introduce the operation registry: surface-independent id, service function, per-surface exposure
   with a reason for every chat omission, and an optional renderer.
2. Derive the MCP tool registrations from it, preserving each tool's name, schema, annotations and
   result shape exactly, with the entity families expanding as they do today.
3. Derive the CLI command registrations from it, preserving each command's name, arguments, options,
   output and exit codes exactly, and moving the `humanize` special cases onto the renderer field.
4. Derive the server instruction string's gated-action list from the registry so it cannot fall out
   of date.
5. Add the two surface snapshots and the totality test.
6. Record today's terminal-only operations with their reasons, without changing their exposure.

## Non-goals

- Exposing any currently terminal-only operation to chat.
- Adding hosts to `integrate`, or changing how host configuration is written.
- Unifying error formatting or `--json` rendering beyond what deriving the tables requires.
- A general command framework, middleware layer or dependency-injection container.
- Any change to the board, its API, or the approval event schema.

## Acceptance

- One registry module declares every Kotta operation with a surface-independent id, its service function, and its exposure on each surface, and every operation not exposed to chat carries a recorded reason.
- Both surfaces are built from the declaration: the CLI command table and the MCP tool list are derived, and an entity-parameterised family expands deterministically over the entities it names.
- A totality test derives both surfaces from the code and compares them against the registry as sets, failing when either side carries an operation the other does not name; no surface count appears in the assertion.
- An entry may carry a renderer, and every command whose output the CLI special-cases today keeps its exact human output through that field rather than through a switch beside the registry.
- Every existing CLI command and MCP tool keeps its name, arguments, options, input schema, annotations, human output, --json output and exit code, proven against snapshots captured from the built surfaces before the change.

## Verification

- Surface snapshots captured from the built binary and from the MCP server before the change, and
  compared after; any difference fails the task.
- The totality test, run against a deliberately unregistered command and a deliberately
  unregistered tool, fails in both directions.
- The full vitest suite and typecheck stay green, with no existing test edited to pass.

## Constraints

The registry is an internal structure: it is not written into `.kotta/`, carries no migration and
appears in no published schema. Operation ids are internal identifiers. The gated-action set stays
exactly what `APPROVAL_ACTIONS` holds when the work starts.

## Open decisions

None.

## Execution notes

None.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| One registry module declares every Kotta operation with a surface-independent id, its service function, and its exposure on each surface, and every operation not exposed to chat carries a recorded reason. | src/core/operations.ts declares each operation with a dotted id and per-surface exposure; the registry test asserts every id matches /^[a-z]+[.][a-z-]+$/ (neither an MCP underscore nor a CLI space), that every absent surface states a reason of substance in either direction, and that no operation reaches no surface. The service function is not a field - declared under Deviations. |
| Both surfaces are built from the declaration: the CLI command table and the MCP tool list are derived, and an entity-parameterised family expands deterministically over the entities it names. | run: npx vitest run tests/integration/operation-registry.test.ts — verified: exit 0 at 57addbe |
| A totality test derives both surfaces from the code and compares them against the registry as sets, failing when either side carries an operation the other does not name; no surface count appears in the assertion. | Both directions exercised by hand against the built binary and a live server: a declared-but-unbuilt entry raised 'Operation workspace.phantom declares the MCP tool phantom_tool, which this server does not build' and the CLI equivalent, while deleting claim.release from the declaration raised 'builds CLI commands no operation declares'. The assertions compare sorted sets, never lengths. |
| An entry may carry a renderer, and every command whose output the CLI special-cases today keeps its exact human output through that field rather than through a switch beside the registry. | The eleven-branch humanize chain became eleven named renderers, each passed to defineCommand where its command is built; humanize is now a map lookup on the result command with the same fallback line. The MCP instruction sentence likewise joins APPROVAL_ACTIONS rather than restating it, closing the fourth copy of the gating knowledge - it had said five actions while the enum held six. |
| Every existing CLI command and MCP tool keeps its name, arguments, options, input schema, annotations, human output, --json output and exit code, proven against snapshots captured from the built surfaces before the change. | run: npx vitest run tests/integration/surface-snapshot.test.ts — verified: exit 0 at 57addbe |
| refactor: behavioral_invariants_verified | Full suite green after each step and at the end: 399 passed, 1 skipped across 59 files, plus typecheck. The gated action set, the .a-team compatibility path and every service signature are untouched. |
| refactor: target_structure_achieved | One declaration carries identity, per-surface exposure with stated absences in both directions, family expansion and the renderer; both surfaces iterate it and refuse at startup on either kind of drift, so an operation cannot exist on one surface without a recorded decision about the other. |
| refactor: excluded_redesign_not_introduced | No operation added, renamed or removed; no change to approval_request gating or elicitation; no plugin mechanism and no code-generation step - the registry is a runtime list; the board is untouched and integrate gained no host. |

### Verification performed

One registry module declares every Kotta operation with a surface-independent id, its service function, and its exposure on each surface, and every operation not exposed to chat carries a recorded reason.: src/core/operations.ts declares each operation with a dotted id and per-surface exposure; the registry test asserts every id matches /^[a-z]+[.][a-z-]+$/ (neither an MCP underscore nor a CLI space), that every absent surface states a reason of substance in either direction, and that no operation reaches no surface. The service function is not a field - declared under Deviations.
Both surfaces are built from the declaration: the CLI command table and the MCP tool list are derived, and an entity-parameterised family expands deterministically over the entities it names.: run: npx vitest run tests/integration/operation-registry.test.ts
A totality test derives both surfaces from the code and compares them against the registry as sets, failing when either side carries an operation the other does not name; no surface count appears in the assertion.: Both directions exercised by hand against the built binary and a live server: a declared-but-unbuilt entry raised 'Operation workspace.phantom declares the MCP tool phantom_tool, which this server does not build' and the CLI equivalent, while deleting claim.release from the declaration raised 'builds CLI commands no operation declares'. The assertions compare sorted sets, never lengths.
An entry may carry a renderer, and every command whose output the CLI special-cases today keeps its exact human output through that field rather than through a switch beside the registry.: The eleven-branch humanize chain became eleven named renderers, each passed to defineCommand where its command is built; humanize is now a map lookup on the result command with the same fallback line. The MCP instruction sentence likewise joins APPROVAL_ACTIONS rather than restating it, closing the fourth copy of the gating knowledge - it had said five actions while the enum held six.
Every existing CLI command and MCP tool keeps its name, arguments, options, input schema, annotations, human output, --json output and exit code, proven against snapshots captured from the built surfaces before the change.: run: npx vitest run tests/integration/surface-snapshot.test.ts
refactor: behavioral_invariants_verified: Full suite green after each step and at the end: 399 passed, 1 skipped across 59 files, plus typecheck. The gated action set, the .a-team compatibility path and every service signature are untouched.
refactor: target_structure_achieved: One declaration carries identity, per-surface exposure with stated absences in both directions, family expansion and the renderer; both surfaces iterate it and refuse at startup on either kind of drift, so an operation cannot exist on one surface without a recorded decision about the other.
refactor: excluded_redesign_not_introduced: No operation added, renamed or removed; no change to approval_request gating or elicitation; no plugin mechanism and no code-generation step - the registry is a runtime list; the board is untouched and integrate gained no host.

### Deviations

Acceptance 1 names three fields; the declaration carries two of them. The service function is not a field, because a handler needs the resolved workspace root and the surface's own parsed options, so it is built where the surface builds it - putting a function name in the declaration would add a label nothing enforces, which is the failure mode D-01m0nsz3vhrjkfv0r2y13mz0ys was written against. Identity and exposure are declared and enforced; the service is reached through the entry that builds it.

### Observations created

None.

### Known concerns

Two things still live beside the declaration rather than in it: each command's arguments, options and action body stay in src/cli/index.ts (the declaration attaches them and guards the table), and the five CLI group descriptions sit in a map there, since a group is a container rather than an operation.
