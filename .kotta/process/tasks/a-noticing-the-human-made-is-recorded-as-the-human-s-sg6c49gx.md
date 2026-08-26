---
id: T-01m0ypa2rb5xev2g5dsg6c49gx
title: A noticing the human made is recorded as the human's
status: review
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
  - UC-01m0f0wn89jqb5mpcjjt1j5j8p
  - E-01m0f0wn89cry06jvtwtmpk4fr
branch: claude/graft-kottara-837884
pull_request: null
created_at: '2026-08-26'
updated_at: '2026-08-26'
coverage:
  'A noticing the human made can be recorded as the human''s. `observation new` takes the origin, the record carries it, and the calling chat can record what the operator said without it becoming the agent''s own.':
    - UC-01m0f0wn89jqb5mpcjjt1j5j8p
    - E-01m0f0wn89cry06jvtwtmpk4fr
  'The default is unchanged and honest. Without the option an observation is the agent''s, as it always was, and only the declared values are accepted.':
    - E-01m0f0wn89cry06jvtwtmpk4fr
  Whose noticing it was is visible where observations are read. The listing and the record distinguish a human's from an agent's without anyone opening the file.:
    - E-01m0f0wn89cry06jvtwtmpk4fr
assigned_agent: claude
worktree: .
execution_mode: inherited
branch_origin: adopted
start_ref: HEAD
start_commit: 9a7e879991847f0d8b495bfe771847e8e8e72a0d
---
## Outcome

The operator's noticings stop evaporating in the conversation they were said in. Measured on this workspace, 146 of 150 observations carry `origin: agent`, and the four that do not came from migration — because `src/commands/observation.ts` writes `origin: "agent"` as a literal and `observation new` has no option for it. A human cannot file an observation as their own at all, on either surface.

That is the half of F-01m0f0y1rmqbqnmyat9q3f-021 that costs something. Severity and confidence are hardcoded the same way, and that is a separate question this task does not answer: nobody has been able to supply them, so there is no evidence about whether they earn their place. Origin is different — the information exists, it is made in passing, and it is lost.

## Scope

- `observation new` takes the origin, defaulting to the agent as today, accepting only the declared values.
- The MCP `observation_create` path carries it, so the calling chat can record what the operator said as theirs.
- The listing shows whose noticing it was.

## Non-goals

- `severity` and `confidence`. They are hardcoded too, and whether they should be supplied, defaulted or removed is a decision with no evidence behind it yet; deciding it here would be taste, not measurement.
- Back-filling the 146. Which of them the operator actually noticed is not recorded anywhere.
- Any change to what an observation means, how it is validated, or how it is dispositioned.

## Acceptance

- A noticing the human made can be recorded as the human's. `observation new` takes the origin, the record carries it, and the calling chat can record what the operator said without it becoming the agent's own.
- The default is unchanged and honest. Without the option an observation is the agent's, as it always was, and only the declared values are accepted.
- Whose noticing it was is visible where observations are read. The listing and the record distinguish a human's from an agent's without anyone opening the file.

## Verification

- `run: npx vitest run tests/integration/observation.test.ts` — the option, the default, and the refusal of an undeclared value.
- `run: npx vitest run tests/integration/mcp.test.ts -t 'observation'` — the chat path records the operator's own.
- `run: npx vitest run tests/integration/list.test.ts tests/integration/surface-snapshot.test.ts` — the listing and the declared surface.

## Constraints

`ENTITY_ORIGINS` already publishes the two values and the schema already requires the field; this makes the existing field reachable rather than adding one, so no record changes shape and no workspace needs migrating.

## Open decisions

None.

## Execution notes

The literal is at `src/commands/observation.ts:75`, inside `writeObservation`'s `data` object. `newObservation` takes `{ title, type, evidence, discoveredDuring }` today and is called from both the CLI action and the MCP `observation_create` tool.

`ENTITY_ORIGINS` in `src/filesystem/entities.ts` is the published set to validate against — restating the two values here would be the drift the schema-to-enum agreement test forbids.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| A noticing the human made can be recorded as the human's. `observation new` takes the origin, the record carries it, and the calling chat can record what the operator said without it becoming the agent's own. | run: npx vitest run tests/integration/observation.test.ts -t 'records the operator' tests/integration/mcp.test.ts — verified: exit 0 at 8b364e5 |
| The default is unchanged and honest. Without the option an observation is the agent's, as it always was, and only the declared values are accepted. | run: npx vitest run tests/integration/observation.test.ts -t 'defaults to the agent' — verified: exit 0 at 8b364e5 |
| Whose noticing it was is visible where observations are read. The listing and the record distinguish a human's from an agent's without anyone opening the file. | run: npx vitest run tests/integration/list.test.ts tests/integration/surface-snapshot.test.ts — verified: exit 0 at 8b364e5 |

### Verification performed

A noticing the human made can be recorded as the human's. `observation new` takes the origin, the record carries it, and the calling chat can record what the operator said without it becoming the agent's own.: run: npx vitest run tests/integration/observation.test.ts -t 'records the operator' tests/integration/mcp.test.ts
The default is unchanged and honest. Without the option an observation is the agent's, as it always was, and only the declared values are accepted.: run: npx vitest run tests/integration/observation.test.ts -t 'defaults to the agent'
Whose noticing it was is visible where observations are read. The listing and the record distinguish a human's from an agent's without anyone opening the file.: run: npx vitest run tests/integration/list.test.ts tests/integration/surface-snapshot.test.ts

### Deviations

One fix beyond the stated Scope: observation_create's double control-plane lock. It is a distinct defect that predates this task and is recorded as its own observation, but the third acceptance condition — the chat records the operator's own — cannot be true while that path refuses as busy, so it was necessary rather than opportunistic. The change removes a wrapper whose commit the service already performed.

### Observations created

F-01m0ypea8kn7shamp4a0t798a8 (the operator's own, recorded as theirs: severity and confidence are still constants, and whether they earn their place has no evidence yet), F-01m0ypjk6gzymm0y51m96mmdaw (observation_create deadlocked on its own lock)

### Known concerns

Not declared.
