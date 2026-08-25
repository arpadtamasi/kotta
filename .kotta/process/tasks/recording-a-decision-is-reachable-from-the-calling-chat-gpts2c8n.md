---
id: T-01m0wak7d8mrr6z098gpts2c8n
title: Recording a decision is reachable from the calling chat
status: done
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
  - BR-01m0f0wn89zb3wfb3t3y4d20a7
  - UC-01m0f0wn89p42025mt5vg5012n
  - IF-01m0f0wn89cq1pnnsta9q8wqx9
  - BR-01m0vqr9k6r571egp3z8qwnpkj
  - BR-01m0nsyasfnjc9s4073r8zb33j
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-25'
updated_at: '2026-08-25'
coverage:
  'Recording a decision is proposed and approved in the conversation, like every other gate. `approval_request` accepts `decision.create`, elicits the human answer, and on yes publishes the decision through the same validated service the CLI uses, with the same receipt.':
    - BR-01m0f0wn89zb3wfb3t3y4d20a7
    - UC-01m0f0wn89p42025mt5vg5012n
  'The human sees the decision before saying yes. The proposal carries the decision''s full text, and what the elicitation shows is what gets published; nothing about the draft reaches the workspace before the yes.':
    - BR-01m0vqr9k6r571egp3z8qwnpkj
    - UC-01m0f0wn89p42025mt5vg5012n
  'The declaration no longer says the operator publishes it. `decision.create` declares the same chat-gated absence the other five gates declare, and the registry''s totality test proves the surfaces still agree.':
    - BR-01m0nsyasfnjc9s4073r8zb33j
    - IF-01m0f0wn89cq1pnnsta9q8wqx9
  'A malformed proposal is refused before the human is asked, and a refusal changes nothing. A payload that is not exactly the decision text is refused by name, and a decision that fails to validate leaves no decision file and no partial event trail.':
    - BR-01m0vqr9k6r571egp3z8qwnpkj
    - IF-01m0f0wn89cq1pnnsta9q8wqx9
worktree: .
branch_origin: adopted
start_ref: HEAD
start_commit: e1b138a170d9327b1f532a21a8c630425f5b6f4e
assigned_agent: claude
execution_mode: inherited
resolution: completed
approved_by: cli
approved_at: '2026-08-25T23:33:59.060Z'
approval_basis: 'CLI --approve: task.close'
---
## Outcome

The sixth human gate stops being the one that sends you to the terminal. Five of Kotta's six approval-carrying mutations — task close, cancel and reopen, batch close, observation resolve — are proposed and answered in the calling chat. The sixth, recording a decision, is declared absent from that surface with the reason "a chat proposes the draft and the operator publishes it": the operator types a command. That contradicts the rule the gate exists to serve (BR-01m0f0wn89zb3wfb3t3y4d20a7: a decision takes effect only on an explicit human yes given in the conversation), the use case that names decision create among the six (UC-01m0f0wn89p42025mt5vg5012n), the interface promise that a question moves to plain chat rather than to the terminal (IF-01m0f0wn89cq1pnnsta9q8wqx9), and the shipped rule 5. This closes it: the decision's text travels in the proposal, the human reads it in the elicitation, and the yes publishes it.

## Scope

- `decision.create` joins `APPROVAL_ACTIONS`, with the decision's Markdown source as its one payload field, dispatched to the existing `createDecision` service.
- The proposal's description names the decision by title, so the elicitation shows what is being recorded rather than a command.
- The operation declaration for `decision.create` names its MCP path instead of an absence reason.
- Tests: the chat path publishes with a receipt, a rejection publishes nothing, a payload that is not the decision text is refused, and the registry's totality holds.

## Non-goals

- The CLI path. `kotta decision create --from <file> --approve` keeps working exactly as it does; this adds a surface, it does not move one.
- Any other absent operation. Five other declarations state an absence reason; whether those reasons hold is F-01m0v2g1gjpjqn9tfz0nz1wjyk's question, not this task's.
- Changing what a decision is, how it validates, or how it is stored.

## Acceptance

- Recording a decision is proposed and approved in the conversation, like every other gate. `approval_request` accepts `decision.create`, elicits the human answer, and on yes publishes the decision through the same validated service the CLI uses, with the same receipt.
- The human sees the decision before saying yes. The proposal carries the decision's full text, and what the elicitation shows is what gets published; nothing about the draft reaches the workspace before the yes.
- The declaration no longer says the operator publishes it. `decision.create` declares the same chat-gated absence the other five gates declare, and the registry's totality test proves the surfaces still agree.
- A malformed proposal is refused before the human is asked, and a refusal changes nothing. A payload that is not exactly the decision text is refused by name, and a decision that fails to validate leaves no decision file and no partial event trail.

## Verification

- `run: npx vitest run tests/integration/mcp.test.ts` — the chat path, its receipt, and its refusals.
- `run: npx vitest run tests/integration/operation-registry.test.ts tests/integration/surface-snapshot.test.ts` — the declaration and both surfaces.
- `run: npm test` — the whole suite, since APPROVAL_ACTIONS is read by the CLI, the MCP schema and the snapshot.

## Constraints

`decision.create` is the first approval action whose entity does not exist yet: `validateEntity` and `relatedTask` both assume an id that already resolves. Whatever shape that takes must not weaken the entity check for the five existing actions.

The decision text is the payload, so BR-01m0vqr9k6r571egp3z8qwnpkj applies to it: exactly one field, nothing else accepted.

## Open decisions

None.

## Execution notes

`APPROVAL_ACTIONS`, `validateEntity`, `validatePayload`, `approvalDescription`, `assertApplicable` and `apply` are all in `src/commands/approval.ts` and each will need a branch for the new action. `createDecision` is in `src/commands/decision.ts` and takes `{ from, id, approved }` — a text payload needs either a temporary file or a sibling entry point that takes the source directly; prefer the latter over writing a temp file inside a lock.

Gated actions are not their own MCP tools: the five existing ones declare `absent: CHAT_GATED`, "Reached from chat through approval_request". `decision.create` joins them by replacing its current reason with that one — the registry keeps counting it absent, and the surface follows `APPROVAL_ACTIONS` because the `approval_request` action enum is built from the constant (`src/commands/mcp.ts`).

A decision has no id before it is recorded, and every other approval names an entity that already resolves. Mint it the way `task_create` mints a task id — server-side, at proposal time — and refuse a supplied id that already exists before the human is asked, not after. `tests/integration/mcp.test.ts` already exercises propose/reject/fail-closed against `task.cancel`; the decision path belongs beside them.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Recording a decision is proposed and approved in the conversation, like every other gate. `approval_request` accepts `decision.create`, elicits the human answer, and on yes publishes the decision through the same validated service the CLI uses, with the same receipt. | run: npx vitest run tests/integration/mcp.test.ts -t 'records a decision from the caller chat' — verified: exit 0 at 58b2f3d |
| The human sees the decision before saying yes. The proposal carries the decision's full text, and what the elicitation shows is what gets published; nothing about the draft reaches the workspace before the yes. | run: npx vitest run tests/integration/mcp.test.ts tests/integration/decision.test.ts — verified: exit 0 at 58b2f3d |
| The declaration no longer says the operator publishes it. `decision.create` declares the same chat-gated absence the other five gates declare, and the registry's totality test proves the surfaces still agree. | run: npx vitest run tests/integration/operation-registry.test.ts tests/integration/surface-snapshot.test.ts — verified: exit 0 at 58b2f3d |
| A malformed proposal is refused before the human is asked, and a refusal changes nothing. A payload that is not exactly the decision text is refused by name, and a decision that fails to validate leaves no decision file and no partial event trail. | run: npx vitest run tests/integration/mcp.test.ts -t 'refused before the human is asked' — verified: exit 0 at 58b2f3d |

### Verification performed

Recording a decision is proposed and approved in the conversation, like every other gate. `approval_request` accepts `decision.create`, elicits the human answer, and on yes publishes the decision through the same validated service the CLI uses, with the same receipt.: run: npx vitest run tests/integration/mcp.test.ts -t 'records a decision from the caller chat'
The human sees the decision before saying yes. The proposal carries the decision's full text, and what the elicitation shows is what gets published; nothing about the draft reaches the workspace before the yes.: run: npx vitest run tests/integration/mcp.test.ts tests/integration/decision.test.ts
The declaration no longer says the operator publishes it. `decision.create` declares the same chat-gated absence the other five gates declare, and the registry's totality test proves the surfaces still agree.: run: npx vitest run tests/integration/operation-registry.test.ts tests/integration/surface-snapshot.test.ts
A malformed proposal is refused before the human is asked, and a refusal changes nothing. A payload that is not exactly the decision text is refused by name, and a decision that fails to validate leaves no decision file and no partial event trail.: run: npx vitest run tests/integration/mcp.test.ts -t 'refused before the human is asked'

### Deviations

Two lines outside the stated Scope: templates/AGENTS.md rule 4 and skills/define-task step 5 both told an agent to record a decision with the CLI. Leaving them would have kept the promise unkept in practice, since those are the texts an executing agent reads. kotta sync regenerated .kotta/AGENTS.md from the template.

### Observations created

Not declared.

### Known concerns

Not declared.
