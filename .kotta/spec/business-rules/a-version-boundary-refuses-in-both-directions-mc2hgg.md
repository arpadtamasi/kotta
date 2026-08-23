---
id: BR-01m0q89b16xcfasfj1z8mc2hgg
form: business-rule
title: "A version boundary refuses in both directions"
---

## Rule

A workspace records the shape version it was written for, and a Kotta that meets a version it does not implement refuses rather than guesses. The refusal has two directions and they are never worded alike. A workspace older than this Kotta is named as older, and `migrate` is the remedy. A workspace newer than this Kotta is named as newer, both versions are stated, and upgrading Kotta is the remedy — and `migrate` is not exempt from this direction, because a migration that rewrites a newer workspace into an older shape destroys what the newer Kotta wrote. A version that cannot be read is neither, and is refused on its own terms.

## Rationale

The compatibility window is deliberately one version wide, so the refusal is the whole mechanism and its wording is the whole remedy. Before this rule a single refusal covered both directions: a Kotta implementing version 5, meeting a workspace recording version 6, called it a "legacy workspace shape" that "predates the flat process layout" and directed the reader to `kotta migrate` — which, exempt from the shape check so that it can read old workspaces at all, planned `version: 6 → 5` and would have written the workspace backwards. The tool damaged data by following its own advice. A published release makes that reachable by anyone who upgrades one checkout before another, which is the ordinary way a team moves.

## Scope

Every command that reads a workspace, and `migrate` itself, which the older direction must keep exempt and the newer direction must not. Not the schema of the version field, and not a compatibility layer: refusing stays the mechanism, and reading two shapes at once is still declined.
