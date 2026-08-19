---
id: T-025
title: >-
  Reset: a build után a kotta újra játszható — a tanulság beépül, a done újra
  defined
status: backlog
origin: human
types:
  - feature
profiles: []
priority: medium
risk: medium
batch: null
depends_on: []
blocks: []
branch: null
pull_request: null
created_at: '2026-08-01'
updated_at: '2026-08-01'
---
# T-025 — Reset: a build után a kotta újra játszható — a tanulság beépül, a done újra defined

## Outcome

Egy `reset` művelet, ami egy lebuildelt workspace-t visszaállít játszható kottává: minden, amit a build közben tanultunk (deviációk, findingok, menet közbeni kérések), **beépül az eredeti ticketek szövegébe**, aztán a `done` ticketek újra `defined` állapotba kerülnek, a claimek és branch-hivatkozások törlődnek, az evidencia a git-történetben marad. A reset után a teljes rendszer újraépíthető a frissített kottából — ez teszi igazzá a crm-kit README ígéretét: „a rendszert a frissített tervből építjük újra, nem foltozgatjuk."

## Context

Ma a workspace egyirányú: a ticket done-ba ér és ott marad, a javítások új ticketekben élnek, a spec elválik a szoftvertől — pontosan így legacy-södik el egy korpusz (F-017). A reset a hiányzó visszaút: a kotta nem napló, hanem partitúra, és a partitúrát előadás után nem eldobjuk, hanem a tanulsággal frissítve újra elő lehet adni.

A művelet kétfelé hasznos:
1. **Kit-életciklus** (crm-kit): build → használat → változáskérés → a kérés a tervbe épül → reset → újraépítés. A BUILD.md 5. lépése (regenerálás) ettől lesz ismételhető szertartás, nem egyszeri kísérlet.
2. **Kotta meglévő rendszerből** (oneanda): a mai oneanda-napló + a felgyűlt deviációk/findingok visszahajtogatása a ticketekbe, majd reset — és a oneandának lesz először *játszható* kottája. Ez a regenerációs design doc (2026-08-01) komponálás-fele, működésként.

## Scope

- **Write-back menet (ágens-segített, ember-kapuzott):** ticketenként összegyűjti, mi változott a szerződéshez képest — elfogadott deviációk, `discovered_during`/`caused_by` findingok, kapcsolódó döntések, menet közbeni módosításkérések — és beépítési javaslatot tesz az eredeti ticket szövegébe. Az elfogadás emberi kapu, ticketenként vagy kötegben.
- **Mechanikus reset (CLI):** `kotta reset` — a write-back után: `done` → `defined`, claimek felszabadítva, branch/PR mezők ürítve, evidencia-szakaszok a git-történetbe archiválva (a fájlból kikerülnek, a commit őrzi őket). Csomag-státuszok visszaállítása.
- **Szelektív forma:** reset egy package-re vagy ticket-halmazra, nem csak a teljes workspace-re — a részleges újraépítés a gyakori eset.
- **Jegyzőkönyv:** a reset kimenete egy összefoglaló — hány ticket, hány beépített tanulság, mi maradt beépítetlen (és miért).

## Non-goals

- Nem érinti a kódot: a reset a kottát állítja vissza, a kód sorsa (törlés, archiválás, tovább élés) a felhasználó döntése.
- Nem automatikus write-back: ember jóváhagyása nélkül szerződés nem módosul — a reset nem lehet az a hely, ahol a spec csendben átíródik.
- A findingok/döntések nem resetelődnek: azok a történet, nem az állapot.

## Acceptance

1. Egy lebuildelt próba-workspace-en a write-back menet ticketenként felsorolja a beépítendőket, és emberi jóváhagyás után a ticketszöveg frissül.
2. `kotta reset` után minden érintett ticket `defined`, claim nincs, validate zöld — és a workspace `package ready`-vel azonnal újraindítható.
3. Az evidencia visszakereshető a git-történetből; a reset commit-üzenete megmondja, hol.
4. Szelektív reset egy package-re működik, a többi entitás érintetlen.
5. **A valós próba:** a crm-kit első buildje után egy módosításkérés (pl. új pipeline-szakasz) beépül a T-001/T-002 szerződésébe, reset, újraépítés — és a pecsételt vizsga frissített változata átmegy rajta.

## Constraints

- A reset atomi: félig visszaállított workspace nem maradhat (a mutation lock és a tranzakciós apply a meglévő minta).
- A write-back javaslat sosem töröl ticketszöveget indoklás nélkül — a szerződés változása diffként jelenik meg a jóváhagyásnál.
- A `done` státusz ma immutábilisnak számít (F-017 jelezte a feszültséget): a reset az egyetlen legális út done-ból defined-be, és mindig explicit emberi szándékkal indul.

## Execution notes

A write-back és a mechanikus reset külön lépcső — a második önmagában is hasznos (pl. kísérleti újraépítéshez), az első nélküle veszélyes (a tanulság elveszne). A oneanda-kotta előállítása külön futam lesz e ticket eszközeivel, de nem e ticket része — az a regenerációs design doc nulladik futamához tartozik.

## Verification

Próba-workspace-en teljes kör (build-szimuláció → write-back → reset → validate → újra ready); a crm-kit valós próbája az 5. acceptance szerint, jegyzőkönyvvel.

## Open decisions

None — a done-immutabilitás feloldását ez a ticket kimondottan a reset-útra szűkíti.
