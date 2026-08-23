---
id: BR-01m0pw5bc7b1rkg5dct5qgdkmb
form: business-rule
title: "A rendering never claims more than the result carries"
---

## Rule

Every human-readable rendering is derived from the same result its machine-readable form carries, and never asserts an outcome that result does not support. Two consequences bind every surface. A result that did not succeed is never rendered as a success line: the rendering names what failed, so a reader learns from the output what the exit code already knows. And a task that ended at `done` is never named without its resolution, because `done` alone does not distinguish work that was delivered from work that was retired — which extends to every aggregate that summarises tasks, so a batch whose members were all cancelled does not read as a batch that was built.

## Rationale

The reason to build a tool that runs its checks instead of narrating them is that narration drifts from fact. That drift was then found in Kotta's own output. `kotta validate` printed `kotta validate completed.` while exiting 1, which left two specification errors red on the base branch across three consecutive review submissions that cited the command as clean. And a sweep that retired twelve tasks produced a workspace in which none of them could be told apart from the eighty-nine that were delivered, because the resolution sits in a field no listing shows. A machine check that is true is worth nothing if the line printed beside it is not.

## Scope

Every rendering surface: the CLI's human output, the read-only board, and any summary a tool prints for a person. Not the stored records, which already carry status and resolution as separate fields — this rule governs what is shown, never what is written.
