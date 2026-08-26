---
id: T-01m0jdnv5fjechrfqwphvrrgqx
title: 'Entities are named to humans by title, not ULID'
status: defined
origin: human
types:
  - ui
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - BR-01m0f0wn89c50fe1mz5yn1nw85
  - QA-01m0fp2hdkq55yrx9qr5t8pweh
  - UC-01m0f0wn89p42025mt5vg5012n
  - IF-01m0f0wn89cq1pnnsta9q8wqx9
  - IF-01m0f0wn8994dzf9z1sdygxa04
branch: null
pull_request: null
created_at: '2026-08-21'
updated_at: '2026-08-26'
coverage:
  'Every sentence a calling chat receives from a Kotta tool names the entity it is about by title. Measured today: eight of nine name a bare identifier and no title.':
    - BR-01m0f0wn89c50fe1mz5yn1nw85
    - IF-01m0f0wn89cq1pnnsta9q8wqx9
  'Every gate description names the judgement by title. Measured today: five of the six read `task.close T-01m0…` and only `decision.create` carries a title.':
    - QA-01m0fp2hdkq55yrx9qr5t8pweh
    - UC-01m0f0wn89p42025mt5vg5012n
  'Every terminal result that reports work on an entity names that entity by title. Measured today the lifecycle commands print `kotta task close completed.`, naming neither the entity nor the work.':
    - BR-01m0f0wn89c50fe1mz5yn1nw85
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'An identifier never stands alone where a title exists to name, and the identifier a reader will type back still travels with it, so nothing that resolved before stops resolving.':
    - BR-01m0f0wn89c50fe1mz5yn1nw85
  'The rule holds for entities that have no title to name and for one whose title is missing or empty: the rendering falls back to the identifier rather than to nothing.':
    - BR-01m0f0wn89c50fe1mz5yn1nw85
---
# T-01m0jdnv5fjechrfqwphvrrgqx — Entities are named to humans by title, not ULID

## Outcome

Nothing a human reads identifies work by an unreadable identifier alone. The operator's requirement,
in their words on 2026-08-26: unreadable ids should not appear on the surfaces, the chat included.

Measured against `main` the same day, the surfaces fail this three ways at once:

- **The chat.** Eight of the nine sentences the MCP tools return name a bare id and no title:
  `Created T-01m0… at <path>.`, `Updated T-01m0…; it is defined.`, `T-01m0… is valid.`,
  `Started T-01m0… for caller execution…`, `Submitted T-01m0… for review.`, `Captured F-01m0…`,
  `Recorded human message for T-01m0…`. Only `entity_show` leads with a title.
- **The gates.** `approvalDescription` renders five of the six gated actions as
  `task.close T-01m0vqr9k…` — an action name and a raw id. Only `decision.create` carries a title,
  with a comment beside it saying why it must.
- **The terminal.** The lifecycle commands have no renderer at all, so they print the generic
  `kotta task close completed.` — naming neither the entity nor the work.

## Scope

- The sentence every MCP tool returns beside its structured data.
- `approvalDescription` in `src/commands/approval.ts`, for every action in `APPROVAL_ACTIONS`.
- The CLI renderers that name an entity, and the generic completion line that names nothing.
- One resolution path shared by all three, so a title is read the same way wherever it is needed.

## Non-goals

- The identifiers themselves. Nothing is renamed, re-minted or re-resolved; ids stay permanent and
  stay accepted as input everywhere they are accepted today.
- The structured payloads. `--json` and the MCP `structuredContent` keep carrying ids exactly as
  they do now: they are the machine's, and a reader who wants them has `--json`.
- The board, which already leads with the entity's title, and the documentation's `kotta task close
  <id>` prose, which is what a human should type.
- Sweep and questions, which already print the title beside the short id.

## Acceptance

- Every sentence a calling chat receives from a Kotta tool names the entity it is about by title. Measured today: eight of nine name a bare identifier and no title.
- Every gate description names the judgement by title. Measured today: five of the six read `task.close T-01m0…` and only `decision.create` carries a title.
- Every terminal result that reports work on an entity names that entity by title. Measured today the lifecycle commands print `kotta task close completed.`, naming neither the entity nor the work.
- An identifier never stands alone where a title exists to name, and the identifier a reader will type back still travels with it, so nothing that resolved before stops resolving.
- The rule holds for entities that have no title to name and for one whose title is missing or empty: the rendering falls back to the identifier rather than to nothing.

## Verification

- run: npx vitest run tests/integration/named-by-title.test.ts
- run: npx vitest run tests/integration/mcp.test.ts tests/integration/approval-receipt.test.ts
- run: npx vitest run --reporter dot
- run: npm run typecheck

## Constraints

- One resolution, not three. If the chat, the gate and the terminal each find a title their own way,
  they will disagree about the same entity — the failure the questions parse was built to avoid.
- Reading a title must not turn a cheap result into a workspace scan: a rendering already holding
  the entity uses what it holds.
- A rendering never claims more than its result carries (BR-01m0pw5bc7b1rkg5dct5qgdkmb): a missing
  title is reported as the id, never as an invented or blank name.

## Open decisions

None.

## Execution notes

The generic `kotta <command> completed.` line is the widest of the three and the least visible: it
is what `define`, `start`, `review`, `close` and `cancel` printed for every gate the operator
approved in this session. It names neither the entity nor what happened to it, so it fails the rule
in its weakest form rather than by printing an id.
