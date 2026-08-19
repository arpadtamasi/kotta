import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findRepositoryRoot, regenerateIndex, processPath } from "../filesystem/workspace.js";
import { findContract } from "../filesystem/entities.js";
import { entityFilename, filenameMatchesId, mintId } from "../core/identity.js";
import { parseMarkdown, renderMarkdown, sections } from "../core/markdown.js";
import { newContract } from "./contract.js";
import { commitControlState, controlPlaneRoot, withControlPlaneMutation } from "../git/control-plane.js";
import { appendCliApprovalAudit, appendLifecycleEvent } from "../core/events.js";

function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export function findObservation(root: string, id: string) {
  for (const state of ["new", "resolved"]) {
    const directory = processPath(root, "observations", state);
    if (!existsSync(directory)) continue;
    const filename = readdirSync(directory).find((name) => name.endsWith(".md") && filenameMatchesId(name, id));
    if (filename) return { state, filename, path: join(directory, filename) };
  }
  throw new Error(`Observation ${id} was not found.`);
}

export function newObservation(options: { title: string; type: string; evidence: string; discoveredDuring?: string }, repositoryRoot?: string) {
  const requestedRoot = repositoryRoot ?? findRepositoryRoot();
  if (options.discoveredDuring) {
    return withControlPlaneMutation(requestedRoot, (root) => {
      findContract(root, options.discoveredDuring!);
      const result = writeObservation(root, options);
      appendLifecycleEvent(root, result.data.id, "new", `Observation captured during ${options.discoveredDuring}.`, options.discoveredDuring!);
      commitControlState(root, `chore(kotta): capture ${result.data.id} during ${options.discoveredDuring}`);
      return result;
    });
  }
  return writeObservation(controlPlaneRoot(requestedRoot), options);
}

function writeObservation(root: string, options: { title: string; type: string; evidence: string; discoveredDuring?: string }) {
  const id = mintId("F");
  const filename = entityFilename(id, slugify(options.title));
  const directory = processPath(root, "observations/new");
  mkdirSync(directory, { recursive: true });
  const data = { id, title: options.title, status: "new", origin: "agent", observation_type: options.type, confidence: "high", severity: "medium", discovered_during: options.discoveredDuring ?? null, created_at: new Date().toISOString().slice(0, 10) };
  const content = `# ${id} — ${options.title}\n\n## Observation\n\n${options.title}.\n\n## Evidence\n\n${options.evidence}\n\n## Impact hypothesis\n\nThis may cause incorrect or inconsistent behaviour.\n\n## Confidence\n\nHigh: the evidence is directly observable.\n\n## Suggested disposition\n\nInvestigate and create the smallest appropriate contract after human approval.\n`;
  const path = join(directory, filename);
  writeFileSync(path, renderMarkdown(data, content));
  regenerateIndex(root);
  return { ok: true, command: "observation new", data: { id, path } };
}

export function validateObservation(id: string, repositoryRoot?: string) {
  const root = controlPlaneRoot(repositoryRoot ?? findRepositoryRoot());
  const observation = findObservation(root, id);
  const entity = parseMarkdown(readFileSync(observation.path, "utf8"));
  const body = sections(entity.content);
  const required = ["Observation", "Evidence", "Impact hypothesis", "Confidence", "Suggested disposition"];
  const errors = required.filter((heading) => !body.get(heading.toLowerCase())?.trim()).map((heading) => ({ code: "MISSING_SECTION", message: `Missing or empty section: ${heading}.` }));
  const title = String(entity.data.title ?? "").trim().toLowerCase();
  const duplicates: string[] = [];
  for (const state of ["new", "resolved"]) {
    const directory = processPath(root, "observations", state);
    if (!existsSync(directory)) continue;
    for (const filename of readdirSync(directory).filter((name) => name.endsWith(".md") && !filenameMatchesId(name, id))) {
      const candidate = parseMarkdown(readFileSync(join(directory, filename), "utf8"));
      if (String(candidate.data.title ?? "").trim().toLowerCase() === title) duplicates.push(String(candidate.data.id));
    }
  }
  for (const state of ["backlog", "defined", "active", "review", "done"]) {
    const directory = processPath(root, state);
    if (!existsSync(directory)) continue;
    for (const filename of readdirSync(directory).filter((name) => name.endsWith(".md"))) {
      const candidate = parseMarkdown(readFileSync(join(directory, filename), "utf8"));
      if (String(candidate.data.title ?? "").trim().toLowerCase() === title) duplicates.push(String(candidate.data.id));
    }
  }
  return { ok: errors.length === 0, command: "observation validate", data: { id, state: observation.state, duplicates }, errors };
}

export function resolveObservation(id: string, disposition: string, approved: boolean, repositoryRoot?: string, options: { approvalRecorded?: boolean; locked?: boolean; commit?: boolean } = {}) {
  const allowed = ["create-contract", "attach-existing", "investigate", "accept-risk", "reject", "merge-duplicate"];
  if (!allowed.includes(disposition)) throw new Error(`Unknown disposition '${disposition}'.`);
  if (!approved) throw new Error("Human approval is required to resolve a observation.");
  const requestedRoot = repositoryRoot ?? findRepositoryRoot();
  const resolveInControlPlane = (root: string) => {
    const observation = findObservation(root, id);
    if (observation.state !== "new") throw new Error(`Observation ${id} is already resolved.`);
    const validation = validateObservation(id, root);
    if (!validation.ok) throw new Error((validation.errors ?? []).map((error) => error.message).join("\n"));
    const entity = parseMarkdown(readFileSync(observation.path, "utf8"));
    let contractId: string | undefined;
    if (disposition === "create-contract") {
      const created = newContract({ title: String(entity.data.title), type: "feature", profiles: [] }, root);
      contractId = created.data.id;
      const contract = findContract(root, contractId);
      const contractEntity = parseMarkdown(readFileSync(contract.path, "utf8"));
      contractEntity.data.origin = "observation";
      contractEntity.data.source_observation = id;
      writeFileSync(contract.path, renderMarkdown(contractEntity.data, contractEntity.content));
    }
    entity.data.status = "resolved";
    entity.data.disposition = disposition;
    entity.data.resolved_at = new Date().toISOString();
    if (contractId) entity.data.contract = contractId;
    const directory = processPath(root, "observations/resolved");
    mkdirSync(directory, { recursive: true });
    const destination = join(directory, observation.filename);
    writeFileSync(destination, renderMarkdown(entity.data, entity.content));
    unlinkSync(observation.path);
    regenerateIndex(root);
    appendLifecycleEvent(root, id, "resolved", `Observation resolved with disposition ${disposition}.`, typeof entity.data.discovered_during === "string" ? entity.data.discovered_during : null);
    if (!options.approvalRecorded) appendCliApprovalAudit(root, id, "observation.resolve", { disposition }, typeof entity.data.discovered_during === "string" ? entity.data.discovered_during : null);
    if (options.commit !== false) commitControlState(root, `chore(kotta): resolve ${id}`);
    return { ok: true, command: "observation resolve", data: { id, disposition, contractId } };
  };
  return options.locked ? resolveInControlPlane(requestedRoot) : withControlPlaneMutation(requestedRoot, resolveInControlPlane, { requireClean: false });
}
