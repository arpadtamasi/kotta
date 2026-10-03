import { existsSync } from "node:fs";
import { basename } from "node:path";
import { WORKSPACE_DIRECTORY, assertCurrentWorkspaceShape, findRepositoryRoot, workspacePath, workspaceSchemaVersion } from "../filesystem/workspace.js";
import { validateWorkspace } from "./validate.js";
import { applyChangeMigration, planChangeMigration, type ChangeMigrationPlan } from "./migrate-changes.js";

/**
 * `kotta migrate` — carries a current workspace's changes out of OpenSpec's folder into its own
 * (UC-01m0f0wn89x00jkpqpqc2esx9h, `migrate-changes.ts`). Nothing else: a pre-1.0 workspace is refused
 * before this command runs, like before every other command, naming the last release that migrates
 * it (BR-01m0q89b16xcfasfj1z8mc2hgg), and a workspace under the pre-rename name is not found at all
 * (BR-01m413z0y4dtjs9rs718bdnm4j).
 *
 * - **Identifiers are never touched**, and the specification is left byte-identical
 *   (BR-01m0f0wn89c50fe1mz5yn1nw85).
 * - **Fail before write.** The whole plan, and every destination that already exists, is known before
 *   the first move; a conflict writes nothing.
 * - **Dry run first.** `--dry-run` computes the identical plan and writes nothing.
 */

export type MigrationChange =
  | { kind: "move"; from: string; to: string }
  | { kind: "rewrite"; path: string; fields: string[] };

/** Whether the workspace the migration produced satisfies the rules of its shape. */
export interface MigrateValidation {
  ok: boolean;
  errors: Array<{ code: string; message: string; path?: string }>;
}

export interface MigrateData {
  root: string;
  workspace: string;
  dryRun: boolean;
  current: boolean;
  fromVersion: number | null;
  changes: MigrationChange[];
  notes: string[];
  /** Null when nothing was written: there is no produced workspace to judge. */
  validation: MigrateValidation | null;
}

export interface MigrateResult {
  ok: true;
  command: "migrate";
  data: MigrateData;
}

/** The change migration, in the report's own terms. */
function planned(plan: ChangeMigrationPlan): MigrationChange[] {
  const changes: MigrationChange[] = [];
  for (const entry of plan.moves) {
    changes.push({ kind: "move", from: entry.from, to: entry.to });
    for (const file of entry.rewrite) changes.push({ kind: "rewrite", path: `${entry.to}/${file}`, fields: [`provenance sources ${entry.from}/ → ${entry.to}/`] });
  }
  if (plan.narrative) changes.push({ kind: "rewrite", path: `${WORKSPACE_DIRECTORY}/config.yaml`, fields: ["narrative: generated (openspec/specs/ is kept, as it was before narrative defaulted to none)"] });
  return changes;
}

export function migrateWorkspace(options: { dryRun?: boolean } = {}, repositoryRoot?: string): MigrateResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  // `--workspace` can point past the CLI's own shape check, so the refusal is repeated here.
  assertCurrentWorkspaceShape(root);
  if (!existsSync(workspacePath(root))) throw new Error(`No Kotta workspace exists at ${root}. Run 'kotta init' first.`);
  const dryRun = Boolean(options.dryRun);
  const workspace = workspacePath(root);
  const fromVersion = workspaceSchemaVersion(root);
  const plan = planChangeMigration(root, WORKSPACE_DIRECTORY);
  const changes = planned(plan);
  if (!changes.length) {
    return { ok: true, command: "migrate", data: { root, workspace, dryRun, current: true, fromVersion, changes, notes: [], validation: null } };
  }
  let validation: MigrateValidation | null = null;
  if (!dryRun) {
    applyChangeMigration(root, WORKSPACE_DIRECTORY, plan);
    const report = validateWorkspace(root);
    validation = { ok: report.ok, errors: report.errors };
  }
  return { ok: true, command: "migrate", data: { root, workspace, dryRun, current: false, fromVersion, changes, notes: plan.notes, validation } };
}

export function formatMigration(result: MigrateResult): string {
  const { data } = result;
  if (data.current) return `${data.workspace} has no change left in OpenSpec's folder; nothing to migrate.`;
  const lines = [
    `kotta migrate${data.dryRun ? " --dry-run" : ""} — the changes ${data.dryRun ? "would move" : "moved"} out of OpenSpec's folder into ${basename(data.workspace)}/changes/.${data.dryRun ? " Nothing was written." : ""}`,
  ];
  for (const change of data.changes) {
    if (change.kind === "move") lines.push(`  move       ${change.from} → ${change.to}`);
    else lines.push(`  rewrite    ${change.path}: ${change.fields.join(", ")}`);
  }
  lines.push("  the specification is left byte-identical.");
  for (const line of validationLines(data.validation)) lines.push(line);
  for (const note of data.notes) lines.push(`\n${note}`);
  return lines.join("\n");
}

/**
 * The migration says whether what it produced satisfies the rules of its shape. It reports; it
 * never repairs, and it never turns a completed migration into a failure.
 */
export function validationLines(validation: MigrateValidation | null): string[] {
  if (!validation) return [];
  if (validation.ok) return ["\nThe migrated workspace validates: 'kotta validate' finds nothing to report."];
  const lines = [
    `\nThe migration finished, but the specification does not validate: ${validation.errors.length} problem${validation.errors.length === 1 ? "" : "s"}. The changes moved; these are what is left to fix.`,
  ];
  for (const error of validation.errors.slice(0, 10)) lines.push(`  ${error.code}  ${error.message}`);
  if (validation.errors.length > 10) lines.push(`  ... and ${validation.errors.length - 10} more; run 'kotta validate' for the full report.`);
  return lines;
}
