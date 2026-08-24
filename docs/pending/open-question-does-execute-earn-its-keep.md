# Open: does `task execute` still earn its keep?

Raised by the owner, 2026-08-24, and deliberately left open.

## The observation

`execute` exists so the executing agent does not inherit the coordinator's context. Any modern
agent host can achieve that itself by spawning a subagent per task, so the fresh-context guarantee
is no longer a reason for Kotta to own a process-launching subsystem.

## What the measurement showed

- `src/commands/execute.ts` is 474 lines; `src/core/execution-metrics.ts` another 84.
- This workspace has 29 tasks recorded `inherited` against 14 `fresh`, and every wave of the
  2026-08-23 renewal used `--caller`. `execute` was not invoked once.
- The MCP surface already declines to expose it: a chat spawning its own successor would escape the
  brief boundary, so chat-driven use is already `task_start_caller`.

## What only `execute` can do

The execution record derived from the run itself — the agent's captured stdout, the exit code, the
no-change comparison, duration and reported usage. A caller-spawned subagent is invisible to Kotta,
so that record would become prose the caller writes about itself, which is the failure family the
2026-08-23 waves removed five times over.

## Why it is not a small question

`batch start` dispatches waves through the same machinery. Removing `execute` removes unattended
batch execution with it — and unattended execution is precisely where a machine-derived record is
worth most, because no human is watching to notice an agent that did nothing.

## The question to answer first

Does Kotta keep the capability to run a batch unattended?

- **Yes** → `execute` stays, but stops being the documented default; `--caller` becomes the normal
  path and `execute` the unattended one. Documentation work, no deletion.
- **No** → `execute` and `batch start` retire together: roughly 560 lines plus the batch dispatch
  machinery, and the surface then promises only what is used.
