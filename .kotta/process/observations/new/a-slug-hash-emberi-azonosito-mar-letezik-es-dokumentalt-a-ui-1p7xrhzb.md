---
id: F-01kz4k6c8tej1hv8dr1p7xrhzb
title: >-
  A slug+hash emberi azonosito mar letezik es dokumentalt - a UI hasznalja, a
  CLI es a skillek soha
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-03'
---
# F-01kz4k6c8tej1hv8dr1p7xrhzb — A slug+hash emberi azonosito mar letezik es dokumentalt - a UI hasznalja, a CLI es a skillek soha

## Observation

A slug+hash emberi azonosito mar letezik es dokumentalt - a UI hasznalja, a CLI es a skillek soha.

## Evidence

Operatori keres, 2026-08-03: 'nem tudom, melyik id mihez kell, adj slug+hash alaku id-ket'. A keresre a valasz nem uj konvencio: a forma mar megvan a kodban, csak a szoveges feluletek nem hasznaljak.

AMI MAR LETEZIK. src/core/identity.ts:76 displayId(), kommentje 'Short human-facing form: T-a3f9c1d2 for a minted id'. :85 entityFilename() a lemezformatumot adja: 'slug-<short id>.md', kommentje szerint 'D-003 - readable and disk-unique across branches'. :95 filenameMatchesId() UTOTAGRA illeszt: barmi, ami '-<hash>'-re vegzodik, azonositja az entitast. :19 SHORT_ID_LENGTH = 8, 'Filename and display tail'. A tervezes tehat mar kimondta, hogy az emberi forma a rovid hash, a lemezforma pedig slug+hash.

A DONTO TENY. A displayId-nek NULLA hivoja van a src/ alatt. Mind a 12 hivas a boardon van (ui/src/App.tsx), amely ezen felul UJRAIMPLEMENTALJA a fuggvenyt (App.tsx:67) ahelyett hogy a core-bol importalna - tehat a ket felulet mar el is csuszott egymastol. A boardon a minta vegig 'titleOf(id) ?? displayId(id)': cim eloll, rovid id tartalekkent. A UI jol csinalja. A CLI nyers id-t ir, amikor egyaltalan ir valamit (F-01kz3k7e3a6g28h5j29mg56yk6), a skillek pedig semmilyen kimeneti szabalyt nem kapnak: a 'displayId' es a 'shortId' egyszer sem fordul elo a skills/ alatt.

Ez pontosan a F-012 / F-013 par: a F-012 (UI fele) a T-018-cal elkeszult, a F-013 (szoveges fele) 2026-07-28 ota nyitva all. Ez az eszrevetel a F-013 KONKRET FORMAJAT rogziti, es a F-01kz3t0a9tpz16m9ehszetd8cz mechanizmus-leirasat egesziti ki azzal, hogy a megoldas nagy resze mar meg van irva.

A KERT FORMA. Az entitas emberi neve a fajlnev-torzs: slug + '-' + 8 karakteres hash. Az egyediseget a hash adja, a slug puszta olvashatosag - tehat a slug szabadon rovidithető megjelenitesnel, es a feloldas akkor is mukodik, ha csak a hasht irjak. Ebbol harom kovetkezmeny: (1) minden parancs, amely entitast emlit, ezt a format irja; (2) minden parancs, amely id-t VAR, fogadja el ugyanezt - ma sem a 'szetd8cz', sem a 'T-1366pk' nem oldodik fel, csak a teljes 26 karakteres ULID, pedig a filenameMatchesId utotag-illesztese mar pontosan ezt a szemantikat valositja meg a lemezen; (3) a skillek kapjanak kimeneti szabalyt, mert a batch-inditasi uzeneteket ok fogalmazzak - a mai oneanda-peldaban nyolc 'T-...' kezdetu token vezetett a cimek elott, es a zaro kerdes olyan valaszt kert, amit id-vel kellett volna megadni.

LISTA-SZABALY, amit ugyanaz a pelda mutatott meg: egyetlen emliteshez jo a 'cim (id)' alak, de LISTABAN az id oszlopnyi zajt csinal, ezert a cim vezessen; es kerdesben soha ne legyen id - a valasztas sorszammal tortenjen, az agens fejti vissza.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
