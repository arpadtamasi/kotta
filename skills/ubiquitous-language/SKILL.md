---
name: ubiquitous-language
description: This skill should be used when the user asks to "define domain vocabulary", "build a glossary", "resolve naming collisions", "establish ubiquitous language", or clarify an overloaded business term.
---

# Ubiquitous language

Make domain language precise enough that product conversation, specifications, interfaces, and code
can use the same words. Persist an agreed concept as a `glossary-term` node. Prefer one sharply
bounded definition over a catalog of plausible synonyms.

## Recognize the form

Read `.kotta/spec/forms/glossary-term.yaml` before drafting. Recognize a glossary term when the same
concept appears under several names, one word carries several meanings, or an inclusion boundary
changes behavior. Repeated ordinary language is not enough; the term must matter to decisions or
system behavior.

## Run the workshop

1. Collect the phrases used for the concept and the contexts in which each appears.
2. Place contrasting examples beside one another to expose the boundary.
3. Choose the term already accepted at the widest user-facing domain boundary.
4. Define it positively, then state near misses and non-examples.
5. Replace aliases in new specification nodes; record legacy aliases only when readers still need
   them for migration.

Ask what qualifies, what almost qualifies but does not, who uses the term, and which existing word
loses if a collision exists. Draft the definition and examples from available evidence before asking
for a decision. Never ask for an alphabetic list of empty glossary entries.

Write the node under `.kotta/spec/glossary-terms/` using the registered identity and filename convention.
Use prose links to related ids when helpful; glossary terms have no mandatory edges. Keep a term in
the language in which the domain uses it, regardless of the skill's English instructions.

## When not to use

Do not use this workshop to enforce stylistic naming preferences, document generic technical terms,
or rename code without a domain decision. Do not create a glossary term for every noun. Use an
entity when identity, attributes, and invariants are the real subject.

## Worked example

`.kotta/spec/glossary-terms/available-person-0000000b.md`:

```markdown
---
id: GT-01m0aq0000000000000000000b
form: glossary-term
title: Available person
---

# Definition

A person whose confirmed availability covers every day of a staffing request's assignment window.

# Usage

Use “available person” only after applying the inclusive date rule in
BR-01m0aq00000000000000000005. Qualification is separate: an available person may still lack a
required competency.

# Non-examples

- A person available for only the first week of the assignment.
- A person whose availability is tentative rather than confirmed.
- A qualified person with no availability record for part of the requested window.
```
