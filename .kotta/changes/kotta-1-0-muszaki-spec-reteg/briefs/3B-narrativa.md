# 3B — narratíva-desztilláció

Worktree: `../kotta-k3-narrative`, ág `spike/k3-narrative` (az összefésült fejről). Csak ott dolgozz; commitolj; ne pusholj. A `src/cli/index.ts`-ben csak a saját parancsodat regisztráld.

Olvasd: a change `specs/narrative/spec.md`, `design.md`, `briefs/README.md` (a `conversation.md` helye a change-ben), `skills/plan-change/SKILL.md`, `src/commands/plan.ts` (hogyan olvassa a forrásokat), `src/commands/ui.ts` narratíva-végpontja (repó-relatív `openspec/changes/...` forrást vár).

## Feladat

`kotta narrative <change> --from <munkamenet-fájl|könyvtár> [--since <időbélyeg>] [--json]` — a beszélgetés desztillátumát írja a change `conversation.md`-jébe.

1. **Bemenet:** Claude Code munkamenet-naplók (`~/.claude/projects/<slug>/*.jsonl`: `type: user|assistant`, `message.content` string vagy blokk-lista, `isSidechain` kihagyandó, `timestamp`) és Codex naplók (`~/.codex/sessions/**/rollout-*.jsonl`: `type: response_item`, `payload.type: message`, `payload.role: user|assistant`, `payload.content[].text`). Ismerje fel a formátumot a tartalomból. Hagyja ki a rendszer- és eszközüzeneteket (`<system-reminder`, `<task-notification`, `[Request interrupted`, `<command-`, skill-betöltéseket, 4000 karakternél hosszabb beillesztéseket).
2. **Desztillátum**, magyarul, időbélyegekkel, ebben a sorrendben: **Szándék** (az ember saját mondatai, szó szerint); **Javaslatok és válaszok** — minden ágens-javaslathoz az ember rá adott válasza párban (egyszavas „igen”/„a”/„mehet” is), időbélyeggel, mert a provenance `agent-proposed-human-approved` ezekre hivatkozik; **Elvetett utak** (ahol az ember mást választott, mint az ágens javasolt); **Kérdések és válaszok**; **Nyers forrás** (a munkamenet-fájl útvonala és a feldolgozott üzenetek száma). A párosítás heurisztikus: egy ember-üzenet az előtte álló ágens-üzenet javaslataira válasz; ne találj ki párosítást, ahol bizonytalan, tedd a „Párosítatlan” alá.
3. **Titok- és személyesadat-szűrés** írás előtt (`specs/narrative` „A titkok nem kerülnek be”): API-kulcs-minták (`sk-`, `gho_`, `AKIA`, JWT), e-mail-címek, telefonszámok, abszolút otthoni útvonalak (`/Users/<név>/` → `~/`). Amit szűrt, azt a kimenet felsorolja fajtánként, számmal.
4. **A `plan` és a skill használja:** a `plan-change` skill mondja ki, hogy a „miért”-et a `conversation.md`-ben kell keresni a következtetés előtt, és a provenance `sources` repó-relatív hivatkozása `openspec/changes/<név>/conversation.md#<szakasz>` legyen, amit a board végpontja megtalál.
5. **Tesztek:** egy Claude Code- és egy Codex-formátumú fixture (5–8 üzenet), a párosítás, a kihagyások, a szűrés, `--since`. `npm run typecheck`, `npm test`, `npm run build` zöld.

Minden tisztázatlan pont a change `DECISIONS.md`-jébe („3B:” előtaggal). Zárójelentés magyarul, tömören.
