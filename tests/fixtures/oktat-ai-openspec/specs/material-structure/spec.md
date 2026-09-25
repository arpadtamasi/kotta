# material-structure Specification

## Purpose
A diák a helyet a könyv saját nyelvén lássa („Kilencedik ének · 99. oldal”),
ne fájlnévként: ez a képesség rögzíti a feldolgozott PDF címének, fejezeteinek
és nyomtatott oldalszámainak kiolvasását és ellenőrzését.

## Requirements

### Requirement: Mikor fut a szerkezet kiolvasása
A szerkezetet a feldolgozás SHALL kiolvasni, amikor egy dokumentum kész vagy
részben kész, és újra, ha a kész egységek száma azóta változott (pl.
megérkezett a képi feldolgozás). Csak PDF-oldal egységek vesznek részt benne; a
DOCX-szakasz és a PPTX-dia megtartja a saját helyét, az EPUB-szakasz pedig a
könyv tartalomjegyzékéből kapott fejezetcímét.

#### Scenario: Képi eredmény után
- **WHEN** egy dokumentum képi oldalai később készülnek el
- **THEN** a szerkezet a friss oldalakkal újra kiolvasásra kerül

#### Scenario: DOCX
- **WHEN** a dokumentum DOCX
- **THEN** az egységek helye „N. szakasz” marad

#### Scenario: EPUB
- **WHEN** a dokumentum EPUB
- **THEN** a szakaszok a könyv tartalomjegyzékének fejezetcímét viselik, a hely „N. szakasz”

### Requirement: Javaslat modellel vagy szabályokkal
A szerkezetre SHALL javaslat készülni az oldalak első soraiból, utolsó sorából,
az első oldalak szövegéből és a PDF saját metaadataiból. OpenAI-modell mellett
a modell javasol, és amit kihagy (fejezet, oldalszámozás, cím, szerzők,
közreműködők, nyelv), azt a szabályalapú felismerő pótolja; modell nélkül vagy
modellhiba esetén csak a szabályalapú felismerő fut. A szabályalapú felismerő
magyar („Kilencedik ének”, „3. fejezet”, „IV. rész”) és angol vagy német
(„Chapter 9”, „Kapitel 3”) címsort, tartalomjegyzéket és „Fordította:”
közreműködőt ismer fel.

#### Scenario: Modellhiba
- **WHEN** a szerkezet-javaslat modellhívása hibát ad
- **THEN** a szabályalapú felismerő eredménye kerül felhasználásra, és a feldolgozás nem bukik el

### Requirement: Csak az marad, amit a szöveg igazol
A javaslatból az ellenőrzés SHALL csak azt megtartani, amit az oldalak szövege
alátámaszt:
- nyomtatott oldalszám csak akkor érvényes egy oldalra, ha a javasolt szám az oldal első vagy utolsó sorában ott áll; a számozás egésze csak akkor marad meg, ha legalább max(3, oldalszám/2) oldalon igazolt, különben egyetlen oldalszám sem marad;
- fejezetkezdet csak ott, ahol a címsor az oldal elején áll; ha a javasolt oldalon nincs ott, a legközelebbi olyan oldal lesz a kezdet, ahol ott van; tartalomjegyzék oldala nem lehet kezdet; egy oldalra két kezdet esetén az elsőként felsorolt marad;
- egy fejezet a következő kezdete előttig, az utolsó a következő nem törzsszöveg rész (pl. jegyzetek) előttig vagy a dokumentum végéig tart;
- a fejezet címe az oldalon ténylegesen álló sor, a csupa nagybetűs címsor mondatszerű alakban.

#### Scenario: Elszámolt kezdőoldal
- **WHEN** a modell a Kilencedik ének kezdetét a 97. oldalra teszi, de a címsor a 98. oldal elején áll
- **THEN** a fejezet a 98. oldalon kezdődik

#### Scenario: Nem igazolt oldalszámozás
- **WHEN** a javasolt oldalszámok csak két oldalon állnak ténylegesen ott
- **THEN** a dokumentum nyomtatott oldalszám nélkülinek számít

### Requirement: Megjelenített hely
Minden PDF-oldal egység SHALL megjelenített helyet kapni: a fejezet címe (vagy
fejezeten kívül a rész neve, pl. „Tartalomjegyzék”), utána a nyomtatott
oldalszám „N. oldal” alakban, pont-középponttal elválasztva. Ha a dokumentumban
egyáltalán nincs igazolt nyomtatott oldalszám, az oldalszám helyén „PDF N.
oldal” áll, hogy ne keverjék össze a nyomtatottal.

#### Scenario: Fejezet és oldalszám
- **WHEN** a 99. nyomtatott oldal a Kilencedik énekben van
- **THEN** a hely „Kilencedik ének · 99. oldal”

#### Scenario: Nyomtatott oldalszám nélkül
- **WHEN** a PDF-ben nincs nyomtatott oldalszám, és az 5. oldal nem tartozik fejezethez
- **THEN** a hely „PDF 5. oldal”

### Requirement: Dokumentum-szintű szerkezet
A dokumentumra SHALL rákerülni a felismert cím, szerzők, közreműködők (magyar
szerepnévvel), a fejezetek és részek oldaltartománya, az oldalszámozás helye
és lefedettsége, a nyelv és az, hogy modell vagy szabály ismerte fel. Ha van
felismert cím, az a dokumentum címe lesz a fájlnév helyett.

#### Scenario: Cím a fájlnév helyett
- **WHEN** a `scan_0042.pdf` címlapja szerint a mű „Odüsszeia”
- **THEN** a tanár anyaglistáján és a forrásnézetben „Odüsszeia” szerepel
