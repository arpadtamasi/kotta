---
id: UC-01m0fpqfxjvet99wbz0v1ag64q
form: use-case
title: "Analyze the implementation gap"
actor:
  - A-01m0f0wn89ewnpex9n4tq0s0rg
goal:
  - G-01m0f0wn89bsqrswjac57sdzez
accepted:
  - >-
    structural: Assigned on 2026-08-24 from the form of this node, not from examining the node itself. Many code sites realise a promise of this form and no single one would ever name it, so the absence of its id in the repository measures the instrument rather than the system. Reclassify it if that turns out to be wrong here.
capability: evidence
provenance:
  level: partly-inferred
  decided_by: agent-proposed-human-approved
  sources:
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3"
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P1"
    - ".kotta/changes/fejlesztes-az-archive-elott/proposal.md · Why"
  quote: "rp, 2026-10-01 18:02 UTC: 1 ok / 2 ok — after 17:46 UTC: a gap tulajdonképpen kód -> change, ugye?"
  inferred: "The operator named the direction and accepted the agent's two proposals (open changes shown unasked with a narrowing by name; the checked-out commit read for an open change). The wording, and that a never-approved change is not measured, are the agent's."
---

## Intent

Answer, from the repository alone, which parts of the accepted specification the running system does not yet implement or verify - so the next tasks are defined from the reported gap, never from memory.

## Preconditions

An accepted specification on the base branch, or an approved change that is still open. A readable repository. Nothing else: the analysis is a read.

## Main success scenario

The operator asks for the gap. The analysis walks the accepted spec nodes and reports, deterministically and without writing, which promises have no implementing or verifying evidence in the repository - and, in the reverse direction, which enforced behaviors no node states. Each entry names the node by title and the evidence looked for. The analysis looks only where a promise can be kept or checked: a copy of the specification - the workspace, an OpenSpec change, the archive, a generated narrative, a published package specification - is not searched as evidence, and a node that only such a copy names is reported without evidence, with the excluded sources that name it, so the report itself says why. For the accepted agreement the analysis reads the base branch and says which commit it read: evidence that is written but not committed is invisible to it by construction. A fresh landing is checked delta-first: the diff names what changed, so its entries lead the report. What changed means what is promised: a landing that only restates a node's own admission bookkeeping - which kind of gap it is, and why - moved no agreement and is not a delta. Where a landing touched more nodes than it changed agreements in, the report says both numbers, because a delta that is the whole specification names nothing. The report is the input to defining tasks.

## Alternatives

Where approved changes are still open, the analysis measures them without being asked: after the accepted model it gives each such change a section of its own, and `--change <name>` narrows the report to one of them. For an open change it walks the nodes of the delta instead of waiting for them to land, and it reads the commit that is checked out - the change and the code that keeps it live on a working branch until they are merged -, while the accepted model is still read from the base branch; the report names both commits. It reports which of them no code, test or command definition names yet, by title, apart from the accepted model's promises, and does not refuse over them - they are the work that remains in the change. A change that was never approved is not measured: what it promises is not yet agreed.

A node deliberately unimplemented is listed with its recorded reason as an accepted gap, not as a defect. A node that is neither evidenced nor admitted is the one case the analysis refuses over: it names each, and exits non-zero, so a promise cannot stay unaccounted for by nobody having looked. Where uncommitted paths could carry the missing evidence, the refusal says so and names them - only paths the evidence filter admits, never an uncommitted copy of the specification -, so the reader is not sent looking for a defect that a commit would settle - without claiming those files are the evidence, which the analysis has not read, and without letting the promise through. No gap: the report says exactly that. The analysis never creates tasks or observations by itself - what it finds waits for the human line.
