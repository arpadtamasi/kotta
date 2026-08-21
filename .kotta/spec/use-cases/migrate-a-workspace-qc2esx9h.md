---
id: UC-01m0f0wn89x00jkpqpqc2esx9h
form: use-case
title: "Migrate a workspace"
actor:
  - A-01m0f0wn89ewnpex9n4tq0s0rg
goal:
  - G-01m0f0wn89zx3nr6h1vtd9jg9h
interfaces:
  - IF-01m0f0wn8994dzf9z1sdygxa04
---

## Intent

Carry a workspace from any older shape - directory name, vocabulary, layout - to the current one without changing any identity.

## Preconditions

A workspace written under earlier names (.a-team/, findings/ready/packages, pre-namespace layout).

## Main success scenario

A dry run lists every change without writing. The migration renames directories, statuses, and frontmatter fields; the id set before and after is compared and must be identical. The result is committed so derived readers see it. A second run reports the workspace already current.

## Alternatives

The migration is interrupted: every step derives from disk, so running it again finishes the job. Every other command refuses a pre-migration workspace by naming the migrate command - there is deliberately no compatibility layer behind that refusal.
