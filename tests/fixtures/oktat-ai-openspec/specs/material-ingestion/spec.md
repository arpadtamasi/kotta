# material-ingestion Specification

## Purpose
A feltöltött anyag a háttérben, időkorlát nélkül válik kereshető egységekké:
ez a képesség rögzíti a formátumonkénti egységeket, a láncolt feldolgozást, az
index kitételét, a helyreállást és az oldalak könyvelését.

## Requirements

### Requirement: Egységek formátumonként
A feldolgozás az anyagot SHALL olvasható, visszakereshető egységekre bontani,
amelyek mindegyike megjeleníthető helyet hordoz:
- PDF: oldalanként egy egység;
- DOCX: címsor-stílusú bekezdésenként induló szakaszok; címsor nélkül nagyjából 1800 karakterenként vágott szakaszok; a táblázatok soronként a szakasz részei; a hely „N. szakasz”;
- PPTX: diánként egy egység a címmel, a szövegdobozokkal, a táblázatokkal és „Jegyzet:” előtaggal a előadói jegyzettel; a hely „N. dia”;
- EPUB: a könyv olvasási sorrendjében fejezetenként induló szakaszok, a hosszú fejezet nagyjából 1800 karakterenként bekezdéshatáron vágva; a szakasz a fejezet címét viseli (a könyv tartalomjegyzékéből, ennek híján az első címsorból); a képek alt-szövege „[Kép: …]” bekezdésként a szöveg része; a hely „N. szakasz”;
- hang és videó: a hangsáv legfeljebb 5 perces, 30 másodperccel átfedő darabjai, mindegyik a saját időbélyeges átiratával; a hely a darab időtartománya (pl. „12:30–17:30”), a hivatkozási horgony a felvétel időpontja; a videó képi tartalma nem kerül feldolgozásra.
Az üres szakasz MUST NOT egységet adni; beszéd nélküli darab üres, hibás egység.

#### Scenario: Diák jegyzettel
- **WHEN** egy PPTX második diáján előadói jegyzet van
- **THEN** a második egység szövege a jegyzetet is tartalmazza, a helye „2. dia”

#### Scenario: Címsor nélküli Word-jegyzet
- **WHEN** egy húszoldalas DOCX-ben nincs címsor
- **THEN** több szakaszegység keletkezik, nem egyetlen

#### Scenario: Könyv epubként
- **WHEN** egy epub tartalomjegyzéke szerint a harmadik fejezet „A küklopsz”, és a fejezet 5000 karakter
- **THEN** a fejezetből több szakasz keletkezik, mindegyik „A küklopsz” szakaszcímmel, a könyv sorrendjében

#### Scenario: 12 perces felvétel
- **WHEN** egy 12 perces MP3 kerül feldolgozásra
- **THEN** három darab keletkezik (0:00–5:00, 4:30–9:30, 9:00–12:00), mindegyik időbélyeges átirattal

#### Scenario: Videó hangsáv nélkül
- **WHEN** egy MP4-nek nincs hangsávja
- **THEN** a feldolgozás „nincs hangsáv” okkal bukik el

### Requirement: Háttérben, időkeretes lépésekben
A feltöltés után a feldolgozás SHALL a háttérben, dokumentumonként láncolt
lépésekben futni. Egy lépés a beállított időkeretig (alapból 180 másodperc)
dolgozik; ha marad munka, azonnal ütemezi a következő lépést. Egy lépés
megszakadása után a következő SHALL ott folytatni, ahol az előző abbahagyta. A
lépés hibáját a futtató legfeljebb ötször próbálja újra.

#### Scenario: Nagy PDF
- **WHEN** a feldolgozás egy lépés időkereténél tovább tart
- **THEN** a dokumentum több egymást követő lépésben készül el, és egyik lépés sem ütközik időkorlátba

### Requirement: Dokumentumállapot
Minden dokumentum SHALL a tanár által olvasható állapotot hordozni: státusz
(várakozik, fut, kész, részben kész, sikertelen), fázis, százalék, kész, összes
és hibás egységek száma, és sikertelenségnél hibakód.

#### Scenario: Hibás oldalak
- **WHEN** egy PDF néhány oldala nem dolgozható fel
- **THEN** a dokumentum „részben kész” lesz a hibás egységek számával, a többi oldal kereshető

### Requirement: Szolgáltatónként elkülönített keresőindex
Minden szolgáltató kész egységei SHALL a szolgáltató saját keresőindexébe
kerülni: valódi modellkulccsal a saját indexbe (darabok és vektoraik a
szolgáltató ágában, lásd `search-index`), kulcs nélkül vagy emulátoron
folyamaton belüli lexikális indexbe. Egy szolgáltató keresése MUST NOT más
szolgáltató anyagát visszaadni.

#### Scenario: Tenant-izoláció
- **WHEN** két szolgáltató ugyanarra a szóra keres
- **THEN** mindegyik csak a saját anyagából kap találatot

### Requirement: Index kitétele lépésenként egyszer
A kész egységeket a feldolgozás SHALL egyszerre tenni ki az indexbe, amikor egy
lépésben elfogy a munka, nem egységenként. Ha a lépés ekkor már 60
másodpercnél tovább dolgozott, a kitétel egy friss lépésben fut. A kitétel
idempotens, és a dokumentumon rögzíti a kereshető egységek számát és idejét.
Minden kitett egység kereshető szövege elé a dokumentum címe és az egység
helye kerül („cím · hely”).

#### Scenario: Kereshetőség késése
- **WHEN** a feldolgozás kész, de a kitétel még nem futott le
- **THEN** a kereshető egységek száma kisebb a késznél, és a tanár „Kereshetővé tétel” állapotot lát

#### Scenario: Fejezetcímre keresés
- **WHEN** a diák a „Kilencedik ének” kifejezésre kérdez
- **THEN** a kereső a fejezet oldalait is megtalálja, mert a hely a szöveg elején áll

### Requirement: Ütemezési hiba látható
Ha a következő lépés ütemezése nem sikerül, a feltöltés MUST NOT elbukni, de a
szerver SHALL az okot a dokumentumra írni, ahol a tanár látja; a következő
sikeres ütemezés a jelzést törli.

#### Scenario: Sikertelen ütemezés
- **WHEN** a feladatsor nem fogadja a folytatást
- **THEN** a tanár az anyagnál „Elakadt” jelzést lát az okkal

### Requirement: Elakadt feldolgozás felélesztése
Ha egy várakozó vagy futó dokumentum legalább 600 másodperce nem változott, és
ugyanazt a tartalmat újra feltöltik, a szerver SHALL a feldolgozás folytatását
ütemezni.

#### Scenario: Újrafeltöltés elakadás után
- **WHEN** egy dokumentum feldolgozása egy leállt példány miatt tíz perce áll, és a tanár újra feltölti a fájlt
- **THEN** a feldolgozás folytatódik ott, ahol abbamaradt

### Requirement: Várakozás kötegre
Ha a dokumentum egy beadott képi kötegre vár, a feldolgozás SHALL a legkorábbi
esedékes időpontra ütemezni a következő lépést, és addig a dokumentum
feldolgozás alatt marad.

#### Scenario: Nyitott köteg
- **WHEN** a dokumentum oldalai képi kötegre várnak
- **THEN** a dokumentum „fut” állapotú marad, és a köteg lekérdezése a poll-idő után újra megtörténik

### Requirement: Oldalak könyvelése egyszer
Amikor egy dokumentum feldolgozása kész vagy részben kész, a szerver SHALL a
dokumentum összes egységének és képi egységeinek számát pontosan egyszer a
szolgáltató havi használatára könyvelni, akárhány további lépés fut még a
dokumentumon.

#### Scenario: Ismételt folytatás
- **WHEN** egy kész dokumentumon még egy lépés lefut
- **THEN** az oldalak nem könyvelődnek másodszor

### Requirement: Kereshető anyag a chatnek
A kurzus-chat számára egy dokumentum SHALL akkor számítani feldolgozottnak,
ha legalább egy egysége kész; ehhez a feldolgozás teljes befejezése és az index
kitétele nem feltétel.

#### Scenario: Részben kész anyag
- **WHEN** egy PDF első oldalai készek, a többi még fut
- **THEN** a diák már kérdezhet a kurzusban

### Requirement: Nyelvfelismerés
A feldolgozás SHALL felismerni és a dokumentumon rögzíteni az anyag fő
nyelvét kétbetűs ISO 639-1 kóddal, minden formátumnál, a feldolgozás végén. Ha
a nyelv nem ismerhető fel, a dokumentum nyelve ismeretlen, és nem fordítódik.

#### Scenario: Görög szöveg
- **WHEN** egy ógörög nyelvű PDF feldolgozása befejeződik
- **THEN** a dokumentum nyelve `el`

### Requirement: Fordítás a kurzus nyelvére
Ha egy kész dokumentum nyelve eltér valamelyik kurzusnak a nyelvétől, amelyen
az anyag szerepel, a feldolgozás SHALL a dokumentum szöveges egységeit
lefordítani az adott kurzus nyelvére, a háttérben, időkeretes, folytatható
lépésekben, és a lefordított egységeket külön keresőpéldányként a keresőindexbe
tenni, az eredeti egységre mutatva. Ugyanez a lépés a dokumentum címét, a
szerzők nevét és a szakaszcímeket is lefordítja, hogy a hivatkozás felirata a kurzus nyelvén
álljon; a szakasz számozása arab számmal jelenik meg („9. ének”).
A fordítás MUST NOT felülírni az eredeti szöveget. Egy egység egy nyelvre
egyszer fordítódik; ugyanaz a dokumentum több kurzusban több nyelvre is
fordítódhat. A fordítás a kurzusra felvett anyagnál, a kurzus nyelvének
változásakor és a feldolgozás befejezésekor indul.

#### Scenario: Görög anyag magyar kurzusra
- **WHEN** a görög Odüsszeia feldolgozása kész, és az anyag egy magyar kurzuson szerepel
- **THEN** mind a 333 oldal magyar fordítása elkészül, és a fordítás szövege is kereshető

#### Scenario: Azonos nyelv
- **WHEN** egy magyar anyag magyar kurzusra kerül
- **THEN** nem készül fordítás

#### Scenario: Megszakadt fordítás
- **WHEN** a fordítás egy lépés időkeretén túl tart
- **THEN** a következő lépés a még le nem fordított oldalaknál folytatja

#### Scenario: Görög szerző magyar kurzuson
- **WHEN** a görög Odüsszeia szerzője „Ὅμηρος”, és az anyag magyar kurzuson szerepel
- **THEN** a modell a találat metaadatában a „Homérosz” szerzőnevet kapja

### Requirement: A könyv saját adatai
Egy EPUB feltöltésekor a dokumentum címe, szerzői és nyelve SHALL a könyv saját
adataiból (OPF metaadat) kerülni a dokumentumra, ha ott szerepelnek.

#### Scenario: Szerző a metaadatban
- **WHEN** az epub szerzője „Stephen Fry”, címe „Odüsszeia”
- **THEN** a dokumentum címe „Odüsszeia”, szerzői között „Stephen Fry” áll, és a modell ezt a metaadatban kapja
