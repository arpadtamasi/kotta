# A régi Kotta-bevezető átalakítása is megy

## Why

Az A-Team-örökség kivezetésének folytatása: a `kotta sync --link-agents` ma felismeri és lecseréli
azt a bevezetőt, amit egy 0.x-es Kotta a projekt saját `AGENTS.md`-jébe írt. Úgy döntöttél, hogy ez
is mehet. A kotta repó `.kotta/legacy/` archívuma már törölve; egy elfogadott szabály még említi.

## What changes

- **Módosul — Kotta owns its rules file, never the project's:** a hatókörből kikerül a `migrate`
  (már nem frissíti a szabályfájlt), és kimondja, hogy egy 0.x-es bevezető közönséges projekt-tartalom.
- **Módosul — The accepted model promises only what a shipped command does:** kikerül a `.kotta/legacy/`
  említése.

## Open decisions

- A `--link-agents` egésze megy, vagy csak a régi bevezető átalakítása — a „Kotta owns its rules file”
  szabálynál.
