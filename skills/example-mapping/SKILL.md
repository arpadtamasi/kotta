---
name: example-mapping
description: This skill should be used when the user asks to "map examples", "clarify acceptance criteria", "write Given When Then examples", "discover business rules", or turn ambiguous requirements into concrete cases.
---

# Example mapping

Use concrete examples to expose and settle business rules. Persist durable policies as
`business-rule` nodes and observable cases as `example` nodes. Keep questions in the workshop;
store only established facts and explicitly accepted gaps in canonical nodes.

## Recognize the forms

Read `.kotta/forms/business-rule.yaml` and `.kotta/forms/example.yaml` before drafting. Recognize a
business rule in durable “must”, “only”, “never”, eligibility, threshold, classification, or
derivation language. Recognize an example when concrete inputs, context, and observable outcomes can
prove or falsify a story, use case, rule, or quality scenario.

## Run the workshop

1. Start with one story or use case and one representative example.
2. Extract the rule that explains the expected outcome.
3. Vary one fact at a time across boundaries and counterexamples.
4. Separate unanswered questions from rules; resolve only what the available evidence supports.
5. Give each durable rule its own node and each materially distinct case its own example node.
6. Put every proved node id in the example's `subjects` list.

Ask for real values, boundary values, observable outcomes, and the business consequence of a
violation. Draft a plausible case from stated facts first, then ask narrow questions about remaining
ambiguity. Never ask the user to fill a blank Given/When/Then card.

Write nodes under `.kotta/business-rules/` and `.kotta/examples/`. Let the example's `subjects`
edge be canonical; do not mirror it onto the proved nodes. Keep setup facts in Given, the single
event under When, and externally observable results under Then.

## When not to use

Do not use example mapping to invent product policy, enumerate every test case, or replace
exploratory testing. Use a quality scenario when the essential claim is a measured response under
load or failure. Avoid turning incidental implementation details into business rules.

## Worked examples

`.kotta/business-rules/availability-covers-assignment-00000005.md`:

```markdown
---
id: BR-01m0aq00000000000000000005
form: business-rule
title: Availability covers the whole assignment
---

# Rule

A person is eligible only when confirmed availability covers every day from the assignment start
through the assignment end, inclusive.

# Rationale

A partial overlap cannot produce a deliverable staffing commitment.

# Scope

Apply the rule to automatic matching and manual shortlist additions. Approved split assignments
are separate staffing requests rather than exceptions.
```

`.kotta/examples/unavailable-candidate-is-excluded-00000006.md`:

```markdown
---
id: EX-01m0aq00000000000000000006
form: example
title: Unavailable candidate is excluded
subjects:
  - US-01m0aq00000000000000000003
  - UC-01m0aq00000000000000000004
  - BR-01m0aq00000000000000000005
  - QA-01m0aq00000000000000000009
---

# Given

An approved request runs from 6 October through 31 October, requires Kotlin, and the catalog holds
60,000 people. Mira has verified Kotlin competency but confirmed availability only through 24 October.

# When

The coordinator requests qualified candidates.

# Then

Mira is absent from the results, every returned candidate covers the full date range, and the
95th-percentile response time recorded by the acceptance environment is at most 2 seconds.
```
