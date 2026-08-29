---
id: F-01m1661vt9r2cghptxxpn7wxwy
title: >-
  A specification id cited in prose is unchecked, so a broken reference lands
  green
status: new
origin: agent
observation_type: inconsistency
confidence: high
severity: medium
discovered_during: T-01m165x8k9vwg5160eykprv97p
created_at: '2026-08-29'
---
# F-01m1661vt9r2cghptxxpn7wxwy — A specification id cited in prose is unchecked, so a broken reference lands green

## Observation

A specification id cited in prose is unchecked, so a broken reference lands green.

## Evidence

While landing the board spec delta I wrote BR-01m0f0wn89jwyd6yq5yn1nw85 into the Postconditions prose of .kotta/spec/interfaces/board-kh6t6tnw.md. No such node exists — the naming rule is BR-01m0f0wn89c50fe1mz5yn1nw85. 'kotta validate' passed on that commit and reported nothing. The broken id was caught only when 'kotta task define' refused the same wrong id in the task's frontmatter 'spec' field, which IS checked (assertSpecReferences). References are therefore validated in frontmatter and unvalidated in prose, while prose citation is exactly what 'kotta gap' treats as evidence that a promise is kept: files.filter(f => f.text.includes(node.id)). A mistyped citation is both invisible to validate and unable to count as evidence, and nothing says so.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate task after human approval.
