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
---

## Intent

Answer, from the repository alone, which parts of the accepted specification the running system does not yet implement or verify - so the next tasks are defined from the reported gap, never from memory.

## Preconditions

An accepted specification on the base branch. A readable repository. Nothing else: the analysis is a read.

## Main success scenario

The operator asks for the gap. The analysis walks the accepted spec nodes and reports, deterministically and without writing, which promises have no implementing or verifying evidence in the repository - and, in the reverse direction, which enforced behaviors no node states. Each entry names the node by title and the evidence looked for. The subject is the accepted agreement, so the analysis reads the base branch and says which commit it read: evidence that is written but not committed is invisible to it by construction. A fresh landing is checked delta-first: the diff names what changed, so its entries lead the report. The report is the input to defining tasks.

## Alternatives

A node deliberately unimplemented is listed with its recorded reason as an accepted gap, not as a defect. A node that is neither evidenced nor admitted is the one case the analysis refuses over: it names each, and exits non-zero, so a promise cannot stay unaccounted for by nobody having looked. Where uncommitted paths could carry the missing evidence, the refusal says so and names them, so the reader is not sent looking for a defect that a commit would settle - without claiming those files are the evidence, which the analysis has not read, and without letting the promise through. No gap: the report says exactly that. The analysis never creates tasks or observations by itself - what it finds waits for the human line.
