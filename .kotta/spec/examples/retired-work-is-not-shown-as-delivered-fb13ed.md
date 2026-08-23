---
id: EX-01m0pw5bc7qdenh5j2pefb13ed
form: example
title: "Retired work is not shown as delivered"
subjects:
  - BR-01m0pw5bc7b1rkg5dct5qgdkmb
---

## Given

A batch whose member tasks all reached `done` with a resolution of `cancelled`, alongside tasks that reached `done` with the resolution `completed`.

## When

A reader lists tasks, shows one of them, or asks for the batch's status.

## Then

Each retired task is named as cancelled rather than as done, and the batch's report says its members were retired rather than completed. A reader can tell what was built from what was abandoned by reading the workspace, without going to the commit history.
