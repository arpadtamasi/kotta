---
name: setup-kotta
description: Initialize Kotta's repository-native technical specification workspace in a Git repository. Use when a user asks to install, set up, bootstrap, initialize or migrate Kotta for a project.
---

# Set up Kotta

Use the `kotta` CLI as the canonical way in. Do not create `.kotta/` by hand.

1. Locate the Git repository root and inspect any existing workspace directory. `.kotta/` is the workspace directory, and `init` refuses to create one where it already exists.
2. **An existing workspace is migrated, never re-initialized.** On a current workspace, `kotta migrate --dry-run` still has work when an earlier release left changes under `openspec/changes/`: it moves them into `.kotta/changes/`, and keeps the OpenSpec narrative (`narrative: generated`) where the project has `openspec/specs/`. If `.kotta/config.yaml` records a shape version below 6, or a `process/` directory is present, the workspace is from before 1.0: every command refuses it and names the last release that migrates it (`npx -y -p @arpadtamasi/kotta@1.0.0-alpha.4 kotta migrate`). Tell the human; run that only on an explicit yes, then commit the result.
3. Explain any conflict that would prevent a safe initialization or migration. Preserve existing files; never overwrite them silently.
4. For a repository with no workspace, run `kotta init` from the repository root. Add `--json` when structured output is useful. It creates the form registry under `.kotta/spec/forms/`, one directory per form, `config.yaml` (project, base branch, protected branches) and the workspace README, and installs the skills.
5. `init` also writes `.kotta/AGENTS.md` — the rules every agent in this project must follow, including the command that installs the CLI they require. That file is Kotta's; `kotta sync` keeps it current and reports it as drifted rather than overwriting an edited one.
6. The project's own `AGENTS.md` is **not** Kotta's, and how it is joined depends on whether one exists. Where the project has none, `init` creates it carrying the reference — nothing was protected, and rules nobody reads are not installed; report that it did, and move on. Where the project has one, **you** place the reference, because you have read the file and the CLI has not: find where it belongs in that document — beside its other tooling notes, not appended after its last line — write it in the document's own voice, say what the reference is rather than leaving a bare pointer, and show the human the exact diff before writing anything. Apply it only on an explicit yes; a no is a no, and the rules stay readable at `.kotta/AGENTS.md`. Never reorder or rewrite what the project already wrote. `kotta sync --link-agents` remains the deterministic fallback for a run with no human to ask — it appends a Kotta section at the end, which is correct but never the best placement; when the file has Kotta's complete pre-1.0 inline structure and an explicit `## This repository` boundary, it replaces only the obsolete Kotta-owned prelude and preserves the project section byte-for-byte. Similar-looking or unrecognized content is never removed. With no human to ask, never pass the flag.
7. When the caller is Codex, run `kotta integrate codex`. It idempotently adds the local Kotta MCP server — the read-only specification tools — to the project `.codex/config.toml` without replacing existing host settings. Tell the user a new chat or host restart is required before newly configured MCP tools appear.
8. Run `kotta validate` and report actionable validation failures.
9. Summarize the created workspace: the forms registered and the base branch.
10. Tell the user that every proposal starts as a change — `kotta change new <name>` opens `.kotta/changes/<name>/` with a proposal to write — that the specification workshops (`impact-mapping`, `use-case-modeling`, `example-mapping` and the others) draft nodes into it, that `kotta spec new <form> --title "…" --into <change>` mints one by hand, that the `plan-change` skill takes it to the one gate, and that `kotta gap` reports which accepted promises the code keeps. If the repository already has an `openspec/specs/` folder, `kotta import openspec` takes it in as a change.

The filesystem under `.kotta/` is canonical. The form registry and the specification nodes under
`.kotta/spec/` are the project's to shape; a node becomes the agreement when it lands on the base
branch on a human yes. `kotta ui` is a read-only
projection of the specification.
