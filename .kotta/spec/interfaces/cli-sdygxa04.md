---
id: IF-01m0f0wn8994dzf9z1sdygxa04
form: interface
title: "The kotta CLI"
---

## Purpose

The complete, scriptable operation surface and the human-operated recovery path: init, migrate, validate, status, the contract/observation/batch/decision/claim command families, sync, integrate, mcp, and ui. Every command supports JSON output.

## Preconditions

Node.js 20+, a Git repository; an initialized workspace for everything except init and migrate. Mutations require the control plane to be resolvable.

## Postconditions

Mutations are validated before writing and committed to canonical state. Every entity-creating command prints the identifier it minted. Exit codes reflect the outcome.

## Invariants

The id the CLI prints is the id the CLI accepts - short forms resolve on every command. Reads write nothing. A validation failure never produces a defined contract. The pre-rename binary name remains an alias of the same entrypoint.

## Failures

A refusal names the violated rule and corrective action. An ambiguous short id is refused naming the full ids it matched. A pre-migration workspace is refused naming the migrate command. A missing agent binary refuses execution before creating anything.
