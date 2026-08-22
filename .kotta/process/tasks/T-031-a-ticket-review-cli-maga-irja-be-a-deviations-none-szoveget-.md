---
id: T-031
title: >-
  A ticket review CLI maga irja be a 'Deviations: None.' szoveget — az F-019
  hazugsag-mintaja beepitett
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
branch: feat/T-031-a-ticket-review-cli-maga-irja-be-a-deviations-none-szoveget-
pull_request: null
created_at: '2026-08-02'
updated_at: '2026-08-02'
source_observation: F-026
assigned_agent: claude
resolution: completed
---
# T-031 — Hotfix: a review ne írjon kéretlen „Deviations: None."-t

## Outcome

A `ticket review` deviáció-szakasza a valóságot mondja: a hívó explicit adja meg a deviációkat (`--deviations`), és ha nem adja meg, a szakasz „Not declared." — soha nem állít kéretlenül „None."-t. Az F-019-ben mért hazug-mező mintázat mechanikus oka megszűnik.

## Context

F-026: a `reviewTicket` sablonja fixen `### Deviations\n\nNone.`-t ír minden ticketbe — az ágenst meg sem kérdezi. A oneandában 14 done ticket mondott „None."-t, miközben a prózában deviációk sorakoztak (F-019). A T-026 review-jában a deviációkat csak az evidencia-szövegbe lehetett csempészni. A strukturált mező akkor ér valamit, ha a tartalma állítás, nem sablon.

## Scope

- Új opció: `ticket review <id> --evidence <text> [--deviations <text>]`.
- Ha `--deviations` meg van adva: a `### Deviations` szakasz a megadott szöveget kapja.
- Ha nincs megadva: a szakasz tartalma `Not declared.` — ami őszintén mondja, hogy senki nem nyilatkozott; a „None." csak explicit `--deviations "None."` esetén születhet.
- A `### Findings created` és `### Known concerns` szakaszok ugyanígy: opcionális `--findings-created`, `--known-concerns` flagek, alapérték `Not declared.` — egy menetben, mert azonos a mintázat.
- A skillek (`submit-review`) frissítése: a review-hívás kötelezően nyilatkozzon deviációkról — „None." csak akkor, ha tényleg nincs.

## Non-goals

- Nem validál tartalmat (nem dönti el, igaz-e a nyilatkozat) — az F-018/F-019 mélyebb gépezete külön munka.
- Nem érinti a meglévő done ticketek szövegét.

## Acceptance

1. `review --deviations "X"` a szakaszba X-et írja — teszt.
2. `review` deviations nélkül `Not declared.`-et ír, nem `None.`-t — teszt.
3. A submit-review skill szövege kimondja a nyilatkozati kötelezettséget.
4. A meglévő teljes tesztkészlet zöld (a review-close tesztek igazítva, ha a „None."-ra számítottak).

## Constraints

- Visszafelé kompatibilitás a validátorral: a done-kapu nem törhet el attól, hogy a szakasz „Not declared." — ellenőrizni, hogy a validátor nem követel konkrét szöveget.

## Execution notes

Kis diff a `reviewTicket`-ben és a CLI-regisztrációban; a skill-szöveg egy bekezdés.

## Verification

`npm run build:cli` zöld; `npx vitest run` teljes készlet zöld.

## Open decisions

None.

## Review evidence

| Acceptance condition | Evidence |
|---|---|
| Ticket acceptance criteria | Acc1: '--deviations X' szo szerint a szakaszba kerul — integracios teszt. Acc2: flag nelkul 'Not declared.' mindharom szakaszban, 'None.' sehol; 'None.' csak explicit '--deviations None.'-nal — ket teszt. Acc3: submit-review skill kimondja a nyilatkozati kotelezettseget (SKILL.md:19). Acc4: teljes keszlet 16 fajl / 44 passed / 1 skipped; a review-close tesztek valtozatlanok (grep igazolta, hogy egyik sem allitott 'None.'-t). Validator-ellenorzes: a done-kapu nem kovetel konkret szoveget, 'Not declared.'-del nem torik. Brief ~780 token, friss kontextus, D-009. |

### Verification performed

Acc1: '--deviations X' szo szerint a szakaszba kerul — integracios teszt. Acc2: flag nelkul 'Not declared.' mindharom szakaszban, 'None.' sehol; 'None.' csak explicit '--deviations None.'-nal — ket teszt. Acc3: submit-review skill kimondja a nyilatkozati kotelezettseget (SKILL.md:19). Acc4: teljes keszlet 16 fajl / 44 passed / 1 skipped; a review-close tesztek valtozatlanok (grep igazolta, hogy egyik sem allitott 'None.'-t). Validator-ellenorzes: a done-kapu nem kovetel konkret szoveget, 'Not declared.'-del nem torik. Brief ~780 token, friss kontextus, D-009.

### Deviations

Az agens nyilatkozata: erdemi devicio nincs. Egy iteleti dontes: ures/whitespace '--deviations' is 'Not declared.'-kent ertelmezodik — a szerzodes ezt az elet nem rogzitette. A brief 'kotelezo' nyilatkozata skill-szintu kotelessegkent implementalva, nem CLI hard-requirementkent — a koordinator ezt elfogadta.

### Findings created

None.

### Known concerns

None.
