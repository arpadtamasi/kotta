# Tasks

## 1. A szabály
- [x] 1.1 `templates/AGENTS.md`: új pont a „Rules for agents" alatt (a kód a kapu után jön, `opsx:apply` vagy kézzel), és egy mondat a négy réteg bekezdésében; `kotta sync` után a `.kotta/AGENTS.md` követi.
- [x] 1.2 `docs/agents.md`: a „What it tells every agent" lista az új szabállyal.
- [ ] 1.3 `skills/plan-change/SKILL.md`: a jóváhagyás utáni sorrend a szabály szerint (archive, majd implementáció).
- [x] 1.4 Teszt a kiadott szabályfájlra (`tests/integration/sync.test.ts`), amely a szabály node-ját megnevezi.

## 2. A `CLAUDE.md` hivatkozás
- [x] 2.1 `kotta init` és `kotta sync` létrehozza a hiányzó `CLAUDE.md`-t `@AGENTS.md` sorral, a meglévőt jelzi és békén hagyja, `--link-agents` hozzáfűz; tesztek; `docs/agents.md`, `docs/getting-started.md`.

## 3. Ellenőrzés
- [ ] 3.1 `npm run typecheck`, `npm test`, `kotta validate`, CHANGELOG-bejegyzés.
