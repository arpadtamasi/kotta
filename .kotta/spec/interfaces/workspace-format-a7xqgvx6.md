---
id: IF-01m0f0wn897newtcbva7xqgvx6
form: interface
title: "The workspace file format"
---

## Purpose

The durable on-disk contract everything else derives from: entities as Markdown with YAML frontmatter, claims and config as YAML, events as schema-validated JSON, under the spec and process namespaces of .kotta/.

## Preconditions

A Git repository; the layout created by init or brought current by migrate.

## Postconditions

One entity, one file; lifecycle state expressed as directory plus status field, kept consistent. Published schemas define contracts, observations, batches, claims, events, and config.

## Invariants

Plain text, mergeable, diffable; the index carries a union merge rule. Identifiers are permanent. The spec namespace is project-owned and hand-editable; the process namespace is service-owned. Discovery prefers the current directory name and never renames a workspace behind the user's back.

## Failures

Workspace validation names the malformed file and the violated rule. Two real workspace directories side by side produce a warning naming the ignored one - a state to merge, not to live in. A merge that left one entity in two state directories at once is reported as duplicated state, with the dedupe command as the recovery.
