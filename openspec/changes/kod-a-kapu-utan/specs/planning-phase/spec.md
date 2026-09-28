## ADDED Requirements

### Requirement: Jelezze, ha a kód elhagyja a specet
<!-- kotta: BR-01m3kdq88m3bgye3xnn9q6hsr2 -->
Az ügynök MAY egy change-et implementálni — `opsx:apply`-jal vagy kézzel — akkor is, ha a
modell-deltája még nem ment át a kapun. Ha az általa írt kód olyan ígéretet tart, változtat vagy
ejt, amelyet az elfogadott modell nem mond ki, az ügynök SHALL ezt egy sorban jelezni az embernek,
az ígéretet közérthetően megnevezve, és SHALL felajánlani a tervezési fázist. SHALL NOT emiatt
megállni, elutasítani vagy késleltetni a munkát. Ha a munka egyetlen ígéretet sem érint, a specről
nem szól.

#### Scenario: A kód megelőzi a modellt
- **WHEN** az ügynök egy olyan change-et implementál, amely a modellben ki nem mondott viselkedést ad
- **THEN** implementál, és egy sorban jelzi, melyik ígéretet tartja a kód, amit a modell nem mond
  ki, és felajánlja a tervezést

#### Scenario: Ígéretet nem érintő munka
- **WHEN** a change csak dokumentációt ír vagy tiszta refaktort végez
- **THEN** az ügynök implementál, és a specről nem szól
