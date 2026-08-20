---
id: EX-01m0f0wn8a8paahm3na20rfbq9
form: example
title: "Listing writes nothing"
subjects:
  - QA-01m0f0wn89nx49z82gh2ssx6j1
---

## Given

An unchanged workspace.

## When

The same list command runs twice in a row.

## Then

The outputs are byte-identical and no file was written - not even the index. The same guarantee holds for the read-only tools the calling chat uses to orient.
