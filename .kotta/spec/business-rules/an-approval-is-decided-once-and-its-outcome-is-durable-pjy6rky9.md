---
id: BR-01m0vqr9k64ht9h70fpjy6rky9
form: business-rule
title: "An approval is decided once, and its outcome is durable"
---

## Rule

An approval reaches exactly one terminal phase and keeps it. A decision on an approval that already ended returns the phase it ended in, and applies nothing a second time. Where the mutation fails after the human said yes, the failure is recorded as the approval's own terminal phase, carrying the error, and the transition is not reported as successful. A proposal that no longer names a possible transition is refused when it is prepared, not silently applied later.

## Rationale

The receipt is only worth what its finality is worth. If a yes could be replayed, one human decision could produce two transitions; if a failed application could pass for a successful one, the record would claim a state the workspace is not in. Both failures are invisible at the moment they happen and expensive afterwards, because everything downstream reads the record rather than the repository.

## Scope

Every approval, from the moment it is proposed. The rule governs the approval's own lifecycle; what the approved mutation then does is governed by that transition's own rules.
