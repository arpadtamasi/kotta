# Tasks

## 1. Előfeltétel

- [ ] 1.1 A `gap` fusson a régi workspace-formában is, vagy mondja meg pontosan, mit kell migrálni; ellenőrzés: lefut a kotta és a oneanda repóban
- [ ] 1.2 A modul-lista kiolvasása a manifestekből; ellenőrzés: az assistant-core négy csomagja megjelenik, kézi bejegyzés nélkül

## 2. Modulhatár

- [ ] 2.1 A node modulját a bizonyíték helyéből vezesse le; ellenőrzés: az assistant-core node-jainak modul-eloszlása megegyezik a kézi besorolással
- [ ] 2.2 Kilógó node jelentése (bizonyíték két modulban); ellenőrzés: a határ-átrendezés előtti állapotban 8 kilógó ígéretet jelez
- [ ] 2.3 Hiányzó interfész jelzése modulonként; ellenőrzés: a `chat-ui` transport interfész nélkül hibát ad
- [ ] 2.4 Repók közötti hivatkozás feloldása és verzió rögzítése; ellenőrzés: a goschool a mag `corpus.search` ígéretét a magból olvassa

## 3. Tervezés-fázis

- [ ] 3.1 Narratív javaslatból modell-delta; ellenőrzés: a snake „QUIT? Y/N” változtatásán a delta ugyanazt a nyolc pontot fedi le, mint a kézi mérés
- [ ] 3.2 Összevetés az elfogadott modellel: ütközés, kieső eset, hamissá váló állítás; ellenőrzés: a goschool SSO-kérésén mind a nyolc előre rögzített ütközést jelenti
- [ ] 3.3 Kérdés-kötelezettség: hiányzó „miért” esetén kérdés, nem kitöltés; ellenőrzés: a goschool körbefordításában egyetlen cél sem keletkezik kitalálva
- [ ] 3.4 Emberi kapu a modell-deltára; ellenőrzés: nyitott kérdéssel a jóváhagyás elutasításra kerül

## 4. Narratíva

- [ ] 4.1 Desztillátum a munkamenetből: (javaslat, válasz) párok, elvetett utak, kérdések, hivatkozás; ellenőrzés: az oktat-ai három munkamenetéből előáll, és a 68 „miért”-ből 48 forrása visszakereshető
- [ ] 4.2 A döntés forrásának jelölése és az „amit a gép döntött el” lista; ellenőrzés: a mérés 20 gépi döntése megjelenik benne
- [ ] 4.3 Titokszűrés a repóba írás előtt

## 5. Bizonyíték

- [ ] 5.1 Modul-szintű kötés a jelentésben
- [ ] 5.2 Teszt-szintű kötés: azonosító a teszt nevében, eredmény a futásból; ellenőrzés: átugrott teszt nem számít bizonyítottnak

## 6. Nézet

- [ ] 6.1 Use case diagram, történet-térkép, entitás-térkép, állapotgépek a modellből
- [ ] 6.2 A jelölés (kimondott, következtetett, gép döntése) megjelenítése
- [ ] 6.3 Narratíva elérése a node-ról

## 7. Eltávolítás és migráció

- [ ] 7.1 A folyamatréteg eltávolítása (task, batch, execute, claim, approval, sweep, observation, decision)
- [ ] 7.2 Migráció: folyamat-adat archívumba, spec változatlanul; ellenőrzés: a hét workspace mindegyike migrálható, veszteség nélkül
- [ ] 7.3 OpenSpec-import; ellenőrzés: az oktat-ai narratív specje importálható, és a modellben minden node jelölt
