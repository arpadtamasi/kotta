---
id: IF-01m0f0wn898ggsdxa0kh6t6tnw
form: interface
title: "The read-only board"
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Purpose

A local web projection of canonical state and history - tasks, observations, batches, runs, and per-task timelines - for the human's eyes.

## Preconditions

An initialized workspace with its state committed to the configured base ref; a free port (the default advances from 4311, an explicit port is strict).

## Postconditions

GET serves state and the event timeline; the selected URL is printed and opened. Restarting reconstructs the same timeline from the stored events. A task that ended at done is shown with the resolution that ended it, so retired work does not read as delivered work.

## Invariants

Deliberately read-only: every mutation endpoint answers 405; actions and approvals stay in the calling chat. State derives from named refs through Git plumbing, never from the working-tree HEAD; in-flight worktrees appear as overlay with provenance and disagreement surfaces as drift.

## Failures

An occupied explicit port fails with an actionable error. A browser that refuses to open is a warning, never a startup failure. Uncommitted migration shows a notice instead of wrong content.
