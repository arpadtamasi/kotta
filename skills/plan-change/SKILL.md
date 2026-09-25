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
  archived.

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
5. Bind the narrative where it names a node: a `<!-- kotta: <id> -->` line directly under a
   requirement heading lets `kotta plan` report when the prose and the node disagree. Report such a
   drift; do not rewrite either side to make it disappear.

## Run the measuring

```bash
kotta plan <name>          # writes openspec/changes/<name>/planning.md; non-zero while anything blocks
```

It reports (a) the delta's structure, (b) the merged model as a whole, (c) conflict candidates —
accepted nodes that share an edge with, are named by, or contrast with what the delta changes, and
lifecycle transitions removed or reversed — ranked, at most ten, each awaiting judgement, (d) the
silences: open decisions and unanswered form questions, (e) narrative drift, (f) the provenance
summary with the list of what the machine decided. Fix what is structurally wrong, re-run, and repeat
until only human questions remain.

## Take it to the gate

Put the decision to the human in the conversation, in their language, named by **title**, never by
id:

- what the change adds, changes and removes, one line each;
- every open question, asked plainly — record each answer in the node (with its provenance) and
  remove the answered item, then `kotta plan` again;
- the conflict candidates, as questions ("the example *The quit prompt appears* still expects the
  prompt — does it still hold?"), never as verdicts;
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
