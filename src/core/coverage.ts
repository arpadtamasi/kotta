import { findSpecNode } from "../spec/registry.js";
import { sections } from "./markdown.js";
import type { ValidationIssue } from "./validation.js";

export interface CoverageEntry {
  acceptance: string;
  spec: string[];
}

function strings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((entry) => entry.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

export function acceptanceConditions(content: string): string[] {
  return sections(content).get("acceptance")?.split(/\r?\n/)
    .map((line) => /^\s*[-*]\s+(.+)/.exec(line)?.[1].trim())
    .filter((line): line is string => Boolean(line)) ?? [];
}

/**
 * Coverage is explicit in one of two forms: the acceptance condition names a referenced node id,
 * or frontmatter maps the condition's exact text to referenced ids. Nothing is inferred from prose
 * similarity. The exact-text key keeps the relation stable, reviewable, and unambiguous.
 */
export function taskCoverage(data: Record<string, unknown>, content: string): CoverageEntry[] {
  const referenced = strings(data.spec);
  const raw = data.coverage && typeof data.coverage === "object" && !Array.isArray(data.coverage)
    ? data.coverage as Record<string, unknown>
    : {};
  return acceptanceConditions(content).map((acceptance) => ({
    acceptance,
    spec: [...new Set([
      ...referenced.filter((id) => acceptance.includes(id)),
      ...strings(raw[acceptance]),
    ])].sort(),
  }));
}

export function validateTaskCoverage(root: string, data: Record<string, unknown>, content: string, path?: string): ValidationIssue[] {
  const errors: ValidationIssue[] = [];
  const acceptance = acceptanceConditions(content);
  const referenced = strings(data.spec);
  const rawCoverage = data.coverage;
  if (rawCoverage !== undefined && (typeof rawCoverage !== "object" || rawCoverage === null || Array.isArray(rawCoverage))) {
    errors.push({ code: "INVALID_COVERAGE_MAP", message: "Coverage must map each acceptance condition's exact text to one or more referenced specification node ids.", path });
  }
  const mapped = rawCoverage && typeof rawCoverage === "object" && !Array.isArray(rawCoverage)
    ? rawCoverage as Record<string, unknown>
    : {};

  const duplicates = acceptance.filter((condition, index) => acceptance.indexOf(condition) !== index);
  for (const condition of [...new Set(duplicates)]) {
    errors.push({ code: "DUPLICATE_ACCEPTANCE", message: `Acceptance condition '${condition}' occurs more than once, so coverage cannot name it unambiguously. Make each acceptance condition distinct.`, path });
  }
  for (const condition of Object.keys(mapped).sort()) {
    if (!acceptance.includes(condition)) {
      errors.push({ code: "COVERAGE_UNKNOWN_ACCEPTANCE", message: `Coverage maps '${condition}', but that exact acceptance condition is not present. Correct the key or remove the stale mapping.`, path });
    }
    if (!strings(mapped[condition]).length) {
      errors.push({ code: "EMPTY_COVERAGE", message: `Coverage for '${condition}' names no specification node. Name at least one referenced accepted node.`, path });
    }
  }

  for (const entry of taskCoverage(data, content)) {
    if (!entry.spec.length) {
      errors.push({
        code: "ACCEPTANCE_NOT_COVERED",
        message: `Acceptance condition '${entry.acceptance}' is not covered by a referenced accepted specification node. Name a referenced node in the condition or coverage map; if the specification does not promise it, record an observation and amend the spec before defining this task.`,
        path,
      });
      continue;
    }
    for (const id of entry.spec) {
      if (!referenced.includes(id)) {
        errors.push({ code: "COVERAGE_NOT_REFERENCED", message: `Coverage for '${entry.acceptance}' names '${id}', but the task does not reference it in spec. Add it to spec or remove it from coverage.`, path });
      } else if (!findSpecNode(root, id)) {
        errors.push({ code: "COVERAGE_SPEC_NOT_ACCEPTED", message: `Coverage for '${entry.acceptance}' names '${id}', but that node is not present in the accepted specification on the control branch. Land the node before defining this task.`, path });
      }
    }
  }
  return errors;
}
