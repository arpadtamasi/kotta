---
id: F-024
title: >-
  The operator works in sweeps and batch decisions; the tool is built around the
  single-ticket lifecycle
status: resolved
origin: human
observation_type: product
confidence: high
severity: high
discovered_during: null
created_at: '2026-08-01'
disposition: attach-existing
resolved_at: '2026-08-02T15:04:29.152Z'
---
# F-024 — The operator works in sweeps and batch decisions; the tool is built around the single-ticket lifecycle

## Observation

A-Team models one ticket moving through its states, and every command is shaped that way. The operator almost never asks about one ticket. They sweep the whole workspace, then decide on many tickets in a single sentence. The tool has no verb for either move, so both are re-improvised through an agent every time.

## Evidence

108 operator messages across two days in the oneanda workspace, 2026-07-31 / 08-01. The recurring shapes:

**Sweeps — "what is not finished?"** asked five separate times, twice in a row because the first answer was incomplete:
- *"van még valami félkészen?"* (09:21) → *"ok újra kérdés: van-e valami félkészen"* (09:45)
- *"akkor van még szemét, ami a p-18 előtt van és megoldható?"* (12:17)
- *"ok mi az amit most eldönthetek és takarít"* (11:39)
- *"van kérdés, bizonytalanság, ellentmondás?"* (11:52)

**Batch decisions — many tickets, one sentence:**
- *"t35, t60 zárható t41, t43 maradhat nyitva - nincs most eszközöm t52,t57 mi? meg tudod csinálni? ha igen, tedd meg"*
- *"O-9.1 és 9.2 kuka"* · *"o-97 mehet és a gyerekek is"* · *"T-052 és T-057 zárható"*

Each of those lines is several state transitions plus a question, mixed together. The CLI offers one ticket per command; the operator's unit is a decision that spans a set.

**"What needs me?"** — *"mi a teendőm?"*, *"mit kell tennem?"*, *"mi a teendőm? btw T-052 és T-057 zárható"*. The human-gate queue is the operator's home view, and it is derived by an agent reading files rather than being a first-class query.

**Silence during long runs** — *"hogy áll?"*, *"mikorra lesz kész akkor?"*, *"kész kéne lennie..."*, and after an overnight package: *"de 4 órája kezdted el, mi történt?"*. Progress is only visible by asking.

**Compression is a hard requirement, not a preference** — *"1. szedd össze (adhd!)"* twice, and *"inkább mondd el a saját szavaiddal, hogy hogy fog ez működni adhd-m van"*. Long structured dumps are unusable for this operator; the tool's default output is long structured dumps.

**Friction inside the shaping loop** — the plan repeatedly had to be pulled back onto the tickets: *"a-teams ticketekre kéne hivatkozni azokra vezesd rá a tervet"*, *"de akkor tegyük rendbe a szerződéseket, állítsuk be a ticketek függését itt"*, *"ellenőrizd és tedd rendbe a tervet"*. And oneanda F-032 records a hard block: a `ready` ticket cannot be `define`d, so acceptance cannot be extended without first un-readying it — the exact operation the operator kept asking for.

## Impact hypothesis

The operator spends their attention re-deriving workspace state through conversation instead of deciding. Every sweep costs a full agent read of the workspace, the answers are inconsistent between sweeps (hence the repeat question), and decisions that are one thought become many commands. This is where the friction is — not in the individual ticket lifecycle, which works.

## Confidence

High: drawn from the operator's own messages, quoted verbatim.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval. Candidate directions, cheapest first: a real sweep query ("what is half-done / stalled / waiting on me") as one command and one UI view; batch state transitions accepting an id set; progress that is pushed during long package runs rather than pulled by asking; and short-by-default output, with detail on request. The wave view is already the right shape for this — it is the first thing in the tool the operator called good.
