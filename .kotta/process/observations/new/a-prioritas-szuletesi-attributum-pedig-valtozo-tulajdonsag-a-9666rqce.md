---
id: F-01kz3y61ve7v8h8k7y9666rqce
title: >-
  A prioritas szuletesi attributum, pedig valtozo tulajdonsag: alairas utan
  befagy, es semmi nem olvassa
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-03'
---
# F-01kz3y61ve7v8h8k7y9666rqce — A prioritas szuletesi attributum, pedig valtozo tulajdonsag: alairas utan befagy, es semmi nem olvassa

## Observation

A prioritas szuletesi attributum, pedig valtozo tulajdonsag: alairas utan befagy, es semmi nem olvassa.

## Evidence

Operatori eszrevetel, 2026-08-03: 'a prioritasok valtoznak'. A workspace ezzel szemben szuletesi attributumkent kezeli a prioritast.

MIT TUD MA. A priority kotelezo mezo (schemas/contract.schema.json:6), az erteke low|medium|high|critical (uo. :24). A contract new fixen 'medium'-ra allitja (src/commands/contract.ts:29). A define felulirhatja a draft frontmatterjebol (src/commands/contract.ts:52, a DEFINITION_FIELDS resze a :37-en). A board a reszletezo fiokban kiirja egy metaadat-sorkent (ui/src/App.tsx:845).

MIT NEM TUD. (1) Nincs parancs, ami egy letezo contract prioritasat modositana. Az egyetlen iro a define, a define pedig csak backlogbol megy - tehat alairas utan a prioritas befagy. Egy defined, active vagy review allapotu contract nem tehető se feljebb, se lejjebb, pedig eppen a mar elindult munka az, aminek a fontossaga a leggyakrabban valtozik. (2) Semmi nem OLVASSA. A priority nem szerepel egyetlen osszehasonlitasban vagy rendezesben sem: se a status, se az index.md generalasa, se a board listai nem hasznaljak. Cimke, nem sorrend.

BIZONYITEK, HOGY A MEZO HALOTT. A kotta sajat backlogjaban 13 contractbol 12 'medium', egy 'high'. A 12 medium nem dontes, hanem a new alapertelmezese, amit senki nem irt at - mert a level nem all rendelkezesre a definicio pillanata utan, es mert az atirasnak nem lenne kovetkezmenye.

FONTOS HATAR, hogy ez ne utkozzon a kimondott scope-pal. A README Scope szakasza kizarja az 'automatic prioritization'-t a V1-bol. Ez az eszrevetel NEM azt keri: nem szamitott rangsort, nem sulyozast, nem utemezot javasol. Azt keri, hogy egy EMBERI dontes, amit a rendszer mar tarol, megvaltoztathato legyen a rogzitese utan is - ez az automatikus prioritizalas ellentete, nem a valtozata. A rendezes kulon, kesobbi kerdes; eloszor legyen mit rendezni.

CSALAD. Ugyanaz a szerkezeti hiba, mint a F-01kz3kzvcsxm67z31va469asbk (a define nem javithatja a cimet) es a F-01kz1na17fnzygqcvv147t946f (egy mar defined contract szovegehez egyik parancs sem nyul hozza): a definicio utani mutabilitas hianyzik, es minden esetben ugyanaz az ok - a define az egyetlen iro, es csak backlogbol fut. Erdemes lehet a haromra egy kozos valaszt adni ahelyett, hogy mezonkent toldozzuk.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
