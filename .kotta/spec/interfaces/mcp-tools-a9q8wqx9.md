---
id: IF-01m0f0wn89cq1pnnsta9q8wqx9
form: interface
title: "The MCP tool surface"
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
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
