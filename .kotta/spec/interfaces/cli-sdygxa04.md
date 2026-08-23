---
id: IF-01m0f0wn8994dzf9z1sdygxa04
form: interface
title: "The kotta CLI"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Purpose

The complete, scriptable operation surface and the human-operated recovery path: init, migrate, validate, status, gap, the task/observation/batch/decision/claim command families, sync, integrate, mcp, and ui. Every command supports JSON output.

## Preconditions

Node.js 20+, a Git repository; an initialized workspace for everything except init and migrate. Mutations require the control plane to be resolvable.

## Postconditions

Mutations are validated before writing and committed to canonical state. Every entity-creating command prints the identifier it minted. Exit codes reflect the outcome. The human rendering of a result carries what its JSON carries: a non-zero exit is explained in the printed output rather than left to the exit code alone. An invocation of Kotta written into another program's configuration is proved from the running process, never left to that program's PATH.

## Invariants

The id the CLI prints is the id the CLI accepts - short forms resolve on every command. Reads write nothing. A validation failure never produces a defined task. The pre-rename binary name remains an alias of the same entrypoint. Every invocable command is a projection of one operation declaration; the CLI carries no command the declaration does not name.

## Failures

A refusal names the violated rule and corrective action. An ambiguous short id is refused naming the full ids it matched. A pre-migration workspace is refused naming the migrate command. A missing agent binary refuses execution before creating anything.
