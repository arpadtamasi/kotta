---
name: define-task
description: Turn a raw request or backlog item into a concise, spec-covered Kotta task. Use when a user asks to define, refine, clarify, create, or update a Kotta task for execution.
---

# Define a task

Investigate before asking the human. Use the `kotta` CLI for every task creation or lifecycle mutation; do not move or rewrite canonical task files directly.

1. Inspect relevant repository code, documentation, existing tasks, batches, observations, profiles, and decisions.
2. Separate observed facts from missing product intent. Ask only focused questions whose answers cannot be discovered locally.
3. Propose the smallest independently executable outcome, bounded scope, non-goals, constraints, acceptance conditions, and a verification method for each condition. Name every accepted spec node the task executes in frontmatter `spec`.
4. Select every applicable type and profile. Satisfy the union of their required sections; do not force unlike work through a generic definition.
5. Record unresolved human choices under open decisions. When none remain, write `None`, `N/A`, or
   `No open decisions`, optionally followed by a period; these are the accepted empty markers. Never
   invent intent or trade-offs.
   When a human resolves a choice and asks to retain it durably, use `kotta decision create --from <draft.md> --approve` instead of editing `.kotta/process/decisions/`.
6. Add a frontmatter `coverage` map whose keys are the exact acceptance bullet text and whose values are one or more ids already listed in `spec`. An acceptance bullet may instead contain its referenced id directly. Coverage is explicit, never inferred from similar prose. If a condition is not promised by the accepted spec, create an observation and take it through `amend-spec`; keep the task in backlog.
7. Create the item with `kotta task new`, write the investigated definition to a temporary Markdown file, then apply it with `kotta task define <task-id> --from <file>`. A valid covered definition moves directly to `defined`.
8. Run `kotta task validate <task-id>` and `kotta validate`.
9. If and only if the workspace explicitly sets `workflow.require_human_sign_approval: true`, define leaves the covered task in backlog and reports sign as the next step. Then request `task.sign` through the calling host; the approval must be human and leaves a receipt. Do not request a sign gate in the default workflow.

A defined task must have an explicit outcome, bounded scope, acceptance and verification, all active-profile requirements, no blocking open decision, a valid dependency order, and explicit acceptance-to-spec coverage.
