---
id: EX-01m0f0wn8axw5hjaed4fp0gdxx
form: example
title: "Migration moves vocabulary, never identity"
subjects:
  - UC-01m0f0wn89x00jkpqpqc2esx9h
  - BR-01m0f0wn89c50fe1mz5yn1nw85
accepted:
  - >-
    unexamined: Inherited on 2026-08-23 and kinded on 2026-08-24. Nobody has yet checked whether this promise is kept. This is a form that can name itself where it is enforced or proven, so the absence of its id is a real question that has simply not been asked. Answer it by naming the node where the code enforces it or a test proves it, or by reclassifying it as unimplemented.
---

## Given

A pre-rename workspace: the old directory name, findings/ready/packages vocabulary, sequential ids like T-034.

## When

A dry run lists every change; the migration applies them; the command runs a second time.

## Then

The shape and vocabulary are current, the id set before and after is identical - the command refuses to lose one - and the second run reports the workspace already current. Until then, every other command refuses the old shape by naming the migrate command.
