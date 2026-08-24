---
id: EX-01m0f0wn8ahv3s98t67rbytqjh
form: example
title: "The board survives a restart"
subjects:
  - UC-01m0f0wn89m98wpkqq8e5c9p6p
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A workspace whose lifecycle, conversation, and approval history are committed to the base ref.

## When

The board is stopped and started again.

## Then

The same read-only task timeline is reconstructed from the stored events - nothing lived only in a process's memory, and what the operator sees is derived from the repository alone.
