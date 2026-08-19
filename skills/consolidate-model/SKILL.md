---
name: consolidate-model
description: Find where one concept lives under several names across code, docs, wire schemas and storage — then propose consolidations in chat for the human to decide. Use periodically, or when a rename migration closes, a boundary type feels duplicated, or the vocabulary in conversation stops matching the vocabulary in the code.
---

# Consolidate the model

A codebase drifts by accumulating **second names for things that already have one**. The
drift is invisible in conversation, because both sides hear a familiar word. It surfaces
much later as a translation layer nobody owns, or as a domain-model split.

This skill finds those collisions and **proposes consolidations in chat**. That is all it does.

## The hard rule

**This skill creates nothing.** No file, no wiki page, no contract, no observation, no
decision, no commit. It reads, it compares, it proposes. Every proposal is a sentence the
human accepts, rejects, or rewrites.

The reason is not caution. A collision list that writes itself into a backlog becomes 40
more items to triage, and the triage queue is already the bottleneck. The value here is the
**adjacency** — putting two facts next to each other so a human sees the collision — not the
paperwork.

If the human decides a proposal should become work, they say so, and the normal Kotta path
takes over (`kotta observation new`, or a contract). Never anticipate that.

Say which step you are in: `scoping` → `reading` → `comparing` → `proposing`.

## 1. Scope it

Ask which repository or repositories, unless the human already said. One repo is the normal
case; two adjacent repos is worth it when they share a domain or a wire protocol, because
the boundary between them is where collisions hide.

Then locate, and say what you found:

- **Type sources** — the exported domain types (`libs/`, `src/core/`, `src/model/`).
- **Wire and storage** — request/response schemas, stored document field names.
- **User-facing vocabulary** — the spec, glossary, or README that states what things are
  called *to a person*. In a Kotta workspace also `.kotta/process/decisions/`.
- **Capability docs** — user story maps, requirement docs, anything shaped as
  "as a X I want Y".

If a repo has no user-facing vocabulary and no capability docs, say so plainly. Three of the
five checks read those documents and will find nothing without them, so the run is thin. That
is a finding in itself, not a failure — a project with no stated vocabulary cannot drift from
it, but it also cannot tell anyone what its words mean.

## 2. Run the five checks

Run all five. Each has a cheap mechanical core; the judgement is in what you *do not* report.

### Check 1 — One concept, several names

For each central concept, list every surface's name for it: exported type, wire field,
stored field, user-facing word, CLI output.

```bash
# example shape: the same idea under different labels
grep -rn "interface \|type .* = \|export const" libs/*/src --include='*.ts' | head -50
```

Report when two or more distinct names refer to the same thing. Include every surface, even
the ones that agree — the agreement is what makes the outlier visible.

### Check 2 — The same word at a different level

**The highest-value check, and the one a conversation never catches.**

Extract every hierarchy statement from the docs — `a > b > c`, `x < y < z`, "each A contains
several B". Compare them pairwise. If the same word sits at a different position in two
hierarchies, that is a collision of the worst kind: both speakers hear a word they know, and
mean different things.

Report the two hierarchies side by side, with the moved word marked.

### Check 3 — A central type re-declared instead of imported

```bash
# a type declared in more than one place
grep -rn "^\(export \)\?interface <Name>\|^\(export \)\?type <Name>" --include='*.ts' .
# an exported symbol nothing in its own package calls
grep -rn "<symbol>" src | grep -v "<its home file>"
```

Two signals, both worth reporting:

- The same type name declared in two modules, where one could import the other.
- An exported helper with **zero callers in its own package** — the design decided
  something, and the surfaces that need it re-implemented it instead.

### Check 4 — Orphan residue from a closed migration

Read the **Non-goals** of closed contracts, and the transitional notes in specs. Look for
things deliberately left behind: an old field name kept for compatibility, an old directory
name still read, a legacy artefact still parsed.

For each one, ask two questions:

1. Does the named thing still exist?
2. Does anything — a decision, a contract, an observation, a dated note — say **when it goes away**?

Report only when the answer is *yes* then *no*. Deliberate residue with an expiry is fine and
should not be reported. Deliberate residue without one is the finding: the contract preserved
the decision and nobody preserved the deadline.

### Check 5 — A missing edge between two documents

Find documents that state a hard limit — a measured threshold, a sampling caveat, a known
inaccuracy — and check whether the capability documents that *depend* on that limit reference
it. Then check the reverse.

Report the pair and the direction of the missing link. This is the cheapest fix in the whole
skill and usually the most useful: one line in one file.

## 3. Decide what wins

A proposal that does not name a winner is not a proposal. Apply this order:

1. **The accepted user-facing vocabulary wins**, when the project has one. If a spec says
   "these are the words the product uses", that is the answer, and the code is what moves.
2. **Otherwise, the name a decision record names wins.** It was already argued.
3. **Otherwise, the name at the widest boundary wins** — the wire or storage name, because it
   has the most external readers.
4. **Code-internal convenience never wins.** A name that exists because it was easier to type
   is the one that changes.

When none of these settle it, say so and put the choice to the human rather than picking.

## 4. Propose, in chat

**Put first what nobody could have found on their own.**

Two names for one thing, and a type declared twice, are findable: they look wrong, and anyone
who suspects them can grep the name and see it. Report them, but lower.

The same word at a different level, and a leftover with no deadline, are not findable. Nothing
about them looks wrong — the word is familiar to everyone who says it, and the leftover was
written down on purpose. Nobody goes looking, so nobody finds them. **Those go first.**

Within each half, order by how much depends on the collision.

For each finding, four short parts and nothing else:

- **Collision** — one sentence.
- **Evidence** — `file:line` rows, one per surface. No prose here.
- **Proposal** — the winner, the rule that picked it, and what moves.
- **Cost** — roughly what changes: a rename, a link, a date, a delete.

Cap it. Six findings that a human will read beat twenty that get skimmed. State plainly how
many you dropped and why, so the list never reads as exhaustive when it is not.

Close with the one question worth asking: **which of these should become work?** Then stop.

## Guardrails

- **Do not widen the atom set.** Entity, actor, capability, decision, constraint. If a sixth
  seems necessary, it is almost certainly a field of one of the five. This skill is not the
  start of an ontology project, and a Kotta non-goal says so.
- **Do not report style.** A shorter name, a nicer word, a more consistent casing — not this
  skill's business. A collision means two names for one thing, not one name you dislike.
- **Do not invent vocabulary.** If the project has a word, use the project's word, including
  in your own proposal text. Introducing a parallel vocabulary while reporting parallel
  vocabularies is the failure mode this skill exists to prevent.
- **Do not render an artifact** unless asked. The default output is chat.
- **Separate observed facts from hypotheses**, and label them. "These two names refer to the
  same thing" is a claim — verify it by reading both definitions, not by their similarity.
