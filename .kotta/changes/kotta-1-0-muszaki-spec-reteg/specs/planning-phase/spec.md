## Purpose

A tervezés-fázis a narratív javaslatból műszaki modell-deltát állít elő az apply előtt, és ez az egyetlen pont, ahol emberi jóváhagyás kell.

## ADDED Requirements

### Requirement: A tervezés nem talál ki szándékot
Ahol egy forma olyat kér, amit sem a narratíva, sem a termék-dokumentumok nem mondanak ki, a tervezés SHALL kérdést rögzíteni, és SHALL NOT a hiányt saját döntéssel kitölteni.

#### Scenario: Hiányzó cél
- **WHEN** egy use case-hez egyik forrás sem mond célt
- **THEN** a tervezés kérdést ír a jelentésbe, és a change nem hagyható jóvá, amíg a kérdés megválaszolatlan

#### Scenario: A narratívában megvan
- **WHEN** a hiányzó „miért” a beszélgetésben vagy egy proposalban szerepel
- **THEN** a tervezés onnan veszi át, idézettel és forrásmegjelöléssel, és nem kérdez

### Requirement: A tervezés összeveti a deltát az elfogadott modellel
A tervezés SHALL jelenteni az ütközéseket, a csendben kieső eseteket, és azokat az elfogadott állításokat, amelyek a változás után hamissá válnának.

#### Scenario: Ütközés elfogadott szabállyal
- **WHEN** a javaslat egy elfogadott szabállyal ellentétes viselkedést kér
- **THEN** a jelentés megnevezi a szabályt és a hozzá tartozó példákat, és a jóváhagyás enélkül nem adható meg

### Requirement: Egyetlen emberi kapu a tervezés végén
A rendszer SHALL emberi jóváhagyást kérni a modell-deltára, a nyitott kérdésekre adott válaszokkal együtt, és SHALL NOT további kaput állítani az apply és az archiválás közé.

#### Scenario: Jóváhagyás nyitott kérdéssel
- **WHEN** a modell-delta nyitott kérdést tartalmaz
- **THEN** a jóváhagyás elutasításra kerül, a kérdés megnevezésével

#### Scenario: Az apply nem kérdez újra
- **WHEN** a jóváhagyott delta alapján az apply lefut
- **THEN** az archiválás emberi jóváhagyás nélkül megtörténik
