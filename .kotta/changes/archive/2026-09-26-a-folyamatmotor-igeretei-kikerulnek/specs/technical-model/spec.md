## ADDED Requirements

### Requirement: The accepted model promises only what a shipped command does
<!-- kotta: BR-01m3f47dgh74a0dm9bwv0pwgc3 -->
An accepted node SHALL promise behaviour that a command, a surface or a published artefact of the current release has or is meant to have. When a release removes a behaviour, the nodes that promise only that behaviour MUST leave the accepted model through a change - listed in its `model/REMOVED.md` and landed on the one human gate - and never stay behind as admitted gaps or be deleted by hand. A node that still promises something the release keeps is reworded in the same change instead of being removed.

#### Scenario: Egy levett parancs ígérete vele távozik
- **WHEN** egy elfogadott állapotgép minden átmenete olyan parancs, amelyet a kiadás már nem szállít
- **THEN** a node egy change `model/REMOVED.md` listájára kerül, és csak a change jóváhagyása és
  archiválása után hagyja el a `.kotta/spec/`-et
