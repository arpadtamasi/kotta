# Az A-Team-örökség megy

## Why

A Kotta még mindig hordozza az 1.0 előtti világot: megkeresi a régi `.a-team` nevű munkaterületet,
és a `kotta migrate` egy v1–v5-ös munkaterületet a feladataival, observationjeivel együtt áttesz egy
`legacy/` archívumba. A gépeiden ilyen munkaterület már nem maradt, amelyik kellene. Úgy döntöttél,
hogy minden A-Team-örökség mehet, és migrálni sem kell; a Kotta marad a kódrepóban.

## What changes

- **Új szabály — Kotta knows one workspace name:** csak a `.kotta/` nevet ismeri; az `.a-team`-et
  nem keresi és nem nevezi át.
- **Módosul — A version boundary refuses in both directions:** egy régi munkaterületre a Kotta nem a
  saját `migrate`-jét ajánlja, hanem az utolsó kiadást, amelyik még migrál (1.0.0-alpha.4).
- **Módosul — Migrate a workspace:** csak az OpenSpec mappájából való kiköltöztetés marad.
- **Módosul — The workspace file format:** a felfedezés csak a `.kotta/`-t ismeri.
- **Kikerül:** Migration skips operating-system metadata and nothing else, és a régi migráció három
  példája (Finder metadata does not stop the migration, An unknown entry still stops the migration,
  Migration moves vocabulary, never identity).
- Két példa: a régi nevű munkaterületet a Kotta nem találja; az 1.0 előtti munkaterületet elutasítja,
  és megnevezi a kiadást, amelyikkel még migrálható.

Nem része: a régi folyamat-csomópontok (feladat, claim, observation…) — azokat a jóváhagyott
„a-motor-maradek-igeretei” változás veszi ki; és a kódon kívüli munkaterület, amit elengedtünk.

## Open decisions

Nincs.
