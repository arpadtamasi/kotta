---
id: F-01kz3vdf6ahkwfdzhw88p5tm36
title: >-
  A board nemán rejti el a nem commitolt munkat, ha a fo munkafa nem a base
  branchen all - figyelmeztetes csak a teljesen ures ref eseten szolal meg
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-03'
---
# F-01kz3vdf6ahkwfdzhw88p5tm36 — A board nemán rejti el a nem commitolt munkat, ha a fo munkafa nem a base branchen all - figyelmeztetes csak a teljesen ures ref eseten szolal meg

## Observation

A board nemán rejti el a nem commitolt munkat, ha a fo munkafa nem a base branchen all - figyelmeztetes csak a teljesen ures ref eseten szolal meg.

## Evidence

A kotta ui az entitaslistat a base refbol olvassa git plumbinggal (src/commands/ui.ts:146-157), es hozzauniozza a workspace nem commitolt HOZZAADASAIT - de ket szukitessel: csak a '??' es 'A' statuszu .md fajlokat veszi (uncommittedMdAdds, ui.ts:33-39), es csak akkor, ha a fo munkafa a base branchen all: 'const uncommittedAdds = onBase ? uncommittedMdAdds(projectRoot, workspaceDirectory) : []' (ui.ts:133).

Ha az onBase nem teljesul - feature branch vagy egy masik worktree van kicsekkolva a fo konyvtarban -, az unio ures, es MINDEN nem commitolt entitas lathatatlan a boardon. Ugyanez all a modositasokra is: egy mar kovetett fajl ' M' statusszal sosem kerul be az unioba, tehat a board a ref szerinti REGI tartalmat mutatja rola, jelzes nelkul.

A hianyzo jelzes a lenyeg. A readNotices csak akkor figyelmeztet (ui.ts:248), ha a ref NULLA entitast tartalmaz, mikozben a munkafaban van - vagyis a migracios esetre, amit a README is leir. A reszlegesen lathatatlan workspace - a commitolt entitasok megvannak, a friss munka hianyzik - semmilyen jelzest nem ad. A board teljesnek latszik, es nem az; a nezo semmibol nem tudja meg, hogy amit lat, az nem a munkaja jelenlegi allapota.

A hatas nem elmeleti, es nem is emberre korlatozodik. 2026-08-03-an egy agens ezt a tunetet ugy diagnosztizalta, hogy 'a contract new + define nem frissitette az indexet, ezert a HEAD-beli index.md nem tartalmazta a C1-et - a UI onnan olvas'. A diagnozis ket ponton teves: a new es a define is hiv regenerateIndex-et (src/commands/contract.ts:33 es :70, ugyanugy mint a sign a :114-en), es a board egyaltalan nem olvassa az index.md-et. Az agens azert talalt ki mechanizmust, mert a felulet nema volt: lathato hiany plusz semmilyen magyarazat egyenlo talalgatas. A sign azert TUNT javitasnak, mert allapotatmenetkent a fajlt egy addig nem letezo defined/ utvonalra mozgatja, ami friss '??' bejegyzes - eppen az a fajta hozzaadas, amit az unio felszed.

Javasolt irany: a notices akkor is szoljon, ha a refbol olvasott keszlet es a munkafa keszlete BARMIBEN elter - nem csak akkor, ha a ref ures -, es nevezze meg, hany entitas nem lathato es miert (nem commitolt modositas, vagy onBase nem all). Rokon: a README migracios szakasza ugyanezt a csapdat mar leirja a teljes esetre, tehat a reszleges eset kimaradasa felugyeleti hiany, nem szandekos dontés.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
