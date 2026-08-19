---
id: F-01kz3t0a9tpz16m9ehszetd8cz
title: >-
  Az id azert szivarog a human kommunikaciora, mert o az egyetlen stabil es
  szerszam-kompatibilis fogodzo - a konvencio ezert nem tartja meg (F-013
  mechanizmusa)
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-03'
---
# F-01kz3t0a9tpz16m9ehszetd8cz — Az id azert szivarog a human kommunikaciora, mert o az egyetlen stabil es szerszam-kompatibilis fogodzo - a konvencio ezert nem tartja meg (F-013 mechanizmusa)

## Observation

Az id azert szivarog a human kommunikaciora, mert o az egyetlen stabil es szerszam-kompatibilis fogodzo - a konvencio ezert nem tartja meg (F-013 mechanizmusa).

## Evidence

A F-013 (2026-07-28) leirja a TUNETET - a csupasz id semmit nem jelent CLI-kimeneten, index.md-ben, commitban, chatben - es konvenciot javasol: 'reference entities as title (id) in prose and commit subjects'. Ez az eszrevetel a MECHANIZMUST nevezi meg, vagyis azt, hogy a konvencio miert nem fog megtartani.

Az id azert nyer, mert harom tulajdonsaga van egyszerre, es a cimnek egyik sincs meg:

1. SZERSZAM-KOMPATIBILIS. Minden parancs id-t var, sosem cimet (contract define/sign/start/execute/review/close, observation validate/resolve, a --discovered-during es a --depends-on ertekei). Az agens munkanyelve ezert id; amikor prozat ir, az van a kezeben.

2. STABIL. A D-010 garantalja, hogy az azonosito sosem valtozik. A cim nem: ma bizonyosodott be, hogy a define nem javithatja (F-01kz3kzvcsxm67z31va469asbk), ezert a T-01kz3kx1ex19tjw82tbd1366pk frontmatter-cime 'brief header + kotta guide'-ot iger, mikozben a definicio Non-goals szakasza a kotta guide-ot kifejezetten kizarja. Aki cimmel hivatkozik ra, rossz informaciot terjeszt. A helyessegi osztonzo tehat az id fele mutat.

3. OLCSO. A cim megszerzese munka: a parancsok se id-t, se cimet nem irnak vissza (F-01kz3k7e3a6g28h5j29mg56yk6), tehat a hivatkozashoz grep '^id:' kell a friss fajlon; a cim ezzel szemben haromsoros hajtogatott YAML skalar ('title: >-'), a fajlnev slugja pedig ekezet nelkuli es csonkolt, tehat lossy - a cim abbol nem rekonstrualhato. Az olcso ut az id.

Friss bizonyitek, sajat magamon: 2026-08-03-an megirtam harom szomszed repo AGENTS.md-jet arrol, hogyan kell agensnek viselkednie, majd ugyanabban a beszelgetesben vegig csupasz 26 karakteres ULID-okkal hivatkoztam entitasokra az operator fele - contractra, harom observationre, egymastol vizualisan megkulonbozhetetlen modon (T-01kz3kx1ex19tjw82tbd1366pk vs F-01kz3swfa5xh6rvxzq10cpc3k3). Az operator reakcioja: 'ez a fo baj' es 'valamiert beszivarog az id a human kommunikacioba'. Egy 2026-07-28 ota nyitott konvencio-javaslat nem valtoztatott ezen semmit.

A javasolt iranyra ez azt mondja: a bemenet maradjon id, a KIMENET legyen cim. Ma forditva van - az id az, ami kijon, es a cimet kell kikaparni. Konkretan: minden parancs, amely entitast erint, irja ki a 'T-1366pk · <cim>' format (ez egyben a F-01kz3k7e3a6g28h5j29mg56yk6 javitasa is); a status es az index.md ugyanezt; a rovid megjelenitesi forma (T-1366pk) mar dokumentalt konvencio a README-ben es a oneanda AGENTS.md-jeben. Amig a szerszam a cimet nem adja ingyen, addig az agens az id-t fogja hasznalni, barmit ir elo egy szabalyfajl.

Rokon: F-013 (a tunet, ennek az eszrevetelnek a szuloje), F-012 es D-003 (human reference = title), F-01kz3kzvcsxm67z31va469asbk (a cim nem javithato), F-01kz3k7e3a6g28h5j29mg56yk6 (a parancsok nem irjak ki az azonositot).

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
