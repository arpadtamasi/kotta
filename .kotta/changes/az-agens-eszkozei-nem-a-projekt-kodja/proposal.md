# Az ügynök eszközei nem a projekt kódja

## Why

A health-ai projektben a `kotta gap` 145 „specifikáció nélküli kényszer" találatából 141 a
`.claude/skills/gstack/` alól jön: egy bemásolt, idegen skill-készlet kódjából. A jelentés azt
kérdezi, mit kényszerít ki a projekt kódja specifikáció nélkül, és erre a válasz négy sor lenne;
a többi zaj. Ugyanez a könyvtár bizonyítéknak is számítana, ha egy fájlja megnevezne egy elemet.

Az első javaslat egy újabb kizárt forrás volt (`.claude/`, `.codex/`). Az operátor, 2026-10-03:
„de tiltás helyett inkább azt kéne megmondani, hogy miben igen", és: „a determinisztikus tiltás
mindig rossz lesz". Egy rögzített tiltólista mindig lemarad valamiről, amit egy projekt a repóban
tart; a projekt viszont tudja, hol van a saját kódja.

## What changes

- **Új szabály: *Evidence is sought where the project says its code is*.** A `kotta gap` (és az MCP
  `gap_report` eszköze) paraméterben kapja meg, hol van a projekt kódja és tesztje: `--in src --in
  tests`. A hívó ügynök adja meg. Megadva csak ott keres bizonyítékot és specifikáció nélküli
  kényszert; paraméter nélkül az egész repót olvassa, mint eddig (az operátor: „1a"). A jelentés feje
  megmondja, hol olvasott. A hat mai kizárt forrás a megadott útvonalakon belül is kizárt marad.
- **Az archive nem kapja meg** (az operátor: „2b"): a change bizonyítékát továbbra is az egész
  repóban keresi.
- **Új példa**: *A vendored skill is neither evidence nor unspecified enforcement*.

Ami marad: a bizonyíték továbbra is hivatkozás; a `kotta modules` nem változik.

## Open decisions

Nincs: a forrás a paraméter, paraméter nélkül a mai viselkedés, az archive nem kapja meg.
