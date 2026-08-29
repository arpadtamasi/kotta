---
id: IF-01m0f0wn898ggsdxa0kh6t6tnw
form: interface
title: "The read-only board"
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
---

## Purpose

A local web projection of canonical state and history - the specification, tasks, observations, batches, runs, and per-task timelines - for the human's eyes. The specification belongs in that list because it is what the rest of it is for: a task executes an accepted agreement, and a board that shows the execution and not the agreement shows the half that cannot be judged on its own.

## Preconditions

An initialized workspace with its state committed to the configured base ref; a free port (the default advances from 4311, an explicit port is strict).

## Postconditions

GET serves state and the event timeline; the selected URL is printed and opened. A task names the accepted nodes it executes and the map from each acceptance condition to the nodes that carry it, so the gate that let it become defined is legible where the task is read. Every specification reference a surface shows is named by its title and leads to the node itself, the way every other entity is named (BR-01m0f0wn89c50fe1mz5yn1nw85); a bare id standing alone is the reader being handed the key instead of the door. Restarting reconstructs the same timeline from the stored events. A task that ended at done is shown with the resolution that ended it, so retired work does not read as delivered work.

## Invariants

Deliberately read-only: every mutation endpoint answers 405; actions and approvals stay in the calling chat. State derives from named refs through Git plumbing, never from the working-tree HEAD; in-flight worktrees appear as overlay with provenance and disagreement surfaces as drift.

## Failures

An occupied explicit port fails with an actionable error. A browser that refuses to open is a warning, never a startup failure. Uncommitted migration shows a notice instead of wrong content.
