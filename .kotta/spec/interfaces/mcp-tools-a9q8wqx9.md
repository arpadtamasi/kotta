---
id: IF-01m0f0wn89cq1pnnsta9q8wqx9
form: interface
title: "The MCP tool surface"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Purpose

The calling-chat control plane over stdio MCP: workspace status, the gap report, list and show for every entity, task create/define/validate/brief/start-caller/submit-review, observation create, message recording, and the approval elicitation.

## Preconditions

The server connected to the host (kotta integrate codex writes the project-scoped configuration idempotently); a fresh chat so tools are discovered.

## Postconditions

Identifiers and paths return as structured data, so the human never relays them. An approval interrupts the chat with one exact entity-scoped approve/reject/cancel form, records the visible response, and applies the same validated mutation the CLI would - once.

## Invariants

Same validation, same services, same refusals as the CLI. Persisted conversation stores exact visible messages only - never hidden reasoning, raw tool output, or streaming deltas. Every tool is a projection of one operation declaration, an entity-parameterised family expanding deterministically over the entities it names; the surface carries no tool the declaration does not name.

## Failures

A failed application is durable and never masquerades as a successful transition. Where the host refuses elicitation, the question moves to plain chat rather than to the terminal.
