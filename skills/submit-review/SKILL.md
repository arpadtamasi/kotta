---
name: submit-review
description: Prepare evidence and submit an implemented Kotta task into review. Use when implementation is complete and a user or agent asks to request review, open or record a pull request, or move a task to review.
---

# Submit a task for review

Use `kotta task review` for the lifecycle mutation. Do not move the task file or edit status manually.

1. Confirm the active task, claim, branch, and worktree agree and the working tree is clean.
2. Run all required repository checks and task-specific verification.
3. Map every acceptance condition to concrete evidence. Verify the done checks of every active profile.
4. Confirm that unrelated discoveries are recorded as observations and that no hidden scope expansion remains.
5. Record the pull-request identifier or equivalent review target when available.
6. Add the review evidence required by the CLI: acceptance mapping, verification performed, deviations, observations created, and known concerns.
7. Run `kotta task review <task-id>` with supported evidence and pull-request options; use `--json` for automation. For one check, `--evidence "<answer>"` remains sufficient. For multiple checks, repeat `--evidence "<exact check>=<answer>"` once per acceptance condition and profile check. The MCP tool accepts the same mapping as an object whose keys are the exact check texts. Prefer a declared check where one exists: an answer starting with `run: <command>` is executed in the execution checkout at submission — a failure refuses the submission, a success is recorded next to the evidence as command, commit and `exit 0`. Answers without `run:` remain prose the reviewer weighs.

You have a declaration duty for deviations. The CLI never asserts "None." on your behalf: if you omit `--deviations`, the task records "Not declared.", which is an incomplete review, not a clean one. Compare the implementation against the task and pass `--deviations` with an honest statement — every deviation listed explicitly, or exactly "None." only when you verified there are none. The same duty applies to `--observations-created` and `--known-concerns`.
8. Verify that the task is in review and the claim remains in place.

Do not claim acceptance or integration. If checks fail or evidence is incomplete, keep the task active and report the corrective action.
