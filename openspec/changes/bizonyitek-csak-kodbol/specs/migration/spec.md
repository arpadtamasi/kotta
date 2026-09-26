## ADDED Requirements

### Requirement: Az import nem vázol node-ot megjegyzésből
<!-- kotta: BR-01m3cqmtnnwxz7fkyr6d5ch9e6 -->
A `kotta import openspec` SHALL a narratív spec minden szakaszának — a képesség Purpose-ának,
a követelménynek, a scenariónak — szövegét a Markdown-megjegyzések levágása után mérni. Egy
szakasz, amelyben ezután nincs szöveg, SHALL NOT node-vázlatot adni. Üres Purpose-nál az import
SHALL a figyelmeztetései között megnevezni a képességet, amelynek célja nincs kimondva, hogy a
tervezés-fázis rákérdezzen; üres követelménynél vagy scenariónál SHALL szintén figyelmeztetni, a
képesség és a szakasz megnevezésével, nem csendben kihagyni.

#### Scenario: A Purpose csak a generátor megjegyzését tartalmazza
- **WHEN** egy `openspec/specs/<capability>/spec.md` `## Purpose` szakaszában csak a
  `<!-- … -->` megjegyzés áll
- **THEN** az import nem készít goal-vázlatot a képességhez, és a figyelmeztetései között
  megnevezi, hogy a képesség célja nincs kimondva

#### Scenario: A Purpose szöveget és megjegyzést is tartalmaz
- **WHEN** a `## Purpose` szakaszban a megjegyzés mellett próza is áll
- **THEN** az import a prózából vázol goal-t, a megjegyzés nélkül

### Requirement: A migráció nem bukik rendszer-metaadaton
<!-- kotta: BR-01m3cqmtvgmsdxnf78babstw2c -->
A `kotta migrate` SHALL figyelmen kívül hagyni az operációs rendszer metaadatfájljait a régi
alak könyvtárainak olvasásánál. A lista rögzített, nem konfigurálható: `.DS_Store`, `._*`,
`.Spotlight-V100`, `.Trashes`, `.fseventsd`, `Thumbs.db`, `ehthumbs.db`, `desktop.ini`. Ilyen
fájl SHALL NOT az archívumba kerülni; a régi könyvtárával együtt törlődik, és a terv SHALL
megnevezni minden kihagyott fájlt. Ez az egyetlen, amit a migráció átvitel nélkül töröl. Minden
más ismeretlen bejegyzésen SHALL továbbra is megállni, a bejegyzést megnevezve, írás nélkül.

#### Scenario: Finder-metaadat a régi workspace-ben
- **WHEN** egy v2-es workspace `batches/` könyvtárában `.DS_Store` fájl van
- **THEN** a migráció lefut, a fájl nem kerül az archívumba, és a terv megnevezi, hogy figyelmen
  kívül hagyta

#### Scenario: Ismeretlen fájl a régi workspace-ben
- **WHEN** egy régi alakú könyvtárban a migráció számára ismeretlen, nem metaadat bejegyzés van
- **THEN** a migráció megáll, megnevezi a bejegyzést, és semmit nem ír
