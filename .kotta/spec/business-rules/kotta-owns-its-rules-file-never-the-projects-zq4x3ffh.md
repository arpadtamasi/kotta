---
id: BR-01m0f1djtb5dkb76tjzq4x3ffh
form: business-rule
title: "Kotta owns its rules file, never the project's"
---

## Rule

Kotta fully owns .kotta/AGENTS.md: it writes it, keeps it current with the running package's real install line, and reports a hand-edited copy as drifted rather than replacing it. Drift is a state to leave, not a verdict to live under: the report names the one deliberate command that discards the local edits and takes Kotta's copy, that command says how much it discarded, and nothing else replaces an edited file. Reconciling edits is the operator's, in the template - a refreshed file never merges them. The project's own AGENTS.md belongs to the project. Where there is none, Kotta creates it with the reference, unasked: there is nothing to protect, and rules nobody reads are not installed. Where there is one, the reference is placed by an agent that has read it - where it belongs in that document, in its own voice, shown as a diff and applied on an explicit yes (D-01m13v4eqfhv5213paeqdn4tbm). A deterministic path stays for environments with no agent, so a Kotta installed from a terminal or from CI still reaches the agents that will work there; it appends after an explicit yes, idempotently, and what it writes says what the reference is rather than standing as a bare line. A non-interactive run never writes the project's file, except to create one that does not exist.

## Rationale

The rules must reach every project without a human copying them by hand - they once did not travel at all, install line included - but a generator that rewrites a project's own conventions file would lose exactly the trust the rules ask for (D-01kztp2e).

## Scope

kotta init and kotta sync, including sync --link-agents. Skill installation follows the same drift rule: a byte-identical copy is updated, an edited one is reported and left alone, and another tool's file under the same name is never overwritten.
