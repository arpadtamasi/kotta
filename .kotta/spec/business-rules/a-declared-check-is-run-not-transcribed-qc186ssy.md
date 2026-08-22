---
id: BR-01m0m33yxt2vqxb3jvqc186ssy
form: business-rule
title: "A declared check is run, not transcribed"
---

## Rule

An evidence entry may declare a runnable check by starting its value with `run:` followed by a command. The review submission executes each declared command in the task's execution checkout, refuses the whole submission when any of them exits non-zero — naming the check and the exit code — and records, next to the evidence, the command, the commit it ran on, and its exit status. A recorded machine check is the receipt of an actual run, never a transcript; an entry without a declared check remains what it always was, prose the reviewer weighs.

## Rationale

The evidence table already refuses duplicated and self-refuting entries, but a plausible narration of a run that never happened still passes it. Executing the declared command at submission makes that class of evidence impossible to fake without also faking the repository the reviewer reads.

## Scope

Review submission on every surface (CLI and MCP). Applies per evidence entry: declared checks and prose entries mix freely in one submission. The declared command runs as the operator's own environment runs it; Kotta adds no sandbox and re-runs nothing at close.
