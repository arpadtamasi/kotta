# Design

## 1. Egy szűrő, egy szabály

`isEvidencePath` marad az egyetlen hely, amely eldönti, mi bizonyíték. Ma három kizárása van
(workspace, kiadott `kotta-spec/`, `node_modules`); a negyedik az `openspec/` fa a repó
gyökerétől (`OPENSPEC_DIRECTORY`). Nem útvonal-mintát adunk hozzá (`**/specs/**`), mert a
projekt saját `specs/` könyvtára jogosan lehet teszt; a kizárás a Kotta által ismert
spec-forrásokra vonatkozik, nem a névre.

## 2. A kizárt említések nem tűnnek el, hanem megneveződnek

A jelentés a kizárt fájlokat nem olvassa bizonyítékként, de a `none` szintű node-ok mellé
odaírja, melyik kizárt osztály említi (`openspec-change`, `openspec-archive`, `openspec-spec`,
`published-spec`). Ez a „miért none” kérdés válasza, és olcsó: az id-keresés ugyanaz, csak a
találat osztályozása más.

## 3. Modul-levezetés ugyanazon a szűrőn

`modules.ts` a node modulját az őt említő fájlok moduljából vezeti le, ugyanezzel a szűrővel.
A változás automatikusan oda is elér; a tesztnek ki kell mondania, hogy egy csak `openspec/`
alatt említett node besorolatlan, nem `(root)`.

## 4. Import: megjegyzés nélkül mérve

`parseCapabilitySpec` a `## Purpose` szövegét megjegyzések nélkül adja vissza (a
`normalizeProse` már létezik a `spec/narrative.ts`-ben; a megjegyzés-levágás oda kerül, hogy a
követelmény- és scenario-szövegek is egyformán mérődjenek). Üres Purpose → nincs goal-vázlat,
egy figyelmeztetés a képesség nevével.

## 5. Nem scope

A `bound` szint tesztfuttatásra alapozott zöld/piros állapota (a régi `prove` jegyzet) továbbra
sem része ennek a change-nek.
