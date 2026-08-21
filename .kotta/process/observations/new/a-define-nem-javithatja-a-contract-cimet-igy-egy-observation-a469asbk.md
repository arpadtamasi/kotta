---
id: F-01kz3kzvcsxm67z31va469asbk
title: >-
  A define nem javithatja a contract cimet, igy egy observationbol szuletett
  contract cime a szukitett scope utan is a megfigyelest irja le
status: new
origin: agent
observation_type: bug
confidence: high
severity: medium
discovered_during: T-01kz3kx1ex19tjw82tbd1366pk
created_at: '2026-08-03'
---
# F-01kz3kzvcsxm67z31va469asbk — A define nem javithatja a contract cimet, igy egy observationbol szuletett contract cime a szukitett scope utan is a megfigyelest irja le

## Observation

A define nem javithatja a contract cimet, igy egy observationbol szuletett contract cime a szukitett scope utan is a megfigyelest irja le.

## Evidence

A DEFINITION_FIELDS (src/commands/contract.ts:37) az id, types, profiles, priority, risk, depends_on, blocks mezoket engedi, es a define (52-54. sor) ezek kozul is csak a types, profiles, priority, risk, depends_on, blocks ertekeket masolja at a draftbol. A cim nincs kozottuk: a define a teljes torzset kicsereli, a frontmatter cimet viszont erintetlenul hagyja, es 'Unsupported definition fields: title' hibaval elutasitja a draftot, ha valaki megis probalja.

Ez akkor faj, amikor a contract observationbol szuletett. A resolveObservation create-contract aga (src/commands/observation.ts:77) a megfigyeles cimet adja at a newContract-nak, a megfigyeles cime viszont a PROBLEMAT irja le, a contract pedig annak rendszerint csak egy reszet oldja meg - a definicio dolga eppen a szukites.

Kozvetlenul megfigyelve most: a T-01kz3kx1ex19tjw82tbd1366pk az F-01kz3k2axqqy6r4rgqmgt5ybtt-bol szuletett, ezert a frontmatter cime 'brief header + kotta guide', a definicio Non-goals szakasza viszont kifejezetten kizarja a kotta guide-ot es kulon contractra utalja. A cim tehat tobbet iger, mint amit a contract szallit - es a status, az index.md es a board a cimet mutatja, nem a Scope-ot. Athidalasnak a markdown H1-be irtam a valos scope-ot, ami viszont azt jelenti, hogy a ket cim mostantol elter egymastol ugyanabban a fajlban.

Rokon, de nem azonos: F-01kz1na17fnzygqcvv147t946f arrol szol, hogy egy MAR DEFINED contract szovegehez egyik parancs sem nyul hozza. Ez itt egy backlog contract, ahol a define elvileg a szovegre valo - csak eppen a cimre nem.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
