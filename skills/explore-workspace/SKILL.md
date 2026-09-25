---
name: explore-workspace
description: This skill should be used when the user asks "what does the spec say about X?", "which nodes touch this?", "find overlaps or duplicates in the specification", "what is still open?", "what has no evidence?", or asks about a theme across the Kotta technical specification and its legacy archive.
---

# Explore a Kotta workspace

Perform read-only analysis over the repository's technical specification under `.kotta/spec/`. Treat the conversation as the interface: answer the user's actual question instead of proposing a separate dashboard or stopping after an inspection plan.

1. Locate the repository root and `.kotta/config.yaml`. Read `.kotta/spec/forms/*.yaml` first: the registry says which forms exist, where their nodes live, and which edges they answer. Never assume the eleven shipped forms; a project may register its own.
2. Read the nodes under each form's directory. Every node is one Markdown file: `id`, `form`, `title`, the required fields and the edges in the frontmatter, the required sections in the body. Follow edges by id in both directions — what a node names, and what names it.
3. Ask the CLI before deriving by hand: `kotta validate` for what does not satisfy its form, `kotta gap` for which accepted promises have no evidence in the code (and which enforcement has no spec behind it), `kotta questions` for which drafts still carry an open question. Where the Kotta MCP tools are available, `spec_list`, `spec_show`, `workspace_validate`, `workspace_questions` and `gap_report` are the same reads.
4. Inspect `.kotta/legacy/` only when the user asks about history. It is a read-only archive of the pre-1.0 process state — tasks, observations, batches, decisions — and can explain why a node says what it says. Nothing in it governs anything now, and nothing may be written there.
5. Compare titles, sections, edges and admissions. Never infer a relationship from title similarity alone; two nodes overlap when they promise the same observable thing or cite the same evidence.
6. Separate results into the smallest useful groups, such as direct matches, the nodes that name them, overlap or duplicate candidates, admitted gaps, open questions, and adjacent context. Omit empty groups.
7. Render every reported node as a Markdown link with its title first and its exact identifier after, such as `[Export a report](.kotta/spec/use-cases/export-a-report-8kq3m2vp.md) · UC-…8kq3m2vp`. Link the node's canonical file.
8. Distinguish observed facts from interpretation. Explain the concrete reason for every non-obvious relationship and call out uncertainty.
9. Return the substantive answer as concise GitHub-Flavored Markdown. Use tables only when comparing repeated fields across several nodes; otherwise prefer short prose and lists.

Remain read-only. Do not create or edit nodes, do not write admissions, and do not touch `legacy/`. End with optional next actions only when they are useful, and make clear that each requires an explicit human request.

## Common requests

- For "what does the spec say about `<topic>`?", search titles, sections and glossary terms, including synonyms and likely domain terms; report the nodes with the sentence that answers, and say when nothing does.
- For "which nodes touch `<id>`?", start from the named node, then follow every edge in and out, to the depth the question needs.
- For "find overlaps or duplicates", require promise-equivalent or evidence-linked nodes and distinguish true duplicates from adjacent scope.
- For "what is still open?", read `kotta questions` and the nodes whose required edges are unanswered, then order by how much depends on them.
- For "what has no evidence?", read `kotta gap` and group by admission kind; `unimplemented` is the debt, `unexamined` is the unknown, `structural` is the measurement's boundary.
