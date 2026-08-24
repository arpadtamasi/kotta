---
id: UC-01m0f0wn89b2ymcw1c3qd4vcxb
form: use-case
title: "Execute a task in a fresh context"
actor:
  - A-01m0f0wn89wpjph2q6xv5xrv38
goal:
  - G-01m0f0wn89hek1751b5xje6pfa
interfaces:
  - IF-01m0f0wn89efd2ss83c4csk7qx
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Intent

Implement one defined task in an isolated Git context, from its brief alone, and record what the run actually did.

## Preconditions

The task is defined, its dependencies are done, no claim or execution context exists, the repository is clean, and the agent command resolves.

## Main success scenario

Execute claims the task, creates the feature branch and worktree (or adopts the environment's existing non-protected branch), assembles the brief and reports its token count, captures the baseline, and launches the agent with the brief as its only input. The agent implements and verifies within scope. The run is compared against the baseline and recorded as implemented.

## Alternatives

A non-zero exit or empty result is agent-failed: claim and worktree are kept for inspection; resume reuses the existing context, and a second plain execute is refused. An unchanged tree is recorded as no-change regardless of the agent's story. Continuity over isolation is the explicit opt-in: start with caller keeps execution in the current context, labeled inherited. Context carry-over into a fresh run requires a declared, logged reason. The brief plus the worktree not sufficing means the task is incomplete - the gap is recorded, the context never widened.
