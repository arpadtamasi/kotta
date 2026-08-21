---
id: F-01kz3y8871e82v1v8dsjb9v9w9
title: >-
  Nincs backlog review, es epp azert kell tolnia magat a termeknek, mert PM-kent
  ezt mindenki elhagyja
status: new
origin: agent
observation_type: improvement
confidence: high
severity: medium
discovered_during: null
created_at: '2026-08-03'
---
# F-01kz3y8871e82v1v8dsjb9v9w9 — Nincs backlog review, es epp azert kell tolnia magat a termeknek, mert PM-kent ezt mindenki elhagyja

## Observation

Nincs backlog review, es epp azert kell tolnia magat a termeknek, mert PM-kent ezt mindenki elhagyja.

## Evidence

Operatori keres, 2026-08-03: 'kene egy backlog review - ami atnez mindent es kerdezget', majd a dontő indoklas: 'ezt mindig elhagyja az ember pm-kent'. Ez a masodik mondat a fontosabb: nem egy hianyzo funkciorol szol, hanem egy elhanyagolt ritualerol. Egy kepesseg, amit fel kell IDEZNI, hogy hasznald, pontosan az, amit nem fogsz hasznalni. A backlog review tehat nem lehet csak egy skill, amit el kell inditani - a termeknek kell szolnia, hogy esedekes.

A HANYAGOLAS BIZONYITEKA UGYANEBBEN A WORKSPACE-BEN, amit a tulajdonosa napi szinten hasznal: 44 nyitott observation es 13 backlog contract. A 13-bol 12 'medium' prioritasu, ami nem dontés, hanem a contract new alapertelmezese, amit soha senki nem irt at (lasd F-01kz3y61ve7v8h8k7y9666rqce). A T-002 cime meg mindig 'A-Team'-et mond, tehat a 2026-08-as rename elott irtak es azota erintetlen. A F-01kz2as3kq6j8t3g0b9m3dkmxv ('crm-kit and flowbench cannot be migrated') meg 'new' allapotban all, mikozben mindket repo azota megkapta a kotta migrate-et - egy eszrevetel, amit a valosag lehagyott, es semmi nem vette eszre.

AMI MA VAN, ES MIERT NEM FEDI LE. Az explore-workspace skill read-only portfolio-elemzes, es PULL-alapu: megvalaszolja a kerdesedet ('what needs my decision?'), de nem tesz fel kerdest, es nem valtoztat allapotot. A validate-observation egyetlen tetelt visz vegig. A T-019 ('Sweep: one command that answers what is unfinished and why') valaszol, de nem faggat es nem rangsorol. Egyik sem az, ami vegigmegy MINDENEN es kerdez.

A KERT ALAK. Vegigveszi a nyitott observationoket es a backlog contractokat, temak szerint csoportositva; minden tetelnel azt kerdezi, amit csak ember tud eldonteni - meg aktualis-e, duplikatum-e, mi a prioritasa, lezarhato-e -; a valaszokat a MEGLEVO parancsokkal vezeti at (observation resolve, contract define/sign/cancel), tehat nem uj tarolo, hanem meghajtő a meglevo kapuk folott; es kotegelve kerdez, nem tetelenkent, mert 44 tetelnel a tetelenkenti kerdezes maga is elhagyhatova valik.

A NYITOTT KERDES a definiciohoz: mi TOLJA. Lehetoseg (a) a kotta status mondja meg, ha a backlog avult - hany observation nyitott, hany contract all alapertelmezett prioritason, mi nem mozdult N napja; (b) kuszob-alapu figyelmeztetes a boardon; (c) kadencia. Barmelyik jobb, mint egy skill, amire emlekezni kell.

## Impact hypothesis

This may cause incorrect or inconsistent behaviour.

## Confidence

High: the evidence is directly observable.

## Suggested disposition

Investigate and create the smallest appropriate contract after human approval.
