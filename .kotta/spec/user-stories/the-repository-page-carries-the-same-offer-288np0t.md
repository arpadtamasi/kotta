---
id: US-01m0hrxc4qmhhrpwz2f288np0t
form: user-story
title: "The repository page carries the same offer as the public page"
actor: A-01m0f0wn89ewnpex9n4tq0s0rg
accepted:
  - >-
    implementation: Inherited on 2026-08-23, when kotta gap began refusing a promise that is neither evidenced nor admitted (BR-01m0qtshfqhcrrqtz051zm9svr). This node predates that rule and no code, test or command definition names its id. It was admitted in bulk with the other 107 and was not examined individually, so this line records that nobody has looked yet — not a decision that it should stay unimplemented.
---

## Story

As a developer or technical lead who reaches Kotta through GitHub rather than through the public page, I want the repository's own landing view to tell me what Kotta is for, who it is for, and what it does not do, before it tells me how to install it, so I can decide whether Kotta fits my situation without reading a process manual or a migration history first.

## Value

GitHub is a first-class entry point, not a mirror of the site. A visitor who arrives at the repository sees the same offer, in the same restrained voice, and reaches a correct install path. Reference material that only an existing user needs — compatibility, migration, maintainer process — stays available without standing between a newcomer and the product claim.

## Notes

The surface is `README.md`, which GitHub renders as the repository page, together with the repository's own description. The page keeps Kotta's product truth: no fabricated metrics, customers, testimonials, or hosted-service claims, and every product claim traceable to behaviour that exists in the repository. Stating what Kotta does not do is part of the offer, not a disclaimer appended to it. Where the same fact appears on both surfaces — the installed version, the skills-install command — the two surfaces agree.
