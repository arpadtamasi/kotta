---
name: impact-mapping
description: This skill should be used when the user asks to "map an outcome", "build an impact map", "identify actors", "connect features to business goals", or explain how proposed behavior produces measurable impact.
---

# Impact mapping

Turn a proposed output into a small chain of measurable outcomes and participating roles. Use
the canonical `goal` and `actor` forms from `.kotta/forms/`; keep the workshop notation in
Markdown. Treat diagrams as optional illustrations, never as the canonical record.

## Recognize the forms

Read `.kotta/forms/goal.yaml` and `.kotta/forms/actor.yaml` before drafting. Recognize a goal
when the conversation names a desired change, success measure, baseline, or target. Recognize an
actor when it names a user role, stakeholder, or external system that can change the outcome.
Separate roles by goals and responsibilities, not by demographic labels or UI permissions alone.

Say which signals triggered each proposed node. Do not create a node merely because a noun could
fit the form.

## Run the workshop

Start from the outcome, then move outward:

1. Ask what observable change matters and who benefits from it.
2. Establish the baseline, target, time horizon, and measurement source.
3. Identify actors able to help or hinder that change.
4. Ask what each actor must do differently; hand those behaviors to story mapping or use-case
   modeling when they become concrete.
5. Challenge every proposed deliverable with “which measured outcome does this move?”

Prefer focused questions based on facts already present. Draft a substantive node first, label
assumptions in the body, then ask only for facts needed to replace them. Never present an empty
frontmatter or heading template for the user to fill in.

For a goal, settle the outcome, context, baseline, target, horizon, and `measured_by` edge. For an
actor, settle the role boundary, goals, responsibilities, and at least one story or use case that
references its id. Keep a human name out of the title unless the individual, rather than the role,
is truly the actor.

Write each node beneath its registered directory. Mint a coordination-free id in the registered
prefix and ULID shape. Name the file `<slug>-<last 8 id characters>.md`; keep the full id in
frontmatter.

## When not to use

Do not use impact mapping to document a known step-by-step interaction; use use-case modeling.
Do not use it to prioritize a flat backlog without an outcome decision. Do not invent a metric
when the conversation contains only a delivery deadline. Avoid splitting one actor into personas
unless their goals or responsibilities actually differ.

## Worked examples

`.kotta/goals/reduce-staffing-lead-time-00000001.md`:

```markdown
---
id: G-01m0aq00000000000000000001
form: goal
title: Reduce staffing lead time
owner: A-01m0aq00000000000000000002
measured_by: [QA-01m0aq00000000000000000009]
---

# Outcome

Staffing coordinators produce a qualified shortlist sooner without relaxing eligibility rules.

# Context

Specialist requests currently wait while coordinators reconcile availability and competency data
from separate sources.

# Baseline and target

Reduce median elapsed time from an approved request to a three-person shortlist from 2 business
days to 4 working hours during the first quarter after rollout.
```

`.kotta/actors/staffing-coordinator-00000002.md`:

```markdown
---
id: A-01m0aq00000000000000000002
form: actor
title: Staffing coordinator
---

# Role

Owns the creation of a defensible shortlist for an approved staffing request.

# Goals

Find qualified, available people quickly and explain why each candidate qualifies.

# Responsibilities

Confirm request constraints, review eligibility evidence, and publish the shortlist to the
requesting manager.
```

The actor's required incoming edge is supplied by the worked user story and use case in the
corresponding workshop skills. Do not duplicate that relationship in actor frontmatter.
