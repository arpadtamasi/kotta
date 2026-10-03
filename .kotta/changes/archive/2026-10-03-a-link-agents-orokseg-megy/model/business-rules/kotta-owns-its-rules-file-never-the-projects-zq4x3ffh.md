---
id: BR-01m0f1djtb5dkb76tjzq4x3ffh
form: business-rule
title: "Kotta owns its rules file, never the project's"
provenance:
  level: partly-inferred
  decided_by: human
  sources:
    - "chat · rp, 2026-10-03 ~18:00 UTC: asked whether the deterministic --link-agents path is still needed („kell még?”), then chose (b), the whole flag goes"
    - ".kotta/changes/a-link-agents-orokseg-megy/conversation.md · P1"
    - "chat · rp, 2026-10-03 ~15:52 UTC, sent while the agent was working (not in the distillate): „sync --link-agents is mehet”"
    - ".kotta/changes/archive/2026-10-03-az-a-team-oroksege-megy/conversation.md · P6"
  quote: "rp, 2026-10-03: „minden a-team örökség mehet” — „töröld a legacyt” — „sync --link-agents is mehet”"
  inferred: "The operator chose that the whole --link-agents flag goes, with its rewrite of a pre-1.0 prelude. That a run with no agent reports the line instead is the agent's wording of what is left; the rest is the accepted text."
---

## Rule

Kotta fully owns .kotta/AGENTS.md: it writes it, keeps it current with the running package's real install line, and reports a hand-edited copy as drifted rather than replacing it. Drift is a state to leave, not a verdict to live under: the report names the one deliberate command that discards the local edits and takes Kotta's copy, that command says how much it discarded, and nothing else replaces an edited file. Reconciling edits is the operator's, in the template - a refreshed file never merges them. The project's own AGENTS.md belongs to the project. Where there is none, Kotta creates it with the reference, unasked: there is nothing to protect, and rules nobody reads are not installed. Where there is one, the reference is placed by an agent that has read it - where it belongs in that document, in its own voice, shown as a diff and applied on an explicit yes (D-01m13v4eqfhv5213paeqdn4tbm). Where no agent is there to place it — a terminal or a CI run — Kotta SHALL leave an existing project file byte-identical and SHALL report the exact line to add, for the operator or a later agent to place. Claude Code reads the project's CLAUDE.md, not its AGENTS.md, so the same policy SHALL reach that file too: where there is no CLAUDE.md and the project has an AGENTS.md, Kotta creates it with the line `@AGENTS.md` and a sentence saying what the line is, and says so; where a CLAUDE.md exists that includes neither AGENTS.md nor the workspace rules, Kotta leaves it byte-identical and reports the line to add. A CLAUDE.md includes the project's AGENTS.md, never Kotta's rules directly, so a Claude Code agent reads what every other agent reads. A non-interactive run never writes the project's file, except to create one that does not exist. Kotta never commits the project's files, not even one it just created: writing it finishes Kotta's own installation, committing it makes a change in the project's history under the operator's name (D-01m14ccbcvntfbkwxty56sybak). The line that reports the write calls on the operator to commit it, so nothing Kotta wrote is left for them to discover as an untracked file or to meet as a refusal that does not explain itself.

## Rationale

The rules must reach every project without a human copying them by hand - they once did not travel at all, install line included - but a generator that rewrites a project's own conventions file would lose exactly the trust the rules ask for (D-01kztp2e).

## Scope

kotta init and kotta sync. A project AGENTS.md written in a pre-1.0 Kotta's own inline shape is ordinary project content: nothing recognises or rewrites it. Skill installation follows the same drift rule: a byte-identical copy is updated, an edited one is reported and left alone, and another tool's file under the same name is never overwritten.
