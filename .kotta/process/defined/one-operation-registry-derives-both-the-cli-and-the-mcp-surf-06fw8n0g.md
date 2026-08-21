---
id: T-01kzda6nj9hd2z45tt06fw8n0g
title: One operation registry derives both the CLI and the MCP surface
status: defined
origin: human
types:
  - refactor
profiles:
  - refactor
priority: medium
risk: medium
batch: null
depends_on:
  - T-01kzda6d8qr4yxqcb41yd5vn20
blocks: []
branch: null
pull_request: null
created_at: '2026-08-07'
updated_at: '2026-08-07'
---
# T-01kzda6nj9hd2z45tt06fw8n0g — One operation registry derives both the CLI and the MCP surface

## Outcome

Which Kotta operations are reachable from a terminal and which are reachable from a calling chat is
stated once, in one place, and both surfaces are built from that statement. Adding an operation
without deciding its chat exposure becomes impossible rather than merely undocumented, and the
current asymmetry between the two surfaces becomes readable instead of inferred by comparing two
hand-written lists.

## Current structural problem

Kotta has two entry points over one service layer, and the layer is not the problem — the two
surface lists are. `src/cli/index.ts` registers 40 subcommands. `src/commands/mcp.ts` registers 10
tools. Both delegate to the same functions in `src/commands/`, but nothing relates the two lists to
each other.

The knowledge of "what is exposed where" is therefore spread across at least three independent
places that must be kept in agreement by hand:

- the `program.command(...)` chain in `src/cli/index.ts`
- the `server.registerTool(...)` calls in `src/commands/mcp.ts`
- the server instruction string at `src/commands/mcp.ts:47`, which prose-lists which actions route
  through `approval_request`

Nothing fails when they disagree. There is no type, test or validation that observes the
relationship, so 30 CLI commands having no chat equivalent is indistinguishable from an oversight.

## Demonstrated cost or risk

- The one host-wiring command in the repository is hardcoded to a single host: `src/cli/index.ts:315`
  rejects any host but `codex`, and `humanize` carries a matching special case at
  `src/cli/index.ts:64`. A Claude Code session opened in this repository on 2026-08-07 consequently
  started with zero Kotta tools, and the human was told to run `kotta contract close --approve` in a
  terminal — the exact round-trip that `T-01kz8tk2t53jbax6mrseka50v9` shipped to remove. Recorded as
  observation `F-01kzd9sh03y7hwwbeen5cp4s0q`.
- A new command lands in the CLI and silently never reaches chat. The omission produces no error, no
  warning and no record, so the chat surface degrades relative to the CLI with every addition.
- The prose list at `src/commands/mcp.ts:47` is a fourth copy of the gating knowledge. If a sixth
  approval action is added to the `approval_request` enum, that sentence does not notice.
- Reviewing whether the chat surface is adequate requires diffing two files by eye. No artifact
  answers "which operations are deliberately terminal-only".

## Behavioural invariants

- Every existing CLI subcommand keeps its name, arguments, flags, human output, `--json` output and
  exit code.
- Every existing MCP tool keeps its name, input schema, annotations and structured result shape.
- `approval_request` keeps eliciting through the host, and the same five actions stay gated:
  `contract.sign`, `observation.resolve`, `contract.close`, `contract.request-changes`,
  `batch.close`.
- The CLI-only operations stay CLI-only. This contract makes the omissions explicit; it does not
  change them.
- Both surfaces keep calling the same service functions, and the service layer's behaviour is
  untouched.
- `kotta --version`, `kotta --help` and every subcommand's `--help` keep their current text and
  structure.
- The `.a-team/` compatibility path and workspace-shape assertion still run where they run now.

## Target structural property

One declarative registry of operations. Each entry names the operation, its service function, and
its exposure on each surface. The CLI command table and the MCP tool table are both derived from
that registry, so an operation cannot exist on one surface without a recorded decision about the
other.

Omission from the chat surface is explicit and carries a reason. A registry entry declares its MCP
exposure rather than defaulting to absent, so "terminal-only" is a statement in the code rather than
the result of nobody having written a tool.

## Excluded redesign

- No new operations, no renames, no removals on either surface.
- No change to what `approval_request` gates or to how elicitation works.
- No change to any service function's behaviour or signature. The one signature change this work
  benefits from is `T-01kzda6d8qr4yxqcb41yd5vn20` and is out of scope here.
- No plugin or third-party extension mechanism.
- No code-generation build step if a runtime registry is sufficient.
- No change to `kotta ui`, which stays a read-only projection and is not a third surface.
- No new host support for `integrate`. That gap is evidence for this contract, not its scope.

## Behaviour-preserving verification

The surfaces are the observable behaviour here, so they are pinned before the registry is
introduced and compared after:

- A snapshot test captures the full CLI surface — every subcommand, argument, option and help text —
  from the built binary before the change. The same snapshot must match afterwards, unmodified.
- A snapshot test captures the MCP tool list with each tool's name, input schema and annotations,
  taken from the server rather than the source. The same snapshot must match afterwards.
- The existing integration and MCP suites run unchanged. Any test that has to be edited to pass
  marks a behaviour change and fails this contract.
- A new test asserts the registry itself is total: every entry declares its exposure on both
  surfaces, and every registered CLI command and MCP tool traces back to exactly one entry. This is
  the property the contract adds, so it is verified directly rather than inferred.

## Scope

1. Introduce a declarative operation registry describing each Kotta operation, its service function,
   and its exposure on the CLI and MCP surfaces, with an explicit reason recorded for any operation
   not exposed to chat.
2. Derive the MCP tool registrations from the registry, preserving each current tool's name, schema,
   annotations and result shape exactly.
3. Derive the CLI command registrations from the registry, preserving each current command's name,
   arguments, options, output and exit codes exactly.
4. Replace the prose action list at `src/commands/mcp.ts:47` with text derived from the registry's
   gated actions, so it cannot fall out of date.
5. Add the surface-snapshot tests and the registry totality test described above.
6. Record the current terminal-only operations with their reasons as part of the registry, without
   changing whether they are exposed.

## Non-goals

- Exposing any currently terminal-only operation to chat.
- Adding hosts to `integrate`, or changing how host configuration is written.
- Unifying error formatting, output shaping or `--json` rendering between the surfaces beyond what
  deriving the tables requires.
- A general command framework, middleware layer or dependency-injection container.
- Any change to the board, its API, or the approval event schema.

## Acceptance

- One registry module lists every Kotta operation, and each entry states its CLI exposure and its
  MCP exposure, with a reason string present on every operation not exposed to chat.
- The CLI surface after the change is identical to the captured pre-change snapshot: same 40
  subcommands, same arguments, same options, same help text.
- The MCP surface after the change is identical to the captured pre-change snapshot: same 10 tools,
  same names, same input schemas, same annotations.
- A test fails if a CLI command exists with no registry entry, if an MCP tool exists with no registry
  entry, or if an entry omits either exposure declaration.
- Adding a registry entry that declares no MCP exposure and no reason fails that test, demonstrated
  by a fixture rather than asserted in prose.
- The server instruction text listing gated actions is produced from the registry, and adding a
  sixth action to the `approval_request` enum changes that text without a separate edit.
- `approval_request` still elicits and still gates exactly the five current actions.
- `kotta validate`, `npm run typecheck` and the full suite pass, and no existing test file required
  an assertion change.

## Verification

- `npx vitest run` on the new CLI-surface and MCP-surface snapshot tests — before and after,
  asserting no diff.
- `npx vitest run` on the registry totality test, including the negative fixture for a missing
  exposure declaration.
- `npx vitest run tests/integration/` — the existing lifecycle coverage, unmodified.
- The existing MCP test file, unmodified.
- `npm run typecheck`.
- `npx vitest run --exclude '.worktrees/**'` — full suite, excluding linked worktrees so the run
  measures this branch only.
- Manual: start the server with `kotta mcp`, list tools, and confirm the set and schemas match the
  snapshot.

## Constraints

- `.kotta/` remains the canonical source of truth, and both surfaces keep routing every mutation
  through the existing validated services and `withControlPlaneMutation`.
- The registry describes exposure; it must not become a place where validation, gating or lifecycle
  rules are re-implemented.
- Prefer a runtime registry over generated source. A build step is only acceptable if a runtime
  table cannot preserve the CLI help text exactly.
- This work is behaviour-preserving. Any observable difference on either surface is a defect, not an
  improvement, and the excluded redesign list is binding even where a change looks obviously better.
- `T-01kzda6d8qr4yxqcb41yd5vn20` should land first so the registry is not built around a
  path-shaped outlier.

## Open decisions

None.

## Execution notes

- One decision was made while defining this contract rather than deferred: MCP exposure is declared
  per operation with a required reason for omission, rather than defaulting to absent. The reason is
  that the observed failure mode was silence — nobody noticed the chat surface was missing — and a
  default-absent registry reproduces exactly that silence. Reversing this later is cheap: it is a
  type change on one field plus the totality test.
- The registry is expected to record uncomfortable entries. `init`, `migrate` and `integrate` are
  terminal-only for a bootstrap reason: the MCP server cannot register itself. `claim`, `dedupe` and
  `validate` are terminal-only for a recovery reason: they are needed precisely when a host
  connection is unavailable. Writing those reasons down is part of the deliverable.
- `src/cli/index.ts:64` currently special-cases `"integrate codex"` inside `humanize`. Deriving the
  command table does not remove that; it makes it visible as a per-operation formatting concern.
- The 40-vs-10 asymmetry is the current state, not a defect to fix here. This contract makes it
  legible so that a later, separate decision can change it deliberately.
