---
id: T-030
title: >-
  Backlog-ticketnek nincs duplikatum/torles utja a CLI-ben — a finding resolve
  auto-ticketje utkozott a kezzel irt szerzodessel
status: done
origin: observation
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: feat/T-030-backlog-ticketnek-nincs-duplikatum-torles-utja-a-cli-ben-a-f
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-027
assigned_agent: claude
resolution: completed
---
# T-030 — Hotfix: ticket cancel — legális kivezetés backlog/ready állapotból

## Outcome

Létezik `a-team ticket cancel <id> --resolution duplicate|obsolete|cancelled --approve`: egy backlog vagy ready ticket emberi jóváhagyással, kapun át kerül done-ba a megadott resolutionnel — nem `git rm`-mel.

## Context

F-027: az F-023 lezárásakor a `finding resolve` auto-ticketje (T-028) ütközött a kézzel írt T-027-tel, és kiderült: duplikátum backlog-ticketet csak kézi fájltörléssel lehet eltávolítani — pont az F-022-ben kritizált kapumegkerülés. A validátor a done állapotban már ismeri a `duplicate`/`obsolete`/`cancelled` resolutionöket, csak nincs út hozzájuk.

## Scope

- Új CLI-parancs: `ticket cancel <id> --resolution <duplicate|obsolete|cancelled> --approve [--json]`.
- Csak `backlog` és `ready` állapotból engedélyezett; active/review ticketre hibát ad (azoknak a reopen/close az útjuk).
- A ticket a `done/` könyvtárba kerül a megadott resolutionnel, `updated_at` frissül; claim nem létezhet (backlog/ready-ben nincs), branch-mező érintetlen (null).
- `--approve` nélkül elutasít, a szokásos emberi-kapu üzenettel.
- Ha a ticket package tagja, a package `tickets` listája érintetlen marad, de a done-átmenet a meglévő `updateContainingPackage` úton fut át.
- Index regenerálódik; a review-evidencia követelmény cancelled ticketre NEM áll (a validátor done-ágát ehhez igazítani kell: resolution != completed esetén nem kér review evidence-t).

## Non-goals

- Nem érinti az active/review kivezetést és a reopen utat.
- Nem törli a fájlt — a cancelled ticket a done-ban él, a történet marad.

## Acceptance

1. Backlog ticket cancel duplicate-tel: a fájl done-ba kerül, `resolution: duplicate`, validate zöld — integrációs teszt.
2. Ready ticketre ugyanez működik; active ticketre a parancs hibával elutasít — teszt.
3. `--approve` nélkül elutasít — teszt.
4. Cancelled (nem-completed) done ticketen a validátor nem követel review evidence-t — teszt.
5. A meglévő teljes tesztkészlet zöld.

## Constraints

- A mutáció atomi (temp fájl + rename minta, ahogy a define csinálja), és a szokásos commit-konvenció szerint zárul.

## Execution notes

A `closeTicket` szerkezete a minta, a git-branch logika nélkül. A validátor `MISSING_REVIEW_EVIDENCE` ága kap egy resolution-feltételt.

## Verification

`npm run build:cli` zöld; `npx vitest run` teljes készlet zöld; füstteszt egy eldobható repóban.

## Open decisions

None.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Acc1: backlog->done duplicate resolutionnel, validate zold — integracios teszt. Acc2: ready->done obsolete OK; active ticketre elutasit ('can only be cancelled from backlog or ready'), helyben marad — teszt. Acc3: --approve nelkul nonzero exit + 'Human cancel approval is required', ticket erintetlen — teszt. Acc4: cancelled done ticket review-evidencia nelkul zold; completed done evidencia nelkul tovabbra is MISSING_REVIEW_EVIDENCE — mindket irany teszttel rogzitve. Acc5: teljes keszlet 15 fajl / 41 passed / 1 skipped, 0 hiba. Implementacio: cancelTicket a closeTicket mintajara git-branch logika nelkul (src/commands/ticket.ts:219-252), validator-feltetel (validation.ts:48-49), CLI-regisztracio, 5 uj integracios teszt. Fusteszt eldobhato repoban zold. DEVIACIOK (friss agens nyilatkozata): +1 orszem-teszt ismeretlen resolutionre (scope-on beluli bovites); assertClean+commit a closeTicket-konvenciot koveti, a brief explicit nem kerte; claim-guard vedekezo ertelmezessel (hibat ad kobor claimre). Brief ~820 token, friss kontextus, D-009 szerint. |

### Verification performed

Acc1: backlog->done duplicate resolutionnel, validate zold — integracios teszt. Acc2: ready->done obsolete OK; active ticketre elutasit ('can only be cancelled from backlog or ready'), helyben marad — teszt. Acc3: --approve nelkul nonzero exit + 'Human cancel approval is required', ticket erintetlen — teszt. Acc4: cancelled done ticket review-evidencia nelkul zold; completed done evidencia nelkul tovabbra is MISSING_REVIEW_EVIDENCE — mindket irany teszttel rogzitve. Acc5: teljes keszlet 15 fajl / 41 passed / 1 skipped, 0 hiba. Implementacio: cancelTicket a closeTicket mintajara git-branch logika nelkul (src/commands/ticket.ts:219-252), validator-feltetel (validation.ts:48-49), CLI-regisztracio, 5 uj integracios teszt. Fusteszt eldobhato repoban zold. DEVIACIOK (friss agens nyilatkozata): +1 orszem-teszt ismeretlen resolutionre (scope-on beluli bovites); assertClean+commit a closeTicket-konvenciot koveti, a brief explicit nem kerte; claim-guard vedekezo ertelmezessel (hibat ad kobor claimre). Brief ~820 token, friss kontextus, D-009 szerint.

### Deviations

DEVIACIOK (friss agens nyilatkozata): +1 orszem-teszt ismeretlen resolutionre (scope-on beluli bovites); assertClean+commit a closeTicket-konvenciot koveti, a brief explicit nem kerte; claim-guard vedekezo ertelmezessel (hibat ad kobor claimre).

### Findings created

None.

### Known concerns

None.
