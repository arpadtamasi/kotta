---
name: plan-change
description: This skill should be used when the user asks to "plan a change", "turn the proposal into the model", "translate the narrative into nodes", "prepare the model delta", "run kotta plan", or to bring an OpenSpec change to the one human gate before it is applied.
---

# Plan a change

The planning phase turns a change's narrative — its OpenSpec `proposal.md` and `specs/`, and the
distilled `conversation.md` when there is one — into a **model delta**: Kotta nodes under the change's
`model/`, each marked with where its content came from. `kotta plan` then measures the delta against
the accepted model, and the human decides it at the one gate. You do the translation; the command
does the measuring; the human does the deciding.

## The layout you write into

```text
openspec/changes/<name>/
  proposal.md, specs/**          the narrative (read it; never edit it to fit the model)
  conversation.md                the distilled conversation, if any
  model/<form-directory>/<slug>-<id8>.md   a new node, or an accepted node changed under its own id
  model/REMOVED.md               accepted nodes the change removes: one list item per id, with why
  planning.md                    written by `kotta plan`
  approval.yaml                  written by `kotta approve`, after the human's yes
```

- A **new** node: `kotta spec new <form> --title "…" --into <name>`. It is minted and scaffolded in
  the change's `model/`, with an empty `provenance` block to answer.
- A **changed** node: copy the accepted file from `.kotta/spec/<form-directory>/` into the same
  directory under `model/`, keep its `id`, and edit the copy. Never edit `.kotta/spec/` for a change.
- A **removed** node: a list item in `model/REMOVED.md` naming its id and the reason.
- A node that belongs to a capability carries `capability: <path>` (e.g. `game/session`); the
  narrative spec `openspec/specs/<path>/spec.md` is generated from those nodes when the change is
  archived — unless the project writes its narrative by hand (see *Generated or authored narrative*).

## Distil the conversation first

If the change was shaped in an agent session, distil it before translating:

```bash
kotta narrative <name> --from <session log or directory> [--since <ISO time>]
```

It reads a Claude Code (`~/.claude/projects/<project>/*.jsonl`) or Codex
(`~/.codex/sessions/**/rollout-*.jsonl`) log and writes `openspec/changes/<name>/conversation.md`:
the human's own sentences of intent (`SZ1`, `SZ2`…), each proposal paired with the human's answer
(`J1`…, a one-word "igen" included), the paths the human turned down (`E1`…), the questions with
their answers (`K1`…), what it could not pair (`P1`…), and the raw source. Secrets, e-mail
addresses, phone numbers and home directories are filtered before anything is written. Use
`--since` when one session shaped several changes. A distillate that was edited by hand is never
overwritten.

## Translate, with provenance on every node

1. Read the narrative requirement by requirement. For each, decide which form states it (a rule, an
   example, a use case, an interface, a quality attribute, a story…) and read that form's
   `.kotta/spec/forms/<form>.yaml` for its required sections and edges.
2. Look for the **why** in the narrative first — the proposal's Why, the requirement's own text, and
   `conversation.md` — before you infer anything or consider it missing. Read the conversation before
   you mark a node `partly-inferred` or `inferred`: a "why" the human said there is `stated`. The
   planning phase asks only for what none of them says.
3. Fill `provenance` on every delta node:

   ```yaml
   provenance:
     level: stated | partly-inferred | inferred
     decided_by: human | agent-proposed-human-approved | agent-decided
     sources: ["openspec/changes/<name>/proposal.md · Why", "openspec/changes/<name>/conversation.md · J3"]
     quote: "<≤ 30 words; speaker and timestamp when it comes from a conversation>"
     inferred: "<what had to be supplied>"   # required unless level is stated
   ```

   A conversation source is always the repository-relative path
   `openspec/changes/<name>/conversation.md`, followed by ` · ` (or `#`) and the item it cites — `J3`,
   `SZ1`, `E2`, `K1` — so the board opens exactly that exchange; `kotta plan` lists a citation it
   cannot resolve. A `J` item is `agent-proposed-human-approved`; an `SZ` item is `human`; an `E` item
   records what the human chose instead of the agent's proposal, so cite it for the choice, never for
   the proposal it turned down. A `P` item is unpaired: read it, and never cite it as an approval.

   `stated` means a source says it; quote it. `decided_by: agent-decided` is the honest mark for
   anything you chose that nobody said — it is listed at the gate for the human to see. Never mark
   your own choice `human`.
4. **Never invent intent.** Where a form asks for something — a goal, an actor, a rationale, a
   threshold — that no source says, do not fill it with a plausible answer. Write it as an item under
   `## Open decisions` in that node, one question per item. A listed gap is worth more than a
   filled-in guess; the change cannot be approved while one is open, which is the point.
5. **Write every obligation with SHALL or MUST.** A business rule's `Rule`, an interface's
   `Postconditions` or `Invariants` and a quality attribute's `Response` state the obligation with the
   normative keyword, in English whatever the language around it, as OpenSpec expects: "The system
   SHALL ask before it quits", „A rendszer SHALL megerősítést kérni kilépés előtt". The form registry
   names these sections (`normative_sections`); `kotta validate` and `kotta plan` refuse a change's
   node without the keyword. The generator carries the text into the narrative as written and never
   adds the keyword for you, so it has to be there in the node.
6. Bind the narrative where it names a node: a `<!-- kotta: <id> -->` line directly under a
   requirement heading lets `kotta plan` report when the prose and the node disagree. Report such a
   drift; do not rewrite either side to make it disappear.

## An imported change

`kotta import openspec` opens a change for an existing OpenSpec project and drafts only what the
narrative states: a business rule per requirement, an example per scenario proving it, a goal per
capability Purpose, each `stated` and `agent-decided`. Every section the narrative has no text for
holds the comment `<!-- kotta import: not derivable … -->` and still counts as empty. Your part:

- derive the actors, use cases, entities and state machines the requirements imply, as new nodes,
  marked `partly-inferred` or `inferred` with what you supplied — the import drafted none;
- answer each not-derivable section from the proposal's History (the archived changes) or the
  sources it names; where none says it, ask — an `## Open decisions` item, never a guess;
- a rule that is really an interface, a quality attribute or a use case may move to that form:
  remove the draft and add the right node, keeping its provenance source.

## Run the measuring

```bash
kotta plan <name>          # writes openspec/changes/<name>/planning.md; non-zero while anything blocks
```

It reports (a) the delta's structure, (b) the merged model as a whole, (c) conflict candidates —
accepted nodes that share an edge with, are named by, or contrast with what the delta changes, and
lifecycle transitions removed or reversed — ranked, at most ten, each awaiting judgement, (d) the
silences: open decisions and unanswered form questions, (e) narrative drift, (f) the provenance
summary with the list of what the machine decided, each with what it rests on, and every citation of
`conversation.md` that does not open at a heading. Fix what is structurally wrong, re-run, and repeat
until only human questions remain.

## Judge the conflicts yourself

The machine's candidates are an aid, not the measure. They are lexical and narrow on purpose — a
glossary contrast, for one, is named only when a claim names the term and one of its non-examples and
states what the non-example denies — so a real contradiction phrased any other way is not on the
list. **Compare every claim of the delta with the accepted nodes it touches**: the rules, examples,
glossary terms, entities and use cases it names or that name it, and the ones about the same thing.
Write each contradiction you find into section (c) of `planning.md`, inside the block `kotta plan`
keeps for you, one list item each, marked `judged`:

```markdown
<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: *Győzelem 11 pontnál* now counts the 11 on total points; the glossary's *Kint vagyok* says only sure points count.
<!-- /kotta:judged -->
```

`kotta plan` re-measures everything else on every run and keeps this block as you wrote it. Put
every judged contradiction to the human at the gate beside the machine's candidates.

## Take it to the gate

Put the decision to the human in the conversation, in their language, named by **title**, never by
id:

- what the change adds, changes and removes, one line each;
- every open question, asked plainly — record each answer in the node (with its provenance) and
  remove the answered item, then `kotta plan` again;
- the conflict candidates and your judged contradictions, as questions ("the example *The quit
  prompt appears* still expects the prompt — does it still hold?"), never as verdicts;
- the list of what the machine decided alone, so the human can overrule any of it.

Then ask for a plain yes or no to the delta as planned. Only on an explicit yes, in this conversation,
to this delta, record it:

```bash
kotta approve <name> --by "<the human's name>"
```

`approve` refuses if the report is older than the model, if a decision is open, or if the delta does
not validate — re-plan and ask again rather than working around it. After the yes there is no second
gate: implement, then `kotta archive <name>` lands exactly the approved delta, regenerates the
capability narratives from the model, and moves the change to `openspec/changes/archive/`. If the
delta changes after the yes, the approval no longer holds, and archive says so.

## Generated or authored narrative

Where `openspec/specs/` comes from is the project's setting, `narrative:` in `.kotta/config.yaml`
(or in `openspec/config.yaml`):

- `generated` (the default): `kotta archive` regenerates each capability the delta touches from the
  merged model, carrying every section as written. What OpenSpec's strict validation would still call
  incomplete — a Purpose under fifty characters, a requirement no example proves — is reported as a
  warning, never filled in: state it in the model (a goal node, an example).
- `authored`: people write `openspec/specs/`. Archive lands the model and writes no narrative; where
  a bound requirement says something else than its node, it reports the drift and does not stop.
  Bring the two together by hand, in whichever direction the human decides.
