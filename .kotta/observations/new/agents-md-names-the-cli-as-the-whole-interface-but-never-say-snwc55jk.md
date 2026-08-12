---
id: F-01kztn8rzehzvdfqq1snwc55jk
title: >-
  AGENTS.md names the CLI as the whole interface but never says where it comes
  from
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-12'
---
# F-01kztn8rzehzvdfqq1snwc55jk — AGENTS.md names the CLI as the whole interface but never says where it comes from

## Observation

AGENTS.md names the CLI as the whole interface but never says where it comes from.

## Evidence

Measured on 2026-08-12. An agent running in a hosted environment (claude.ai web) against a Kotta workspace reported that it could not proceed at all: "A kotta CLI nincs telepítve ebben a környezetben (nem parancs, és nincs publikus npm csomag), a .kotta/ kézi szerkesztését pedig az AGENTS.md tiltja."

Half of that is a wrong conclusion drawn from a correct observation. The package is published and public — `npm view @arpadtamasi/kotta version` returns 0.5.0 — but the bare name is not: `npm view kotta` is a 404. An agent that reasons from the binary name to the package name concludes there is no package, and stops.

The other half is a real hole. AGENTS.md is the file copied into every Kotta project, and it states that "the CLI is the whole interface" and that workspace files are never hand-edited, while never once naming the package, the install command, or `npx`. The only install line in the repository is README.md:20, which a copied AGENTS.md does not bring along. The document therefore closes every path it opens: no CLI, no MCP server, and an explicit ban on the one fallback that would work. The agent's question — "hogyan menjek tovább?" — has no answer in the document that produced it.

Two things are missing and neither is a code change: AGENTS.md should name the package and the one-line install (global, or `npx -p @arpadtamasi/kotta kotta …` where nothing may be installed), and it should say what an agent does when it has neither surface — read state, prepare the work, and hand every lifecycle mutation to an environment that has one — instead of leaving the ban as the last word.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
