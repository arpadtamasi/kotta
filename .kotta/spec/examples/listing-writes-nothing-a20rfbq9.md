---
id: EX-01m0f0wn8a8paahm3na20rfbq9
form: example
title: "Listing writes nothing"
subjects:
  - QA-01m0f0wn89nx49z82gh2ssx6j1
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

An unchanged workspace.

## When

The same list command runs twice in a row.

## Then

The outputs are byte-identical and no file was written - not even the index. The same guarantee holds for the read-only tools the calling chat uses to orient.
