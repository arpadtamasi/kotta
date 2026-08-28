---
id: D-01m14ccbcvntfbkwxty56sybak
title: 'Kotta does not commit the project''s own file, it asks the operator to'
date: '2026-08-28'
approved_by: cli
approved_at: '2026-08-28T14:29:02.491Z'
approval_basis: 'CLI --approve: decision.create'
---
# D-01m14ccbcvntfbkwxty56sybak — Kotta does not commit the project's own file, it asks the operator to

## Decision

Kotta never commits a project's own AGENTS.md, not even the one it just created. It names the file
it wrote and calls on the operator to commit it, in the same breath as reporting that it wrote it.

Creating a file the project did not have is Kotta finishing its own installation; committing it is
making a change in the project's history under the operator's name, and that is theirs.

## Context

kotta init leaves everything it writes untracked - .gitattributes, .gitignore, .kotta/ and, since
D-01m13v4eqfhv5213paeqdn4tbm, the project's AGENTS.md - so the next command that checks the working
tree refuses over files Kotta created seconds earlier. Every other mutation commits what it writes,
and the rule landed the same morning says a service never reports the operator's checkout as
unclean when the uncommitted change is its own. The question put to the operator was whether Kotta
may commit the project's file to close that gap. The answer was no, with a condition: it must
prompt.

## Consequences

The output of a run that created the project's file names it and says to commit it, so the operator
is not left to discover an untracked file later or to meet a refusal that does not explain itself.
Whether Kotta commits the workspace it created - its own .kotta/, .gitignore and .gitattributes,
which are not the project's - is a separate question this decision does not answer, and it stays
open.
