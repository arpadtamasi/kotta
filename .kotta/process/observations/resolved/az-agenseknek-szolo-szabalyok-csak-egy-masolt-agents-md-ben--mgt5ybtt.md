---
id: F-01kz3k2axqqy6r4rgqmgt5ybtt
title: >-
  Az agenseknek szolo szabalyok csak egy masolt AGENTS.md-ben elnek, pedig a
  termeknek kellene hordoznia oket (brief header + kotta guide)
status: resolved
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-03'
disposition: create-contract
resolved_at: '2026-08-03T10:49:51.333Z'
contract: T-01kz3kx1ex19tjw82tbd1366pk
---
# F-01kz3k2axqqy6r4rgqmgt5ybtt — Az agenseknek szolo szabalyok csak egy masolt AGENTS.md-ben elnek, pedig a termeknek kellene hordoznia oket (brief header + kotta guide)

## Observation

Az agenseknek szolo szabalyok csak egy masolt AGENTS.md-ben elnek, pedig a termeknek kellene hordoznia oket (brief header + kotta guide).

## Evidence

AGENTS.md (2026-08-03, F-01kz24pa29b5yhhzpcpky2an1x nyoman) ~80 sor: lifecycle-tabla, execute/resume szemantika, 8 agent-szabaly, skill-lista, config-mutato. Mindez minden agens kontextusaba betoltodik minden sessionben, es minden Kottat hasznalo projekt egy masolatot kap, ami a binaristol fuggetlenul avul.

A termek ket csatornaja ezt ma nem hasznalja ki:

1. BRIEF. A briefContract() (src/commands/contract.ts:347-362) mar most kiir egy fix, CLI-tulajdonu fejlecet, es abban mar szerepel a nyolc szabaly egyike szo szerint: 'If the work cannot start from this brief plus the code in the worktree, that gap is a contract defect - record it, do not silently widen the context.' A contract execute a briefet stdin-en, az agens teljes promptjakent adja at (src/commands/execute.ts:143-145 promptFor, 215 launch). Tehat a vegrehajtas-ideju szabalyok (maradj a scope-ban, a mellekleletet observationkent rogzitsd, nem talalsz ki szandekot, a --approve nem a tied, te review-ig viszed nem close-ig) egy meglevo, determinisztikus csatornan minden vegrehajto agenshez eljutnanak - hoszttol, telepitett skillektol es az AGENTS.md letetol fuggetlenul. Ma ehelyett a hivo promptjan vagy a repo AGENTS.md-jen mulik.

2. HELP. A kotta contract --help ma a new, define, validate, review, close alparancsokat leiras nelkul listazza; csak a sign, execute, brief, cancel, dedupe kapott egyet. Egyetlen parancs sem irja ki a lifecycle-t. Nincs kotta guide.

Amit egyik csatorna sem tud lefedni: a belepes. Aki briefet kap, az mar tul van azon, hogy 'ez a repo Kottaval megy', hogy .kotta a kanon, es hogy nincs valtoztatas contract nelkul; aki meg egy kotta parancsot sem futtatott, azt a help nem eri el. Ez a resz marad az AGENTS.md-e, es ez rovid.

Nyitott kerdesek a definiciohoz: (a) a brief header fix szabalyblokkja - a fejlec ma ~90 token, egy szabalyblokk nagyjabol megduplazza a 12000-es warn kuszob ellenében, es a tests/integration/brief.test.ts token-allitasait erinti; (b) kotta guide plusz a hianyzo alparancs-leirasok; (c) rovid AGENTS.md, amit a kotta init ir ki minden workspace-be - ez F-01kz24pa29b5yhhzpcpky2an1x nyitott kerdese is.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
