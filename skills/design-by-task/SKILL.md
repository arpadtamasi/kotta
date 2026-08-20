---
name: design-by-task
description: This skill should be used when the user asks to "define an interface task", "write preconditions and postconditions", "specify API obligations", "model failure guarantees", or clarify responsibilities across a system boundary.
---

# Design by task

Specify a boundary by the obligations on its caller and provider. Persist the agreement as an
`interface` node with preconditions, postconditions, invariants, and failures. Describe semantics in
Markdown; include wire examples or diagrams only as supporting illustrations.

## Recognize the form

Read `.kotta/spec/forms/interface.yaml` before drafting. Recognize an interface when components,
organizations, or actors exchange a call, event, file, command, or message and correctness depends
on shared input, output, error, or compatibility obligations.

## Run the workshop

1. Name the boundary and the behavior it exposes, independent of transport.
2. Separate caller preconditions from provider validation.
3. State postconditions observable on success.
4. State invariants that hold before and after every operation.
5. Enumerate failure categories and the guarantees each failure preserves.
6. Link at least one use case or entity that references the interface.

Ask who owns each obligation, whether retries duplicate effects, what remains unchanged after
failure, and which compatibility promise external consumers rely on. Draft from known behavior,
label assumptions, then ask precise questions. Never ask the user to populate an empty task
shell.

Write the node under `.kotta/spec/interfaces/` with the registered identity and filename. Make the
reference canonical on the consuming use case or entity through its `interfaces` field; avoid a
reciprocal `used_by` list on the interface.

## When not to use

Do not use design by task for an internal helper with no meaningful boundary, for screen
behavior better expressed as examples, or as a substitute for an API schema. Do not encode
implementation choices as preconditions merely to simplify the provider.

## Worked example

`.kotta/spec/interfaces/competency-catalog-search-0000000a.md`:

```markdown
---
id: IF-01m0aq0000000000000000000a
form: interface
title: Competency catalog search
---

# Purpose

Return people whose verified competencies and confirmed availability satisfy one staffing request.

# Preconditions

The caller supplies an approved staffing request id. The request has a valid inclusive date range
and at least one required competency.

# Postconditions

Every returned person has evidence for each required competency and confirmed availability covering
the full assignment window. The operation does not change the request or person records.

# Invariants

Person and request ids retain their meaning across retries. Identical catalog and request versions
produce the same eligibility set regardless of result ordering.

# Failures

- Unknown or unapproved request: reject without querying candidates.
- Catalog unavailable: report a retryable failure and return no partial eligibility set.
- Request changes during evaluation: reject the stale result and allow a fresh retry.
```

The use case `UC-01m0aq00000000000000000004` references this interface through `interfaces`.
