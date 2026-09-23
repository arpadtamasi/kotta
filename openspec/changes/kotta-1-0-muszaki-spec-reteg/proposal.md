# Kotta 1.0 — műszaki spec a narratív mellé

## Why

A Kotta ma folyamatmotor: task, claim, worktree, review-kapu, batch, observation, döntés. A 2026-09-22/23-i mérések szerint ez a réteg a mai használatban nagyrészt ceremónia (a commitok 54–72%-a állapot-könyvelés, és egy hét OpenSpec-munka után az operátor szerint „nem hiányzott a Kotta”), miközben a valóban dolgozó rész a leírt, elfogadott specifikáció.

Ugyanezek a mérések azt is megmutatták, mit nem tud a próza önmagában:

- **A „mit” és a „hogyan” kimondott, a „miért” és a „kinek” nem.** Egy természetes OpenSpec-specből (oktat-ai, 112 requirement) levezetett 479 node-ból 301 volt kimondott; a 11 célból és a 14 user storyból egy sem.
- **A szerkezet nem vezethető vissza.** A goschool körbefordításában (299 node → OpenSpec → vissza) a hat cél elveszett, helyükre 11 kitalált cél került, és a use case → cél élekből egy sem egyezett.
- **A formákban írt delta pontosabb.** Ugyanarra a változtatásra a próza-delta kitalált egy szabályt és csendben elejtett egy esetet; a modell-delta egyiket sem, cserébe 2,3-szor annyi ideig tartott.
- **A modulhatár a specben ma nincs jelen.** Az assistant-core-on mérve: a határ kimondása után a `chat-ui` fejlesztésekor a spec 42%-a (35 node) kimarad, és a kilógó ígéretek száma 8-ról 1-re esett.
- **A másolt ígéret elavul.** A `corpus.search` interfész a goschoolban és az assistant-core-ban már ma mást mond.
- **A gép észrevétlenül dönt.** A visszakeresett 68 „miért”-ből 20-at senki nem mondott ki: azokat a gép választotta.

## What Changes

A Kotta a **műszaki spec** gazdája lesz az OpenSpec narratív specje mellett, és lemond a folyamatmotorról.

- **Négy réteg:** chat → narratív spec (OpenSpec) → műszaki spec (Kotta-formák) → kód. A rétegek hivatkozásokkal kapcsolódnak, nem másolással.
- **Tervezés-fázis** az apply előtt: a narratívából modell-deltát állít elő, összeveti az elfogadott modellel, rákérdez a hiányzó „miértekre”, és **soha nem talál ki** szándékot.
- **Egyetlen emberi kapu:** a tervezés végén, a modell-deltán, diagramon, a nyitott kérdésekre adott válaszokkal.
- **Modulhatár:** a modulok a manifestekből, a node modulja a bizonyítéka helyéről vezethető le. Ami modulhatáron átnyúlik, interfész-node-ba kerül; ezt a validálás kikényszeríti.
- **Repók közötti hivatkozás:** a fogyasztó a mag ígéreteire hivatkozik, nem másolja őket, verzióhoz kötve.
- **Narratíva:** változtatásonként desztillált beszélgetés, a (javaslat, válasz) párokkal, és azzal, **ki döntött** — ember, ember a gép javaslatára, vagy a gép egyedül.
- **Nézet:** a board a modellt mutatja diagramként (use case, story map, entitás-térkép, állapotgépek), a jelöléssel, mi kimondott és mi következtetett.
- **BREAKING:** kiesik a task, a claim, a worktree-kezelés, a batch, a review-kapu, az observation-életciklus és a döntési rekord. A meglévő workspace-ek `process/` adata archívumba kerül, csak olvashatóan.

## Capabilities

### New Capabilities
- `technical-model`: a műszaki spec és a viszonya a narratív spechez (az eltérés jelzése is).
- `planning-phase`: a tervezés-fázis és az emberi kapu.
- `module-boundary`: modulok, interfészek, repók közötti hivatkozás.
- `narrative`: a beszélgetés desztillátuma és a döntés forrásának rögzítése.
- `evidence`: mi épült meg — modul- és teszt-szintű kötés.
- `model-views`: a diagramokat adó nézet.
- `migration`: a mai workspace-ek átvezetése és az OpenSpec-import.

## Impact

- **Kiesik:** `src/commands/task.ts`, `batch.ts`, `execute.ts`, `approval.ts` nagy része, `sweep.ts`, `observation.ts`, `claim.ts`, `decision.ts`, `conversation.ts`, és a hozzájuk tartozó `core/` modulok.
- **Marad, átalakul:** a form-regiszter, a `validate`, a `gap`, a `sync`, a `ui` szervere, a `migrate`.
- **Új:** a tervezés-fázis, a modul-ellenőrzések, a narratíva-desztilláció, a diagram-nézetek, az import.
- Az `@arpadtamasi/kotta` felülete törik; a változás major verzió.
