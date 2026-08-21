---
id: F-01kz678s2x51xy0jhfmd9f1zcv
title: >-
  Az --approve kapu ceremonia bizonyitek nelkul: senki nem ellenorzi ki gepelte,
  es semmi nem rogziti hogy jovahagyas tortent
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-04'
---
# F-01kz678s2x51xy0jhfmd9f1zcv — Az --approve kapu ceremonia bizonyitek nelkul: senki nem ellenorzi ki gepelte, es semmi nem rogziti hogy jovahagyas tortent

## Observation

Az --approve kapu ceremonia bizonyitek nelkul: senki nem ellenorzi ki gepelte, es semmi nem rogziti hogy jovahagyas tortent.

## Evidence

Operatori kifogas, 2026-08-04, egy masik repo agensenek uzenetere ('A vegrehajtasra jovahagytad, de a Kotta szabalyai szerint az --approve kaput neked kell kozvetlenul lefuttatnod: kotta contract sign T-01kz65kgbpb8szmddwctjtbn7p --approve'): 'ha tenyleg ez a szabaly, az bena' es 'inkabb jovahagyast kene kernie explicit'.

KET TENY A KODBOL. (1) A signContract csak egy boolean flaget ellenoriz (src/commands/contract.ts:98: 'if (!approved) throw ...'). Nincs es nem is lehet szemelyazonossag-ellenorzes: a CLI nem tudja megkulonboztetni, hogy az ember gepelte-e be a --approve-ot vagy egy agens. Ugyanez all a resolveObservation-re, a closeContract-ra es a batch sign-ra. A 'neked kell kozvetlenul lefuttatnod' tehat NEM a termek szabalya, hanem konvencio a skillekben es az AGENTS.md-kben - koztuk abban, amit 2026-08-03-an ebbe a repoba irtunk ('--approve is a human gate. Never pass it, on any command.').

(2) SEMMI NEM ROGZITI A JOVAHAGYAST. Az approved_by, approver, signed_by, actor mezokre nulla talalat a src/ es a schemas/ alatt. A sign annyit ir az entitasra, hogy status: defined es updated_at. Utolag nem allapithato meg, hogy jovahagyas tortent-e egyaltalan, nemhogy ki adta es mi alapjan.

A KETTO EGYUTT AZT JELENTI, hogy a ceremonia surlodasba kerul es semmi maradandot nem vesz erte. Ha az auditalhatosag lenne a cel, a workspace rogzitene a jovahagyast; nem rogziti. Ha a szandekossag lenne a cel, akkor a kerdes MINOSEGE szamitana, nem az, hogy ki gepel - egy 30 karakteres ULID-ot tartalmazo parancs bemasolasa ellenben eppen a vak beillesztesre tanit, tehat rosszabb kapu, mint egy jol feltett kerdes. A surlodas mereheto: a mai peldaban ket parancs, ket teljes 26 karakteres azonositoval, olyan operatornak, aki elozo nap eppen az azonositok olvashatatlansagat kifogasolta (lasd a-slug-hash-emberi-azonosito-mar-letezik-es-dokumentalt-a-ui-1p7xrhzb).

A JAVASOLT ALAK, harom lepes: (1) az agens EXPLICIT kerdez - mit ir ala, mire kotelez, mi valtozik tole -, strukturaltan, nem parancsot ad hazi feladatnak; (2) kifejezett igenre az agens futtatja a parancsot; (3) a parancs ROGZITI a jovahagyast az entitasban: ki, mikor, mi alapjan (pl. approved_by, approved_at, approval_basis). A harmadik pont teszi valodiva a kaput, es az teszi biztonsagossa a masodikat: egy relayelt jovahagyas akkor auditalhato, ha nyoma van annak, hogy relay volt.

KOVETKEZMENY MAS FAJLOKRA: a szabaly ma negy repo AGENTS.md-jeben szerepel a jelenlegi, tilto formaban (kotta, oneanda, crm-kit, flowbench), es a skillekben is. Ha a policy valtozik, mind egyszerre valtozik - ugyanaz a duplikacios csapda, mint a harom-szomszed-agents-md eszrevetelnel.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
