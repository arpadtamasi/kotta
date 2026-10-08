# Measuring a drop inside a change

## Why

The question "what falls out if we drop this use case" is asked while planning, and while planning the
use cases are still in a change. `kotta spec impact` reads only the accepted specification, so it
refuses a use case that exists only in a change ("No accepted use case is named …"). The oktat-ai
session, planning its use-case hierarchy (2026-10-08), had to compute the answer with a script of its
own, and that is how it found that the teacher's test chat lacked seven shared chat rules.

## What changes

*Dropping a use case shows what falls out with it* gains one sentence: the answer can be asked of a
change's model laid over the accepted one, the way `kotta plan` sees it. `kotta spec impact` takes
`--change <name>` for this; without it nothing changes. The board is unchanged: its Hierarchy view
already reads the selected change.

## Open decisions
