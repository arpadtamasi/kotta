---
id: EX-01m1cjsz0k2pspzgx2rpm92vnm
form: example
title: "Local green is reported while the gated run is red"
subjects:
  - BR-01m1cjrgkej23rfe962zk31z7r
accepted:
  - >-
    unimplemented: Landed with the rule it illustrates and shares its state. It will carry evidence when the obligation reaches the shipped rules file.
---

## Given

A project gates its release on a run of its own checks, and a test fixture passes only because the machine it runs on supplies something the fixture never sets — a Git identity, a credential, a locale. Every developer machine supplies it; the gated runner does not.

## When

An agent runs the suite locally, sees it pass, and reports the checks as green without reading the result of the gated run for that commit.

## Then

The report is wrong in the one case it was needed, and stays wrong for as long as nobody asks: the gated run has been failing since the commit that introduced the dependency, and each new local pass reads as fresh confirmation. Under the rule the agent reads the authoritative result for the commit it is reporting on and reports that — a failure, or that no run has completed yet — so the disagreement between the two environments surfaces as the finding it is, on the first report rather than the seventh.
