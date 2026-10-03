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

- **Új szabály: *Evidence is sought where the project says its code is*.** A bizonyítékot és a
  specifikáció nélküli kényszert a `kotta gap` és a `kotta modules` ott keresi, ahol a projekt
  megmondja, hogy a kódja és a tesztjei vannak; ami azon kívül esik, nem számít. A jelentés feje
  megnevezi, hol olvasott.
- **Új példa**: *A vendored skill is neither evidence nor unspecified enforcement*.

Ami marad: a bizonyíték továbbra is hivatkozás (az elem azonosítója a kódban).

## Open decisions

- Ki mondja meg, hol a kód; mi történik, amíg nincs megmondva; és mi lesz a mai hat kizárt
  forrással. (Az új szabályban.)
