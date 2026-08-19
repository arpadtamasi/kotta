# Kotta workspace

This directory is the repository's canonical work record. It has two ownership boundaries:
project-owned specification knowledge under `spec/`, and Kotta-owned execution and lifecycle state
under `process/`. Keep contracts and batches in the process directory that represents their current
lifecycle state; their frontmatter `status` must match that directory.

- `spec/forms/` contains the data-driven form registry; every form's `directory` is relative to
  `spec/`, so nodes live in paths such as `spec/goals/`, `spec/user-stories/`, and `spec/entities/`.
- `process/backlog/`, `process/defined/`, `process/active/`, `process/review/`, and `process/done/` contain contracts.
- `process/observations/`, `process/batches/`, and `process/profiles/` contain the remaining durable process records.
- `process/claims/` contains temporary execution locks. Do not edit or remove an active claim casually.
- `process/events/` contains immutable visible chat, lifecycle and scoped approval events.
- `process/decisions/` contains durable human decisions. Create them with
  `kotta decision create --from <draft.md> --approve`; do not edit canonical records directly.
- `process/index.md` is generated; do not edit it manually.

Repository files are canonical. Visible contract chat is persisted here; provider internals, hidden
reasoning and raw tool output are not. Pull-request comments and user interfaces remain views.

Use the calling host chat's Kotta MCP tools for scoped human approvals and the `kotta` CLI as the
automation-compatible fallback. Both use the same validated services. `kotta ui` is read-only. Live
state and visible conversation stay on the configured base branch; contract feature worktrees hold
implementation code without a competing lifecycle copy. `contract execute` launches a fresh
brief-only context by default, while `contract_start_caller` explicitly keeps the caller's context.

A decision draft uses `title` frontmatter and non-empty `Decision`, `Context`, and
`Consequences` sections. The CLI assigns a stable `D-001`-style identifier and date,
validates the draft, and publishes it atomically to the identity-only filename (`D-001.md`).
