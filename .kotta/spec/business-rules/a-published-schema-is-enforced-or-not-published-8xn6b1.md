---
id: BR-01m0sj2f8mxydc7zxz6y8xn6b1
form: business-rule
title: "A published schema is enforced or not published"
---

## Rule

Every schema Kotta publishes states something the code actually holds to. For each published schema, the suite reads the shipped file and asserts that the code agrees with it: the fields it requires are the fields the code requires, and each set of permitted values is the set the code permits. A schema and the constant that mirrors it can no longer drift apart in silence — the disagreement fails the build and names the field. A schema nobody is willing to hold to is deleted rather than shipped.

The check reads the published file, never a copy of it inside the suite. A test that restates the contract proves only that the restatement is self-consistent.

## Rationale

Kotta ships six JSON schemas — task, observation, batch, claim, event, config — declaring forty-four required fields and six sets of permitted values between them. The code duplicates all of it in hand-maintained arrays, and exactly one pairing is checked: the observation enums. The other five are documentation wearing the costume of a contract, and anyone building against them is building on a promise nothing keeps.

This is the same failure the surfaces had before one declaration derived both: two hand-maintained descriptions of one thing, with nothing saying when they part. There the fix was to derive; here the schema is a published artefact with its own audience, so the fix is to assert the agreement rather than collapse one into the other.

## Scope

The schemas under `schemas/`, and the constants in the code they describe. Not the validator's mechanism: nothing here makes validation read JSON Schema at runtime, and the code keeps its typed constants. Not the specification forms in `.kotta/spec/forms/`, which are a project-owned registry the workspace already validates against.
