---
id: T-01kz23pvzscenqavzx4tg62x1b
title: A vegrehajto agens jelentese automatikusan a ticketbe kerul
status: backlog
origin: observation
types:
  - feature
  - workflow
profiles:
  - workflow
priority: high
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-01kz23nj69srgr2w13htpyyahh
---
# T-01kz23pvzscenqavzx4tg62x1b — A végrehajtó ágens jelentése automatikusan a ticketbe kerül

## Outcome

The executing agent's report lands in the repository by itself. `ticket execute` writes the agent's full output to a canonical place tied to the ticket, and `ticket review` can cite it instead of the coordinator retyping it. What the executor actually said survives even when the coordinator summarises badly, and the two can be compared.

## Context

Observed across six consecutive agent runs on 2026-08-02. `ticket execute` (T-035) captures the agent's stdout — but only to decide whether the result was empty. It is never written anywhere. The report therefore lives in one process and disappears; what reaches the ticket is whatever the coordinator retypes into `ticket review --evidence`.

Three ways that degrades today, none of them gated:

- The coordinator **omits**. T-020's report summarised 161 tool calls; the evidence carried what the coordinator judged important.
- The coordinator **rephrases**. The evidence stops being what the executor claimed and becomes what the reviewer understood — the directness between proof and prover is lost.
- The coordinator's **context compacts** between steps and the report is simply gone.

The operator's instruction is explicit: this must happen automatically, not by discipline. Today's other lesson supports it — D-009 was written down, and five tickets were then executed in the coordinator's own context anyway.

Sibling: F-018, the same weakness seen from the other side — `ticket review --evidence` takes one string and the template writes that same blob into every acceptance row.

## Scope

- `ticket execute` persists the agent's complete output to a canonical location bound to the ticket, on every outcome — success, `agent-failed` and cancellation alike, because a failed run's report is the most valuable one.
- The location is derived, not passed in, so no caller can redirect or skip it.
- `ticket review` can reference the stored report; the evidence cites it rather than replacing it.
- The stored report is committed with the ticket's own work, so it travels with the branch.
- The report is recorded verbatim. The coordinator's summary is a separate, additional statement — never an overwrite.

## Non-goals

- Judging whether the report is truthful or complete — that is F-018's deeper machinery.
- Per-acceptance-condition evidence mapping — also F-018.
- Changing how the coordinator writes review evidence by hand; this ticket adds the raw record beside it.
- Capturing anything from agents not launched through `ticket execute`.

## Actors

- The executing agent, whose report this is.
- `ticket execute`, which now records it.
- The coordinator, who reviews against it.
- A later reader, for whom the raw report is the only unmediated account.

## Initial state

A ready ticket with an execution context, about to run an agent.

## States

- `unrecorded` — the agent has not returned.
- `recorded` — the report is on disk at its canonical path and committed.
- `recorded-failed` — the agent failed or was cancelled and the report is still recorded.

## Transitions

Agent returns → report written → committed with the ticket's work. A retry (`--resume`) records a further report without destroying the earlier one.

## Triggers

Agent completion, agent failure, and cancellation.

## Permissions

`ticket execute` may write only the report at its derived path. It never edits the ticket body and never writes review evidence on the agent's behalf.

## Error paths

An unwritable path, a report too large to store, and a second run against the same context all need defined behaviour. Losing the report silently is not one of them: if it cannot be stored, the command says so.

## Cancellation path

A cancelled run still records what the agent produced before it stopped, and says the run was cancelled.

## Retry and duplicate-action behaviour

Retrying appends a further report rather than replacing the previous one; the order of attempts stays readable.

## Audit and notification expectations

The command names the path it wrote. No external notification.

## Acceptance

1. A successful `ticket execute` leaves the agent's full output at a canonical path bound to the ticket, byte-identical to what the agent produced.
2. A failed run (non-zero exit) records the report too, marked as failed.
3. A cancelled run records what was produced before cancellation.
4. A retry records a further attempt without destroying the earlier one, and the attempts are distinguishable.
5. The path is derived from the ticket, not caller-supplied; no flag can suppress the recording.
6. If the report cannot be written, the command reports that failure rather than continuing silently.
7. `ticket review` can cite the stored report, and doing so is visible in the resulting ticket.
8. Full suite, typecheck and all three builds green.

## Verification

Integration tests over a temp repo with the existing deterministic agent double: success, non-zero exit, cancellation, retry, and an unwritable path. Assert the stored bytes equal the double's output exactly. A review that cites the report, asserted in the resulting ticket file.

## Constraints

The report is recorded verbatim — never truncated into meaning, never summarised by the tool. It must not bloat the ticket body; a reader of the ticket should still be able to read the ticket. All writes go through supported writers.

## Open decisions

None.

## Execution notes

`src/commands/execute.ts` already collects the agent's stdout and stderr and classifies the outcome; the recording hangs off the same result. `reviewTicket` in `src/commands/ticket.ts` builds the evidence block. The workspace directory name is no longer a constant — resolve it through `workspacePath()` from `src/filesystem/workspace.ts` (T-020).
