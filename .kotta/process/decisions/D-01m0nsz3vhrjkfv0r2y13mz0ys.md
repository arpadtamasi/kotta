---
id: D-01m0nsz3vhrjkfv0r2y13mz0ys
title: >-
  One operation, one declaration: identity, families and rendering in the
  operation registry
date: '2026-08-22'
approved_by: cli
approved_at: '2026-08-22T22:37:52.388Z'
approval_basis: 'CLI --approve: decision.create'
---
# D-01m0nsz3vhrjkfv0r2y13mz0ys — One operation, one declaration: identity, families and rendering in the operation registry

## Decision

Four rulings, one model, so the operation registry can be specified and built:

1. **Identity is surface-independent.** Each operation carries its own id — `task.submit-review`,
   `task.start` — and the CLI name (`task review`) and the MCP tool name (`task_submit_review`)
   are two projections of that one declaration. Neither surface's spelling is the identity.
   `--caller` stays a flag on `task.start`, not a second operation, because it is one service.

2. **The registry declares families, and expansion is derived.** The entity-parameterised
   `list` and `show` families are declared once with the entities they cover; the concrete
   `task_list`, `observation_show`, … are derived from that declaration. Totality is asserted on
   the expanded set, never on the declaration count.

3. **Rendering is a field of the entry, not an exception to the registry.** An entry may carry an
   optional renderer. `task brief` — which writes the brief to stdout, a summary to stderr and
   honours `--out` — is an entry with a renderer, and the six commands the CLI's `humanize`
   special-cases today (`gap report`, `task start`, `batch start`, `task new`, `status`,
   `decision create`) become renderer fields rather than a switch statement beside the registry.

4. **No acceptance condition pins a surface count.** The totality property is asserted by deriving
   both surfaces and comparing the sets, so the test stays true as the surface grows.

## Context

F-01m0ahnn050zz0zr7yn9k18wbv walked the defined operation-registry task and found its acceptance
pinned to "40 subcommands" and "10 tools" while the code had 44 and 18 — counts produced by
counting registration call sites rather than registered operations, since one call site inside a
loop registers four. Measured again four days later the same surfaces are 43 and 19: the removal
of `dedupe` and the pre-rename MCP aliases moved both numbers. A count written into acceptance is
unsatisfiable by the time anyone reads it, which is why ruling 4 exists.

The same walk found four structural questions the task declared as "Open decisions: None" — the
name collision between surfaces, the family expansion, the brief's renderer and the humanize
special cases. Rulings 1–3 answer them; without those answers an entry's shape cannot be written
down, so the task could not be defined at all.

## Consequences

The registry becomes the single place an operation is declared, and both surfaces are generated
projections of it — a new operation reaches the CLI and MCP together or fails the totality test.
The renderer field absorbs the formatting concern that currently lives in a `humanize` switch,
which makes per-operation output a declared property rather than a growing set of exceptions.

The cost of reversal is moderate and bounded: the registry is an internal structure, not a stored
format, so abandoning it changes code and tests but no workspace on disk and no published schema.
The operation ids introduced by ruling 1 are internal identifiers; they are not written into
`.kotta/` and carry no migration.
