---
id: EX-01m0f0wn8a8paahm3na20rfbq9
form: example
title: "Listing writes nothing"
subjects:
  - QA-01m0f0wn89nx49z82gh2ssx6j1
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Given

An unchanged workspace.

## When

The same list command runs twice in a row.

## Then

The outputs are byte-identical and no file was written - not even the index. The same guarantee holds for the read-only tools the calling chat uses to orient.
