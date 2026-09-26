import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { stringify } from "yaml";
import { gateApprovalReceipt, type ApprovalReceipt } from "../core/approval-receipt.js";
import { displayId } from "../core/identity.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { APPROVAL_FILE, PLANNING_FILE } from "../spec/change.js";
import type { ValidationIssue } from "../spec/registry.js";
import { analyzeChange, blockingIssues, readPlanning, type NodeRef } from "./plan.js";

/**
 * `kotta approve <change> --by <who>` — the one human gate, recorded (BR-01m0f0wn89zb3wfb3t3y4d20a7):
 * the receipt names who said yes, when, and on what basis (EX-01m0f0wn8am4hb2vy03wmn4brs).
 *
 * The human says yes in the conversation; this command only writes the receipt. It refuses, with the
 * exact list, whenever the yes could not have been given on the current delta: no planning report, a
 * report older than the model it describes, an open decision, or a delta that does not validate.
 */

export interface ApproveResult {
  ok: boolean;
  command: "approve";
  data: {
    change: string;
    approval: string | null;
    receipt: ApprovalReceipt | null;
    approved: { added: NodeRef[]; modified: NodeRef[]; removed: NodeRef[] };
  };
  errors: ValidationIssue[];
}

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

export function approveChange(name: string, by: string, repositoryRoot?: string, now: Date = new Date()): ApproveResult {
  const root = repositoryRoot ?? findRepositoryRoot();
  const analysis = analyzeChange(root, name);
  const directory = analysis.model.directory;
  const errors: ValidationIssue[] = [];

  const planning = readPlanning(directory);
  if (!planning) {
    errors.push({ code: "PLANNING_MISSING", message: `The change has no ${PLANNING_FILE}. Run 'kotta plan ${analysis.change}' and put its report to the human first.`, path: join(directory, PLANNING_FILE) });
  } else {
    const newer = analysis.model.files.length
      ? filesUnder(analysis.model.modelDirectory).filter((file) => statSync(file).mtimeMs > planning.mtime)
      : [];
    for (const file of newer) errors.push({ code: "PLANNING_STALE", message: `${relative(root, file)} changed after ${PLANNING_FILE} was written; the report does not describe it. Run 'kotta plan ${analysis.change}' again.`, path: file });
    if (!newer.length && planning.deltaHash !== analysis.deltaHash) {
      errors.push({ code: "PLANNING_STALE", message: `${PLANNING_FILE} describes a different model delta than model/ holds now. Run 'kotta plan ${analysis.change}' again.`, path: join(directory, PLANNING_FILE) });
    }
  }
  errors.push(...blockingIssues(analysis));

  const approved = analysis.delta;
  if (errors.length) return { ok: false, command: "approve", data: { change: analysis.change, approval: null, receipt: null, approved }, errors };

  const receipt = gateApprovalReceipt(by, analysis.deltaHash, now);
  const path = join(directory, APPROVAL_FILE);
  const titled = (nodes: NodeRef[]) => nodes.map((node) => ({ id: node.id, title: node.title }));
  writeFileSync(path, stringify({
    change: analysis.change,
    ...receipt,
    approved: { added: titled(approved.added), changed: titled(approved.modified), removed: titled(approved.removed) },
  }));
  return { ok: true, command: "approve", data: { change: analysis.change, approval: relative(root, path), receipt, approved }, errors: [] };
}

export function formatApprove(result: ApproveResult): string {
  const { data } = result;
  if (!data.receipt) return `The change ${data.change} was not approved.`;
  const lines = [`Recorded ${data.receipt.approved_by}'s approval of ${data.change} in ${data.approval}:`];
  const list = (label: string, nodes: NodeRef[]) => { for (const node of nodes) lines.push(`  ${label} ${node.title} (${displayId(node.id)})`); };
  list("added  ", data.approved.added);
  list("changed", data.approved.modified);
  list("removed", data.approved.removed);
  lines.push(`Basis: ${data.receipt.approval_basis}. 'kotta archive ${data.change}' lands exactly this delta, and nothing else, without asking again.`);
  return lines.join("\n");
}
