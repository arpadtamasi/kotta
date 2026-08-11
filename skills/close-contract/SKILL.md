---
name: close-contract
description: Safely complete an accepted and integrated Kotta contract, release its claim and Git resources, and update batch status. Use when a reviewed contract has been accepted and merged or otherwise integrated.
---

# Close a contract

Use `kotta contract close` as the canonical completion operation. Never delete claims, branches, worktrees, or canonical contract files by hand.

1. Verify recorded review acceptance, merged or integrated status, acceptance evidence, and all active-profile completion checks.
2. Confirm the final resolution, normally `completed`; use another supported resolution only when it truthfully describes the outcome.
3. Inspect the claimed worktree and branch for uncommitted or unintegrated work. Stop rather than delete unsafe Git resources.
4. Prepare contract close in chat and let the human inspect and approve the exact action there. The
   human-run CLI fallback is `kotta contract close <contract-id> --approve`.
5. Verify that the contract moved to done, the claim was released, safe worktree and local-branch cleanup occurred, the containing batch was updated, and `.kotta/index.md` was regenerated.
6. Report any resource intentionally retained and the exact safe follow-up.

A merge alone is insufficient: completion requires accepted review and verified acceptance. Rejected review returns through a legal CLI transition instead of being closed.

Work whose purpose is gone is not closed at all — it is retired. `kotta contract cancel <id>
--resolution <resolution> --reason "…" --approve` accepts any state before `done`, and
`--superseded-by <id>` names the contract or decision that took its place, which `duplicate` and
`obsolete` require. Use it when a decision made the contract objectless, when another contract
duplicates it, or when it is abandoned outright. Closing such a contract as `completed` records work
that was never wanted, and leaving it in `active` or `review` is not a resolution.
