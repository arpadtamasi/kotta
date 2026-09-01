---
id: BR-01m1cjrgkej23rfe962zk31z7r
form: business-rule
title: 'The authoritative run is the verdict, not the local one'
accepted:
  - >-
    unimplemented: Examined on 2026-09-01, the day after it landed, from the observation that this repository reported a local green after every wave for a day and a half while the gated run was red. Nothing keeps it yet. The obligation belongs in the rules file Kotta ships, and it is the follow-up work that puts it there which will name this id; until then the rule is agreed and unenforced, and saying so is the point of this admission.
---
# The authoritative run is the verdict, not the local one

## Rule

Where a project gates release or deployment on a run of its own checks, that run decides whether the checks pass. A run on the machine an agent happens to occupy is evidence about that machine, and Kotta's rules say so to the agents they reach: before reporting the checks as green, fixed or ready, the agent reads the result of the authoritative run for the commit it is reporting on, and where none has completed for that commit it reports that instead of letting the local result stand in. A local pass and an authoritative failure are not a contradiction to be resolved in favour of the nearer one — the difference is the finding, and what the local environment supplied without being asked is where it lives.

Reporting a check as passing is a claim about where it ran. An agent that has read only its own terminal says so in the same breath, because the sentence is worth least at the exact moment the two disagree.

## Rationale

Measured in this repository: from 2026-08-28 the release workflow and the Pages deployment both failed on every push — seven consecutive runs, a day and a half — because one test fixture never set a Git identity and a newly committing service began to need one. Every machine that ran the suite locally carried a global identity, so the suite was green on each of them. Across that period the sessions working here reported the suite green after every wave and never once read a CI result. Nothing was hidden: the verdict was one query away and the question was never asked, because a green terminal reads like an answer.

An agent that reports the run it can see is not lying, and that is the difficulty. The rule does not ask for more scepticism; it names which run the word "passing" refers to, so the two results can no longer be swapped without anyone noticing.

## Scope

The obligation Kotta's rules file places on agents, and every project whose release or deployment gates on a run of its checks. Not a project with no such run: where nothing is gated, a local result is all there is, and reporting it plainly as local is complete. Nothing here makes Kotta execute, host or poll anyone's checks, and nothing here weakens the local run — the fast check before a push stays exactly what it was, evidence gathered early and named for what it is.
