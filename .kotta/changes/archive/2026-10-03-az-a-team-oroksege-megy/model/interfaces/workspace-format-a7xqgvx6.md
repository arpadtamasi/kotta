---
id: IF-01m0f0wn897newtcbva7xqgvx6
form: interface
title: "The workspace file format"
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · SZ2"
    - "chat · rp, 2026-10-03 ~14:55 UTC, sent while the agent was working (not in the distillate): „ez már egyik sem kell” — answering whether discovery and migrate should still know .a-team/"
    - ".kotta/changes/az-a-team-oroksege-megy/conversation.md · J1"
  quote: "rp, 2026-10-03: „minden a-team örökség mehet, migrálni sem kell” — „és engedjük el, akkor lehessen a kotta csak a repóban” — „1”"
  inferred: "Only the discovery sentence changes, as the operator decided; the rest of the node is the accepted text."
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Purpose

The durable on-disk task everything else derives from: entities as Markdown with YAML frontmatter, claims and config as YAML, events as schema-validated JSON, under the spec and process namespaces of .kotta/.

## Preconditions

A Git repository; the layout created by init or brought current by migrate.

## Postconditions

One entity, one stable file; lifecycle state lives in the frontmatter status field alone, and a transition is an in-place edit, never a move. Published schemas define tasks, observations, batches, claims, events, and config, and each is asserted against the code that enforces it, so a published schema states what the code actually holds to.

## Invariants

Plain text, mergeable, diffable; the index carries a union merge rule. Identifiers are permanent. The spec namespace is project-owned and hand-editable; the process namespace is service-owned. Discovery SHALL find a workspace only under its own name, `.kotta/` at the repository root (BR-01m413z0y4dtjs9rs718bdnm4j), and never renames a workspace behind the user's back.kotta-<name>/` beside it (BR-01m413z0jn52xchnz360vzg57q, BR-01m413z0y4dtjs9rs718bdnm4j), and never renames a workspace behind the user's back.

## Failures

Workspace validation names the malformed file and the violated rule. A workspace recording a shape version this Kotta does not implement is refused in the direction it differs: an older one names migrate, a newer one names the upgrade and is never migrated backwards. Two real workspace directories side by side produce a warning naming the ignored one - a state to merge, not to live in. Two files claiming one identifier inside an entity directory are reported as an identifier collision; a conflicting transition surfaces as an ordinary merge conflict on the status line, resolved like any other conflict - never as a second copy.
