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
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Intent

Answer, from the repository alone, which parts of the accepted specification the running system does not yet implement or verify - so the next tasks are defined from the reported gap, never from memory.

## Preconditions

An accepted specification on the base branch. A readable repository. Nothing else: the analysis is a read.

## Main success scenario

The operator asks for the gap. The analysis walks the accepted spec nodes and reports, deterministically and without writing, which promises have no implementing or verifying evidence in the repository - and, in the reverse direction, which enforced behaviors no node states. Each entry names the node by title and the evidence looked for. A fresh landing is checked delta-first: the diff names what changed, so its entries lead the report. The report is the input to defining tasks.

## Alternatives

A node deliberately unimplemented is listed with its recorded reason as an accepted gap, not as a defect. A node that is neither evidenced nor admitted is the one case the analysis refuses over: it names each, and exits non-zero, so a promise cannot stay unaccounted for by nobody having looked. No gap: the report says exactly that. The analysis never creates tasks or observations by itself - what it finds waits for the human line.
