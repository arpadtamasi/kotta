---
id: F-01m0fm0pedh7q04jsp5cnxb5vb
title: >-
  A kotta validate nem látja a spec-gráfot, így a törött hivatkozás zöld
  eredményt ad
status: new
origin: agent
observation_type: risk
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-20'
---
# F-01m0fm0pedh7q04jsp5cnxb5vb — A kotta validate nem látja a spec-gráfot, így a törött hivatkozás zöld eredményt ad

## Observation

A kotta validate nem látja a spec-gráfot, így a törött hivatkozás zöld eredményt ad.

## Evidence

A kotta validate a workspace konzisztenciájának ellenőrzéseként van dokumentálva (.kotta/AGENTS.md: "kotta validate — is the workspace consistent"), de a .kotta/spec/ fát egyáltalán nem olvassa.

1. A CLI-ben nincs spec-támogatás. A `grep -rn "spec" src --include=*.ts` kizárólag "inspect"/"specify" találatokat ad; a validateWorkspace() (src/commands/validate.ts) a CONTRACT_STATES állapotkönyvtárakat, a batcheket, a claimeket, a decisionöket és az eventeket járja be, a spec-et soha.
2. Lelógó él-ellenőrzés létezik, de csak a folyamat-gráfra: DANGLING_REFERENCE a contractok depends_on/blocks mezőire (src/commands/validate.ts:80-88) és DANGLING_EVENT_CONTRACT az eventekre.
3. Reprodukció: a .kotta másolatában az összes core spec-csomópont (45 db) törlése után a kotta validate zölden fut le.
4. Az egyetlen ellenőrző a requirements-traceability skill, amely minden feloldatlan azonosítót broken-reference errorként hoz, a rangsor 2. szintjén ("the graph is factually inconsistent"), és kifejezetten tiltja a legalizálásukat: "Never waive a broken reference through accepted." Az accepted mechanizmus csak a hiányzó kötelező élre való.
5. A jelenlegi gráf ép: 82 csomópont, 87 hivatkozás, 0 törött. A bejövő fok a use-case-eknél (24), business-rule-oknál (17), actoroknál (12), goaloknál (12) és interface-eknél (10) koncentrálódik, tehát egy core-halmaz törlése a 87 élből a többséget lelógóvá tenné.

Következmény: a CI és az ember a validate zöldjét látja, miközben a spec-gráf tényszerűen inkonzisztens lehet; a törést csak az veszi észre, aki külön, kézzel lefuttatja a skillt. Egy invariáns, amelyet csak egy skill őriz, gate nélküli invariáns.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
