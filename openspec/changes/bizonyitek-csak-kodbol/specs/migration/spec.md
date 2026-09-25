## ADDED Requirements

### Requirement: Az import nem vázol node-ot megjegyzésből
A `kotta import openspec` SHALL a narratív spec szakaszainak szövegét a Markdown-megjegyzések
levágása után mérni. Egy szakasz, amelyben ezután nincs szöveg, SHALL NOT node-vázlatot adni;
az import SHALL figyelmeztetésként megnevezni a képességet, amelynek nincs kimondott célja.

#### Scenario: A Purpose csak a generátor megjegyzését tartalmazza
- **WHEN** egy `openspec/specs/<capability>/spec.md` `## Purpose` szakaszában csak a
  `<!-- … -->` megjegyzés áll
- **THEN** az import nem készít goal-vázlatot a képességhez, és a figyelmeztetései között
  megnevezi, hogy a képesség célja nincs kimondva

#### Scenario: A Purpose szöveget és megjegyzést is tartalmaz
- **WHEN** a `## Purpose` szakaszban a megjegyzés mellett próza is áll
- **THEN** az import a prózából vázol goal-t, a megjegyzés nélkül

### Requirement: A migráció nem bukik rendszer-metaadaton
A `kotta migrate` SHALL figyelmen kívül hagyni az operációs rendszer metaadatfájljait
(`.DS_Store`, `Thumbs.db`, `desktop.ini`) a régi alak könyvtárainak olvasásánál, és SHALL
megnevezni a tervben, mit hagyott figyelmen kívül. Minden más ismeretlen bejegyzésen SHALL
továbbra is megállni írás nélkül.

#### Scenario: Finder-metaadat a régi workspace-ben
- **WHEN** egy v2-es workspace `batches/` könyvtárában `.DS_Store` fájl van
- **THEN** a migráció lefut, a fájl nem kerül az archívumba, és a terv megnevezi, hogy figyelmen
  kívül hagyta

#### Scenario: Ismeretlen fájl a régi workspace-ben
- **WHEN** egy régi alakú könyvtárban a migráció számára ismeretlen, nem metaadat bejegyzés van
- **THEN** a migráció megáll, megnevezi a bejegyzést, és semmit nem ír
