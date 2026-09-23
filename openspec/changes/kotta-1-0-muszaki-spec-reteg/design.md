# Design

## Context

Kilenc mérés vezetett ide (2026-09-19 – 09-23): a snake és a goschool páros változtatása, a goschool körbefordítása, az oktat-ai levezetése, a narratíva-visszakeresés, a 10 fix-commit boncolása, az írás-próba, a modul-szeletelés és a határ-átrendezés az assistant-core-on. A részletek a `docs/designs/fix-commit-boncolas.md`-ben.

## Goals / Non-Goals

- **Cél:** a műszaki spec mint külön réteg, modulhatárokkal, diagramokkal, a döntés forrásának jelölésével.
- **Nem cél:** kevesebb hibát ígérni. A boncolás szerint 10 javításból 3–4 volt szándék-hiba, de hogy ezt a modell megelőzi-e, nem mértük.
- **Nem cél:** a folyamatmotor megtartása. Az egyetlen kivétel a közös mag védelme.
- **Nem cél:** OpenSpec-kiterjesztésként működni. A spike megmutatta, hogy az archive a saját artefaktumainkat érintetlenül hagyja, nem kapuz, és a séma-API kísérleti.

## Decisions

1. **A modell az elfogadott igazság, a próza belőle generálódik — és az eltérést jelezni kell.** (Operátori döntés.) A körbefordítás megmutatta, hogy prózából a szerkezet nem nyerhető vissza: a hat célból nulla jött vissza.
2. **Egyetlen emberi kapu, a tervezés végén.** (Operátori döntés.) A mai modellben négy-öt kapu van, és a lezárási kapu a méréseink szerint reflexszerű igen.
3. **A bizonyíték modul- és teszt-szinten is kötődik.** (Operátori döntés: mindkettő.) A modul-szintű kötés kell a szeleteléshez, a teszt-szintű ahhoz, hogy a „zöld” valódi futásból jöjjön.
4. **A hatókörön kívüli észrevétel egy sor a narratívában**, dispozíció nélkül. A mai 178 megfigyelésből kevés lett valódi munka.
5. **A mai folyamat-adat archívumba kerül**, csak olvashatóan; a spec változatlanul átmegy.
6. **A hierarchia levezetett, nem karbantartott.** A modulok a manifestekből, a node modulja a bizonyíték helyéről. Új mező nincs, mert az elavulna.
7. **A közös mag ígérete hivatkozás.** A `corpus.search` két változata már ma elcsúszott a goschool és az assistant-core között.

8. **A mai Kotta legacy lesz, nem szűnik meg.** (Operátori döntés.) A hét workspace használatban van; a `kotta-legacy` név megtartja a mai működést, amíg a migráció meg nem történik, és a `kotta` név az új termék felülete lesz.

## Risks / Trade-offs

- **A formákban írás 2,3× lassabb** → a tervezés külön fázis, nem a beszélgetés része; az ár egyszer jelentkezik változtatásonként.
- **A kontextus nem magától csökken**, csak a határ-fegyelemmel → a validálás kikényszeríti, hogy a határon átnyúló ígéret interfészbe kerüljön (mérve: 8 kilógó ígéret → 1).
- **A tervezés kitalálhat szándékot** → tiltás és kérdés-kötelezettség; a körbefordításban egy use case célja bizonyítottan téves lett.
- **Az OpenSpec formátuma változhat** → nem futásidejű függőség, hanem importált és generált formátum.

## Migration Plan

1. `gap` újra futtathatóvá tétele a régi workspace-formában (előfeltétel: erre épül a modul-levezetés és a bizonyíték).
2. Modul-ellenőrzések a validálásban.
3. Tervezés-fázis és a narratíva-desztilláció.
4. Nézet: diagramok.
5. A folyamatréteg eltávolítása és a hét workspace migrációja, utolsó lépésként.

## Open Questions

- A change-mappa pontos alakja és a tervezés-jelentés formátuma.
- A narratíva desztillálásának indítása: munkamenet végén, vagy a tervezés részeként.
- A nézet 1.0-s hatóköre: mennyi a diagramból, és mennyi marad listának.
