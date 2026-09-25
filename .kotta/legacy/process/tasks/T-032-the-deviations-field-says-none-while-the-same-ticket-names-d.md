---
id: T-032
title: A done-kapu nem békíti ki a próza deviációit a strukturált Deviations mezővel
status: done
origin: observation
types:
  - feature
profiles: []
priority: medium
risk: low
batch: null
depends_on: []
blocks: []
branch: feat/T-032-a-done-kapu-nem-bekiti-ki-a-proza-deviacioit-a-strukturalt-d
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-019
assigned_agent: claude
resolution: completed
---
# T-032 — A done-kapu nem békíti ki a próza deviációit a strukturált Deviations mezővel

## Outcome

Ha egy ticket `### Deviations` szakasza „None." vagy „Not declared.", de a review-evidencia prózája deviációt említ, a validáció hibát ad. A két hely nem mondhat ellent egymásnak észrevétlenül.

## Context

F-019: a oneanda workspace 67 done ticketjéből 14-ben a `### Deviations` „None."-t mondott, miközben ugyanabban a fájlban `DEVIACIOK:` lista sorakozott — 2–8 említés ticketenként. A T-031 a mechanikus okot megszüntette (a CLI többé nem ír kéretlen „None."-t, alapérték „Not declared."), de a kibékítést semmi nem kényszeríti ki: az ágens továbbra is nyilatkozhat „None."-t, és írhat deviációt a `### Verification performed` szövegébe. A T-031 ezt kifejezetten non-goalnak jelölte.

## Scope

- Új validációs szabály a done-kapuban: ha a `### Deviations` szakasz tartalma „None." vagy „Not declared.", és a `### Verification performed` szövege illeszkedik a deviáció-markerre (`/deviáci|deviaci|deviation/i`), a validáció `DEVIATION_MISMATCH` hibát ad, a ticket azonosítójával és a találat idézetével.
- A hiba a `validate` parancs kimenetében jelenik meg, ugyanabban a formában, mint a többi (`code`, `message`, `path`).
- Csak `done` állapotú ticketekre fut.

## Non-goals

- Nem dönti el, hogy a nyilatkozat *igaz*-e — csak azt, hogy a két hely nem mond ellent (a tartalmi bírálat az F-018 külön munkája).
- Nem javítja visszamenőleg a meglévő done ticketek szövegét.
- Nem blokkolja a `ticket close`-t futás közben; a validáció jelzi, a döntés emberi.

## Acceptance

1. Done ticket „Deviations: None." + a verification szövegében „DEVIACIOK: ..." → `validate` hibát ad `DEVIATION_MISMATCH` kóddal.
2. Ugyanez „Not declared."-del is hibát ad.
3. Done ticket, amelynek Deviations szakasza valódi felsorolást tartalmaz → nincs hiba, akárhányszor szerepel a szó a prózában.
4. Done ticket „None." + a prózában nincs deviáció-marker → nincs hiba.
5. Nem-done ticketre a szabály nem fut.
6. A teljes tesztkészlet zöld.

## Verification

Integrációs tesztek fixture-ticketekkel a `tests/integration` alatt, az 1–5. feltételre egy-egy eset; `npx vitest run` teljes készlet.

## Constraints

- A szabály nem törhet el a `Not declared.` alapértéken (T-031) — ez a leggyakoribb jövőbeli tartalom.
- A marker-regex ékezet nélküli írásmódot is fogjon (a mért esetekben `DEVIACIOK` szerepelt, ékezet nélkül).

## Open decisions

None.

## Execution notes

A szabály helye a `src/commands/validate.ts` ticket-bejárása; a szakaszok kiolvasásához a meglévő markdown-parser elég, nem kell új függőség.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Acc1: done ticket 'Deviations: None.' + 'DEVIACIOK: ...' a narrativaban -> DEVIATION_MISMATCH, a hibauzenet idezi a talalt sort (integracios teszt, uzenet-tartalom is allitva). Acc2: ugyanez 'Not declared.'-del is hibat ad (teszt). Acc3: valodi deviacio-felsorolas a mezoben -> nincs hiba, akarhanyszor szerepel a szo a prozaban (teszt). Acc4: 'None.' + marker nelkuli proza -> nincs hiba (teszt); plusz tagado proza ('No deviations, ...', 'Erdemi deviacio nincs.') sem ad hibat (teszt). Acc5: review allapotu ticketre a szabaly nem fut (teszt). Acc6: npm run build:cli zold, npx tsc --noEmit zold, npx vitest run 18 fajl / 55 passed / 1 skipped (elotte 17/49). Valos repon merve: a szabaly 3 done ticketet jelol (T-026, T-029, T-030) — mindharom igazolt valodi talalat, kezzel ellenorizve; T-011 eloszor hamis pozitiv volt ('No deviations, findings, or known concerns.'), a tagadas-kezeles utan tiszta. Implementacio: src/core/markdown.ts subsections() (a sections() kozos headingSections() helperre bontva), src/core/validation.ts done-agi ellenorzes. Commitok: 39d53ea, 0e6fa7a. |

### Verification performed

Acc1: done ticket 'Deviations: None.' + 'DEVIACIOK: ...' a narrativaban -> DEVIATION_MISMATCH, a hibauzenet idezi a talalt sort (integracios teszt, uzenet-tartalom is allitva). Acc2: ugyanez 'Not declared.'-del is hibat ad (teszt). Acc3: valodi deviacio-felsorolas a mezoben -> nincs hiba, akarhanyszor szerepel a szo a prozaban (teszt). Acc4: 'None.' + marker nelkuli proza -> nincs hiba (teszt); plusz tagado proza ('No deviations, ...', 'Erdemi deviacio nincs.') sem ad hibat (teszt). Acc5: review allapotu ticketre a szabaly nem fut (teszt). Acc6: npm run build:cli zold, npx tsc --noEmit zold, npx vitest run 18 fajl / 55 passed / 1 skipped (elotte 17/49). Valos repon merve: a szabaly 3 done ticketet jelol (T-026, T-029, T-030) — mindharom igazolt valodi talalat, kezzel ellenorizve; T-011 eloszor hamis pozitiv volt ('No deviations, findings, or known concerns.'), a tagadas-kezeles utan tiszta. Implementacio: src/core/markdown.ts subsections() (a sections() kozos headingSections() helperre bontva), src/core/validation.ts done-agi ellenorzes. Commitok: 39d53ea, 0e6fa7a.

### Deviations

Egy szerzodesen tuli reszlet: a Scope csak a marker-regexet nevesitette, de a valos repon merve a 'No deviations, ...' fordulat hamis pozitivot adott (T-011), ezert a szabaly a tagado fordulatokat (angol es magyar) kiszuri a sor vizsgalata elott. Ez az Acceptance 4 szandekat teljesiti, de tobb kod, mint amit a ticket szo szerint kert. Tovabba: a Scope 'a hibauzenet a ticket azonositojaval es a talalat idezetevel' — az idezet 120 karakterre vagva, ezt a szerzodes nem rogzitette.

### Findings created

F-031 — a szabaly a sajat repon harom mar lezart ticketet jelol (T-026, T-029, T-030); a visszamenoleges szovegjavitas a T-032 non-goal-ja, ezert 'a-team validate' a merge utan harom DEVIATION_MISMATCH hibaval piros marad, amig az F-031 nincs dispozicionalva.

### Known concerns

A szabaly heurisztika, nem szemantikus itelet: (a) deviaciokrol szolo meta-ticketek (mint ez) csak akkor mennek at, ha valodi deviaciot nyilatkoznak; (b) a tagadas-lista veges, szokatlan fogalmazas ('deviation: absent') hamis pozitivot adhat; (c) csak a '### Verification performed' szakaszt nezi, az evidencia-tablazat cellait nem. Az F-018 melyebb, tartalmi gepezete tovabbra is kulon munka.
