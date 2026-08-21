---
name: setup-kotta
description: Initialize Kotta's repository-native task workspace in a Git repository. Use when a user asks to install, set up, bootstrap, or initialize Kotta for a project.
---

# Set up Kotta

Use the `kotta` CLI as the canonical mutation interface. Do not create or edit `.kotta/` state by hand.

1. Locate the Git repository root and inspect any existing workspace directory and `.gitignore` entry. `.kotta/` is the workspace directory; a directory under the pre-rename name is still read, and `init` refuses to add a second one beside it. The README section "Renamed from A-Team" is the single description of that compatibility, including how to migrate an existing workspace (`git mv` plus a backwards symlink) and what happens when both names are real directories — read it there rather than restating it.
2. Explain any conflict that would prevent a safe initialization. Preserve existing files; never overwrite them silently.
3. Run `kotta init` from the repository root. Add `--json` when structured output is useful.
4. `init` also writes `.kotta/AGENTS.md` — the rules every agent in this project must follow, including the command that installs the CLI they require. That file is Kotta's; `kotta sync` keeps it current and reports it as drifted rather than overwriting an edited one.
5. The project's own `AGENTS.md` is **not** Kotta's. `init` reports one pointer line and adds nothing. Explain what `kotta sync --link-agents` will do, then run it only on an explicit yes: normally it appends that pointer; when the file has Kotta's complete legacy inline structure and explicit `## This repository` boundary, it replaces only the obsolete Kotta-owned prelude and preserves the project section byte-for-byte. Similar-looking or unrecognized content is never removed. A no is a no: the rules are still readable at `.kotta/AGENTS.md`. With no human to ask, never pass the flag.
6. When the caller is Codex, run `kotta integrate codex`. It idempotently adds the local Kotta MCP server to the project `.codex/config.toml` without replacing existing host settings. Tell the user a new chat or host restart is required before newly configured MCP tools appear.
7. Run `kotta validate` and report actionable validation failures.
8. Summarize the created workspace and configuration, including the base branch and worktree policy.
9. Tell the user that `/define-task` creates the first executable work task and `kotta status` shows current state.

The filesystem under `.kotta/` is canonical. Project-owned forms and specification nodes live under
`.kotta/spec/`; Kotta-owned lifecycle and execution records live under `.kotta/process/`, and every
mutation of those process records must pass through Kotta's validated services so validation, index
generation, and transaction safety stay consistent. The calling host chat is the primary human
approval surface; `kotta ui` is a read-only projection and the CLI remains the automation and
recovery fallback.
