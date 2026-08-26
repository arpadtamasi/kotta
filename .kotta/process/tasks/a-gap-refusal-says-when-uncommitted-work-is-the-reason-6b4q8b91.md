---
id: T-01m0xraxm6k5mbbr266b4q8b91
title: A gap refusal says when uncommitted work is the reason
status: active
origin: human
types:
  - bug
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
spec:
  - IF-01m0f0wn8994dzf9z1sdygxa04
  - UC-01m0fpqfxjvet99wbz0v1ag64q
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-26'
updated_at: '2026-08-26'
coverage:
  'A refusal that uncommitted work would explain says so. When `kotta gap` refuses and the working tree holds uncommitted changes that could carry the missing evidence, the refusal names that as the likely cause and the step that settles it.':
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'A refusal with nothing uncommitted is unchanged. The sentence appears only when there is something to explain, so it never becomes a line every refusal carries.':
    - IF-01m0f0wn8994dzf9z1sdygxa04
  'The report stays deterministic and still writes nothing. The added sentence is derived from the same repository, the exit status is decided by the same rule as before, and a passing report gains nothing.':
    - UC-01m0fpqfxjvet99wbz0v1ag64q
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 4dda185b6717638d87221f53ead41c112b668dd3
---
## Outcome

The gap report stops reading as a defect when it is only reading an older commit. `gapReport` walks the accepted specification on `git.base_branch`, deliberately — the accepted agreement is what landed, not what is being typed. The consequence is that a wave which lands a spec node together with the code naming it fails until the commit exists, then passes unchanged, and the failure explains none of that: it names the node, names the id it looked for, and says the evidence is missing.

It cost a diagnosis three times in two days (F-01m0sm78y2b1vpg1msj98cvwxz): on the ratchet's own wave, on T-01m0qz128k7h6vtnhnykj5sba8, and on T-01m0jdnwfg647qh8j2673emy85 at 69746e2 — and a fourth time yesterday, landing the approval-machinery rules. Every time the evidence was already written, one `git commit` away from the ref the report reads. `IF-01m0f0wn8994dzf9z1sdygxa04` promises a refusal names the violated rule *and the corrective action*; here the corrective action is not a fix to the code at all, and the report never says so.

## Scope

- When the report refuses, and the working tree holds uncommitted changes that could carry the missing evidence, the refusal names that possibility and the step that settles it.
- The header already states `Base: <branch>@<commit>`; this connects that fact to the failure in front of the reader.

## Non-goals

- Reading the working tree. The report's subject is the accepted agreement, which is what landed on the base branch; making it read uncommitted files would change what it measures.
- Changing the exit status. A refusal caused by an uncommitted evidence file is still a refusal — the reader is told why, not let through.
- Warning on a passing report. A dirty tree that changes nothing needs no sentence.

## Acceptance

- A refusal that uncommitted work would explain says so. When `kotta gap` refuses and the working tree holds uncommitted changes that could carry the missing evidence, the refusal names that as the likely cause and the step that settles it.
- A refusal with nothing uncommitted is unchanged. The sentence appears only when there is something to explain, so it never becomes a line every refusal carries.
- The report stays deterministic and still writes nothing. The added sentence is derived from the same repository, the exit status is decided by the same rule as before, and a passing report gains nothing.

## Verification

- `run: npx vitest run tests/integration/gap-ratchet.test.ts` — the refusal, with and without uncommitted work.
- `run: npx vitest run tests/integration/gap-kinds.test.ts tests/integration/gap-readability.test.ts` — the report's shape and its determinism.

## Constraints

The sentence must not claim the uncommitted files *are* the evidence — the report has not read them, and saying so would be the same overclaim the rendering rule forbids. It says what is uncommitted and what would settle the question.

## Open decisions

None.

## Execution notes

`gapReport` in `src/commands/gap.ts:259` resolves `baseBranch^{commit}` and reads everything at that ref; the refusal is assembled around line 309, where `UNADMITTED_PROMISE` is pushed. `git(root, ["status", "--porcelain"])` is the cheapest read of the working tree, and `readableRepositoryFiles` already knows which paths are excluded from evidence.

`tests/integration/gap-ratchet.test.ts` builds a fixture that commits its nodes precisely because of this; a case that deliberately leaves them uncommitted is the missing one.
