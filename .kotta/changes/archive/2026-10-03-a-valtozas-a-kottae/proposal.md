# A változás a Kottáé, az OpenSpec opcionális

## Why

Az 1.0.0-alpha.3 kiadás a modell előtt ment ki: a kód és a szabályok már azt csinálják, amit ez a
változás leír, az elfogadott modell viszont nem tud róla. Ez a változás hozza be a modellbe, amit a
kiadás szállított — és semmi mást.

A kiadás oka: ugyanarra a kérésre („kérek egy specet") két projektben két rossz eredmény született.
Az egyikben az ügynök OpenSpec-mappát hozott létre a semmiből, mert a szabály szerint a változás az
`openspec/changes/` alatt él; a másikban szabad `SPEC.md` lett, ami sosem vált változássá. Az
üzemeltető szerint a Kottában az OpenSpecet nem kell megtartani, csak mint lehetséges alapot; a
tiltás pedig, hogy „openspec/ mappát soha ne hozz létre", maga is csapda, mert a megnevezés hozza
elő azt, amit tilt.

## What changes

- **Új szabály — A proposal opens as a change in the workspace:** minden javaslat a
  `.kotta/changes/<név>/` alatt, `kotta change new`-val nyílik; a workshopok ide rajzolnak, nem az
  elfogadott specbe.
- **Új szabály — OpenSpec is an optional narrative:** `narrative: none | generated | authored`,
  alapból `none`; a SHALL/MUST csak megtartott narratívánál kötelező.
- **Új szabály — The rules name nothing an agent should not reach for:** a szabályfájl, a skillek és
  az MCP-utasítás nem nevez meg olyat, amihez az ügynöknek nem kell nyúlnia, tiltásként sem.
- **Módosul — Migrate a workspace:** a migráció a v6-os munkaterületről is kiviszi a változásokat
  az OpenSpec mappájából.
- **Módosul — Say when the code runs ahead of the spec → The code never runs ahead of the spec:**
  jelzésből tiltás lesz: az ügynök ígéretet érintő kódot csak jóváhagyott változás után ír, előbb
  megnyitja a változást. Vele módosul két példa (*Code ahead of the model is named in one line →
  A promise the model does not state opens a change first*, *Building an approved change needs no
  signal*), és kikerül belőlük az OpenSpec-skill.
- Öt új példa a fenti szabályokhoz.

Nem része: a board és a nyitott változások (külön változás), a modell egyéb elavult részei (a
„The read-only board" leírása még feladatokat és observationöket említ; „The workspace file format"
még a process-névteret).

## Open decisions

Nincs: a kód soha nem előzi meg a specet (válasz: 1a, 2026-10-03).
