---
id: F-01kznx56zc91gqg24advhj455d
title: >-
  Entity filenames are keyed on the same eight characters the display is, so two
  colliding ids collide on disk
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-10'
---
# F-01kznx56zc91gqg24advhj455d — Entity filenames are keyed on the same eight characters the display is, so two colliding ids collide on disk

## Observation

Entity filenames are keyed on the same eight characters the display is, so two colliding ids collide on disk.

## Evidence

Found on 2026-08-10 while writing the ambiguity test for T-01kzn4jcktrv988d0n4ghwhjs5. entityFilename (src/core/identity.ts) builds a minted entity's filename as '<slug>-<shortId>.md', where shortId is the last eight characters of the 26-character ULID body. Two entities whose ids share those eight characters therefore produce the same filename in the same state directory, and the second write silently overwrites the first — the test had to name its two colliding fixtures by hand because the real writer could not have created both. The display side now refuses such a collision: canonicalEntityId names both full ids and asks the operator to choose. Storage has no equivalent guard, and it is the half that loses data rather than the half that asks a question. Nothing in the mint path checks whether the short form is already taken in the workspace. The probability is small — eight Crockford base32 characters, and the trailing characters of a ULID are random — but it is a silent overwrite of a canonical entity, which is the failure mode that must not be left to probability. F-01kzhna04m3pnghkchc26y53yb and its siblings are about a contract that cannot be repaired; this one is about a contract that quietly stops existing.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
