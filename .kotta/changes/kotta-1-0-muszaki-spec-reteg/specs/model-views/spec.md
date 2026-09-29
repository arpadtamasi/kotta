## Purpose

A nézet a műszaki modellt mutatja úgy, hogy az ember átlássa: diagramokon, nem listákon.

## ADDED Requirements

### Requirement: A modell diagramként látszik
A nézet SHALL a modellből use case diagramot, történet-térképet, entitás-térképet és állapotgépeket rajzolni, és SHALL a node-ok jelölését láthatóvá tenni.

#### Scenario: Következtetett cél a diagramon
- **WHEN** egy cél következtetett
- **THEN** a diagramon megkülönböztethető jelöléssel jelenik meg

### Requirement: A diagramról a narratíva elérhető
A nézetben egy node-ról SHALL elérhető lennie a narratíva, amelyből a „miértje” származik.

#### Scenario: Honnan jött ez a szabály
- **WHEN** a felhasználó egy szabályra kattint
- **THEN** megjelenik a desztillált beszélgetés részlete és a döntés forrása

### Requirement: A nézet nem mutat folyamatot
A nézet SHALL NOT feladatot, batch-et, claimet vagy jóváhagyási sort mutatni.

#### Scenario: Nincs folyamat-nézet
- **WHEN** a nézet megnyílik
- **THEN** a spec és a bizonyíték látszik, folyamat-tábla nélkül
