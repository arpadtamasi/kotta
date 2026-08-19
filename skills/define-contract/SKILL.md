---
name: define-contract
description: Turn a raw request or backlog item into a concise, evidence-grounded Kotta contract. Use when a user asks to define, refine, clarify, create, update, or sign a Kotta contract off for execution.
---

# Define a contract

Investigate before asking the human. Use the `kotta` CLI for every contract creation or lifecycle mutation; do not move or rewrite canonical contract files directly.

1. Inspect relevant repository code, documentation, existing contracts, batches, observations, profiles, and decisions.
2. Separate observed facts from missing product intent. Ask only focused questions whose answers cannot be discovered locally.
3. Propose the smallest independently executable outcome, bounded scope, non-goals, constraints, acceptance conditions, and a verification method for each condition.
4. Select every applicable type and profile. Satisfy the union of their required sections; do not force unlike work through a generic definition.
5. Record unresolved human choices under open decisions. When none remain, write `None`, `N/A`, or
   `No open decisions`, optionally followed by a period; these are the accepted empty markers. Never
   invent intent or trade-offs.
   When a human resolves a choice and asks to retain it durably, use `kotta decision create --from <draft.md> --approve` instead of editing `.kotta/process/decisions/`.
6. Create the item with `kotta contract new`, write the investigated definition to a temporary Markdown file, then apply it with `kotta contract define <contract-id> --from <file>`. Keep incomplete work in backlog.
7. Run `kotta contract validate <contract-id>` and `kotta validate`.
8. Only after the definition is complete, call the Kotta `approval_request` tool for
   `contract.sign`. The human approves the exact transition in the calling host chat;
   `kotta contract sign <contract-id> --approve` remains the human-run CLI fallback. Never ask the
   human to copy the id or run that fallback when the MCP tools are available.

A defined contract must have an explicit outcome, bounded scope, acceptance and verification, all active-profile requirements, no blocking open decision, and a valid dependency order.
