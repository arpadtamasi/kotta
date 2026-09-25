---
name: setup-kotta
description: Initialize Kotta's repository-native technical specification workspace in a Git repository, or migrate a pre-1.0 workspace to it. Use when a user asks to install, set up, bootstrap, initialize or migrate Kotta for a project.
---

# Set up Kotta

Use the `kotta` CLI as the canonical way in. Do not create `.kotta/` by hand, and never hand-edit `.kotta/legacy/`.

1. Locate the Git repository root and inspect any existing workspace directory. `.kotta/` is the workspace directory; a directory under the pre-rename name `.a-team/` is still discovered, and `init` refuses to add a second workspace beside an existing one under either name.
2. **An existing workspace is migrated, never re-initialized.** If `.kotta/config.yaml` records a shape version below 6, or a `process/` directory is present, every command except `kotta migrate` refuses and names the migration. Run `kotta migrate --dry-run`, show the human exactly what would change — the process state moves untouched into `.kotta/legacy/process/` as a read-only archive, `config.yaml` drops the process keys, the rules file and the workspace README are regenerated, and `spec/` is left byte-identical — and run `kotta migrate` on an explicit yes. Then commit the result; the board reads the base branch and shows the pre-migration files until the commit lands.
3. Explain any conflict that would prevent a safe initialization or migration. Preserve existing files; never overwrite them silently.
4. For a repository with no workspace, run `kotta init` from the repository root. Add `--json` when structured output is useful. It creates the form registry under `.kotta/spec/forms/`, one directory per form, `config.yaml` (project, base branch, protected branches) and the workspace README, and installs the skills.
5. `init` and `migrate` also write `.kotta/AGENTS.md` — the rules every agent in this project must follow, including the command that installs the CLI they require. That file is Kotta's; `kotta sync` keeps it current and reports it as drifted rather than overwriting an edited one.
6. The project's own `AGENTS.md` is **not** Kotta's, and how it is joined depends on whether one exists. Where the project has none, `init` creates it carrying the reference — nothing was protected, and rules nobody reads are not installed; report that it did, and move on. Where the project has one, **you** place the reference, because you have read the file and the CLI has not: find where it belongs in that document — beside its other tooling notes, not appended after its last line — write it in the document's own voice, say what the reference is rather than leaving a bare pointer, and show the human the exact diff before writing anything. Apply it only on an explicit yes; a no is a no, and the rules stay readable at `.kotta/AGENTS.md`. Never reorder or rewrite what the project already wrote. `kotta sync --link-agents` remains the deterministic fallback for a run with no human to ask — it appends a Kotta section at the end, which is correct but never the best placement; when the file has Kotta's complete pre-1.0 inline structure and an explicit `## This repository` boundary, it replaces only the obsolete Kotta-owned prelude and preserves the project section byte-for-byte. Similar-looking or unrecognized content is never removed. With no human to ask, never pass the flag.
7. When the caller is Codex, run `kotta integrate codex`. It idempotently adds the local Kotta MCP server — the read-only specification tools — to the project `.codex/config.toml` without replacing existing host settings. Tell the user a new chat or host restart is required before newly configured MCP tools appear.
8. Run `kotta validate` and report actionable validation failures.
9. Summarize the created or migrated workspace: the forms registered, the base branch, and — after a migration — where the archive is and that nothing reads or writes it.
10. Tell the user that the specification workshops (`impact-mapping`, `use-case-modeling`, `example-mapping` and the others) draft the first nodes, that `kotta spec new <form> --title "…"` mints a node by hand, and that `kotta gap` reports which accepted promises the code keeps.

The filesystem under `.kotta/` is canonical. The form registry and the specification nodes under
`.kotta/spec/` are the project's to shape; a node becomes the agreement when it lands on the base
branch on a human yes. There is no process layer — no task, claim, batch, observation or decision
record — and `.kotta/legacy/` is a read-only archive of the pre-1.0 one. `kotta ui` is a read-only
projection of the specification.
