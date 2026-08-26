import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { WORKSPACE_DIRECTORY_LABEL, findRepositoryRoot, hasWorkspace, processPath, workspacePath } from "../filesystem/workspace.js";
import { idFromEntityFile } from "../filesystem/entities.js";
import { validateTaskFile } from "../core/validation.js";
import { validateBatch } from "./batch.js";
import { findDecision } from "./decision.js";
import { validateClaim } from "../core/claim.js";
import { parseMarkdown } from "../core/markdown.js";
import { validateDecisionFile } from "../core/decision.js";
import { readEvents, validateEvent } from "../core/events.js";
import { controlPlaneRoot } from "../git/control-plane.js";
import { readFormRegistry, readSpecNodes, validateSpecWorkspace } from "../spec/registry.js";

/**
 * Two files claiming one id is a real identifier collision: with one stable file per entity and
 * lifecycle state in the frontmatter alone, there is no state-directory duplication left to
 * distinguish it from — a merge conflict over a transition lands on the status line, never as a
 * second copy.
 */
function duplicateIssues(located: Map<string, string[]>): Array<{ code: string; message: string; path: string }> {
  const issues: Array<{ code: string; message: string; path: string }> = [];
  for (const [id, paths] of located) {
    if (paths.length < 2) continue;
    issues.push({ code: "DUPLICATE_ID", message: `${id} appears in ${paths.length} files: ${paths.join(" and ")}.`, path: paths[paths.length - 1] });
  }
  return issues;
}

export function validateWorkspace() {
  const root = controlPlaneRoot(findRepositoryRoot());
  const errors: Array<{ code: string; message: string; path?: string }> = [];
  if (!existsSync(workspacePath(root))) {
    return { ok: false, command: "validate", data: { tasks: 0 }, errors: [{ code: "WORKSPACE_NOT_FOUND", message: `No ${WORKSPACE_DIRECTORY_LABEL} workspace exists at ${root}. Run kotta init first.`, path: root }] };
  }
  const seen = new Map<string, string[]>();
  const references: Array<{ id: string; field: "depends_on" | "blocks"; reference: string; path: string }> = [];
  const tasksDirectory = processPath(root, "tasks");
  for (const filename of existsSync(tasksDirectory) ? readdirSync(tasksDirectory).filter((name) => name.endsWith(".md")) : []) {
    const path = join(tasksDirectory, filename);
    const report = validateTaskFile(path, undefined, (decision) => Boolean(findDecision(root, decision)));
    errors.push(...report.errors);
    // The frontmatter carries identity; a minted entity's filename holds only its short suffix.
    const id = idFromEntityFile(path, filename) ?? filename.replace(/\.md$/, "");
    seen.set(id, [...(seen.get(id) ?? []), path]);
    let state = "";
    try {
      const entity = parseMarkdown(readFileSync(path, "utf8"));
      state = String(entity.data.status ?? "").trim();
      for (const field of ["depends_on", "blocks"] as const) {
        const values = Array.isArray(entity.data[field]) ? entity.data[field].map(String) : [];
        for (const reference of values) references.push({ id, field, reference, path });
      }
    } catch {
      // validateTaskFile already reports malformed frontmatter for this path.
    }
    if (state === "active") {
      const claimPath = processPath(root, "claims", `${id}.yaml`);
      if (!existsSync(claimPath)) errors.push({ code: "MISSING_CLAIM", message: `Active task ${id} has no claim.`, path });
      else {
        const claimErrors = validateClaim(parse(readFileSync(claimPath, "utf8")) as Record<string, unknown>);
        for (const message of claimErrors) errors.push({ code: "INVALID_CLAIM", message: `Claim ${id}: ${message}.`, path: claimPath });
      }
    }
  }
  errors.push(...duplicateIssues(seen));
  for (const reference of references) {
    if (!seen.has(reference.reference)) {
      errors.push({
        code: "DANGLING_REFERENCE",
        message: `${reference.id} ${reference.field} references missing task ${reference.reference}.`,
        path: reference.path,
      });
    }
  }
  const seenBatches = new Map<string, string[]>();
  const batchesDirectory = processPath(root, "batches");
  for (const filename of existsSync(batchesDirectory) ? readdirSync(batchesDirectory).filter((name) => name.endsWith(".md")) : []) {
    const path = join(batchesDirectory, filename);
    const id = idFromEntityFile(path, filename);
    if (!id) {
      errors.push({ code: "MISSING_BATCH_ID", message: `${path} has no batch id in its frontmatter.`, path });
      continue;
    }
    seenBatches.set(id, [...(seenBatches.get(id) ?? []), path]);
    const report = validateBatch(id, root);
    if (!report.ok) errors.push(...report.errors.map((error) => ({ ...error, path })));
  }
  errors.push(...duplicateIssues(seenBatches));
  const decisionsDirectory = processPath(root, "decisions");
  const decisions = existsSync(decisionsDirectory)
    ? readdirSync(decisionsDirectory).filter((name) => name.endsWith(".md"))
    : [];
  const seenDecisions = new Map<string, string>();
  for (const filename of decisions) {
    const path = join(decisionsDirectory, filename);
    errors.push(...validateDecisionFile(path));
    const id = idFromEntityFile(path, filename) ?? /^D-\d+/.exec(filename)?.[0];
    if (!id) continue;
    const previous = seenDecisions.get(id);
    if (previous) errors.push({ code: "DUPLICATE_DECISION_ID", message: `${id} appears in both ${previous} and ${path}.`, path });
    else seenDecisions.set(id, path);
  }
  let events: ReturnType<typeof readEvents> = [];
  try { events = readEvents(root); }
  catch (error) {
    errors.push({ code: "INVALID_EVENT", message: error instanceof Error ? error.message : String(error), path: processPath(root, "events") });
  }
  for (const event of events) {
    const path = processPath(root, "events", event.entity, `${event.id}.json`);
    for (const message of validateEvent(event)) errors.push({ code: "INVALID_EVENT", message: `${event.id}: ${message}.`, path });
    if (event.task && !seen.has(event.task)) errors.push({ code: "DANGLING_EVENT_TASK", message: `${event.id} references missing task ${event.task}.`, path });
  }
  // The specification carries its own schema in the form registry; until now nothing enforced it.
  const spec = validateSpecWorkspace(root);
  errors.push(...spec);
  const specNodes = readSpecNodes(root, readFormRegistry(root).forms).nodes.length;

  return { ok: errors.length === 0, command: "validate", data: { tasks: seen.size, decisions: decisions.length, events: events.length, specNodes }, errors };
}
