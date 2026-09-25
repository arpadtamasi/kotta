# Concepts

What Kotta holds, why, and the handful of rules everything else follows from.

## Four layers

```text
chat  →  narrative spec (OpenSpec)  →  technical model (Kotta forms)  →  code
```

| Layer | Where it lives | What it is for |
| --- | --- | --- |
| Chat | the agent session; optionally `openspec/changes/<name>/conversation.md` | where intent is said |
| Narrative spec | `openspec/changes/<name>/`, `openspec/specs/` | where a change is proposed and argued in prose |
| Technical model | `.kotta/spec/` | the precise, machine-checkable form of what was accepted |
| Code | the rest of the repository | what keeps the promises, naming the node it keeps |

The layers are joined by references, never by copies. Kotta owns the third one.

## The model is the accepted truth

A node is one Markdown file: frontmatter (`id`, `form`, `title`, the edges its form requires) and
the sections its form requires. The [form registry](forms.md) under `.kotta/spec/forms/` says which
shapes exist. A node becomes the agreement when it lands on the base branch after a human yes.

When the narrative and the model disagree, the model wins and the disagreement is reported. By
default the narrative under `openspec/specs/` is generated from the model on archive, so the two
cannot drift apart silently.

Why a model beside the prose, measured on the operator's own projects:

- **The why is not said.** From a natural OpenSpec spec (oktat-ai, 112 requirements), 479 nodes were
  derived; 301 of them were stated in the prose, and none of the 11 goals or the 14 user stories.
- **Structure does not come back from prose.** Round-tripping the goschool model (299 nodes →
  OpenSpec → nodes) lost its six goals, invented eleven in their place, and matched none of the
  use case → goal edges.
- **A delta in forms is more precise.** For the same change, the prose delta invented a rule and
  silently dropped a case; the model delta did neither, and took 2.3 times as long to write.

## Provenance

Every node a change proposes carries a `provenance` block (optional on accepted nodes):

```yaml
provenance:
  level: stated | partly-inferred | inferred
  decided_by: human | agent-proposed-human-approved | agent-decided
  sources: ["openspec/changes/<name>/proposal.md · Why"]
  quote: "at most 30 words"
  inferred: "what had to be supplied"    # required unless level is stated
```

- `level` says how much was said: `stated`, `partly-inferred` or `inferred`.
- `decided_by` says who settled it: the human, the agent with the human's approval, or the agent
  alone.
- `sources` names the file and section it came from; required unless the level is `inferred`.
- `quote` is a witness, not a transcript: at most 30 words.

The schema is published as `schemas/provenance.schema.json`. `kotta plan` lists every
`agent-decided` node at the gate, and the board filters to them.

Why: in one measurement, 20 of 68 recovered "whys" had been said by nobody; the machine had chosen
them. The casino change's planning report counted 74 of 184 nodes as `agent-decided`.

## Never invent intent

Where a form asks for something — a goal, an actor, a rationale, a threshold — that no source says,
the agent writes a question under `## Open decisions`, one list item each, not a plausible answer.
`kotta questions` lists them, addressed as `<id>/Q<n>`. A change cannot be approved while one is
open.

## One human gate

A change has exactly one approval: at the end of planning, on the model delta. The human says yes in
the conversation; `kotta approve <change> --by <who>` records it in `approval.yaml`, bound to a hash
of the delta. `kotta archive` then lands exactly that delta and asks nothing again. There is no task,
claim, review or close step. See [The planning phase](planning-phase.md).

Why: the 0.x process layer measured as ceremony. On the operator's projects 54–72% of commits were
state bookkeeping, and after a week of plain OpenSpec work the operator reported not missing Kotta.

## Evidence by citation

The code, test or command definition that keeps a promise names the node's id. `kotta gap` reads the
base branch and reports every accepted node at one of three levels:

| Level | Meaning |
| --- | --- |
| `none` | no committed file outside `.kotta/` names the id |
| `cited` | a committed file names it |
| `bound` | a test's own name carries it (a skipped test does not bind) |

A node nothing names either admits the gap in its frontmatter
(`accepted: ["unimplemented: <reason>"]`, or `structural`, or `unexamined`) or the report refuses.
See [Modules and evidence](modules-and-evidence.md).

## Drift is reported, never smoothed

`kotta plan` reports narrative requirements that disagree with the node they are bound to;
`kotta archive` refuses while regenerated prose still disagrees; with `narrative: authored` it warns
instead. No command rewrites either side to make a disagreement disappear. Which side moves is the
human's call.

## Modules and repositories

Modules come from the manifests, a node's module from where its evidence lives. A promise that
crosses a module boundary belongs in an interface node; a promise from another repository is
referenced by version, not copied. Measured: on assistant-core, stating the boundary left 42% of the
spec (35 nodes) out of `chat-ui` work and cut straddling promises from 8 to 1; the `corpus.search`
interface, copied into two repositories, already said different things in each.

## Where the measurements come from

The figures on this page are the operator's measurements on their own projects in September 2026,
recorded in the change that planned 1.0:
[`openspec/changes/kotta-1-0-muszaki-spec-reteg/proposal.md`](../openspec/changes/kotta-1-0-muszaki-spec-reteg/proposal.md)
(in Hungarian). The casino figure is from that project's `planning.md`.
