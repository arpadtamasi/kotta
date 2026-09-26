# Tasks

## 1. Bizonyíték-szűrő
- [ ] 1.1 `isEvidencePath` kizárja az `openspec/` fát; egységteszt a négy kizárási osztályra és a projekt saját `specs/` könyvtárának megtartására.
- [ ] 1.2 A találatok osztályozása: kizárt említés osztálya (`openspec-change`, `openspec-archive`, `openspec-spec`, `published-spec`) a `gap` és `modules` `--json` kimenetében a `none` node-ok mellett.
- [ ] 1.3 Integrációs teszt: archivált change-gel és generált speckel rendelkező fixture-ben minden node `none`, a kizárt osztály megnevezve; a modul-levezetés besorolatlant ad, nem `(root)`-ot.

## 2. Import
- [ ] 2.1 A Purpose (és a követelmény/scenario) szövege megjegyzések levágása után mérve.
- [ ] 2.2 Üres Purpose → nincs goal-vázlat, figyelmeztetés a képesség nevével; teszt a csak-megjegyzés és a próza+megjegyzés esetre.

## 3. Migráció
- [ ] 3.1 A lapítás figyelmen kívül hagyja a rendszer-metaadatfájlokat és a tervben megnevezi; teszt `.DS_Store`-ral és egy valódi ismeretlen fájllal.

## 4. Dokumentáció és ellenőrzés
- [ ] 4.1 `docs/modules-and-evidence.md` „Known limit” pontja törölve, a kizárási szabály leírva.
- [ ] 4.2 A kaszinó-workspace-en (`/Users/rp/Dev/phd/oktatas/kaszino-e2e`) a `gap` 184 cited → 0 cited; a szám a CHANGELOG-ba.
- [ ] 4.3 `npm run typecheck`, `npm test`, CHANGELOG-bejegyzés.
