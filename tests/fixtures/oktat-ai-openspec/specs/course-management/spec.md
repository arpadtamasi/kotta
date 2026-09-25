# course-management Specification

## Purpose
A tanár kurzusokba rendezi az anyagát, és ő dönti el, mikor lát belőle
valamit a diák: ez a képesség rögzíti a kurzus létrehozását, módosítását és
állapotait.

## Requirements

### Requirement: Kurzus létrehozása
A szolgáltató tanára SHALL kurzust létrehozni névvel, opcionális leírással és
nyelvvel. A név MUST NOT üres lenni. A nyelv kétbetűs ISO 639-1 kód, alapból
`hu`; érvénytelen kódot a szerver MUST elutasítani. A slug a megadott slug
vagy a névből képzett slug; ha az adott szolgáltatónál már van ilyen slugú
kurzus, a létrehozás MUST hibával elutasulni. Az új kurzus piszkozat,
anyagverziója 0, anyag nélkül.

#### Scenario: Új kurzus
- **WHEN** a tanár „Kémia 9” néven, „Anyagok és reakciók” leírással kurzust hoz létre
- **THEN** létrejön a `kemia-9` piszkozat kurzus magyar nyelvvel, és a felület a tanári kurzusoldalára visz

#### Scenario: Ütköző slug
- **WHEN** a tanár olyan nevű kurzust hoz létre, amelynek slugja már foglalt a szolgáltatónál
- **THEN** a létrehozás hibával elutasul

#### Scenario: Angol nyelvű kurzus
- **WHEN** a tanár `en` nyelvvel hoz létre kurzust
- **THEN** a kurzus nyelve angol

### Requirement: Kurzus módosítása
A tanár SHALL módosítani a kurzus nevét, leírását, állapotát és nyelvét. A név,
ha meg van adva, MUST NOT üres lenni; az állapot csak `draft`, `live` vagy
`archived` lehet; a nyelv kétbetűs ISO 639-1 kód. A slug a létrehozás után nem
változik. A nyelv módosításakor a kurzus azon anyagai, amelyek nyelve eltér az
újtól, fordításra ütemeződnek.

#### Scenario: Ismeretlen állapot
- **WHEN** a tanár `published` állapotot küld
- **THEN** a szerver hibával elutasítja

#### Scenario: Nyelvváltás
- **WHEN** a tanár egy magyar kurzus nyelvét angolra állítja, és a kurzuson magyar anyag van
- **THEN** a magyar anyag angol fordításra ütemeződik

### Requirement: Állapotátmenetek
A szerver SHALL bármely állapotból bármely másikba engedni az átmenetet, azzal
az egy feltétellel, hogy élőre állítani csak olyan kurzust MUST lehet,
amelynek legalább egy anyaga legalább egy kész egységgel rendelkezik —
ugyanaz a feltétel, amely mellett a kurzusban kérdezni lehet. A tanári
felület piszkozat és archivált kurzusnál „Élesítés”, élő és archivált
kurzusnál „Vissza piszkozatba”, nem archivált kurzusnál „Archiválás”
műveletet SHALL kínálni. Amíg az élesítés feltétele nem teljesül, a felület
az „Élesítés”-t SHALL letiltani, és megmondani az okát: nincs anyag, az anyag
még feldolgozás alatt áll, vagy minden anyag feldolgozása sikertelen.

#### Scenario: Élesítés anyag nélkül
- **WHEN** a tanár anyag nélküli kurzust állít élőre
- **THEN** a szerver hibával elutasítja, a felületen a gomb le van tiltva „Előbb tölts fel anyagot” indokkal

#### Scenario: Élesítés feldolgozás előtt
- **WHEN** a kurzus egyetlen anyaga még feldolgozás alatt áll, és egyetlen egysége sem kész
- **THEN** a szerver az élesítést elutasítja, a felületen a gomb le van tiltva, és a súgó szerint az anyag még feldolgozás alatt áll

#### Scenario: Élesítés az első kész egység után
- **WHEN** a kurzus anyagának első oldalai elkészültek, a többi még fut
- **THEN** a kurzus élesíthető

#### Scenario: Minden anyag sikertelen
- **WHEN** a kurzus minden anyagának feldolgozása sikertelen
- **THEN** az élesítés le van tiltva, és a súgó a sikertelen feldolgozást nevezi meg

#### Scenario: Archiválás visszavonása a felületen
- **WHEN** a kurzus archivált
- **THEN** a felület élesítést és piszkozatba állítást is kínál

### Requirement: Diák csak élő kurzust ér el
Diák egy kurzust SHALL csak élő állapotban megnyitni, benne kérdezni, a
kurzuslistáiban látni. Piszkozat vagy archivált kurzusnál a diák megnyitási és
kérdezési kísérlete MUST „a kurzus még nem élő” tiltással elutasulni. A tanár
bármely állapotú kurzusát megnyithatja a saját teszt-chatjéhez.

#### Scenario: Piszkozat a diáknak
- **WHEN** egy hozzáféréssel bíró diák piszkozat kurzus címét nyitja meg
- **THEN** a felület kimondja, hogy a kurzushoz nincs hozzáférése, a szerver üzenetével

#### Scenario: Piszkozat a tanárnak
- **WHEN** a tanár a piszkozat kurzus teszt-chatjét nyitja meg
- **THEN** kérdezhet a kurzus anyagából

### Requirement: Kurzuslista a tanárnak
A tanári felület SHALL élőben listázni a szolgáltató összes kurzusát
létrehozás szerint növekvő sorrendben, állapottal, sluggal, anyagverzióval és
az anyag utolsó frissítésének napjával.

#### Scenario: Állapotváltás élőben
- **WHEN** a tanár élesít egy kurzust
- **THEN** a kurzuslistában az állapot újratöltés nélkül „Élő” lesz

### Requirement: Kurzuscím megosztása
A tanári kurzusoldal SHALL megmutatni és másolhatóvá tenni a kurzus diákoldali
címét; a diák ezen a címen lép be.

#### Scenario: Cím másolása
- **WHEN** a tanár a „Cím másolása” műveletet választja
- **THEN** a kurzus diákoldali címe a vágólapra kerül
