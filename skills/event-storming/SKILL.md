---
name: event-storming
description: This skill should be used when the user asks to "run event storming", "model the domain lifecycle", "find entities from domain events", "map commands and policies", or clarify state-dependent behavior.
---

# Event storming

Use domain events as discovery prompts, then persist stable domain concepts as `entity` and
`state-machine` nodes. Events, commands, policies, and read models may remain workshop notes unless
they reveal a durable canonical form. Keep Mermaid optional and subordinate to the Markdown facts.

## Recognize the forms

Read `.kotta/forms/entity.yaml` and `.kotta/forms/state-machine.yaml` before drafting. Recognize an
entity when something retains identity while its attributes change and multiple behaviors rely on
its invariants. Recognize a state machine when valid actions or outcomes depend on current state,
especially around approval, retry, cancellation, expiry, and terminal conditions.

## Run the workshop

1. Lay out facts that happened in past tense, in domain order.
2. Find commands, actors, external systems, policies, and hotspots around those facts.
3. Group changes around identities that must remain stable; test each proposed entity by its
   invariants rather than its database shape.
4. Extract a state machine only where named states govern permitted transitions.
5. Record triggers, guards, results, and terminal states in text.
6. Link the entity to at least one behavior or interface that uses it, and link every state machine
   to exactly the entity whose lifecycle it governs.

Ask what makes two records the same thing, what cannot change, which event changes state, what
rejects a transition, and whether repeated commands are safe. Draft the discovered model from the
conversation, label uncertain policies, and ask targeted follow-ups. Never begin with empty entity
or state tables.

Write nodes under `.kotta/entities/` and `.kotta/state-machines/` with their registered identity and
filename conventions. Keep attributes semantic; defer storage types and indexes unless they are
domain constraints.

## When not to use

Do not use event storming for a static glossary, a known one-step interaction, or a database schema
review with no domain behavior. Do not manufacture a state machine for an entity whose only states
are incidental persistence flags. Avoid treating every event-storming sticky as a canonical node.

## Worked examples

`.kotta/entities/staffing-request-00000007.md`:

```markdown
---
id: E-01m0aq00000000000000000007
form: entity
title: Staffing request
used_by:
  - UC-01m0aq00000000000000000004
  - IF-01m0aq0000000000000000000a
---

# Meaning

A request to supply one coherent set of competencies for a bounded assignment window.

# Identity

The immutable request id survives edits, approval, matching, and closure.

# Attributes

Requested competencies, assignment start and end, requesting manager, status, and published
shortlist reference.

# Invariants

The end date is not before the start date. An approved request has at least one required
competency. A published shortlist belongs to this request only.
```

`.kotta/state-machines/staffing-request-lifecycle-00000008.md`:

```markdown
---
id: SM-01m0aq00000000000000000008
form: state-machine
title: Staffing request lifecycle
entity: E-01m0aq00000000000000000007
---

# Governed lifecycle

Controls when a staffing request may be matched, published, cancelled, or closed.

# States

- `draft`: editable and not matchable
- `approved`: matchable, with no published shortlist
- `shortlisted`: shortlist published
- `closed`: assignment completed; terminal
- `cancelled`: request withdrawn; terminal

# Transitions

- `approve`: draft → approved, when dates and required competencies are present
- `publish shortlist`: approved → shortlisted, when at least one eligible candidate is selected
- `close`: shortlisted → closed
- `cancel`: draft, approved, or shortlisted → cancelled, with a recorded reason
```
