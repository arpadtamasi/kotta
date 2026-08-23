---
id: BR-01m0qyxvz954ay2rbm00bazrd5
form: business-rule
title: "A written invocation is proved, not hoped"
---

## Rule

Where Kotta writes an invocation of itself into a file another program will execute — a host's tool configuration, a generated launcher — it writes one proved by the running process: the interpreter executing Kotta and the absolute path of Kotta's own entry point. It never writes a bare command name for a PATH it cannot see to resolve. Where such an invocation is already recorded, Kotta reports whether it still resolves and names it when it does not, rather than reporting the configuration as complete.

## Rationale

Kotta is installed the way Node tools are installed, and the shells its agents run in are not the shell the operator typed in: a non-interactive shell loads no version manager, so a bare `kotta` is not on its PATH. Measured in one project before this rule, that produced twelve `command not found` failures across worktrees and subshells, and the operator worked around it by pasting an absolute binary path into prompts. The configuration Kotta writes for a host reproduced the same mistake exactly — `command = "kotta"` — and it fails in this repository's own session, where `which kotta` finds nothing while Kotta is running.

A name is a hope about someone else's environment. The running process already holds the fact.

## Scope

Invocations Kotta writes into files another program executes. Not the prose of Kotta's own messages, where `kotta task close <id>` is what a human should type and an absolute path would be noise. Not installation: Kotta neither installs itself nor manages a version manager, and an invocation that a later upgrade invalidates is refreshed by running the command again.
