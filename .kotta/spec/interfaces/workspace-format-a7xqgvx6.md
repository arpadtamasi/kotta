---
id: IF-01m0f0wn897newtcbva7xqgvx6
form: interface
title: "The workspace file format"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Purpose

The durable on-disk task everything else derives from: entities as Markdown with YAML frontmatter, claims and config as YAML, events as schema-validated JSON, under the spec and process namespaces of .kotta/.

## Preconditions

A Git repository; the layout created by init or brought current by migrate.

## Postconditions

One entity, one stable file; lifecycle state lives in the frontmatter status field alone, and a transition is an in-place edit, never a move. Published schemas define tasks, observations, batches, claims, events, and config.

## Invariants

Plain text, mergeable, diffable; the index carries a union merge rule. Identifiers are permanent. The spec namespace is project-owned and hand-editable; the process namespace is service-owned. Discovery prefers the current directory name and never renames a workspace behind the user's back.

## Failures

Workspace validation names the malformed file and the violated rule. A workspace recording a shape version this Kotta does not implement is refused in the direction it differs: an older one names migrate, a newer one names the upgrade and is never migrated backwards. Two real workspace directories side by side produce a warning naming the ignored one - a state to merge, not to live in. Two files claiming one identifier inside an entity directory are reported as an identifier collision; a conflicting transition surfaces as an ordinary merge conflict on the status line, resolved like any other conflict - never as a second copy.
