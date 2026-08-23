---
id: E-01m0f0wn89p79s6bffpcbqw35f
form: entity
title: "Workspace"
used_by:
  - UC-01m0f0wn89m98wpkqq8e5c9p6p
  - UC-01m0f0wn89x00jkpqpqc2esx9h
interfaces:
  - IF-01m0f0wn897newtcbva7xqgvx6
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Meaning

The .kotta/ directory: the repository-native record of specification knowledge and execution state for one project.

## Identity

One per repository, discovered by name (.kotta/ first, the pre-rename directory otherwise). Never two real workspace directories side by side.

## Attributes

Bootstrap files (AGENTS.md, README.md, config.yaml, generation metadata); spec/ - the project-owned specification layer with the form registry and node directories; process/ - the service-owned lifecycle layer with tasks, observations, batches, profiles, claims, events, decisions, and the generated index.

## Invariants

Plain Markdown, YAML, and JSON - mergeable and diffable. Entity state is the frontmatter status field; a file's location never encodes it. Identifiers never change across migrations; the migration compares the id set before and after and refuses to lose one.
