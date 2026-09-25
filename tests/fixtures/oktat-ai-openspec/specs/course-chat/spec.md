# course-chat Specification

## Purpose
A diák egy kurzus kontextusában kérdez, és csak a tanár anyagából kap
hivatkozott választ: ez a képesség rögzíti a kurzus megnyitását, a
beszélgetést, a segéd viselkedését, a forrásnézetet és a kérdésnaplót.

## Requirements

### Requirement: Kurzus megnyitása
Egy kurzus megnyitásakor a szerver SHALL ellenőrizni a jogot: a szolgáltató
tanára bármely állapotú kurzust megnyithat; diák csak próba- vagy aktív
hozzáféréssel és csak élő kurzust. Nem létező kurzusnál „nem található”, jog
nélkül „ehhez a kurzushoz nincs hozzáférésed”, nem élő kurzusnál diáknak „a
kurzus még nem élő” hibát MUST adni. Sikeres megnyitáskor a szerver SHALL
biztosítani a felhasználó beszélgetését a kurzusban, és visszaadni a kurzus
adatait, a hozzáférést (szerep, állapot, felhasznált és keret), a beszélgetés
azonosítóját, a feldolgozott és az összes anyag számát és a szolgáltató nevét.

#### Scenario: Diák megnyitja az élő kurzust
- **WHEN** egy próba-hozzáférésű diák az élő kurzus címét nyitja meg
- **THEN** megkapja a beszélgetését és a hátralévő ingyenes kérdéseit

#### Scenario: Jog nélkül
- **WHEN** egy hozzáférés nélküli felhasználó nyitja meg a kurzust
- **THEN** a felület kimondja, hogy nincs hozzáférése, melyik címmel lépett be, és hogy a tanár ehhez a címhez adja a hozzáférést

### Requirement: Egy beszélgetés felhasználónként és kurzusonként
Minden felhasználónak egy kurzusban SHALL pontosan egy beszélgetése lenni,
amelynek egyetlen résztvevője ő. A beszélgetés fajtája tanárnál saját teszt,
diáknál diák. Más felhasználó beszélgetésébe küldött üzenetet a szerver MUST „ez
a beszélgetés másé” tiltással elutasítani.

#### Scenario: Visszatérés a kurzusba
- **WHEN** a diák később újra megnyitja a kurzust
- **THEN** ugyanazt a beszélgetést folytatja az előző üzenetekkel

### Requirement: Kérdés feltétele
A szerver a kérdést SHALL elutasítani, ha üres (a szélek levágása után), ha
4000 karakternél hosszabb, ha a hívó jogát a megnyitás szabályai szerint nem
igazolja, ha a próba kerete elfogyott (fal), ha a kurzusnak nincs feldolgozott
anyaga, vagy ha a megadott szülő-üzenet nem létezik; ezek az elutasítások a
hívás válaszaként érkeznek. Egyébként SHALL rögzíteni a kérdést, egy készülő
válaszüzenetet és a naplóbejegyzést (a kérdés ekkor számít), elindítani a
válasz elkészítését a háttérben, és a válasz megvárása nélkül visszatérni a
kérdés és a készülő válasz azonosítójával. A válasz a hívás után készül el,
és a felület a már meglévő élő folyamból követi; a hívás ideje nem függ a
modell válaszidejétől.

#### Scenario: Anyag nélküli kurzus
- **WHEN** a tanár olyan kurzus teszt-chatjében kérdez, amelynek egyik anyaga sem kész
- **THEN** a szerver „a kurzushoz még nincs feldolgozott anyag” hibát ad

#### Scenario: Túl hosszú kérdés
- **WHEN** a kérdés 4001 karakter
- **THEN** a szerver „az üzenet túl hosszú” hibát ad

#### Scenario: Lassú modellválasz
- **WHEN** a modell egy válaszon 70 másodpercig dolgozik
- **THEN** a kérdés hívása néhány másodpercen belül visszatér, a diák a választ élőben látja elkészülni, és hibaüzenet nem jelenik meg

#### Scenario: Fal a háttérfuttatás előtt
- **WHEN** egy falnál álló diák kérdést küld
- **THEN** a hívás a fal-hibával tér vissza, és nem indul háttérfuttatás

### Requirement: Válasz csak a kurzus anyagából
A segéd SHALL csak az adott kurzus feldolgozott dokumentumaiban keresni, és a
választ kizárólag a keresés találataiból adni. A válasz azon a nyelven készül,
amelyen a diák a kérdést feltette, tömören; ha az anyag nem tartalmazza a
választ, a segéd kimondja, és a tanárhoz irányít; nem oldja meg a feladatot a
diák helyett, hanem rávezet; nem ajánl anyagon kívüli forrást. Mielőtt
kimondja, hogy valami nincs az anyagban, másképp is keres. A szolgáltató neve,
a kurzus neve, leírása és nyelve a segéd szerepleírásának része.

#### Scenario: Kurzuson kívüli anyag
- **WHEN** a szolgáltató másik kurzusa tartalmazza a választ, ez nem
- **THEN** a segéd ebben a kurzusban nem találja, és kimondja, hogy az anyag nem tartalmazza

#### Scenario: Anyagon kívüli kérdés
- **WHEN** a diák „Mi Franciaország fővárosa?” kérdést tesz fel egy kémiakurzusban
- **THEN** a válasz kimondja, hogy az anyag nem tartalmazza, hivatkozás nélkül, és a napló megtagadásként rögzíti

#### Scenario: Angol kérdés magyar kurzusban
- **WHEN** a diák angolul kérdez egy magyar nyelvű kurzusban
- **THEN** a válasz angolul készül, a hivatkozások az anyag oldalaira mutatnak

### Requirement: Keresési találat környezettel
Egy keresés SHALL legfeljebb négy egyező találatot adni, és mindegyik mellé a
dokumentum szomszédos egységeit — egységtípustól függetlenül (PDF-oldal,
DOCX-szakasz, PPTX-dia) — **külön, hivatkozható találatként**, a saját
szövegével és helyével, olvasási sorrendben. A szomszédok egy szövegkeretig
bővülnek: előbb legalább egy előző és egy következő egység (ha van), majd
felváltva egy-egy további előző és következő egység, amíg a keret engedi; ha az
egyik irányban elfogy a dokumentum, a maradék keret a másik irányba jut. Így
rövid egységekből több, hosszú egységekből kevesebb kerül a találat köré. Üres
egység nem kerül be, a környezet nem lép át másik dokumentumba, és egy egység
egy keresésben csak egyszer szerepel. A tárolt egység és a forrásnézet ettől
nem változik. Egy már megtartott találat környezetébe eső gyengébb találat
MUST NOT külön egyező találatként megjelenni, visszakereső backendtől
függetlenül.

A találat szövege SHALL a tárolt egység saját szövege lenni. Az index a
megtalálást szolgálja, és tartalmazhat olyat, ami nem a forrás szövege — a
kurzus nyelvű gépi fordítást, külön keresőpéldányként —, de ez MUST NOT a
találat szövegeként a modellhez jutni: a modell az eredetit kapja, és abból
idéz.

Egy keresés egyező találatai között minden anyag SHALL szóhoz jutni: minden
dokumentum legjobb találata helyet kap, ha nem sokkal gyengébb a legjobbnál, és
egy dokumentumból legfeljebb kettő jön, hacsak nincs más anyag, amelynek helyet
kellene hagyni. Így ha ugyanaz a hely több alakban is megvan a kurzuson
(kurzusnyelvű kiadás, eredeti, felvétel), az erősebben egyező alak nem szorítja
ki a többit.

Amit a forrásról tudunk, a találat SHALL külön mezőkben hozni, nem a szövegbe
fűzve: a dokumentum címe és szerzői, az egység helyének felirata a kurzus
nyelvén, az egység nyelve, felvételnél az időbélyeg, és az, hogy van-e
oldalképe. Így a modell tudja, mit olvas és hol jár, anélkül hogy a forrás
szövegének hinné.

#### Scenario: Oldalhatáron átnyúló jelenet
- **WHEN** a kérdésre a 108. oldal a legjobb találat, és a válasz a 109. oldalon folytatódik
- **THEN** a modell a 108. mellett legalább a 107. és a 109. oldalt is külön találatként kapja, mindegyiket a saját helyével

#### Scenario: Rövid diák
- **WHEN** egy PPTX 5. diája a találat, és a diák rövidek
- **THEN** a modell a keret erejéig több előző és következő diát is kap, mindegyiket „N. dia” hellyel

#### Scenario: Hosszú oldalak
- **WHEN** egy PDF oldalai olyan hosszúak, hogy a keret már egy-egy szomszédnál betelik
- **THEN** a modell a találat oldalát és egy előző meg egy következő oldalt kap

#### Scenario: Dokumentum eleje
- **WHEN** a találat a dokumentum első egysége
- **THEN** a környezet csak következő egységeket tartalmaz, és a teljes keretet ezek kapják

#### Scenario: Közeli gyengébb találat
- **WHEN** a 108. oldal erős, a 109. oldal gyengébb találat ugyanarra a kérdésre
- **THEN** a 109. oldal nem számít külön egyező találatnak, de a 108. szomszédjaként egyszer ott van

#### Scenario: Helyi lexikális index
- **WHEN** a szerver modellkulcs nélkül, a helyi lexikális indexszel fut
- **THEN** a találatok ugyanúgy szomszédokkal és összevonva jutnak a modellhez, és egyik sem vész el

#### Scenario: Több alak ugyanarról a helyről
- **WHEN** a küklopsz-jelenetre a magyar kiadás négy oldala erősebben egyezik, mint a görög eredeti
- **THEN** a görög eredeti oldala is a modell elé kerül, és a magyar kiadásból legfeljebb két egyező oldal jön

#### Scenario: Görög oldal magyar kurzuson
- **WHEN** a magyar kérdés a görög anyag egyik oldalát találja meg (a kurzus nyelvű fordítás alapján)
- **THEN** a modell a görög eredeti szövegét kapja, mellette mezőkben a magyar helyfeliratot, a dokumentum címét, szerzőjét és az egység nyelvét — a fordítás nem kerül a találat szövegébe

### Requirement: Hivatkozás a helyre
Minden anyagból vett állítás mellett a válasz SHALL hivatkozást tartalmazni
arra az egységre, amelynek szövegében az állítás ténylegesen szerepel — a
szomszédként kapott egységekre is —, és ha egy válasz több egységből jön, több
hivatkozást, mindegyiket a saját helyével. A linkszöveg az egység
megjelenített helye (pl. „Tizedik ének · 109. oldal”), nem oldaltartomány, nem
fájlnév, nem belső azonosító és nem a keresés belső jelölése. Hivatkozás csak a
keresés által visszaadott egységre mutathat; megtagadó válasz MUST NOT
hivatkozást tartalmazni.

A megjelenített hely SHALL a kurzus nyelvén állni. Ha az anyag más nyelvű, a
feliratot — a dokumentum címét és az egység helyét — a feldolgozás SHALL a
kurzus nyelvére lefordítva eltárolni, és a segéd a találat mezőjében kapott
feliratot SHALL használni; a segéd MUST NOT a forrás nyelvén hagyni vagy maga
kitalálni a feliratot.

A válasz alatti forráskártya SHALL a forrást mutatni: a dokumentum címe előtt
a szerzővel („Stephen Fry: Odüsszeia”), ha ismert, és a hellyel, fejezetcímmel,
ha az egységnek van (pl. „AZ EGYSZEMŰ · 143. szakasz”). A kurzus nyelvétől
eltérő nyelvű anyag kártyája SHALL a forrás saját nyelvén állni („Ὅμηρος:
ΟΔΥΣΣΕΙΑ · Ραψωδια ι · 121. oldal”), hogy a fordítás és az eredeti kártyája
ne legyen egyforma; a linkszöveg ettől függetlenül a kurzus nyelvén áll.

Ha ugyanaz a hely (azonos cím és szakasz) több anyagból is a találatok között
van, a segéd SHALL mindegyik alakot egyszer felkínálni, megnevezve, mit ad —
olvasás a kurzus nyelvén, eredeti, meghallgatás —, a saját hivatkozásával. Ha
sorszám vagy versszám csak az egyik alakban van kinyomtatva, a segéd SHALL azt
abból megadni, és kimondani, hogy melyik kiadás számozása.

#### Scenario: Hivatkozott válasz
- **WHEN** a diák egy leckéről kérdez, amely az anyagban szerepel
- **THEN** a válasz alatt a forrás helye kattintható hivatkozásként látszik

#### Scenario: A részlet a szomszéd oldalon áll
- **WHEN** a legjobb találat a 108. oldal, de a moly nevű varázsfű a 109. oldalon szerepel
- **THEN** a varázsfűről szóló állítás a „Tizedik ének · 109. oldal” hivatkozást kapja, nem a 108. oldalt és nem tartományt

#### Scenario: Több helyről összerakott válasz
- **WHEN** a válasz egyik része a 108., másik része a 110. oldalon áll
- **THEN** a válaszban két hivatkozás van, egy a 108. és egy a 110. oldalra

#### Scenario: Görög eredeti magyar kurzuson
- **WHEN** a válasz a görög Odüsszeia egyik oldalára hivatkozik egy magyar kurzuson
- **THEN** a hivatkozás felirata „Odüsszeia · 9. ének · 121. oldal”, nem „ΟΔΥΣΣΕΙΑ · Ραψωδια ι · 121. oldal”

#### Scenario: Ugyanaz a részlet két anyagban
- **WHEN** egy magyar kurzuson a küklopsz-jelenetről kérdeznek, és a találatok között ott a magyar kiadás és a görög eredeti is
- **THEN** a válasz mindkettőt felkínálja: a magyar kiadás oldalát olvasásra, a görög oldalt eredetiként

#### Scenario: Csak az eredeti tartalmazza a versszámot
- **WHEN** a kérdés a sorszámra vonatkozik, és versszám csak a görög eredetiben van
- **THEN** a válasz a magyar kiadásra hivatkozik a tartalomért, és a görög eredetire a versszámért, kimondva, hogy a sorszám az eredeti kiadásé

#### Scenario: Két Odüsszeia a kártyán
- **WHEN** a válasz Homérosz Odüsszeiájára és Stephen Fry Odüsszeiájára is hivatkozik
- **THEN** a kártyákon „Homérosz: Odüsszeia” és „Stephen Fry: Odüsszeia” áll, Fry kártyáján a fejezetcímmel („A SZÖKÉS · 144. szakasz”)

#### Scenario: Görög eredeti kártyája magyar kurzuson
- **WHEN** a válasz a görög Odüsszeia 121. oldalára is hivatkozik egy magyar kurzuson
- **THEN** a linkszöveg „9. ének · 121. oldal”, a kártya „Ὅμηρος: ΟΔΥΣΣΕΙΑ · Ραψωδια ι · 121. oldal"

### Requirement: Élő válaszfolyam
A készülő válasz SHALL folyamatosan az adatbázisba íródni, és a diák felülete
élőben követni. A felület a kapcsolat elvesztését SHALL kimondani (ha 10
másodpercen belül nincs szerveradat, vagy a kapcsolat megszakad). Egy válasz
hibája a válaszüzenetre kerül hibaállapotként, egy emberi, magyar mondattal,
amely azt mondja meg, hogy a válasz nem készült el, és újrapróbálható; a
technikai részlet (a hiba típusa és szövege) MUST NOT a felhasználónak
megjelenni, hanem a szerver naplójába és a kérdésnapló bejegyzésébe kerül. A
600 másodpercnél régebben készülő, gazdátlan válaszokat a következő kérdés
hibásként lezárja.

#### Scenario: Megszakadt kapcsolat
- **WHEN** a diák hálózata megszakad válaszírás közben
- **THEN** a felület jelzi, hogy amit lát, elavulhat

#### Scenario: Modellhiba
- **WHEN** a válasz a modell szolgáltatójának hibája miatt nem készül el
- **THEN** a diák egy emberi mondatot és „Újrapróbálás” műveletet lát, a hiba típusát és szövegét nem; a kérdésnapló bejegyzése a hibarészletet tartalmazza

### Requirement: Beszélgetési előzmény
A válaszhoz a segéd SHALL megkapni a kérdés szülőláncának legfeljebb hat
utolsó körét (kérdés és kész, nem üres válasz párok).

#### Scenario: Visszautaló kérdés
- **WHEN** a diák a „jelolo_szakasz_02” utáni kérdésben „És a 04?”-et kérdez
- **THEN** a segéd az előző kérdés kontextusában értelmezi

### Requirement: Újragenerálás
A felhasználó SHALL egy válaszüzenethez új választ kérni ugyanarra a kérdésre;
az új válasz az eredeti mellé, ugyanahhoz a kérdéshez kerül. Nem létező vagy nem
válasz üzenetre, vagy kérdés nélküli válaszra a kérés MUST hibát adni. Az
újragenerálásra ugyanaz a jog-, fal- és anyagfeltétel vonatkozik, mint a
kérdésre, ugyanúgy kérdésként számít és naplózódik, és a kérdéshez hasonlóan
a hívás a készülő válasz rögzítése után, a válasz megvárása nélkül tér vissza.

A felület SHALL a legutóbbi tevékenység ágát mutatni: az új változatra (és egy
új kérdés válaszára) azonnal átvált, a készülő állapottal, újratöltéskor pedig a
legutoljára létrejött üzenet ága nyílik meg — akkor is, ha közben egy korábbi
kérdés válaszát fogalmaztatta újra.

#### Scenario: Másik megfogalmazás
- **WHEN** a diák „Másik megfogalmazás”-t kér
- **THEN** új válasz készül ugyanarra a kérdésre, és a napló új bejegyzést kap

#### Scenario: Korábbi válasz újrafogalmazása után tovább
- **WHEN** a diák az első válaszát újrafogalmaztatja, majd a második kérdés ágán folytatja és újratölti az oldalt
- **THEN** a második kérdés ága jelenik meg a legutóbbi válasszal, nem az első kérdés újrafogalmazott válasza

#### Scenario: Az új változat azonnal látszik
- **WHEN** a diák „Másik megfogalmazás”-t kér
- **THEN** a nézet azonnal az új változatra vált, amely készülő állapotban jelenik meg, a változatszámláló eggyel nő

### Requirement: Forrásnézet
Egy hivatkozásra kattintva a felület SHALL a chat mellett megnyitni a
forrásoldalt. A szerver a forrásoldalt ugyanazzal a joggal adja ki, mint a
kurzus megnyitását: a szolgáltató tanárának bármely állapotú kurzusnál, a
diáknak csak próba- vagy aktív hozzáféréssel és csak élő kurzusnál; jog nélkül
„ehhez a kurzushoz nincs hozzáférésed”, nem élő kurzusnál a diáknak „a kurzus
még nem élő” tiltást MUST adni. Ha a dokumentum már nem része a kurzusnak,
vagy az egység nem létezik, „ez a forrás már nem része a kurzusnak” vagy „a
forrásoldal nem található” „nem található” hibát MUST adni, a korábbi válasz
viszont megmarad. A forrásoldal a hely címét (fejezet vagy rész, ennek híján
az első címsor vagy a dokumentum címe), a nyomtatott oldalszámot, az oldal
szövegét a kinyomtatott oldalszám nélkül, a táblázatokat és a dokumentum címét
adja. Ha az egységnek képi feldolgozásból van oldalképe, a forrásoldal SHALL
az oldalkép legfeljebb egy óráig érvényes letöltési címét is megadni, és a
felület a képet a szöveg mellett megmutatja; más egységnél oldalkép nincs.

#### Scenario: Levett anyag hivatkozása
- **WHEN** a diák egy olyan régi válasz hivatkozására kattint, amelynek anyagát a tanár azóta levette
- **THEN** a felület kimondja, hogy a forrás már nem része a kurzusnak, a válasz megmarad

#### Scenario: Mobil forrásnézet
- **WHEN** a diák telefonon kattint egy hivatkozásra
- **THEN** a forrás alsó panelként nyílik meg, és Escape-pel vagy a háttérre koppintva bezárható

#### Scenario: Szkennelt oldal forrásnézete
- **WHEN** a diák egy képi feldolgozáson átment, szkennelt oldalra mutató hivatkozásra kattint
- **THEN** a forrásnézet a leírt szöveg mellett az oldal képét is mutatja

#### Scenario: Sima szöveges oldal
- **WHEN** a hivatkozott oldal nem ment képi feldolgozásra
- **THEN** a forrásnézet csak a szöveget mutatja, oldalkép nélkül

#### Scenario: Nem élő kurzus forrásoldala
- **WHEN** egy hozzáféréssel bíró diák egy archivált kurzus forrásoldalát kéri
- **THEN** a szerver „a kurzus még nem élő” tiltással elutasítja

### Requirement: Saját teszt-chat
A tanár SHALL a kurzus bármely állapotában, élesítés előtt is kipróbálni a
segédet a tanári kurzusoldalon, fal nélkül, ha a kurzusnak van legalább egy
kész egységű anyaga. Amíg nincs, a teszt-chat a kérdezőmező helyett azt
SHALL mutatni, hogy előbb anyag kell (feltöltve és feldolgozva), és MUST NOT
kérdést küldeni a szervernek. A tanár kérdései a naplóban saját tesztként
jelennek meg, a diák-kérdésszámba és a havi kérdésszámba nem számítanak.

#### Scenario: Teszt élesítés előtt
- **WHEN** a tanár a piszkozat kurzus teszt-chatjében kérdez
- **THEN** hivatkozott választ kap, és a napló „Saját teszt” bejegyzést mutat

#### Scenario: Anyag még feldolgozás alatt
- **WHEN** a kurzus egyetlen anyaga még feldolgozás alatt áll, és a tanár a teszt-chatet nyitja meg
- **THEN** a kérdezőmező helyén az „Előbb anyag kell” üzenet áll, és nyers szerverhiba nem jelenik meg

### Requirement: Kérdésnapló
Minden kérdés és újragenerálás SHALL naplóbejegyzést kapni a feltevéskor: kurzus,
felhasználó és cím, fajta (diák vagy saját teszt), beszélgetés és üzenet, a
kérdés, „készül” állapot, a kurzus aktuális anyagverziója és a modell. A válasz
végén a bejegyzés SHALL megkapni a válasz első 400 karakterét, a végállapotot
(kész vagy hiba), a megtagadás tényét, a hivatkozások számát és a
tokenfogyást, vagy azt, hogy a fogyás ismeretlen.

#### Scenario: Hibás válasz naplója
- **WHEN** a válasz a modell hibája miatt nem készül el
- **THEN** a naplóbejegyzés hibás állapotú, 0 hivatkozással

### Requirement: Kérdésnapló a tanárnak
A tanári kurzusoldal SHALL élőben listázni a kurzus naplóját a legfrissebb
elöl: idő, ki kérdezett (vagy „Saját teszt”), a kérdés, a válasz jellege
(készül, hiba, nincs az anyagban, vagy a hivatkozások száma) az anyagverzióval,
és a tokenfogyás, ha ismert.

#### Scenario: Megtagadott kérdés a naplóban
- **WHEN** egy diák anyagon kívüli kérdést tett fel
- **THEN** a tanár a naplóban „Nincs az anyagban” jelzést lát a kérdés mellett

### Requirement: Modell és offline mód
A segéd SHALL pontosan egy, beállításból választott modellel futni tartalék
nélkül: OpenAI-kulccsal OpenAI-modellel (alapból gpt-5-mini, minimális
gondolkodási szinttel), csak Anthropic-kulccsal Anthropic-modellel, kulcs
nélkül vagy determinisztikus módban offline tesztmodellel. A modell
hívásbeállításai beállítással felülírhatók; felülírás nélkül az OpenAI-modell
a minimális gondolkodási szintet kapja. A felület SHALL megmutatni, melyik
modell fut, és ha offline tesztmodell.

#### Scenario: Kulcs nélküli futtatás
- **WHEN** a szerver modellkulcs nélkül fut
- **THEN** a felület lábléce offline tesztmodellt jelez

#### Scenario: Alapbeállítás OpenAI-kulccsal
- **WHEN** a szerver OpenAI-kulccsal, modell- és hívásbeállítás megadása nélkül fut
- **THEN** a chatválasz a gpt-5-mini modellel, minimális gondolkodási szinttel készül

#### Scenario: Felülírt hívásbeállítás
- **WHEN** a hívásbeállítás kifejezetten alacsony gondolkodási szintet kér
- **THEN** a chatválasz az alacsony szinttel készül, a minimális alapérték helyett

### Requirement: Kép csak képi oldalra
A segéd MUST NOT azt állítani, hogy egy helyen kép, ábra, illusztráció vagy
rajz van, hacsak a hivatkozott találat nem képi feldolgozáson átment oldal
(vizuális jelölésű vagy oldalképpel rendelkező találat). Ha a kérdés képre
vonatkozik, és ilyen találat nincs, a segéd kimondja, hogy az anyagban nem
talált ilyen képet.

#### Scenario: Szöveges oldal nem illusztráció
- **WHEN** a diák „van kép hajózásról?” kérdésére csak szöveges oldalak a találatok
- **THEN** a válasz nem ígér illusztrációt, és kimondja, hogy képet nem talált

#### Scenario: Képi oldal
- **WHEN** a találat egy képi feldolgozáson átment képregényoldal, amelynek leírásában hajó szerepel
- **THEN** a válasz a képet leírja, és arra az oldalra hivatkozik

### Requirement: Keresés a kurzus nyelvén
A segéd a keresőt SHALL a kurzus nyelvén hívni: ha a kérdés más nyelvű, a
keresőkifejezést a kurzus nyelvére fordítja. A keresés a kurzus nyelvű
szövegben talál: a kurzus nyelvével egyező anyagnál az eredetiben, eltérő
nyelvű anyagnál a kurzus nyelvű keresőpéldányában. Egy idegen nyelvű anyag
találata a modell elé az eredeti szöveget adja, a kurzus nyelvű felirattal és
az egység nyelvével a metaadatban; a fordítás nem jut a modellhez.

#### Scenario: Magyar kérdés görög anyagban
- **WHEN** a diák magyarul kérdez Argoszról egy magyar kurzusban, amelyen a görög Odüsszeia magyar fordítása elkészült
- **THEN** a kereső a görög mű megfelelő oldalát is megtalálja, és a modell az eredeti görög szöveget látja, magyar helyfelirattal

#### Scenario: Angol kérdés magyar kurzusban
- **WHEN** a diák angolul kérdez egy magyar kurzusban
- **THEN** a segéd a keresőt magyar kifejezéssel hívja

### Requirement: Hivatkozás a felvétel időpontjára
Hang- vagy videóanyagból vett állításnál a hivatkozás SHALL az átiratdarabra
mutatni, a linkszöveg a felvétel időpontja, ahol az állítás elhangzik
(`perc:másodperc`, egy óránál hosszabb felvételnél `óra:perc:másodperc`), és a
felvétel címe a helyhez tartozik; fájlnév és belső azonosító nem kerül a
válaszba.

#### Scenario: Előadásból vett válasz
- **WHEN** a diák egy fogalomról kérdez, amelyet az előadás 12:34-nél magyaráz
- **THEN** a válasz a „12:34” linkkel hivatkozik a felvétel megfelelő darabjára

### Requirement: Lejátszó a forrásnézetben
Egy felvétel-darabra mutató hivatkozásnál a forrásoldal SHALL az átirat-részlet
mellett a felvétel legfeljebb egy óráig érvényes lejátszási címét is megadni, és
a felület hang- vagy videólejátszót mutatni, amely a hivatkozott időpontnál
indul. A lejátszó jog szerint ugyanúgy védett, mint a forrásoldal.

#### Scenario: Ugrás az időpontra
- **WHEN** a diák a „12:34” hivatkozásra kattint
- **THEN** a forrásnézetben a videó 12:34-nél indítható, mellette az átirat-részlet

#### Scenario: Levett felvétel
- **WHEN** a hivatkozott felvételt a tanár levette a kurzusról
- **THEN** a forrásnézet kimondja, hogy a forrás már nem része a kurzusnak, lejátszó nincs

### Requirement: A gépi fordítás láthatatlan
A kurzus nyelvére készült gépi fordítás kizárólag a megtalálást szolgálja.
MUST NOT a modellhez jutni a találat szövegeként, MUST NOT a forrásnézetben
megjelenni, és MUST NOT hivatkozás célja lenni: a hivatkozás mindig a forrás
saját egységére mutat, és a forrásnézet a forrás saját szövegét mutatja. Amit a
diák a kurzus nyelvén a kurzus anyagából olvashat, az valódi, feltöltött
kiadás, nem gépi fordítás.

#### Scenario: Görög oldal magyar kurzuson
- **WHEN** a diák megnyitja egy görög anyag hivatkozott oldalát egy magyar kurzuson
- **THEN** a görög szöveget látja, gépi fordítás nélkül

#### Scenario: A találat a keresőoldalon keletkezett
- **WHEN** a magyar kérdés a görög oldal kurzusnyelvű keresőoldalán talál
- **THEN** a hivatkozás a görög oldalra mutat, és a modell a görög szöveget kapja

### Requirement: Idézet a kérdés nyelvén
A válasz a kérdés nyelvén SHALL állni, és ha idéz az anyagból, az idézet is a
kérdés nyelvén SHALL megjelenni: idegen nyelvű forrásnál a segéd saját
megfogalmazásában, kimondva, hogy ez az ő fordítása, nem egy kiadás szövege. Ha
a kurzusnak van a kérdés nyelvén álló anyaga is ugyanarról a helyről, az idézet
SHALL annak a szövegéből jönni, és a hivatkozás is arra menni.

#### Scenario: Görög idézet magyar kérdésre
- **WHEN** a diák magyarul kérdez, és csak a görög eredeti tartalmazza a részletet
- **THEN** az idézet magyarul áll, a segéd saját fordításaként megnevezve, a hivatkozás a görög oldalra

#### Scenario: Van magyar kiadás is
- **WHEN** ugyanaz a részlet a kurzus magyar kiadásában is megvan
- **THEN** az idézet a magyar kiadás szövege, és a hivatkozás arra az oldalra megy
