---
id: BR-01m0nsyasfnjc9s4073r8zb33j
form: business-rule
title: "One operation, one declaration"
---

## Rule

Every operation Kotta exposes is declared once, with a surface-independent identity, and each surface is a projection of that declaration: the CLI command name and the MCP tool name are two spellings of one entry, and a mode of one service stays a flag on its operation rather than becoming a second one. An entity-parameterised family is declared once with the entities it covers and expands deterministically. An entry may carry a renderer, so per-operation output is a declared property rather than an exception beside the registry. A declaration that names an operation for what it reports says so when the operation also writes: an entry summarised as a check, a report or a validation, and which changes stored state or commits, is a declaration that is wrong rather than incomplete. The caller decides what to run from what the declaration says, and a caller that expected a read and got a commit was not warned by anything. Neither surface may carry an operation the declaration does not name. The prose a surface prints about an operation is the declaration's summary rendered, never a second sentence written beside it: where a surface tells a human what a command does, that text comes from the entry, and a surface that prints nothing where the declaration carries a summary has projected the name without the meaning. Two hand-written descriptions of one operation part exactly as two registrations do, and the one a reader happens to meet is not the one that was checked. A surface that only prints a command for a human to type is bound the same way, whether or not it can run one: the board is read-only and still tells an operator what to run, and a command it names that no declaration carries is the same drift wearing a different surface. Being unable to act is not being unable to mislead. Where a declaration states that an operation is absent from a surface, the stated reason is part of the declaration and not commentary on it: it may not contradict an accepted node, and a reason that does is the declaration being wrong rather than the rule being excepted.

## Rationale

Two hand-maintained surfaces drift silently: an operation reaches one and not the other, and nothing says so. The failure this prevents was observed as its own symptom — a task tried to pin the surfaces by counting them, counted registration sites instead of operations, and produced acceptance conditions that were already false when written and moved twice within four days.

## Scope

The CLI and the MCP tool surface, and every surface that puts a command in front of a human - the board included. Totality is asserted by deriving both surfaces from the declaration and comparing sets — never by a count written into a specification, a task or a test, because a count is stale by the time it is read.
