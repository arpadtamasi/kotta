---
id: BR-01m0jksma40xmkhyt0z6ajbdhn
form: business-rule
title: "Execution branches follow the configured pattern"
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Rule

Execution branch names are rendered from `git.branch_pattern` ({prefix}/{id}-{slug}) and validated against Git's own reference grammar before anything is created. A pattern that renders an unusable name is refused by name at start; nothing guesses a fallback.

## Rationale

The branch name is provenance: it carries the task id into Git history, and every wave, claim and cleanup resolves work by it. A hand-invented or malformed name breaks that trace silently; an agent once misquoted the pattern, which is exactly the failure a stated rule prevents.

## Scope

Every branch minted by task start, execute and batch dispatch. Adopted branches are exempt from the pattern (the environment named them) but never from the protected-branch rule.
