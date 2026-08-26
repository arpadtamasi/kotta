---
id: EX-01m0z873t1cmhybhakq6vwzxb6
form: example
title: "An unanswered question refuses defining by name"
subjects:
  - BR-01m0z873stwx7szg5896gwsbry
---

## Given

A task whose Open decisions section lists three questions, the first of them naming the decision that settled it.

## When

The agent defines the task.

## Then

Defining is refused naming the second and the third question by their position and their text; the first is not named, because a question naming an existing decision is answered. Asking the workspace for the task's open questions lists all three - one resolved, two open - and the workspace-wide listing groups them under the task with the blocking ones first.
