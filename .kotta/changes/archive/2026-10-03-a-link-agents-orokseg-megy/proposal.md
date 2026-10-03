# A --link-agents megy

## Why

Az A-Team-örökség kivezetésének folytatása: a `kotta sync --link-agents` ma felismeri és lecseréli
azt a bevezetőt, amit egy 0.x-es Kotta a projekt saját `AGENTS.md`-jébe írt. Úgy döntöttél, hogy ez
is mehet. A kotta repó `.kotta/legacy/` archívuma már törölve; egy elfogadott szabály még említi.

## What changes

- **Módosul — Kotta owns its rules file, never the project's:** kikerül az ügynök nélküli
  „determinisztikus út” (`--link-agents`): ilyenkor a Kotta a meglévő fájlt érintetlenül hagyja és
  kiírja a beírandó sort; egy 0.x-es bevezető közönséges projekt-tartalom; a hatókörből kikerül a
  `migrate`.
- **Módosul — The rules ship; the project file stays yours:** a hivatkozást az ügynök teszi be, a
  sodródást a `kotta sync` jelzi (a `status` parancs már nincs).
- **Módosul — The accepted model promises only what a shipped command does:** kikerül a `.kotta/legacy/`
  említése.

## Open decisions

Nincs: az egész `--link-agents` megy (válasz: b, 2026-10-03).
