# Kotta workspace

This directory holds the repository's **technical specification**: the accepted promises of the
product in the precise, machine-checkable shape their forms declare. It is workspace shape
version 6.

- `spec/forms/` is the data-driven form registry. Every form's `directory` is relative to `spec/`,
  so nodes live in paths such as `spec/goals/`, `spec/use-cases/` and `spec/business-rules/`. The
  registry is the project's: add a form, and its nodes participate with nothing compiled in.
- `spec/<directory>/` holds the nodes, one Markdown file each, with the id, form, title, required
  fields and edges in the frontmatter. Identifiers are minted with `kotta spec new`, never typed.
- `legacy/` exists only in a workspace migrated from a pre-1.0 Kotta. It is a read-only archive of
  the old process state (tasks, observations, batches, claims, events, decisions, profiles); nothing
  in Kotta 1.0 reads or writes it. Its own README says what it holds.
- `AGENTS.md` is the rules file Kotta writes for the agents working in this project; `kotta sync`
  keeps it current and reports a hand-edited copy as drifted rather than replacing it.
- `config.yaml` names the project, the base branch and the protected branches.

There is no process layer here: no task, claim, batch, observation or decision record. A node
becomes the agreement when it lands on the base branch on a human yes; `kotta validate` measures
every node against its form, and `kotta gap` reports which accepted promises the code keeps — by
naming the node's id where it keeps them — and which it does not.

Repository files are canonical. Chat, the board (`kotta ui`) and pull requests are views.
