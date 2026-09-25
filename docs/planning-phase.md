# The planning phase

How a change goes from prose to the accepted model: the layout, what each command checks, when it
refuses, and what `archive` generates.

## The layout of a change

```text
openspec/changes/<name>/
  proposal.md, specs/**                    the narrative (OpenSpec's own files)
  conversation.md                          optional: the distilled conversation (kotta narrative)
  model/<form-directory>/<slug>-<id8>.md   a new node, or an accepted node changed under its own id
  model/REMOVED.md                         accepted nodes the change removes, one list item per id, with why
  planning.md                              written by kotta plan
  approval.yaml                            written by kotta approve
```

- **New node:** `kotta spec new <form> --title "…" --into <name>`. The change directory must
  already exist.
- **Changed node:** copy the accepted file from `.kotta/spec/<form-directory>/` into the same
  directory under `model/`, keep its `id`, edit the copy. A node keeps its form.
- **Removed node:** a list item in `model/REMOVED.md` naming its id and the reason. A node is either
  changed or removed, never both.
- A node that belongs to a capability carries `capability: <path>`; that is what `archive`
  generates `openspec/specs/<path>/spec.md` from.

Any other file under `model/` is refused as a stray.

## What `plan-change` does, and never does

The `plan-change` skill does the translation in the chat:

1. It distils the conversation first, when the change was shaped in an agent session.
2. It reads the narrative requirement by requirement, picks the form that states each one, and reads
   that form's required sections and edges.
3. It looks for the why in the proposal, the requirement and the conversation before calling
   anything inferred, and fills `provenance` on every node.
4. It writes every obligation with SHALL or MUST: a rule's Rule, an interface's Postconditions or
   Invariants, a quality attribute's Response. A change's node without the keyword is refused.
5. It runs `kotta plan`, fixes what is structural, and adds the contradictions it finds itself to the
   report's `judged` block.
6. It puts the delta to the human, by title, and records the yes only on an explicit yes.

It never invents intent. Where a form asks for something no source says, it writes a question under
`## Open decisions` in that node. It never marks its own choice `human`, and never edits the
narrative to fit the model.

## `kotta plan <change>`

Measures the delta against the accepted model and writes `planning.md`. The file's frontmatter
records `change`, `generated_at`, `delta_hash` and `ready_for_approval`; the body has these
sections, in this order:

| Section | What it reports |
| --- | --- |
| `## Delta` | the nodes added, changed and removed, by title |
| `## (a) Structure of the delta` | each delta node against its form: sections, required edges, id, provenance, the SHALL/MUST keyword |
| `## (b) The merged view` | the accepted model with the delta applied, validated as a whole |
| `## (c) Conflict candidates` | accepted nodes the delta may falsify, ranked, at most ten; then the `judged` block |
| `## (d) Silences` | open decisions, and questions a form asks that nothing answers |
| `## (e) Narrative drift` | bound narrative requirements that say something else than their node |
| `## (f) Provenance` | counts by level and by decider, the list of what the machine decided alone, and the conversation citations that do not resolve |

The conflict candidates are mechanical: a lifecycle transition removed or reversed, an accepted node
that names a changed or removed node, one named by a changed node, one sharing an edge with it, and a
glossary contrast (a claim that states of a term's non-example what the term denies). Each is marked
"awaits judgement"; none is a verdict.

The `judged` block is the agent's own writing. `plan` keeps it as written on every re-run:

```markdown
<!-- kotta:judged — the agent's own findings; `kotta plan` keeps this block as written -->
- judged: …
<!-- /kotta:judged -->
```

`plan` always writes the report. It exits non-zero while section (a), (b) or an open decision
blocks. When nothing blocks it prints:

```text
Ready for the gate: put the delta, the candidates and the machine's decisions to the human, then record their yes with 'kotta approve'.
```

## `kotta approve <change> --by <who>`

Records the human's yes as `approval.yaml`: `change`, `approved_by`, `approved_at`,
`approval_basis` (the `sha256:` hash of every file under `model/`) and the approved nodes by id and
title. It refuses, listing every reason, when:

| Code | Why |
| --- | --- |
| `PLANNING_MISSING` | there is no `planning.md`; run `kotta plan` and put its report to the human first |
| `PLANNING_STALE` | a file under `model/` is newer than `planning.md`, or the report describes a different delta hash |
| `OPEN_DECISION` | a delta node still asks an open question |
| any structural code | the delta or the merged model does not validate |

`--by` names the human who said yes. Kotta records the claim; it does not authenticate it.

## `kotta archive <change>`

Lands the approved delta. It asks nothing again, and every check runs before the first write, so a
refusal leaves the repository as it was. It refuses when:

| Code | Why |
| --- | --- |
| `APPROVAL_MISSING` | there is no `approval.yaml` |
| `APPROVAL_UNREADABLE`, `INCOMPLETE_APPROVAL_RECEIPT` | the receipt is not valid YAML, or lacks a field |
| `APPROVAL_STALE` | `model/` no longer hashes to the approved basis: plan again and ask again |
| `REMOVED_STILL_REFERENCED` | a node still names a node the change removes |
| `ARCHIVE_EXISTS` | `openspec/changes/archive/<date>-<name>/` already exists |
| `NARRATIVE_DRIFT` | with `narrative: generated`, a bound requirement still disagrees with its node after regeneration |
| `CONFIG_INVALID` | `narrative:` has a value other than `generated` or `authored` |
| any structural code | the delta or the merged model does not validate |

Then it copies each delta node into `.kotta/spec/<form-directory>/` (replacing a same-id node),
deletes the removed nodes, regenerates the narrative, and moves the change directory to
`openspec/changes/archive/<YYYY-MM-DD>-<name>/`. It commits nothing.

## What `archive` generates

With `narrative: generated` (the default), each capability the delta touches gets
`openspec/specs/<capability>/spec.md`, rebuilt from the merged model:

| Part | From |
| --- | --- |
| `## Purpose` | the goal nodes naming the capability (their Outcome); else the existing file's Purpose; else a comment saying the model states none |
| `## Requirements` → `### Requirement: <title>` | business rules, then interfaces, then quality attributes naming the capability; the text is the node's sections in form order, the first as the statement, the rest under bold headings |
| `#### Scenario: <title>` | each example whose `subjects` name the requirement, as GIVEN / WHEN / THEN; an interface no example proves gets its own Preconditions as GIVEN and Postconditions as THEN |
| `## Use cases`, `## User stories` | informative: Intent, Main success scenario, Alternatives; Story, Value. Never requirements |

Every entry carries a `<!-- kotta: ID -->` line under its heading: the binding `plan` and `archive`
check drift against. The file opens with a comment saying it is generated and that the nodes, not
the file, are what to change.

`archive` warns, and never fills in, where OpenSpec's strict validation would object:
`NARRATIVE_PURPOSE_BRIEF` (no Purpose, or one under 50 characters) and `NARRATIVE_NO_SCENARIO` (a
requirement no example proves).

With `narrative: authored`, people write `openspec/specs/`; `archive` writes none of it and reports
each bound requirement's drift as a warning. See [Configuration](configuration.md).

## A worked refusal

A freshly scaffolded rule, planned before it is filled in:

```text
kotta plan failed with 7 errors:
  SPEC_NODE_PROVENANCE: exports-are-csv-only-5bbq9esq.md (business-rule) leaves provenance.level unanswered: is its content stated, partly-inferred, inferred?
  …
  SPEC_NODE_MISSING_SECTION: exports-are-csv-only-5bbq9esq.md (business-rule) is missing or leaves empty the required section 'Rule'.
  …
  SPEC_NODE_MISSING_EDGE: exports-are-csv-only-5bbq9esq.md (business-rule) answers incoming edge 'evidence' 0 time(s); its form requires at least 1. What would break if this rule were violated? Add a reference from example via subjects.
```

Each message carries the form's own question. Answer it in the node, and run `plan` again.
