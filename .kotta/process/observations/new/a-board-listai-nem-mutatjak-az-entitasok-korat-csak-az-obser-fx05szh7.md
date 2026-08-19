---
id: F-01kz218f3rqn3k9ahzfx05szh7
title: >-
  A board listai nem mutatjak az entitasok korat — csak az Observations es csak
  osszesitve a Home
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-02'
---
# F-01kz218f3rqn3k9ahzfx05szh7 — A board listai nem mutatjak az entitasok korat — csak az Observations es csak osszesitve a Home

## Observation

A board listai nem mutatjak az entitasok korat — csak az Observations es csak osszesitve a Home.

## Evidence

Operatori visszajelzes a v2 board landolasa utan, 2026-08-02: 'nagyon hianyzik a ticketek kora'. Merve a kodban: a ui/src/App.tsx-ben a daysSince() segedfuggveny letezik es exportalt (90. sor), de a harom lanc-nezet kozul CSAK az ObservationsView hasznalja — a lista-nezetek tartomanyaban (548-680) egyetlen daysSince-hivas van, az a finding created_at-jara. A ContractsView es a BatchesView soraibol a kor teljesen hianyzik. A Home 'Waiting on you' savja mutat kort, de csak SORONKENT osszesitve ('oldest 74d' + oregedesi sav), nem az egyes tetelekre bontva — tehat lathato, hogy van valami regi, de nem az, hogy melyik. Miert szamit: a Kotta munkamodja a sweep ('mi van felkeszen es miert'), es a kor az elso jel arra, hogy egy contract megallt. Egy 74 napos backlog-tetel es egy tegnapi ugyanugy nez ki a Contracts listaban. Az adat mar ott van a frontmatterben: minden entitas hordoz created_at-ot es updated_at-ot, a szerver mar visszaadja oket, es a segedfuggveny is kesz — ez megjelenites, nem uj olvasas, tehat a T-029 teljesitmeny-szerzodeset nem erinti. Nyitott reszlet, amit a definiciokor eldont: a created_at (mennyi ideje letezik) vagy az updated_at (mennyi ideje nem mozdult) a hasznosabb — a megallas jelzesere valoszinuleg az utobbi, a sorban allo tetelek avulasara az elobbi.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate ticket after human approval.
