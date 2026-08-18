# Kotta workspace

This directory is the repository's canonical work record. Keep contracts and batches in the directory that represents their current lifecycle state; their frontmatter `status` must match that directory.

- `backlog/`, `defined/`, `active/`, `review/`, and `done/` contain contracts.
- `observations/new/` and `observations/resolved/` contain discovered work awaiting or following disposition.
- `batches/` contains coordinated groups of contracts, organized by lifecycle state.
- `profiles/` contains project-specific requirement profiles.
- `forms/` contains the data-driven specification form registry; form-specific node directories
  such as `goals/`, `user-stories/`, and `entities/` appear only when those optional nodes are used.
- `claims/` contains temporary execution locks. Do not edit or remove an active claim casually.
- `events/` contains immutable visible chat, lifecycle and scoped approval events.
- `decisions/` contains durable human decisions. Create them with
  `kotta decision create --from <draft.md> --approve`; do not edit canonical records directly.
- `index.md` is generated; do not edit it manually.

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
