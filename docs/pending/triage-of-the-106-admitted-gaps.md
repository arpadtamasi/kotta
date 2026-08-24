# Triage of the 106 admitted gaps

Read-only measurement, 2026-08-24, at main@f355d54. No lifecycle change; nothing here was acted on.

## Why the number was worth taking apart

`kotta gap` reports 106 admitted gaps. Every one of them carries the same sentence, written in bulk
on 2026-08-23, saying it was not examined individually. Read as a backlog, 106 is alarming. Read
carefully, it is three different things wearing one label.

## By form

| Form | Count | What an admission means for this form |
| --- | --- | --- |
| example | 36 | A test should prove it, and can name it |
| business-rule | 18 | Code should enforce it, and can name it |
| use-case | 13 | Realised by many sites; none names it |
| glossary-term | 10 | Vocabulary; nothing to enforce |
| entity | 8 | Shape realised across readers and writers |
| quality-attribute | 5 | Measured by a suite, rarely at one site |
| goal | 5 | An outcome, not a code site |
| interface | 4 | A whole surface, not a line |
| actor | 3 | A role, not a call |
| user-story | 3 | An outcome, not a code site |
| state-machine | 1 | Realised across every transition |

**52 of the 106 are the lower nine rows.** They are not unimplemented: they are nodes no single code
site would ever name, because many sites realise each of them. Counting them as debt measures the
instrument, not the system.

**54 are examples and business rules** — the two forms that can and should be named where they are
proven or enforced.

## Inside the 54

Six business rules were checked directly against the code, and all six are enforced:

| Rule | Enforced at |
| --- | --- |
| Execution never touches a protected branch | `src/commands/task.ts:315` |
| Control-plane writes are serialized | `src/git/control-plane.ts:97` |
| Consequential transitions are human gates | `src/core/approval-receipt.ts:16` |
| Identifiers are permanent | `src/commands/migrate.ts:214,256` |
| One task, one claim | `src/commands/task.ts:282` |
| The record derives from the run | `src/commands/execute.ts:41,198` |

The example titles match existing test files one for one in the cases checked —
`approval-receipt`, `batch-nesting`, `batch-dependency-waves`, `migrate`, `review-evidence`,
`list`, `gap-report`, `brief`, `board-reads-only`. Four titles that looked like plausible
absences — release canary, quickstart, recognition, onboarding — each have code, tests or site
content behind them.

**This was sampling, not exhaustion.** Six of eighteen rules and roughly a third of the examples
were checked. What the sample shows is that the dominant case is *implemented and unnamed*, not
*unimplemented*.

## What this means for a 1.0 estimate

The honest reading: the genuine implementation debt is far smaller than 106, plausibly under ten.
It cannot be stated more precisely without examining the remaining forty-odd, and that examination
is worth less than the change it points to.

## What the measurement points to instead

The number is not too big; it is undifferentiated. An admission that says "nobody looked" reads the
same as one that says "many sites realise this and none can name it", and the two demand opposite
responses. Making the admission carry its kind — inherited-unexamined, structural, or genuinely
unimplemented — turns 106 into a number whose movement means something. The ratchet then keeps its
force without the count misleading anyone who reads it.
