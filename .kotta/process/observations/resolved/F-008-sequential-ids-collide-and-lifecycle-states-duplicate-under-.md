---
id: F-008
title: >-
  Sequential IDs collide and lifecycle states duplicate under concurrent
  worktrees/merges
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-07-26'
disposition: create-contract
resolved_at: '2026-08-02T12:23:07.215Z'
contract: T-034
---
# F-008 — Sequential IDs collide and lifecycle states duplicate under concurrent worktrees/merges

## Observation

Sequential IDs collide and lifecycle states duplicate under concurrent worktrees/merges.

## Evidence

In the one&a workspace (2026-07-26), concurrent agent worktrees + branch merges produced two distinct integrity failures:

1) REAL ID COLLISIONS — two different entities sharing one id:
- F-008 = {Apple hide-my-email login makes a separate uid} vs {live waitlist 500 on consent-less signup}
- T-049 = {explicit Apple account link flow} vs {landinglegal spec stale effective-date}
Root: nextId() picks max+1 by scanning the current branch's files; two branches independently allocate the same next id and collide on merge. No coordination exists across branches. The earlier atomic-reservation fix (T-011) covered decisions only, not findings/tickets/packages.

2) MERGE-DUPLICATED STATE — the SAME entity present in two state directories at once:
- T-039, T-040 (backlog + done), T-041 (active + backlog), P-015 (packages backlog + ready)
Root: the directory encodes lifecycle state, but git merge does not render a cross-directory move as delete+add, so both copies survive a merge. This is a DISTINCT root from the id collision.

Impact: violates entity integrity / truth-from-derivation; neither ids nor states can be trusted. Directly blocks the concurrent-worktree, multi-agent model the product is built for.

Disposition: the ID-collision root is addressed by decision D-003 (coordination-free ULID identity + title-based human reference). The state-duplication root is NOT addressed by D-003 and needs its own fix (merge-aware state transitions, or encoding state in frontmatter rather than directory). Sibling of F-006 (read-side truth bug); this is the write/merge side.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
