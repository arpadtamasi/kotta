---
id: BR-01m0r52vex4j22266nepm5yq8s
form: business-rule
title: "The brief carries the way to reach Kotta"
---

## Rule

An execution brief states, once and explicitly, the invocation that reaches Kotta from the environment the agent is about to work in — proved from the running process, the way any written invocation is. The agent is never left to resolve the name `kotta` against a PATH nobody checked. The brief carries the same way for the one call its own boundary rule depends on: it tells the agent that work outside the task's scope is recorded rather than silently done, so it also names the command that records it. A rule stated without its means is a rule the agent cannot keep. Kotta also answers the question directly: a diagnostic reports whether the bare name resolves from a non-interactive shell, and names the invocation that does when it does not.

The skills and Kotta's own messages keep writing `kotta task close <id>`. They are read by people and by agents that can substitute, and turning every line of documentation into an absolute path would trade one unreadable failure for permanent noise.

## Rationale

Kotta sends its agents into worktrees and subshells, and a non-interactive shell loads no version manager, so the binary installed through one is absent there. The host configuration Kotta writes was repaired for exactly this reason; the brief was not. Today it carries no invocation at all: an agent is told what to do and never how to reach the tool that records it, while forty-nine bare `kotta` calls wait in the shipped skills. The measured cost, before any of this was fixed, was twelve `command not found` failures in one project and an operator pasting absolute paths into prompts.

A brief that is the complete execution context cannot omit how to reach the control plane it demands every state change go through.

## Scope

The execution brief, and a diagnostic that answers the reachability question on demand. Not the wording of skills or messages, which stay readable. Not installation, and not the agent's own binary, which is another program's.
