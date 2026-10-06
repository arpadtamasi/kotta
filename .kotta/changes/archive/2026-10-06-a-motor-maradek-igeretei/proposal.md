# A folyamatmotor maradék ígéretei kikerülnek

## Why

A 2026-09-26-i „A folyamatmotor ígéretei kikerülnek a modellből" change 17 elemet vitt ki, és
kimondta a szabályt (*The accepted model promises only what a shipped command does*): amit egy
kiadás levett, annak az ígérete change-dzsel távozik, nem marad beismert résként. A levett motor
ígéreteinek nagyobb része mégis elfogadva maradt: taskok, claimek, batchek, observationök,
decision recordok, briefek, a review-beadás, a control plane. Ezeket ma egyetlen parancs sem tudja
betartani, és `structural` vagy `unexamined` beismeréssel állnak a `kotta gap` jelentésében - pont
úgy, ahogy a szabály tiltja. Az operátor, 2026-10-01: „a kotta régi igéi megvannak? kell mind?",
majd a felsorolt hibákra, köztük erre: „csináld".

## What changes

- **Kikerül 63 elem** (`model/REMOVED.md`), mert csak a levett motor viselkedését ígéri: a task és
  életciklusa, a claim és a végrehajtó ágak, a brief, az observation és a triázs, a batch, a
  decision record, a review-beadás bizonyítéktáblája, a control plane és a zárja, valamint az
  *Executing agent* szereplő és a *The agent launch task* interfész.
- **Átfogalmazódik 3 elem**, mert az ígéretük megmaradt, csak a motor szavaival volt kimondva:
  *Proportionate ceremony* (egy kapu change-enként, a tervezés végén), *The ceremony fits the
  stakes* és *Completion is evidence, not report* (a bizonyíték a hivatkozás, a `kotta gap` olvassa).
- **Négy példa új tárgyat kap**, hogy a megmaradó szabályoknak maradjon példájuk: *An unanswered
  question refuses the approval by name* az *Agents never invent intent* szabályt is bizonyítja;
  *Building an approved change needs no signal* a *The spec is the agreement* szabályt is; *An
  approval leaves a receipt* a *Proportionate ceremony*-t is; *The board refuses to write* a
  kikerülő control-plane szabály helyett a *Consequential transitions are human gates* szabályt.

Ami marad, és még a motor szavait hordozza, de megmaradó viselkedést ígér - ezekhez ez a change nem
nyúl: a négy interfész (*The kotta CLI*, *The MCP tool surface*, *The workspace file format*, *The
read-only board*), a *Calling-chat agent* szereplő, a *Workspace* entitás, az *Approve a gate in
conversation*, *Orient in the workspace* és *Shape the specification* use case, a *Direct more work
than you can observe* cél, valamint néhány szabály és példa szövege (*Agents never invent intent*,
*The spec is the agreement*, *Listing writes nothing*, *Shaping runs without a task*, *The board
survives a restart*, *The gap report names the unimplemented promise*, *The release canary times
onboarding*).

A modellen kívül: a `src/core/invocation.ts` megjegyzése egy kikerülő szabályt idéz.

## Open decisions

- A fenti „marad, de a motor szavait hordozza" elemek átfogalmazása ebben a change-ben történjen,
  vagy egy következőben.
