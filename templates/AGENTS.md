# AGENTS.md

This repository keeps its **technical specification** with **Kotta**: the accepted rules, examples,
entities, state machines, use cases, stories and interfaces of the product, as plain Markdown files
under `{{workspace}}/spec/`, each in the shape its form declares. Read this before you touch anything.

## The tool these rules assume

The rules below are enforced by the `kotta` CLI and by the Kotta MCP server. The binary and the npm
package do not share a name, so the package cannot be guessed from the command:

```bash
npm install --global {{package}}@{{version}}   # or: npx -y -p {{package}}@{{version}} kotta validate
```

If you can install neither — a hosted environment with no network or no npm — read the
specification as files, draft your proposal in a file, say what you could not run, and leave the
checks to an environment that has the CLI.

## The four layers

```text
chat  →  narrative spec (OpenSpec)  →  technical model (Kotta forms)  →  code
```

The layers are joined by references, never by copies. The conversation is where intent is said; the
narrative specification is where a change is proposed and argued in prose; the **technical model** is
the precise, machine-checkable form of what was accepted — and when the two disagree, the technical
model is the truth and the disagreement is reported, not smoothed over; the code is what keeps the
promises, and it says which by naming the node it keeps.

A change moves through them in one pass. Its narrative lives in `openspec/changes/<name>/`; planning
translates it into a **model delta** under that change's `model/`, every node marked with its
`provenance` (stated, partly inferred or inferred, and who decided it); `kotta plan <name>` measures
the delta against the accepted model and writes `planning.md`; the human decides it — **the one gate**
— and `kotta approve <name> --by <who>` records that yes; `kotta archive <name>` then lands exactly
the approved delta in `{{workspace}}/spec/`, regenerates the narrative from the model, and moves the
change to the archive, asking nothing again. The `plan-change` skill is the how.

Who writes `openspec/specs/` is the project's choice, `narrative:` in `{{workspace}}/config.yaml`.
With `generated`, the default, archive regenerates every capability a change touches from the model,
carrying the nodes' text as written; with `authored`, people write the narrative, archive writes none
of it and only reports where a bound requirement disagrees with its node. Either way the model is the
truth, and an obligation carries its keyword in the model: a rule, an interface's postconditions or
invariants, a quality attribute's response say SHALL or MUST — in English, as OpenSpec expects,
whatever the language around it. A change's node without one is refused; an older accepted node is
warned about.

## The rule everything else follows from

`{{workspace}}/spec/` is **project-owned**. Its form registry (`spec/forms/*.yaml`) and the nodes
stored in form-declared directories are yours to shape, in conversation, with the workshop skills or
by hand — the validator measures a node against its form and names the form's own question for
every missing part. A node becomes the agreement when it lands on the base branch on a human yes.

There is **no process layer**: no task, no claim, no batch, no observation, no decision record. The
one receipt left is a change's `approval.yaml`, the record of its one gate. Kotta 1.0 does not track who is doing what; it holds what was agreed and whether
the code keeps it. `{{workspace}}/legacy/`, where a migrated workspace keeps its pre-1.0 process
state, is a read-only archive — nothing reads it and nothing writes it.

Chat, the board (`kotta ui`), pull requests and CI are views or history — they never override these
files. The board is read-only.

## Orient yourself first

```bash
kotta validate     # does every node satisfy its form, and every edge name a node
kotta gap          # which accepted promises have no evidence in the code, and which enforcement has no spec behind it
kotta questions    # which drafts still carry an open question
```

Project settings — the base branch, the protected branches — live in `{{workspace}}/config.yaml`.
Read it rather than assuming defaults.

## The model

Every node is one Markdown file with frontmatter: `id`, `form`, `title`, the fields its form
requires, and the edges it answers (a use case names its `actor` and `goal`; an example names what it
`subjects`). The registry says which forms exist, where their nodes live, which sections they must
carry and which edges they must answer. A form the project adds participates the same way, with
nothing compiled in.

Identifiers are minted, never typed: `kotta spec new <form> --title "…"` writes a node already
carrying its id and its form's skeleton, as a draft, committed by nobody. Name a node by its
**title** wherever a human reads; the id is a key for the machine and appears where something will be
typed back or nothing else identifies it.

**A promise is evidenced by citation.** The code, test or command definition that keeps a node names
that node's id, so `kotta gap` finds it in one pass. A node nothing names either has an admission in
its frontmatter — `accepted: ["<kind>: <reason>"]`, where the kind is `structural`, `unexamined` or
`unimplemented` — or the report refuses and names it. Keeping a promise without naming it leaves it
unaccounted for.

Undecided points in a draft are enumerated under `Open decisions`, one list item each, addressed as
`<id>/Q<n>` by their position; `kotta questions` lists them. The planning phase of a change is where
they are answered and where the one human gate stands: `kotta approve` refuses a delta with an open
question, so a draft with one is a draft, not an agreement.

## Rules for agents

1. **The technical model is the accepted truth.** When the narrative, the conversation and the
   nodes disagree, the nodes win and you say where they disagree. You may propose a change to a
   node; you do not decide one. The change lands when the human says yes. `kotta plan`'s conflict
   candidates help; they do not replace comparing every claim of a delta with the accepted nodes it
   touches, and what you find goes into the report marked `judged`.
2. **Never invent product intent.** Where a form asks for something — a goal, an actor, a rationale —
   that neither the conversation nor the narrative says, write the question, not an answer. A
   filled-in guess is worse than a listed gap.
3. **Stay inside the change you are making.** Anything you notice outside it is said to the human,
   in chat, as one line — never a silent fix and never a record of its own.
4. **Approval is a human gate — ask for it here, in the conversation.** Put the decision to the
   human in their language: what will change, named by title, one line, then a plain yes or no.
   Anything less than an explicit yes is a no: silence, a yes to a different question, an earlier
   unrelated yes, or your own judgement that they would obviously agree. If you cannot ask, you do
   not decide. There is one such gate per change, at the end of planning, and none after it.
5. **Evidence names its node.** When you implement a promise, cite the node's id where the code
   keeps it and in the test that proves it; when you cannot yet, admit the gap in the node's
   frontmatter with its kind and reason rather than leaving `kotta gap` to find it.
6. **Never write into `legacy/`.** It is the record of how the project worked before 1.0, kept
   for reading. Nothing in it governs anything now.

## Skills

If the Kotta skills are installed, prefer them — they encode the how. `plan-change` carries a
change from its narrative to the one gate; `setup-kotta` initializes a workspace; `explore-workspace` answers questions across the specification; `requirements-traceability`
reads the model as a graph and reports what hangs; `consolidate-model` finds one concept living under
several names; `report-kotta-bug` reports a defect in Kotta itself. `kotta sync` installs them.

For the specification workshops, use `impact-mapping`, `story-mapping`, `use-case-modeling`,
`example-mapping`, `event-storming`, `ubiquitous-language`, `quality-scenarios` and
`design-by-task`. They draft and read Markdown nodes under `{{workspace}}/spec/`; landing those nodes
on the base branch is how agreement is accepted.

A defect in Kotta itself is not this project's work: use `report-kotta-bug`, or the issue form at
<https://github.com/arpadtamasi/kotta/issues>.

---

This file is written and kept current by Kotta. Edit it and `kotta sync` will report it as drifted
and leave it alone; project-specific instructions belong in the repository's own `AGENTS.md`, which
Kotta never rewrites.
