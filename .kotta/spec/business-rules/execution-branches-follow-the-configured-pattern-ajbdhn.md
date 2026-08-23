---
id: BR-01m0jksma40xmkhyt0z6ajbdhn
form: business-rule
title: "Execution branches follow the configured pattern"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Rule

Execution branch names are rendered from `git.branch_pattern` ({prefix}/{id}-{slug}) and validated against Git's own reference grammar before anything is created. A pattern that renders an unusable name is refused by name at start; nothing guesses a fallback.

## Rationale

The branch name is provenance: it carries the task id into Git history, and every wave, claim and cleanup resolves work by it. A hand-invented or malformed name breaks that trace silently; an agent once misquoted the pattern, which is exactly the failure a stated rule prevents.

## Scope

Every branch minted by task start, execute and batch dispatch. Adopted branches are exempt from the pattern (the environment named them) but never from the protected-branch rule.
