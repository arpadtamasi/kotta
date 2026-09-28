# A kód a kapu után jön

## Why

Az operátor kérdése, 2026-09-28: „az agents/claude md-be beírjuk, hogy használni kell a kottát?
különben elhagyja". Az ügynök kihagyja a Kottát, és ennek két valós oka van.

1. **A Claude Code a `CLAUDE.md`-t olvassa, nem az `AGENTS.md`-t.** A `kotta init` létrehozza a
   projekt `AGENTS.md`-jét (`@.kotta/AGENTS.md` hivatkozással), ha nincs, de semmi nem köti rá a
   `CLAUDE.md`-t. Claude Code alatt a szabályokat így senki nem olvassa el. Ez a repó maga
   `CLAUDE.md`-ben `@AGENTS.md`-t tart; ez a létrehozandó alak.
2. **A szabályfájl leírja a folyamatot, de nem tiltja a kihagyását.** A `.kotta/AGENTS.md`
   elmondja, hogy egy change a narratívától a modell-deltán, a `plan`-on és az egy kapun át az
   `archive`-ig jut, és az 1. szabály szerint „a change akkor landol, amikor az ember igent mond",
   de egyetlen szabály sem mondja ki: ne implementálj olyan OpenSpec change-et, amelynek a
   modell-deltáját még nem hagyták jóvá és nem archiválták. Egy ügynök, amelynek megvan az OpenSpec
   `opsx:apply` skillje, a `tasks.md`-ből egyenesen implementálja a change-et, és a kapu kimarad.

## What Changes

- **Szabály az ügynököknek: a kód a kapu után jön.** Egy change feladatai nem implementálhatók,
  amíg a modell-deltáját az ember jóvá nem hagyta és archiválva nincs. Az ügynök, akit egy ilyen
  change alkalmazására kérnek (`opsx:apply`-jal vagy kézzel), előbb lefuttatja a tervezési fázist
  (`plan-change`), és a deltát az ember elé viszi — és ezt ki is mondja. Egy change, amely egyetlen
  ígéretet sem érint (dokumentáció, tiszta refaktor), mehet tovább, de az ügynök egy sorban
  kimondja, hogy ilyen.
- **A szabály bekerül a kiadott szabályfájlba** (`templates/AGENTS.md`, „Rules for agents"), és egy
  mondat a négy réteg bekezdésébe.
- **A `CLAUDE.md` hivatkozás.** A `kotta init` és a `kotta sync` létrehozza a projekt `CLAUDE.md`-jét
  `@AGENTS.md` sorral, ha nincs; ha van, de a sor hiányzik, jelzi és békén hagyja (`--link-agents`
  hozzáfűzheti). Ez a meglévő szabály — *Kotta owns its rules file, never the project's* —
  alkalmazása a Claude Code által olvasott fájlra; külön kódváltozásként megy.

## Capabilities

### New Capabilities
- `planning-phase`: a change útja a narratívától az egy kapuig, és ami utána jöhet.

## Impact

- `templates/AGENTS.md` és a belőle generált `.kotta/AGENTS.md`; `docs/agents.md`.
- `skills/plan-change/SKILL.md` sorrendje („implement, then `kotta archive`") igazítandó a
  szabályhoz, ha a kapu így dönt.
- `src/commands/agents.ts`, `init.ts`, `sync.ts`, `src/cli/index.ts`: a `CLAUDE.md` létrehozása
  és jelentése (külön commit, a meglévő szabály alatt).
