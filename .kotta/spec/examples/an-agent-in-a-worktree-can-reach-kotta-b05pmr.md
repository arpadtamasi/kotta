---
id: EX-01m0r52vexxy9azs452pb05pmr
form: example
title: "An agent in a worktree can reach Kotta"
subjects:
  - BR-01m0r52vex4j22266nepm5yq8s
---

## Given

A task started in its own worktree, and an agent about to execute it from a shell that has no version manager loaded, so the name `kotta` resolves to nothing.

## When

The agent reads its brief.

## Then

The brief states the invocation that reaches Kotta from there, proved from the process that wrote the brief, so the agent can record every state change without discovering the gap by failing. Asking Kotta directly answers the same question: the diagnostic reports that the bare name does not resolve and names the invocation that does.
