# Az ügynök eszközei nem a projekt kódja

## Why

A health-ai projektben a `kotta gap` 145 „specifikáció nélküli kényszer" találatából 141 a
`.claude/skills/gstack/` alól jön: egy bemásolt, idegen skill-készlet kódjából. A jelentés azt
kérdezi, mit kényszerít ki a projekt kódja specifikáció nélkül, és erre a válasz négy sor lenne;
a többi zaj, amely miatt a jelentést nem olvassa senki. Ugyanez a könyvtár bizonyítéknak is
számítana, ha egy fájlja véletlenül megnevezne egy elemet. Az operátor a felsorolt hibákra,
köztük erre, 2026-10-02: „csináld".

## What changes

- **Az ügynök-host könyvtárai kizárt források.** A repó gyökerében lévő, az ügynök-host által
  olvasott könyvtár - skillek, beállítások, hookok - nem a projekt kódja: sem bizonyítékot nem
  keres benne a `kotta gap` és a `kotta modules`, sem specifikáció nélküli kényszert. Módosul az *A
  copy of the specification is not evidence* szabály.
- **A jelentés megnevezi az új osztályt** (`agent-tooling`), ahogy a többi kizárt forrást: módosul
  a *The report names what it did not count* szabály (hat osztály helyett hét).
- **Új példa**: *A vendored skill is neither evidence nor unspecified enforcement*.

Ami marad: a kizárás továbbra is ismert helyeket nevez meg, nem könyvtárnév-mintát; a projekt saját
`skills/` könyvtára (ahogy ebben a repóban is) kód marad.

## Open decisions

- Mely könyvtárak számítanak az ügynök eszközeinek: a gyökérben lévő `.claude/` és `.codex/`
  egészében (az operátor válasza 2026-10-03-án: „a").
