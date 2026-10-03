---
id: IF-01m0f0wn8994dzf9z1sdygxa04
form: interface
title: "The kotta CLI"
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · P6"
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · J1"
  quote: "rp, 2026-10-03: „minden a-team örökség mehet, migrálni sem kell”"
  inferred: "The refusal sentence changes, the pre-rename binary alias (already gone from the package) leaves with the rest of the A-Team heritage, and two obligations gain the SHALL the repository's OpenSpec narrative requires; the rest of the node is the accepted text."
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Purpose

The complete, scriptable operation surface and the human-operated recovery path: init, migrate, validate, status, sweep, questions, gap, the task/observation/batch/decision/claim command families, sync, integrate, mcp, and ui. Every command supports JSON output.

## Preconditions

Node.js 20+, a Git repository; an initialized workspace for everything except init and migrate. Mutations require the control plane to be resolvable.

## Postconditions

Mutations are validated before writing and committed to canonical state. Every entity-creating command SHALL print the identifier it minted. Exit codes SHALL reflect the outcome. The human rendering of a result carries what its JSON carries: a non-zero exit is explained in the printed output rather than left to the exit code alone. An invocation of Kotta written into another program's configuration is proved from the running process, never left to that program's PATH.

## Invariants

The id the CLI prints is the id the CLI accepts - short forms resolve on every command. Reads SHALL write nothing. A validation failure never produces a defined task. Every invocable command is a projection of one operation declaration; the CLI carries no command the declaration does not name.

## Failures

A refusal names the violated rule and corrective action. An ambiguous short id is refused naming the full ids it matched. A pre-1.0 workspace SHALL be refused naming the last release that migrates it (BR-01m0q89b16xcfasfj1z8mc2hgg). A missing agent binary refuses execution before creating anything.
