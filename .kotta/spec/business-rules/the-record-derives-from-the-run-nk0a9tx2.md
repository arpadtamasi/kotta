---
id: BR-01m0f0wn89v0rpw3p4nk0a9tx2
form: business-rule
title: "The record derives from the run, not the agent"
---

## Rule

An execution outcome is decided by comparing the repository against the captured baseline. Commits or uncommitted changes are implemented; an unchanged tree is no-change; a failed or empty run is agent-failed. The agent's narrative is stored as reported and never promoted into the state.

## Rationale

Completion must be demonstrated, not asserted; an agent that exits 0 talking about work it never did must be visible as exactly that.

## Scope

Every execute and resume, each appending its own record. Applies equally to what the launch may not do: an agent gets only the authority the operator configured, so an unwritable run records as no-change rather than as success.
