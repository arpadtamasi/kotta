---
id: EX-01m3w9ajt2zqpc5gc0katqef96
form: example
title: The gap report measures an approved open change
subjects:
  - UC-01m0fpqfxjvet99wbz0v1ag64q
  - BR-01m0qtshfqhcrrqtz051zm9svr
capability: evidence
provenance:
  level: partly-inferred
  decided_by: agent-decided
  sources:
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P1"
    - ".kotta/changes/fejlesztes-az-archive-elott/conversation.md · P3"
    - ".kotta/changes/fejlesztes-az-archive-elott/proposal.md · Why"
  quote: "rp, 2026-10-01 17:46 UTC: a gap tulajdonképpen kód -> change, ugye?"
  inferred: "The three nodes, that the report counts the change apart from the accepted model, and that it does not refuse over an open change's unbuilt promises were chosen by the agent; that the plain run shows the change and that the working branch is read were accepted by the operator ('1 ok', '2 ok', conversation P3)."
---
# The gap report measures an approved open change

## Given

A workspace whose accepted model is fully accounted for on the base branch, and a working branch, checked out, that holds one approved change still open and the code written for it so far. Its delta adds three nodes. A test names the id of one of them; nothing outside the specification names the other two, and neither carries an admission.

## When

`kotta gap` runs, with no option.

## Then

After the accepted model, the report has a section for that change: it names the two nodes by title as the change's promises without evidence, says which commit of the working branch it read, and counts them apart from the accepted model's promises. The third is counted as evidenced. The copy of the nodes in the change's own `model/` directory counts for nothing. The report writes nothing and does not refuse over the two: in an open change an unbuilt promise is the work that remains, not a promise nobody accounted for.
