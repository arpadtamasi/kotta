---
id: EX-01m0f0wn8ahv3s98t67rbytqjh
form: example
title: "The board survives a restart"
subjects:
  - UC-01m0f0wn89m98wpkqq8e5c9p6p
---

## Given

A workspace whose lifecycle, conversation, and approval history are committed to the base ref.

## When

The board is stopped and started again.

## Then

The same read-only task timeline is reconstructed from the stored events - nothing lived only in a process's memory, and what the operator sees is derived from the repository alone.
