---
id: F-01kz1na17fnzygqcvv147t946f
title: >-
  Ready ticket szovege nem javithato — a define csak backlogbol megy, a reopen
  csak review/done-bol, igy egy elgepeles cancel + ujralétrehozas aran javithato
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
---
# F-01kz1na17fnzygqcvv147t946f — Ready ticket szovege nem javithato — a define csak backlogbol megy, a reopen csak review/done-bol, igy egy elgepeles cancel + ujralétrehozas aran javithato

## Observation

Ready ticket szovege nem javithato — a define csak backlogbol megy, a reopen csak review/done-bol, igy egy elgepeles cancel + ujralétrehozas aran javithato.

## Evidence

Agens-jelentes a oneandabol, 2026-08-02: 'a T-125-ben maradt egy torott hivatkozas, es nem tudtam javitani. Az Acceptance 4. pontja [[T-133]]-ra mutat, ami nem letezik. A T-125 addigra mar ready volt, a ticket define viszont csak backlogbol megy, a reopen pedig csak review/done allapotbol — nincs ut egy ready ticket szovegenek javitasara. Kezzel nem nyultam a .a-team-hez.' Az agens helyesen jart el: inkabb megallt, mint hogy megkerulje a kaput. A kodban ellenorizve (src/commands/ticket.ts): a define a 42. sorban elutasit mindent, ami nem backlog; a reopen a 272. sorban csak review es done allapotot enged; a cancel a 240. sorban csak backlogot es ready-t. Vagyis egy ready ticket szovegehez HAROM parancs kozul egyik sem nyul hozza. A ket megmarado ut mindegyike rossz: (a) cancel + ujralétrehozas — uj azonositot ad, tehat kaszkadol minden ra hivatkozo ticketre (depends_on, blocks, csomag-tagsag, source_finding), es egy elgepeles javitasa aran atirja a fel workspace hivatkozasait; (b) kezi fajlszerkesztes — amit a szerzodes tilt, es amit az agens helyesen nem tett meg. A hatas nem elmeleti: a T-125 ma egy torott [[T-133]] hivatkozassal all ready allapotban, es a helyes cel ismert, csak nem irhato be. Ez a hiba minden olyan javitast blokkol, ami nem a definicio bovitese, hanem a javitasa — elgepeles, elavult hivatkozas, rossz azonosito. Rokon: F-022 (a kapuk megkerulhetok, mert a tar a fajlrendszer) — ott az a baj, hogy tul konnyu megkerulni a kaput, itt az, hogy nincs legalis ut egyaltalan.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
