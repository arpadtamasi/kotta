---
name: use-case-modeling
description: This skill should be used when the user asks to "write a use case", "model an interaction", "describe the main success scenario", "capture alternative flows", or clarify a multi-step actor goal.
---

# Use-case modeling

Describe one actor's goal-directed interaction with the system, including the paths that matter.
Persist the result as a `use-case` Markdown node. Keep UML terminology for precision without
requiring an UML diagram.

## Recognize the form

Read `.kotta/forms/use-case.yaml` before drafting. Recognize a use case when the conversation has an
initiating actor, a meaningful result, several ordered system interactions, and alternatives or
failures that must remain understandable together. Treat screen-by-screen instructions and internal
call traces as implementation detail unless they express actor-visible behavior.

## Run the workshop

1. State the actor's intent and the result that ends the interaction successfully.
2. Establish only genuine preconditions; keep the trigger as the first scenario step.
3. Write the main success scenario as alternating actor intentions and system responsibilities.
4. For each step, ask what can fail, vary, or be cancelled.
5. Add alternatives at the step they branch from and state where they rejoin or end.
6. Link the actor, served goal, proving examples, and any entities or interfaces used.

Ask whether the actor can observe each system response, which guarantee survives a failure, and what
must be true when the interaction ends. Draft the likely flow before asking follow-ups. Mark uncertain
facts as assumptions in prose; never hand over an empty use-case template.

Write the node under `.kotta/use-cases/` with its registered ULID prefix and filename convention.
Supply `actor` and `goal` directly. Supply evidence through example nodes whose `subjects` includes
the use-case id.

## When not to use

Do not use a use case for a one-step rule, a domain definition, or internal architecture with no
actor-visible contract. Use a state machine when valid behavior mainly depends on current state.
Avoid decomposing one actor goal into CRUD use cases unless create, read, update, and delete are
independently meaningful outcomes.

## Worked example

`.kotta/use-cases/build-qualified-shortlist-00000004.md`:

```markdown
---
id: UC-01m0aq00000000000000000004
form: use-case
title: Build a qualified shortlist
actor: A-01m0aq00000000000000000002
goal: G-01m0aq00000000000000000001
entities: [E-01m0aq00000000000000000007]
interfaces: [IF-01m0aq0000000000000000000a]
---

# Intent

Produce a reviewable shortlist for an approved staffing request.

# Preconditions

The staffing request is approved and contains required competencies and assignment dates.

# Main success scenario

1. The coordinator opens the approved request.
2. The system finds people matching the required competencies and dates.
3. The system excludes people who are not available for the full assignment window.
4. The coordinator reviews the evidence and selects three candidates.
5. The system records and publishes the shortlist.

# Alternatives

- At step 2, fewer than three eligible people exist: show every eligible person and the uncovered
  competencies; end without publishing.
- At step 4, competency evidence is stale: refresh that candidate before selection can continue.
```

The example `EX-01m0aq00000000000000000006` names this use case in `subjects`.
