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
