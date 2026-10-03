import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { workspacePath } from "../filesystem/workspace.js";

export interface WorkspaceConfig {
  baseBranch: string;
  protectedBranches: string[];
}

const DEFAULTS: WorkspaceConfig = { baseBranch: "main", protectedBranches: ["main", "master", "develop"] };

/** Reads the git section of the workspace config.yaml, falling back to the values `init` writes. */
export function readWorkspaceConfig(root: string): WorkspaceConfig {
  const path = workspacePath(root, "config.yaml");
  if (!existsSync(path)) return { ...DEFAULTS };
  const parsed = parse(readFileSync(path, "utf8")) as { git?: { base_branch?: unknown; protected_branches?: unknown } } | null;
  const baseBranch = typeof parsed?.git?.base_branch === "string" && parsed.git.base_branch.trim() ? parsed.git.base_branch.trim() : DEFAULTS.baseBranch;
  const configured = Array.isArray(parsed?.git?.protected_branches) ? parsed.git.protected_branches.map(String) : DEFAULTS.protectedBranches;
  // The base branch is protected whether or not the operator listed it.
  return { baseBranch, protectedBranches: [...new Set([...configured, baseBranch])] };
}

/**
 * Whether the project keeps an OpenSpec narrative beside the model, and who writes it
 * (BR-01m40e0ankvnv82me5emp1hf25). `none`, the
 * default: the model is the only specification and nothing is written under `openspec/`. `generated`:
 * archive regenerates `openspec/specs/` from the model. `authored`: people write it, and Kotta only
 * reports where it disagrees with the model.
 */
export const NARRATIVE_MODES = ["none", "generated", "authored"] as const;
export type NarrativeMode = typeof NARRATIVE_MODES[number];

export interface NarrativeSetting { mode: NarrativeMode; source: string | null; error?: string }

function readYaml(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  try { return (parse(readFileSync(path, "utf8")) ?? null) as Record<string, unknown> | null; }
  catch { return null; }
}

/**
 * `narrative: none | generated | authored`, read from the workspace config first and OpenSpec's
 * `openspec/config.yaml` second; `none` when neither says. An unknown value is an error for the
 * caller to name, never silently a default.
 */
export function readNarrativeSetting(root: string): NarrativeSetting {
  const candidates = [workspacePath(root, "config.yaml"), join(root, "openspec", "config.yaml")];
  for (const path of candidates) {
    const value = readYaml(path)?.narrative;
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && (NARRATIVE_MODES as readonly string[]).includes(value)) return { mode: value as NarrativeMode, source: path };
    return { mode: "none", source: path, error: `${path} sets narrative to '${String(value)}'; it is ${NARRATIVE_MODES.join(", ")}.` };
  }
  return { mode: "none", source: null };
}

/**
 * The obligation keyword (SHALL or MUST) is OpenSpec's convention, required only where an OpenSpec
 * narrative is kept: a generated requirement carries the node's sentence, and OpenSpec rejects one without it.
 */
export function requiresNormativeKeyword(root: string): boolean {
  return readNarrativeSetting(root).mode !== "none";
}
