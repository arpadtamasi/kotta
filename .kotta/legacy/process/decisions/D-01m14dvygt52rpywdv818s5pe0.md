---
id: D-01m14dvygt52rpywdv818s5pe0
title: Init writes and asks; every later mutation commits itself
date: '2026-08-28'
approved_by: cli
approved_at: '2026-08-28T14:55:02.169Z'
approval_basis: 'CLI --approve: decision.create'
---
# D-01m14dvygt52rpywdv818s5pe0 — Init writes and asks; every later mutation commits itself

## Decision

`kotta init` commits nothing. It writes the workspace, the ignore rules and, where the project had
none, the project's AGENTS.md — and then names everything it wrote and calls on the operator to
commit it. Every mutation after that commits the canonical state it writes, as it already does.

The line is between creating and changing. What init produces is a workspace nobody has agreed to
yet: it enters the project's history when its operator puts it there, having looked. Everything
afterwards changes a workspace that already exists, where an uncommitted write is Kotta dirtying a
checkout behind the person using it.

## Context

Measured on 2026-08-27: after `kotta init` a fresh repository has .gitattributes, .gitignore,
.kotta/ and AGENTS.md all untracked, so the next command that checks the working tree refuses over
files Kotta created seconds earlier (F-01m14cbw2z2rpwbfybyaejv9dx). Every other mutation commits —
task six times, observation four, batch repaired the same morning
(F-01m0zn0d24hjbva47xdp1kb6m1). The operator was asked whether init should commit the project's own
AGENTS.md and answered no, prompt instead (D-01m14ccbcvntfbkwxty56sybak); asked the same about the
workspace init creates, the answer was the same.

## Consequences

The refusal that follows an uncommitted init stops being a surprise, because the run that caused it
already said what to commit. Init keeps its property of writing a reviewable result rather than a
committed one, which is what makes a first look possible at all. The asymmetry with every later
command is deliberate and stated: create, then look, then commit; after that Kotta keeps its own
state clean without being asked.
