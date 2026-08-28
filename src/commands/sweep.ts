import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";
import matter from "gray-matter";
import { readWorkspaceConfig } from "../core/config.js";
import { readEvents } from "../core/events.js";
import { listEntities, findTask } from "../filesystem/entities.js";
import { findRepositoryRoot, processPath } from "../filesystem/workspace.js";
import { controlPlaneRoot } from "../git/control-plane.js";
import { linkedWorktrees } from "../git/coordinator.js";
import { git } from "../git/git.js";

/**
 * What has stopped, and why (UC-01m0f0wn89m98wpkqq8e5c9p6p).
 *
 * `status` answers how many; this answers which and what to do. The question was asked six times
 * in one session and answered six times by hand, because nothing derived it. Every category here
 * is read from what tasks, batches, observations, claims and Git already say: a category needing
 * a new stored field does not belong, and nothing on this path writes.
 */

/** Ordered by what standing still costs, which is also the order the report prints. */
export const SWEEP_CATEGORIES = [
  "waiting-on-you",
  "stalled",
  "undeclared-deviation",
  "dangling-batch",
  "never-started",
  "drift",
  "undispositioned",
] as const;

export type SweepCategory = typeof SWEEP_CATEGORIES[number];

export interface SweepItem {
  category: SweepCategory;
  id: string;
  title: string;
  /** Why it is here, in the reader's terms — naming the threshold when one decided. */
  reason: string;
  /** The single thing that would move it. */
  action: string;
  /** Days since the fact that stopped it, or null where age is not what put it here. */
  ageDays: number | null;
}

export interface SweepThresholds {
  /** Hours without a commit on its branch after which an active task counts as stalled. */
  stalledHours: number;
  /** Days in `new` after which an observation counts as undispositioned. */
  undispositionedDays: number;
}

export const SWEEP_DEFAULTS: SweepThresholds = { stalledHours: 4, undispositionedDays: 7 };

const DAY = 86_400_000;

function daysSince(when: string | number | null | undefined, now: number): number | null {
  if (when === null || when === undefined) return null;
  const at = typeof when === "number" ? when : Date.parse(String(when));
  return Number.isFinite(at) ? Math.max(0, Math.floor((now - at) / DAY)) : null;
}

/** The frontmatter of an entity file, or an empty record when it cannot be read. */
function frontmatter(path: string): Record<string, unknown> {
  try {
    return matter(readFileSync(path, "utf8")).data as Record<string, unknown>;
  } catch {
    return {};
  }
}

/** One section of a task's review evidence, trimmed; empty when the section is absent. */
function reviewSection(body: string, heading: string): string {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `### ${heading}`);
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("#"));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
}

/** Text a caller wrote to say there was nothing to declare. */
function declaredNothing(text: string): boolean {
  const normalised = text.toLowerCase().replace(/[.\s]+$/, "");
  return !normalised || normalised === "none" || normalised === "not declared" || normalised === "n/a";
}

export interface SweepResult {
  ok: true;
  command: "sweep";
  data: {
    thresholds: SweepThresholds;
    items: SweepItem[];
    counts: Record<string, number>;
    /** A validation failure is reported, never fatal: a broken workspace is when this is needed. */
    unreadable: string[];
  };
}

export function sweep(repositoryRoot?: string, overrides: Partial<SweepThresholds> = {}, clock = Date.now()): SweepResult {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const thresholds = { ...SWEEP_DEFAULTS, ...overrides };
  const items: SweepItem[] = [];
  const unreadable: string[] = [];

  const tasks = listEntities(root, "task");
  const batches = listEntities(root, "batch");
  const observations = listEntities(root, "observation");

  for (const task of tasks) {
    const data = frontmatter(task.path);
    if (!Object.keys(data).length) unreadable.push(task.path);
  }

  // 1. waiting-on-you — a human gate holding the work, from either side.
  for (const task of tasks.filter(({ state }) => state === "review")) {
    items.push({
      category: "waiting-on-you",
      id: task.id,
      title: task.title,
      reason: "submitted for review; nothing moves until it is accepted or sent back",
      action: `kotta task close ${task.id} --approve, or kotta task reopen ${task.id} --approve`,
      ageDays: daysSince(String(frontmatter(task.path).updated_at ?? ""), clock),
    });
  }
  for (const pending of pendingApprovals(root)) {
    // An undecided proposal on work that has since finished is not waiting on anyone: answering it
    // would change nothing. The record and the entity's own history disagree, which is drift.
    const settled = stateOf(tasks, pending.entity) === "done";
    items.push({
      category: settled ? "drift" : "waiting-on-you",
      id: pending.entity,
      title: settled ? titleOf(tasks, pending.entity) : pending.action,
      reason: settled
        ? `${pending.action} was proposed and never answered, and the task reached done another way`
        : `${pending.action} was put to you and never answered`,
      action: settled
        ? "nothing closes a stale proposal today; it stays in the event log as an open question the work went around"
        : "answer it in the conversation that proposed it",
      ageDays: daysSince(pending.created_at, clock),
    });
  }

  // 2. stalled — claimed, and the branch has not moved.
  for (const claim of claimRecords(root)) {
    const branch = typeof claim.branch === "string" ? claim.branch : null;
    if (!branch) continue;
    const last = lastCommitAt(root, branch);
    if (last === null) continue;
    const idleHours = (clock - last) / 3_600_000;
    if (idleHours < thresholds.stalledHours) continue;
    const id = String(claim.task ?? "");
    items.push({
      category: "stalled",
      id,
      title: titleOf(tasks, id),
      reason: `active and claimed, but ${branch} has no commit for ${Math.floor(idleHours)}h (threshold ${thresholds.stalledHours}h)`,
      action: `look in the worktree, or kotta claim release ${id} --force`,
      ageDays: daysSince(last, clock),
    });
  }

  // 3. undeclared-deviation — the review said it deviated and recorded that nowhere else.
  //
  // "Nowhere else" is the link an observation carries, not only the prose written beside the
  // deviation at review time (UC-01m0f0wn89dy38s6whbfa0jafn). That section is written once, at
  // submission; on a done task nothing can change it, so reading it alone made this category
  // unclearable by the very command the item recommends.
  const recordedDuring = new Set(observations
    .map(({ path }) => String(frontmatter(path).discovered_during ?? "").trim())
    .filter(Boolean));
  for (const task of tasks.filter(({ state }) => state === "done")) {
    let body = "";
    try { body = matter(readFileSync(task.path, "utf8")).content; } catch { continue; }
    const deviations = reviewSection(body, "Deviations");
    if (declaredNothing(deviations)) continue;
    // Either record answers it: the prose an agent wrote at review, or an observation naming the
    // task it was discovered during. Nothing accounted for before becomes an item now.
    if (!declaredNothing(reviewSection(body, "Observations created"))) continue;
    if (recordedDuring.has(task.id)) continue;
    items.push({
      category: "undeclared-deviation",
      id: task.id,
      title: task.title,
      reason: "closed with a declared deviation that no observation records",
      action: `kotta observation new --title "…" --type <type> --evidence "…" --discovered-during ${task.id} for what the deviation left behind`,
      ageDays: daysSince(String(frontmatter(task.path).updated_at ?? ""), clock),
    });
  }

  // 4. dangling-batch — it finished and nobody closed it.
  for (const batch of batches.filter(({ state }) => state === "active")) {
    const members = memberTasks(batch.path);
    if (!members.length) continue;
    if (!members.every((member) => stateOf(tasks, member) === "done")) continue;
    items.push({
      category: "dangling-batch",
      id: batch.id,
      title: batch.title,
      reason: `active while all ${members.length} member tasks are done`,
      action: `kotta batch close ${batch.id} --approve`,
      ageDays: daysSince(String(frontmatter(batch.path).updated_at ?? ""), clock),
    });
  }

  // 5. never-started — a batch promised it and skipped it.
  const claimedTasks = new Set(claimRecords(root).map((claim) => String(claim.task ?? "")));
  for (const batch of batches.filter(({ state }) => state === "active")) {
    for (const member of memberTasks(batch.path)) {
      if (stateOf(tasks, member) !== "defined" || claimedTasks.has(member)) continue;
      items.push({
        category: "never-started",
        id: member,
        title: titleOf(tasks, member),
        reason: `defined in active batch ${batch.id}, with no claim and no branch`,
        action: `kotta task start ${member} --agent <agent>`,
        ageDays: null,
      });
    }
  }

  // 6. drift — the workspace and Git disagree about the same work.
  const worktreeBranches = new Set(linkedWorktrees(root).map(({ branch }) => branch).filter(Boolean) as string[]);
  for (const claim of claimRecords(root)) {
    const id = String(claim.task ?? "");
    const worktree = typeof claim.worktree === "string" ? claim.worktree : null;
    if (worktree && worktree !== "." && !existsSync(resolve(root, worktree))) {
      items.push({
        category: "drift",
        id,
        title: titleOf(tasks, id),
        reason: `the claim records worktree ${worktree}, which is not on disk`,
        action: `kotta claim release ${id} --force`,
        ageDays: null,
      });
    }
    const branch = typeof claim.branch === "string" ? claim.branch : null;
    if (branch && worktree && worktree !== "." && !worktreeBranches.has(branch) && existsSync(resolve(root, worktree))) {
      items.push({
        category: "drift",
        id,
        title: titleOf(tasks, id),
        reason: `the claim records branch ${branch}, which no linked worktree has checked out`,
        action: `inspect ${worktree}, then kotta claim release ${id} --force if the work is gone`,
        ageDays: null,
      });
    }
  }
  for (const task of tasks.filter(({ state }) => state === "active")) {
    if (claimedTasks.has(task.id)) continue;
    items.push({
      category: "drift",
      id: task.id,
      title: task.title,
      reason: "active with no claim; no agent holds it",
      action: `kotta task start ${task.id} --agent <agent>, or return it with kotta claim release ${task.id} --force`,
      ageDays: null,
    });
  }

  // 7. undispositioned — captured, and left.
  for (const observation of observations.filter(({ state }) => state === "new")) {
    const age = daysSince(String(frontmatter(observation.path).created_at ?? ""), clock);
    if (age === null || age < thresholds.undispositionedDays) continue;
    items.push({
      category: "undispositioned",
      id: observation.id,
      title: observation.title,
      reason: `captured ${age} days ago and never dispositioned (threshold ${thresholds.undispositionedDays}d)`,
      action: `kotta observation validate ${observation.id}, then resolve it with a disposition`,
      ageDays: age,
    });
  }

  const rank = new Map(SWEEP_CATEGORIES.map((category, index) => [category, index]));
  items.sort((left, right) =>
    (rank.get(left.category) ?? 0) - (rank.get(right.category) ?? 0)
    // Oldest first: age is what distinguishes forgotten from in flight.
    || (right.ageDays ?? -1) - (left.ageDays ?? -1)
    || left.id.localeCompare(right.id));

  const counts: Record<string, number> = {};
  for (const item of items) counts[item.category] = (counts[item.category] ?? 0) + 1;
  return { ok: true, command: "sweep", data: { thresholds, items, counts, unreadable } };
}

function titleOf(tasks: Array<{ id: string; title: string }>, id: string): string {
  return tasks.find((task) => task.id === id)?.title ?? id;
}

function stateOf(tasks: Array<{ id: string; state: string }>, id: string): string | null {
  return tasks.find((task) => task.id === id)?.state ?? null;
}

function memberTasks(path: string): string[] {
  const data = frontmatter(path);
  return Array.isArray(data.tasks) ? data.tasks.map(String) : [];
}

function claimRecords(root: string): Array<Record<string, unknown>> {
  const directory = processPath(root, "claims");
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith(".yaml")).flatMap((name) => {
    try {
      return [parse(readFileSync(join(directory, name), "utf8")) as Record<string, unknown>];
    } catch {
      return [];
    }
  });
}

/** Approvals put to the human and never answered — proposed with no terminal phase after them. */
function pendingApprovals(root: string): Array<{ entity: string; action: string; created_at: string }> {
  const events = readEvents(root);
  const terminal = new Set(events
    .filter((event) => event.kind === "approval" && ["applied", "rejected", "cancelled", "failed"].includes(String(event.phase)))
    .map((event) => String(event.approval_id)));
  return events
    .filter((event) => event.kind === "approval" && event.phase === "proposed" && !terminal.has(String(event.approval_id)))
    .map((event) => ({ entity: event.entity, action: String(event.action ?? "an approval"), created_at: event.created_at }));
}

/** When the branch last moved, in epoch milliseconds; null when it has no commit Kotta can read. */
function lastCommitAt(root: string, branch: string): number | null {
  const seconds = git(root, ["log", "-1", "--format=%ct", branch]);
  const parsed = Number(seconds);
  return Number.isFinite(parsed) && parsed > 0 ? parsed * 1000 : null;
}
