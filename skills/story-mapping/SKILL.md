---
name: story-mapping
description: This skill should be used when the user asks to "map the user journey", "slice stories", "create a story map", "write a user story", or organize capabilities into a walking skeleton and releases.
---

# Story mapping

Map an actor's activity flow, then cut small, independently valuable slices through it. Persist
the resulting behavior as `user-story` nodes; keep the spatial story map as a disposable workshop
view rather than canonical notation.

## Recognize the form

Read `.kotta/spec/forms/user-story.yaml` before drafting. Recognize a user story when an actor wants a
small capability for a stated benefit and concrete examples could demonstrate it. Treat task lists,
technical components, and broad end-to-end processes as signals to reshape the conversation, not
as stories automatically.

## Run the workshop

1. Name the actor and the outcome framing the map.
2. Lay out the actor's activities from trigger to useful result.
3. Place concrete tasks beneath the activities in narrative order.
4. Find the thinnest end-to-end walking skeleton.
5. Slice by business rule, data variation, happy path versus exception, or degree of automation.
6. Attach at least one observable example to every story before calling the slice understood.

Ask what the actor can observe after the story, why that result matters, and which variation can be
deferred safely. Reject conjunction-heavy stories: if the story needs “and then” to state value, look
for another slice. Preserve ordering and release groupings in prose only when they carry a decision.

Draft from the conversation immediately. Record assumptions under Notes and follow with narrow
questions. Never ask the user to complete a blank story-card template. Use an existing actor id;
create an actor node only when the role itself needs definition.

Write the node under `.kotta/spec/user-stories/` using the registered ULID and slug-plus-short-id
filename. Supply `actor` directly. Supply evidence with an `example` node whose `subjects` contains
the story id; do not add a second reciprocal edge.

## When not to use

Do not use story mapping for a single already-understood behavior, a purely technical refactor, or
a lifecycle whose state transitions are the main difficulty. Use use-case modeling when alternative
flows must remain coherent as one interaction. Do not treat a story map as a delivery promise or
force every backlog item into it.

## Worked example

`.kotta/spec/user-stories/explain-shortlist-eligibility-00000003.md`:

```markdown
---
id: US-01m0aq00000000000000000003
form: user-story
title: Explain shortlist eligibility
actor: A-01m0aq00000000000000000002
---

# Story

As a staffing coordinator, I want every shortlisted candidate to show the matching competencies
and availability window so that I can defend the recommendation without reopening source systems.

# Value

The coordinator can publish a trustworthy shortlist in one review pass.

# Notes

The first slice explains inclusion only; ranking explanations remain outside this story.
```

The example `EX-01m0aq00000000000000000006` in the example-mapping skill names this story in
`subjects`, satisfying its evidence edge.
