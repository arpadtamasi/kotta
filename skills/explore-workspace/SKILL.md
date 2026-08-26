---
name: explore-workspace
description: This skill should be used when the user asks "what needs my decision?", "find related work", "where else is this topic?", "find overlaps or duplicates", "explain the backlog", or asks about a theme across Kotta tasks, observations, batches, decisions, and migration history.
---

# Explore a Kotta workspace

Perform read-only portfolio analysis over the repository's canonical `.kotta/` workspace. Treat the conversation as the interface: answer the user's actual question instead of proposing a separate dashboard or stopping after an inspection plan.

1. Locate the repository root and `.kotta/config.yaml`. Read `.kotta/process/index.md` for orientation, then inspect the relevant canonical files rather than relying on the index summary alone.
2. Search `.kotta/process/tasks/`, `.kotta/process/observations/`, and `.kotta/process/batches/`; each entity's lifecycle state is its frontmatter `status` field. Read `.kotta/process/decisions/` to distinguish durable human decisions from still-open decision sections. Include resolved history when it can explain a decision, duplicate, supersession, or dependency.
   Durable decision records are created only with `kotta decision create --from <draft.md> --approve`; exploration remains read-only and never hand-edits `.kotta/process/decisions/`.
3. Ask `kotta sweep` what has stopped and `kotta questions` what still waits on a human answer, entity by entity, before deriving either by hand from the files.
4. Inspect `.kotta/migration.json` when present. Follow `source_file`, legacy identifiers, split records, and excluded-terminal records when current files do not contain enough evidence.
5. Compare outcome, scope, evidence, lifecycle state, dependencies, decisions, and batch membership. Never infer a relationship from title similarity alone.
6. Separate results into the smallest useful groups, such as direct matches, dependencies, overlap or duplicate candidates, adjacent context, resolved history, and items needing a human decision. Omit empty groups.
7. Render every reported canonical entity as a Markdown link with its exact identifier, such as `[O-97](.kotta/process/tasks/O-97-example.md)`. Link the entity's current canonical file; for migration-only history, link the validated `source_file` when available.
8. Distinguish observed facts from interpretation. Explain the concrete reason for every non-obvious relationship and call out uncertainty.
9. Return the substantive answer as concise GitHub-Flavored Markdown. Use tables only when comparing repeated fields across several items; otherwise prefer short prose and lists.

Remain read-only. Do not create tasks or observations, edit priority, reshape batches, or perform lifecycle transitions. End with optional next actions only when they are useful, and make clear that each requires an explicit human request.

## Common requests

- For "find related work for `<id>`", start from the named entity, then search tasks, observations, batches, dependencies, migration metadata, and resolved history for shared evidence or outcome.
- For "where else is `<topic>`?", search both prose and metadata, including synonyms and likely domain terms; report task and observation matches together.
- For "find overlaps or duplicates", require outcome-equivalent or evidence-linked work and distinguish true duplicates from adjacent scope.
- For "what needs my decision?", compare task open-decision sections with durable records under `.kotta/process/decisions/`, then prioritize genuinely unresolved choices, blocked work, unresolved observations, review items, and backlog items whose progress depends on human intent.
- For "explain the backlog", cluster by outcome or decision seam, identify unbatchd work, and flag clusters whose batch structure is misleading or absent.
