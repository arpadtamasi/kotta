---
name: close-task
description: Safely complete an accepted and integrated Kotta task, release its claim and Git resources, and update batch status. Use when a reviewed task has been accepted and merged or otherwise integrated.
---

# Close a task

Use `kotta task close` as the canonical completion operation. Never delete claims, branches, worktrees, or canonical task files by hand.

1. Verify recorded review acceptance, merged or integrated status, acceptance evidence, and all active-profile completion checks.
2. Confirm the final resolution, normally `completed`; use another supported resolution only when it truthfully describes the outcome.
3. Inspect the claimed worktree and branch for uncommitted or unintegrated work. Stop rather than delete unsafe Git resources.
4. Prepare task close in chat and let the human inspect and approve the exact action there. The
   human-run CLI fallback is `kotta task close <task-id> --approve`.
5. Verify that the task's frontmatter status became done, the claim was released, safe worktree and local-branch cleanup occurred, the containing batch was updated, and `.kotta/process/index.md` was regenerated.
6. Report any resource intentionally retained and the exact safe follow-up.

A merge alone is insufficient: completion requires accepted review and verified acceptance. Rejected review returns through a legal CLI transition instead of being closed.

Work whose purpose is gone is not closed at all — it is retired. `kotta task cancel <id>
--resolution <resolution> --reason "…" --approve` accepts any state before `done`, and
`--superseded-by <id>` names the task or decision that took its place, which `duplicate` and
`obsolete` require. Use it when a decision made the task objectless, when another task
duplicates it, or when it is abandoned outright. Closing such a task as `completed` records work
that was never wanted, and leaving it in `active` or `review` is not a resolution.
