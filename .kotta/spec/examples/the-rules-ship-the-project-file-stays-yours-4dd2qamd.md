---
id: EX-01m0f1djtcvdqkvr4r4dd2qamd
form: example
title: "The rules ship; the project file stays yours"
subjects:
  - BR-01m0f1djtb5dkb76tjzq4x3ffh
---

## Given

A project with its own AGENTS.md carrying repository-specific conventions, and Kotta newly initialized in it.

## When

Init writes the workspace rules; the human says yes to linking and sync --link-agents runs; later someone hand-edits the workspace rules file.

## Then

The .kotta/AGENTS.md rules exist with the real package name and version in the install line; the project file gained exactly one referencing line and nothing else in it changed; running the link again is a no-op; and the edited rules copy is reported as drifted by status, never silently replaced.
