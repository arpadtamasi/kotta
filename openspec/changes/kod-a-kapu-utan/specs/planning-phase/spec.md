## ADDED Requirements

### Requirement: A kód a kapu után jön
<!-- kotta: BR-01m3kdq88m3bgye3xnn9q6hsr2 -->
Az ügynök SHALL NOT egy change feladatait implementálni — sem `opsx:apply`-jal, sem kézzel —,
amíg a change modell-deltáját az ember jóvá nem hagyta és a delta archiválva nincs. Az ügynök,
akit egy jóvá nem hagyott change alkalmazására kérnek, SHALL előbb a tervezési fázist lefuttatni
és a deltát az ember elé vinni, és SHALL kimondani, hogy ezt teszi. Egy change, amely egyetlen
ígéretet sem érint, mehet tovább; az ügynök SHALL egy sorban kimondani, hogy ilyen.

#### Scenario: Jóvá nem hagyott change alkalmazása
- **WHEN** az ügynököt egy olyan change alkalmazására kérik, amelynek nincs jóváhagyott és
  archivált modell-deltája
- **THEN** nem ír kódot a feladataihoz, hanem megmondja, hogy előbb a tervezési fázis jön,
  elkészíti a deltát, lefuttatja a `kotta plan`-t, és a deltát az ember elé viszi

#### Scenario: Ígéretet nem érintő change
- **WHEN** a change csak dokumentációt ír vagy tiszta refaktort végez, és egyetlen ígéretet sem
  változtat
- **THEN** az ügynök egy sorban kimondja, hogy a change nem érint ígéretet, és implementál
