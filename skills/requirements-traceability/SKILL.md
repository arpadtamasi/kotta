---
name: requirements-traceability
description: This skill should be used when the user asks to "check requirements coverage", "find dangling specification edges", "run traceability", "show accepted gaps", "validate a custom form", or "analyze the impact" of changing a specification node id.
---

# Requirements traceability

Read the form registry and specification nodes as a graph. Report malformed nodes, broken
references, unanswered required edges, explicitly accepted gaps, and reverse dependency impact.
Remain read-only: this report never changes files, runs a lifecycle transition, or gates a definition,
review, close, validation, build, or deployment.

Treat the registry as the only source of form-specific knowledge. Never hard-code the eleven
shipped forms, their directories, edge fields, or required relationships into the analysis. A
complete `.kotta/spec/forms/risk.yaml` must participate exactly like a bundled form without a code or
skill change.

## Choose the mode

Run **coverage mode** by default. Load the registry, discover every node, and produce a ranked work
list plus accepted gaps.

Run **impact mode** when given a node id. Produce the same structural diagnostics when useful, then
list every node that references the target directly or indirectly. Do not interpret “impact” as
permission to edit dependants.

## Start from the structural pass Kotta already ran

`kotta validate` reads the form registry and measures every node against it: required frontmatter
fields, required body headings, duplicate ids, outgoing edges below their `minimum`, references that
resolve to nothing, references that resolve to the wrong form, a malformed or contradictory form
file, and any node or form that names a task. Run it first and treat its findings as given.

Do not repeat those checks by reading the YAML yourself. They are enforced now, which means a
workspace that passes `kotta validate` has no structural errors left for this report to find, and a
workspace that fails it has errors this report should not restate. Report them as **structural
errors**, quoting the validator, and spend this pass on what it does not do.

## Discover and normalize nodes

For each form, scan `<workspace>/spec/<directory>/*.md`. Do not scan a hard-coded directory list.
Parse YAML frontmatter and the Markdown body, then build one map keyed by full `id`.

What remains for this pass, because the validator does not judge it:

1. `form` equals the registry id for the directory.
2. Every full id follows the registered identity prefix and lowercase Crockford ULID shape, and every
   filename ends in `-<last 8 id characters>.md` with a non-empty slug before it.
3. Frontmatter edges are ids, never titles or slugs.

Keep Mermaid and all other body notation opaque; only headings and textual content are canonical for
this pass.

Collect references from every frontmatter scalar or list item shaped as an entity id, excluding the
node's own `id`. The validator resolves the references a form declares as required edges; this pass
adds the optional ones it never looks at. Resolve each against the full-id map, and report every
unresolved id as a **broken-reference error** with the referring file and frontmatter field. Never
waive a broken reference through `accepted`.

## Evaluate required edges

Evaluate each registry edge literally:

- For `outgoing`, inspect the declared `fields` on a node whose form is in `source_forms`; count only
  resolved references whose form is in `target_forms`.
- For `incoming`, inspect the declared `fields` on all nodes in `source_forms`; count references to
  the current node only when its form is in `target_forms`.
- Count unique adjacent ids and compare the count with `minimum`.

One physical edge may satisfy requirements at both ends. For example, an example's `subjects` edge
both gives that example a subject and supplies incoming evidence for the referenced story. Do not
require or synthesize reciprocal frontmatter.

For every unsatisfied edge, use the exact `question` from the registry. Name the node by title, then
show its id and file. Produce one work item per unsatisfied required edge; do not merge several
registry questions into a generic prompt.

## Handle accepted gaps

Interpret `accepted` as a list of strings in the form `<edge-or-form>: <reason>`. Require a
non-empty key and reason. A key may match the required edge's `name`, one of its `fields`, or one of
the forms at the missing end. Examples include:

```yaml
accepted:
  - "evidence: discovery story; examples start after the policy workshop"
  - "state-machine: the v1 entity has no lifecycle"
  - "implementation: the exporter ships after the policy workshop; nothing implements this yet"
```

`kotta gap` reads three admission kinds — `structural`, `unexamined`, `unimplemented` — and this is
not optional bookkeeping: a node with no evidence and no such entry makes the command refuse
(BR-01m0qtshfqhcrrqtz051zm9svr), and so does an admission that names no kind
(BR-01m0swjgrreeby1pyfdzf4mf7d). Choose `structural` when many sites realise the promise and none
could name it, `unexamined` when nobody has looked yet, `unimplemented` when someone looked and it
is not built. Write the reason for a reader who will meet it a year from now, and delete the entry
when the promise is kept.

When an accepted entry matches a missing required edge, remove the question from the work list and
place the entry under **Accepted gaps** with its reason. Also list well-formed accepted entries for
optional absences, such as an entity explicitly having no state machine. Treat accepted absence as
visible knowledge, not success and not an error. Report an accepted entry with no reason as a node
error.

## Rank and render coverage

Rank results in this order:

1. Registry errors, because an invalid rule cannot be applied reliably.
2. Broken-reference and node errors, because the graph is factually inconsistent.
3. Unanswered required edges, ordered by how many resolved nodes depend directly and indirectly on
   the affected node, then by title.
4. Accepted gaps, separate from the work list and never styled as failures.

Render a concise report with counts and reproducible locations:

```markdown
# Traceability report

Registry: <forms> forms · Nodes: <nodes> · Errors: <errors> · Questions: <questions>

## Ranked work list
1. [error|question] <title> · <id> — <message or exact registry question>
   <relative-file>: <field when relevant>

## Accepted gaps
- <title> · <id> — <key>: <reason>
```

Omit empty sections. When the registry is valid and no specification nodes exist, return only
`No specification nodes; no traceability work.` This state has no question and no error. When nodes
exist but nothing hangs, return the counts followed by `No traceability work.`

## Analyze impact

Resolve the requested full or unambiguous short id from node frontmatter. Build graph adjacency from
all resolved frontmatter references, including optional edges. Reverse the adjacency and traverse
breadth-first from the target:

1. List direct referrers at distance 1.
2. List indirect referrers by increasing distance.
3. Show one shortest path from each referrer to the target, including field names.
4. Visit each id once to terminate cycles; mention additional direct paths without expanding them
   repeatedly.

Render the target first, followed by **Direct impact** and **Indirect impact**. State `No referrers`
when both are empty. A node reached through a broken edge is not impact evidence; keep that edge in
the error list instead.

## When not to use

Do not use this skill to judge whether linked statements contradict one another, to invent missing
requirements, or to make completeness a release gate. Do not report absent forms: specification is
optional, and only existing nodes incur their registered required edges. Do not rewrite nodes while
reporting; hand proposed content to the relevant workshop skill after the operator chooses an item.
