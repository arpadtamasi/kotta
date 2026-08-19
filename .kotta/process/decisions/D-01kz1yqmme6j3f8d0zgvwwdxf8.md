---
id: D-01kz1yqmme6j3f8d0zgvwwdxf8
title: Emberi hivatkozás a prózában a cím; a CLI marad gépi nyelv
date: '2026-08-02'
---
# D-01kz1yqmme6j3f8d0zgvwwdxf8 — Emberi hivatkozás a prózában a cím; a CLI marad gépi nyelv

## Decision

**Prózában — chatben, jelentésben, review-evidenciában, commit-üzenet törzsében — az entitásra a CÍMÉVEL hivatkozunk**, nem a nyers azonosítóval. A rövid id-farok csak akkor kerül mellé, ha tényleg meg kell különböztetni: *„A board átállítása a Kotta Console v2 tervre (`a0bv0fcq`)"*.

Az operátor is bármely felismerhető cím-töredékkel hivatkozhat egy ticketre; az ágens feloldja cím szerinti kereséssel, és csak akkor kérdez vissza, ha kettő is illik.

**A CLI ezzel szemben gépi felület, és az is marad.** A parancsok bemenete a teljes azonosító; a kimenet, a fájlnevek, a frontmatter és az `index.md` a nyers azonosítót hordozzák. Ezeket nem szépítjük.

Ez a döntés a D-003 „human reference = title" felét mondja ki a gyakorlat nyelvén, és **szűkíti az F-013-at**: annak az a fele, amely a CLI-kimenetet is `cím · azonosító` alakra vinné, elesik. Az F-013-ból az agent- és prózai felületek maradnak.

## Context

2026-08-02. A T-034 óta az újonnan mintázott azonosítók 26 karakteres ULID-ok (`T-01kz1xrxw4aheeqv1ca0bv0fcq`). A D-003 már 2026-07-26-án kimondta, hogy a gépi identitás az azonosító, az emberi hivatkozás a cím — mégis végig a nyers ULID-dal hivatkoztam a ticketekre a beszélgetésben, amíg az operátor szóvá nem tette. Egy 26 karakteres azonosító nem kimondható és nem felismerhető; minden említése visszakeresést kényszerít, ami pontosan az a fájdalom, amit az F-012 és az F-013 mért.

Az operátor döntése a CLI-ről: *„a cli gépi nyelv"* — ott a nyers azonosító nem hiba, hanem a helyes alak.

## Consequences

- Az ágens-jelentések, a review-evidenciák és a chat-válaszok címmel hivatkoznak; a CLI-hívások a teljes azonosítóval.
- Az F-013 diszpozicionálásakor a CLI-kimenetre vonatkozó pontja elesik; ami marad, az az agent/prózai réteg és az `index.md` olvashatósága.
- A markdown H1 kérdése ettől független és nyitva marad: a `# <id> — <cím>` fejléc se nem CLI-kimenet, se nem próza, hanem a fájl teteje. Külön finding fedi.
- A skillek szövege igazítható, de a tapasztalat szerint ez nem elég: a D-009-et is leírtuk, aztán öt ticket a koordinátor kontextusában készült el, és az operátor vette észre, nem a szerszám. Ez a döntés is konvenció marad, amíg valami ki nem kényszeríti.
- Ára: a cím változhat, az azonosító nem. Ha egy ticket címét átírják, a régi prózai hivatkozások elavulnak — a rövid farok ezért nem dísz, hanem a visszakereshetőség biztosítéka hosszabb életű szövegekben.
