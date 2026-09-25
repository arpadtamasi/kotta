---
id: D-01m0fp20dxr4vp5q8gw48n6dqf
title: >-
  A kotta a megállapodás, a task a munka — spec-first működés, fedettség-alapú
  kapuk
date: '2026-08-20'
---
# D-01m0fp20dxr4vp5q8gw48n6dqf — A kotta a megállapodás, a task a munka — spec-first működés, fedettség-alapú kapuk

## Decision

Négy összefüggő irány, egy modellként:

1. **A szótár módosul: a munkaegység neve `task`.** Az `observation` és a `batch` marad. Ez a
   D-px6n2p85 egy pontját szűkíti: az ottani érv — „a contract megállapodás, a task csak munka,
   a task gyengítené a terméket a saját állításában" — a spec-névtér megjelenésével megfordult.
   A megállapodást most már **a spec, maga a kotta hordozza**: goalok, business rule-ok,
   quality attribute-ok, példák, acceptance. A munkaegység így őszintén lehet task: egy tétel
   eljátszása a kottából.

2. **Spec-first.** A base branchen lévő spec az elfogadott megállapodás — a shaping szabad, a
   base-re kerülés az elfogadás. Az observation konstruktív kijárata elsősorban a
   spec-módosítás (új diszpozíció: `amend-spec`); a taskok az elfogadott spec és a futó
   rendszer réséből születnek.

3. **A task csak elfogadott specet hajt végre — megállapodást soha nem hoz létre.** Ha a
   végrehajtás olyasmit akar, ami nincs a fedezetében, observationt hoz létre, és onnan a
   humán vonal dönt (validálás → diszpozíció → spec-módosítás vagy decision). Nincs
   „fedezetlen task teljes ceremóniával" sáv: vagy fedett a task, vagy előbb a spec módosul.

4. **A kapu-súly a spec-fedettségből jön, nem külön súlymezőből.** A define ellenőrzi a
   fedettséget; fedett tasknál a sign implicit — a megállapodás akkor történt meg, amikor a
   spec a base-re került; **egy emberi kapu marad: a zárás**, evidence az acceptance-szel
   szemben. Az observation-diszpozíció, a decision, a cancel és a reopen emberi kapu marad.
   Minden jóváhagyás **rögzül az entitáson** (`approved_by`, `approved_at`, `approval_basis`)
   — a rögzítés teszi a kaput valódivá és a chat-relayt auditálhatóvá.

## Context

2026-08-20. A 81 nyitott observation mintázata két oldalról ugyanazt a hibát mutatta: a
ceremónia, ami nem ellenőriz semmit, egyszerre kényelmetlen és hamis biztonság. Az „egy
műszer" lelet (F-tsb4m5qh): egy kétperces oldal és egy sémamigráció ugyanazt az öt lépést és
két emberi kaput fizeti, minden profil csak nehezít. Az `--approve` kapu (F-md9f1zcv):
semmi nem rögzíti, hogy jóváhagyás történt. Az observationnek nincs kijárata a specbe
(F-f5c4wer9): 45 resolved observationből 43 contractba torkollott, mert nincs más konstruktív
ajtó — a rendszer contractokat termel a contractokról. Az evidence-t a mennyiség elégíti ki,
nem az illeszkedés (F-018).

Az operátor iránya a beszélgetésben: „az új szituációban — hogy van spec — a task a jó
[név] a mostani contractra, mert intuitív", és „ha a task valamit akar, observationt hoz
létre és onnan megy a humán vonal". A cél-spec elve: **minden kapu vagy valódit ellenőriz,
vagy nincs** — a kényelem és a minőség ugyanabból a mechanizmusból jön.

## Consequences

- **Először a spec változik** (ez a shaping-kör írja át), a kód, a CLI, az MCP, a board és a
  skillek a spec-résből generált taskokként követik — ez adja a refaktor sorrendjét is.
- A contract → task a harmadik nagy átnevezés ugyanazokon a fájlokon; a D-010 mintája áll:
  a meglévő azonosítók örökre maradnak, olvasási kompatibilitás legalább egy verzión át.
- Az `amend-spec` diszpozíció és az `approved_by`/`approved_at`/`approval_basis` mezők új
  képességek — amíg nem léteznek, a 81 nyitott observation triázsa várhat rájuk, vagy a
  meglévő úton megy.
- A D-px6n2p85 többi pontja — observation, batch, a kind mező elhagyása, ready → defined —
  érvényben marad; csak a contract → task pont fordul meg, az ott még hiányzó spec-névtér
  miatt.
- A négy AGENTS.md-t hordozó szomszéd repo és a skillek szövege a rename-mel együtt frissül,
  egy körben, hogy a jóváhagyási szabály ne éljen több példányban eltérően.
