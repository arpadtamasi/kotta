---
id: E-01m0f0wn89t38psz6mwg7gg62a
form: entity
title: "Form (registry entry)"
used_by:
  - UC-01m0f0wn89ny7vx515ke3ksnra
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Meaning

One registered specification node type, described as data: what fields and headings a node must have, which edges it must answer, and how to recognize it in conversation.

## Identity

One YAML file under .kotta/spec/forms/, keyed by form id; the form's directory names where its nodes live.

## Attributes

id, version, directory, canonical_source, description, identity rule (prefix, ULID format, filename), required_fields (frontmatter, body_headings), required_edges (name, direction, fields, source and target forms, minimum, and the question an unanswered edge asks), recognition_signals.

## Invariants

The registry is the only source of form-specific knowledge - no form name or rule is hard-coded in TypeScript. A project-added form participates exactly like a shipped one. Sync installs newly shipped forms and never replaces an existing form file, so installed forms are project-owned. Eleven forms ship; a decision is not a form (the D- record is the ADR).
