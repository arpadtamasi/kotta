# Legacy process archive

This directory is a **read-only archive of the pre-1.0 Kotta process state**: the tasks,
observations, batches, claims, events, decisions, profiles and the generated index that the
process engine of the 0.x releases kept under `process/`.

`kotta migrate` (Kotta 1.0.0-alpha.1) moved it here from workspace shape version 5.
The records are stored in the last pre-1.0 shape (version 5): one file per entity, lifecycle state
in the frontmatter `status` field. Older vocabulary was carried to that shape on the way in;
no identifier, filename or reference value was changed, and the specification beside it was
left byte-identical.

Kotta 1.0 owns the technical specification and has no task, claim, batch, observation or
decision. Nothing in it reads or writes this directory. To work with these records as they
were, install the last pre-1.0 release: `npx -y -p @arpadtamasi/kotta@0.11.1 kotta --help`.
