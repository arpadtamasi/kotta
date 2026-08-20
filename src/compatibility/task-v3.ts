/**
 * One-version compatibility for the v3 `contract` vocabulary.
 *
 * New writes use task names. These helpers only expose old command aliases and normalize old stored
 * keys at read boundaries so an operator can inspect the workspace before running `kotta migrate`.
 */

export const LEGACY_TASK_COMMAND = "contract";
export const PREVIOUS_WORKSPACE_SCHEMA_VERSION = 3;
export const LEGACY_TASK_SKILL_RENAMES: Readonly<Record<string, string>> = {
  "close-contract": "close-task",
  "define-contract": "define-task",
  "design-by-contract": "design-by-task",
  "execute-contract": "execute-task",
  "start-contract": "start-task",
};

const warned = new Set<string>();

export function legacyTaskMigrationMessage(scope = "This workspace"): string {
  return `${scope} uses the deprecated 'contract' vocabulary. Run 'kotta migrate --dry-run', then 'kotta migrate'; identifiers remain unchanged.`;
}

export function warnLegacyTaskVocabulary(scope = "this workspace"): void {
  if (warned.has(scope)) return;
  warned.add(scope);
  process.stderr.write(`Warning: ${legacyTaskMigrationMessage(scope)}\n`);
}

/** Return a task-vocabulary read view without mutating the parsed legacy record. */
export function readTaskVocabulary(input: Record<string, unknown>): Record<string, unknown> {
  const data = { ...input };
  if (data.tasks === undefined && Array.isArray(data.contracts)) data.tasks = data.contracts;
  if (data.task === undefined && data.contract !== undefined) data.task = data.contract;
  if (data.related_task === undefined && data.related_contract !== undefined) data.related_task = data.related_contract;
  if (data.disposition === "create-contract") data.disposition = "create-task";
  if (data.disposition === "attach-to-existing-contract") data.disposition = "attach-to-existing-task";
  if (data.authority && typeof data.authority === "object" && !Array.isArray(data.authority)) {
    const authority = { ...(data.authority as Record<string, unknown>) };
    if (authority.create_subtasks === undefined && authority.create_subcontracts !== undefined) authority.create_subtasks = authority.create_subcontracts;
    if (authority.reorder_independent_tasks === undefined && authority.reorder_independent_contracts !== undefined) authority.reorder_independent_tasks = authority.reorder_independent_contracts;
    data.authority = authority;
  }
  for (const legacy of ["contracts", "contract", "related_contract"] as const) delete data[legacy];
  return data;
}

export function readTaskEvent(input: Record<string, unknown>): Record<string, unknown> {
  const data = readTaskVocabulary(input);
  if (typeof data.action === "string" && data.action.startsWith("contract.")) {
    data.action = `task.${data.action.slice("contract.".length)}`;
  }
  return data;
}
