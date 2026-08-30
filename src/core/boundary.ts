import { existsSync } from "node:fs";
import { git } from "../git/git.js";
import { processPath } from "../filesystem/workspace.js";

/**
 * Submission is a boundary and the tool holds it (SM-01m0f0wn89gjy6dbk1j6fjpv6j).
 *
 * The evidence a human is asked to accept names one commit. Everything that lands after it is
 * outside that question, and everything the claim never committed is work the record cannot
 * account for. Both are read from Git, from commits the task itself already names — never from a
 * timestamp, which says when a file was touched rather than what was submitted.
 *
 * Nothing here refuses. Both shapes have honest instances — a branch that gained its base back
 * through a merge, a deliverable that legitimately predates its claim — so the boundary is
 * reported and the human decides with the fact in front of them.
 */

export interface SubmissionBoundary {
  /** The commit the submission stands on, as the task recorded it. */
  reviewCommit: string | null;
  /** Where execution began, as the start recorded it. */
  startCommit: string | null;
  branch: string | null;
  /** Commits on the branch that arrived after the submission, newest first. */
  beyond: string[];
  /**
   * Whether anything at all was committed between the start and the submission. `null` when the
   * question cannot be asked — an older task that recorded neither commit is not accused.
   */
  accountedFor: boolean | null;
}

const EMPTY: SubmissionBoundary = { reviewCommit: null, startCommit: null, branch: null, beyond: [], accountedFor: null };

/** Commits reachable from `to` but not from `from`; empty when either end cannot be resolved. */
function between(root: string, from: string, to: string): string[] {
  try {
    const listed = git(root, ["rev-list", `${from}..${to}`]);
    return listed ? listed.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    // A branch that no longer exists, or a commit garbage-collected out of the repository: the
    // question cannot be answered, and answering it wrongly is worse than not answering.
    return [];
  }
}

function resolvable(root: string, revision: string): boolean {
  try { return Boolean(git(root, ["rev-parse", "--verify", `${revision}^{commit}`])); }
  catch { return false; }
}

/** Read the boundary a task in review stands on, from what the task itself recorded. */
export function submissionBoundary(root: string, data: Record<string, unknown>): SubmissionBoundary {
  const reviewCommit = typeof data.review_commit === "string" && data.review_commit.trim() ? data.review_commit.trim() : null;
  const startCommit = typeof data.start_commit === "string" && data.start_commit.trim() ? data.start_commit.trim() : null;
  const branch = typeof data.branch === "string" && data.branch.trim() ? data.branch.trim() : null;
  if (!reviewCommit || !resolvable(root, reviewCommit)) return { ...EMPTY, reviewCommit, startCommit, branch };

  const head = branch && resolvable(root, branch) ? branch : null;
  return {
    reviewCommit,
    startCommit,
    branch,
    beyond: head ? between(root, reviewCommit, head) : [],
    // The claim accounted for something when at least one commit landed inside it.
    accountedFor: startCommit && resolvable(root, startCommit) ? between(root, startCommit, reviewCommit).length > 0 : null,
  };
}

/** The one line that says what landed after the submission, or nothing when nothing did. */
export function beyondSubmissionNote(boundary: SubmissionBoundary): string | null {
  if (!boundary.beyond.length) return null;
  const count = boundary.beyond.length;
  return `${count} commit${count === 1 ? "" : "s"} landed on '${boundary.branch}' after the submission at ${boundary.reviewCommit?.slice(0, 7)}`
    + ` (${boundary.beyond.slice(0, 3).map((commit) => commit.slice(0, 7)).join(", ")}${count > 3 ? ", …" : ""}).`
    + " The evidence names the submitted commit, so this work is outside what the review was asked to accept.";
}

/** Said at submission, where the claim is still open and the record can still be corrected. */
export function unaccountedClaimNote(boundary: SubmissionBoundary): string | null {
  if (boundary.accountedFor !== false) return null;
  return `No commit landed between the start at ${boundary.startCommit?.slice(0, 7)} and this submission,`
    + " so the work this review presents was not committed under the claim. Execution that begins before a claim exists is execution the record cannot account for.";
}

/** Whether a task id has a claim in the control plane — used only to read, never to decide. */
export function claimed(root: string, id: string): boolean {
  return existsSync(processPath(root, "claims", `${id}.yaml`));
}
