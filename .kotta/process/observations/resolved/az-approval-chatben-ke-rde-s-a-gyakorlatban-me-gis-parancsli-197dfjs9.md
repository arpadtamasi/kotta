---
id: F-01m0bt2tkhfwgfp1zs197dfjs9
title: 'Az approval chatben kérdés, a gyakorlatban mégis parancslista a terminálba'
status: resolved
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-19'
disposition: attach-to-existing-task
resolved_at: '2026-08-21T15:07:04.020Z'
approved_by: cli
approved_at: '2026-08-21T15:07:04.020Z'
approval_basis: 'CLI --approve: observation.resolve'
---
# F-01m0bt2tkhfwgfp1zs197dfjs9 — Az approval chatben kérdés, a gyakorlatban mégis parancslista a terminálba

## Observation

Az approval chatben kérdés, a gyakorlatban mégis parancslista a terminálba.

## Evidence

A .kotta/AGENTS.md 5. szabálya és a 'Never ask the human to copy an id or go and run a command' bekezdés kimondja, hogy a jóváhagyást a chatben, a döntés címével, egy sorban kell kérni, és a --approve-ot az agent futtatja. A gyakorlat más: egy másik Kotta-projekt sessionje a felhasználónak négy nyers parancsot adott át másolásra, teljes idkkal:

  kotta contract sign T-01m0bsve9a4547zrfszvgbmkyf --approve
  kotta contract sign T-01m0bs678wm5at0j5f69zwy1cv --approve
  kotta contract close T-01m0b2r3zkgpsh03ppwxeh4knw --approve
  kotta contract cancel T-01m0brfhfdnanqn5hxy3sa2rqp --resolution obsolete --superseded-by ... --approve

Ez pontosan a tiltott alak: id-k a kérdésben, parancs a humánnak, sőt az utolsóban kitöltetlen --superseded-by placeholder. A szabály tehát le van írva, de semmi nem tartja be: sem a skillek, sem a CLI, sem az MCP nem akadályozza meg, hogy az agent parancslistává alakítsa a döntést. A 'Ha az MCP-t egy új sessionben felveszed, ezek chatből is mehetnek' mondat mutatja a mögöttes okot is: az MCP hiánya esetén nincs definiált visszaesési út, ami chat maradna, ezért a terminál lesz belőle.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
