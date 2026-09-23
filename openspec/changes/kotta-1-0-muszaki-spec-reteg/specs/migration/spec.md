## Purpose

A meglévő workspace-ek és az OpenSpec-projektek átvezetése az új modellbe, veszteség nélkül.

## ADDED Requirements

### Requirement: A folyamat-adat archívumba kerül
A migráció SHALL a meglévő folyamat-tartalmat csak olvasható archívumba tenni, és SHALL a spec-részt változatlanul átvinni.

#### Scenario: Meglévő workspace migrálása
- **WHEN** egy mai workspace-t migrálunk
- **THEN** a spec node-jai változatlanok maradnak, a folyamat-adat archívumba kerül, és semmi nem törlődik

### Requirement: OpenSpec-projekt importálható
A rendszer SHALL egy meglévő narratív specet átvenni, és a tervezés-fázissal műszaki modellt SHALL belőle előállítani.

#### Scenario: Import után
- **WHEN** egy OpenSpec-projektet importálunk
- **THEN** a narratív spec változatlan marad, és a modellben minden node jelöli, hogy kimondott vagy következtetett
