---
id: GT-01m0f0wn89vf90ejhsbb4263vr
form: glossary-term
title: "Specification node"
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Definition

One Markdown file in a registered form under .kotta/spec/ - a goal, actor, use case, business rule, example, entity, state machine, quality attribute, interface, or glossary term - with identity and edges in frontmatter.

## Usage

Project-owned and directly editable; shaped in workshops, checked by traceability against the form registry. Tasks may reference spec nodes; a spec node never references a task.

## Non-examples

Lifecycle state (tasks, claims, events - service-owned). A task. A free-form design document outside the registry.
