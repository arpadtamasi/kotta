import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import matter from "gray-matter";
import { parse, stringify } from "yaml";

const sourceRoot = resolve(process.argv[2] ?? "/Users/rp/Dev/ezchops/oneanda");
const outputRoot = resolve(process.argv[3] ?? "examples/oneanda-migration");
// The demo writes into whichever workspace directory the target already uses, and creates the
// current name (.kotta) when there is none — an existing .a-team snapshot is never renamed (T-020).
const WORKSPACE_NAMES = [".kotta", ".a-team"];
const workspace = WORKSPACE_NAMES.includes(basename(outputRoot))
  ? outputRoot
  : join(outputRoot, WORKSPACE_NAMES.find((name) => existsSync(join(outputRoot, name))) ?? ".kotta");
const replace = process.argv.includes("--replace");
const processRoot = join(workspace, "process");
const specRoot = join(workspace, "spec");
const contractSource = join(sourceRoot, "scrum/tickets");
const backlogSource = join(sourceRoot, "scrum/backlog.md");
const sprintSource = join(sourceRoot, "scrum/sprint.md");

if (!existsSync(contractSource) || !existsSync(backlogSource) || !existsSync(sprintSource)) {
  throw new Error(`Legacy Scrum workspace not found under ${sourceRoot}`);
}

const headings = (content) => {
  const matches = [...content.matchAll(/^##\s+(.+?)\s*$/gm)];
  return new Map(matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? content.length;
    return [match[1].trim().toLowerCase(), content.slice(start, end).trim()];
  }));
};

const cleanText = (value, fallback) => value?.trim() || fallback;
const STRUCTURAL_SECTIONS = new Set(["outcome", "scope", "scope notes", "out of scope", "acceptance", "acceptance criteria", "verification", "dependencies", "open questions", "refinement notes"]);
const sourceSections = (legacy, pattern) => [...legacy.sections.entries()]
  .filter(([heading, body]) => body && pattern.test(heading))
  .map(([heading, body]) => `**${heading}**\n\n${body}`)
  .join("\n\n");
const observedEvidence = (legacy) => sourceSections(legacy, /actual|behavio|tünet|symptom|evidence|mért|measured|root cause|gyökérok|deploy|problem|issue|why|context|result/i)
  || [...legacy.sections.entries()].filter(([heading, body]) => body && !STRUCTURAL_SECTIONS.has(heading)).slice(0, 2).map(([heading, body]) => `**${heading}**\n\n${body}`).join("\n\n")
  || "See Legacy source contract below; the source did not provide a separately labelled observation section.";
const impactEvidence = (legacy) => sourceSections(legacy, /impact|consequence|mellékhatás|kockázat|risk|blokkol|blocker|why/i)
  || "See Actual behaviour and Legacy source contract below for the source-recorded consequences.";
const preservedLegacyContract = (legacy) => legacy.content.trim().replace(/^##\s+/gm, "### ");
const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72);
const legacyNumber = (id) => Number(id.replace(/^O-/, ""));
const now = new Date();
const today = now.toISOString().slice(0, 10);

const backlogMeta = new Map();
let section = "Later";
for (const line of readFileSync(backlogSource, "utf8").split(/\r?\n/)) {
  const sectionMatch = /^##\s+(Now|Next|Later|Completed)/.exec(line);
  if (sectionMatch) section = sectionMatch[1];
  const contractMatch = /^- \[(O-\d+)\s+—/.exec(line);
  if (!contractMatch) continue;
  const priority = /\((P[0-3])(?:,|\))/.exec(line)?.[1] ?? null;
  backlogMeta.set(contractMatch[1], { section, priority, compact: line });
}

const sprintContent = readFileSync(sprintSource, "utf8");
const sprintSections = headings(sprintContent);
const sprintName = /#\s+Sprint\s+—\s+([^\n]+)/.exec(sprintContent)?.[1]?.trim() ?? "Current sprint";
const sprintStatus = /^Status:\s*`([^`]+)`/m.exec(sprintContent)?.[1] ?? "backlog";
const sprintLegacyIds = [...new Set([...(sprintSections.get("committed") ?? "").matchAll(/O-\d+/g)].map((match) => match[0]))];
if (!sprintLegacyIds.length) throw new Error(`Current sprint ${sprintName} has no committed legacy contracts.`);

const legacyContracts = readdirSync(contractSource)
  .filter((name) => /^O-\d+.*\.md$/.test(name))
  .map((filename) => {
    const parsed = matter(readFileSync(join(contractSource, filename), "utf8"));
    return {
      filename,
      data: parsed.data,
      content: parsed.content,
      sections: headings(parsed.content),
      backlog: backlogMeta.get(String(parsed.data.id)) ?? { section: "Later", priority: null, compact: "" },
    };
  })
  .sort((a, b) => legacyNumber(String(a.data.id)) - legacyNumber(String(b.data.id)));

const splitDefinitions = {
  "O-9": [
    ["Compose sessions from task graph and history", "Generate the next practice session from task-graph rules and the projected player history, with an auditable recommendation lifecycle and bounded session budget."],
    ["Validate the coach composer with 50+ personas", "Run a reproducible persona evaluation and publish the failure taxonomy and decision evidence."],
  ],
  "O-38": [
    ["Extract Practice screen controller", "Move Practice orchestration into a testable controller without redesigning the screen."],
    ["Move Flutter infrastructure behind typed gateways", "Introduce the smallest session, take, summary, and feedback gateway seams, then remove direct infrastructure globals from the affected screens."],
  ],
};

// Only explicitly shaped, requested outcomes become contracts. Evidence-backed observations,
// review follow-ups, speculative risks and unresolved technical debt remain observations until a
// human dispositions them. Terminal Scrum history is recorded in migration.json, not replayed
// onto the operational Kotta board.
const contractLegacyIds = new Set([
  "O-3", "O-4", "O-5", "O-7", "O-8", "O-9", "O-11", "O-12", "O-13", "O-16",
  "O-22", "O-23", "O-24", "O-25", "O-30", "O-40", "O-42", "O-43", "O-44", "O-45",
  "O-51", "O-56", "O-76", "O-97", "O-102", "O-107", "O-120", "O-121", "O-122",
  "O-123", "O-124",
]);
const observationLegacyIds = new Set([
  "O-14", "O-15", "O-17", "O-18", "O-19", "O-21", "O-26", "O-27", "O-28", "O-29",
  "O-31", "O-32", "O-33", "O-34", "O-35", "O-36", "O-37", "O-38", "O-39", "O-41",
  "O-46", "O-57", "O-61", "O-69", "O-70", "O-71", "O-72", "O-74", "O-75", "O-77",
  "O-78", "O-79", "O-81", "O-82", "O-83", "O-84", "O-87", "O-88", "O-89", "O-90",
  "O-91", "O-95", "O-101", "O-105", "O-108", "O-113", "O-114", "O-115", "O-116",
  "O-117", "O-118", "O-119",
]);
const terminalLegacy = legacyContracts.filter((legacy) => ["done", "rejected"].includes(String(legacy.data.status)) || ["O-1", "O-2"].includes(String(legacy.data.id)));
const terminalLegacyIds = new Set(terminalLegacy.map((legacy) => String(legacy.data.id)));
for (const legacyId of sprintLegacyIds) {
  if (terminalLegacyIds.has(legacyId)) continue;
  contractLegacyIds.add(legacyId);
  observationLegacyIds.delete(legacyId);
}
const unclassified = legacyContracts.filter((legacy) => !terminalLegacy.includes(legacy) && !contractLegacyIds.has(String(legacy.data.id)) && !observationLegacyIds.has(String(legacy.data.id)));
if (unclassified.length) throw new Error(`Unclassified open legacy records: ${unclassified.map((legacy) => legacy.data.id).join(", ")}. Review them before migration.`);
const observationLegacy = legacyContracts.filter((legacy) => observationLegacyIds.has(String(legacy.data.id)));
const contractLegacy = legacyContracts.filter((legacy) => contractLegacyIds.has(String(legacy.data.id)));

const expanded = [];
const splitAudit = [];
for (const legacy of contractLegacy) {
  const legacyId = String(legacy.data.id);
  const splits = splitDefinitions[legacyId];
  if (!splits) {
    expanded.push({ legacy, title: String(legacy.data.title), outcome: legacy.sections.get("outcome"), splitIndex: null });
    continue;
  }
  const targets = [];
  for (let index = 0; index < splits.length; index += 1) {
    expanded.push({ legacy, title: splits[index][0], outcome: splits[index][1], splitIndex: index + 1 });
    targets.push(index);
  }
  splitAudit.push({ legacy_id: legacyId, disposition: "split", reason: "The source contract explicitly combines independently demonstrable outcomes with different verification paths.", targets });
}

const idMap = new Map();
expanded.forEach((item) => {
  const legacyId = String(item.legacy.data.id);
  item.id = item.splitIndex === null ? legacyId : `${legacyId}.${item.splitIndex}`;
  idMap.set(legacyId, [...(idMap.get(legacyId) ?? []), item.id]);
});
for (const audit of splitAudit) {
  audit.targets = audit.target_legacy
    ? audit.target_legacy.flatMap((legacyId) => idMap.get(legacyId) ?? [])
    : idMap.get(audit.legacy_id) ?? [];
  delete audit.target_legacy;
}

const batchDefinitions = [{
  id: "P-001",
  kind: "sprint",
  status: ["backlog", "defined", "active", "done"].includes(sprintStatus) ? sprintStatus : "backlog",
  title: `Sprint ${sprintName}`,
  goal: cleanText(sprintSections.get("sprint goal"), "Deliver the current sprint's explicitly committed outcome."),
  legacy: sprintLegacyIds,
}];

const contractBatches = new Map();
for (const batch of batchDefinitions) {
  batch.contracts = batch.legacy.flatMap((legacyId) => idMap.get(legacyId) ?? []);
  for (const contractId of batch.contracts) if (!contractBatches.has(contractId)) contractBatches.set(contractId, batch.id);
}

const profileFor = (legacy) => {
  const type = String(legacy.data.type ?? "other");
  if (type === "bug") return ["bug"];
  if (["research", "decision"].includes(type)) return ["discovery"];
  if (type === "operations") return ["workflow"];
  if (type === "feature" && ["app", "gtm"].includes(String(legacy.data.lane ?? ""))) return ["ui"];
  return [];
};

const profileSections = (profile, item) => {
  const context = cleanText(item.legacy.sections.get("why") ?? item.legacy.sections.get("known context") ?? item.legacy.sections.get("context"), "See Legacy source contract below.");
  const observed = observedEvidence(item.legacy);
  const impact = impactEvidence(item.legacy);
  const outcome = cleanText(item.outcome, String(item.legacy.data.title));
  const blocks = {
    bug: [
      ["Actual behaviour", observed], ["Expected behaviour", outcome], ["Reproduction steps", "Use the measurements, reproduction path, and source references preserved under Legacy source contract below."],
      ["Environment", `one&a · ${item.legacy.data.lane || "cross-cutting"} lane`], ["Frequency", "Preserve the observed frequency from the source evidence; measure again before implementation."],
      ["Impact", impact], ["Regression-test expectation", "Add a deterministic regression at the closest public seam."],
    ],
    discovery: [
      ["Decision to be supported", outcome], ["Research question", context], ["Hypotheses", "The source contract contains the current evidence and competing explanations."],
      ["Method", "Inspect repository evidence, run the smallest representative measurement, and record uncertainty."], ["Time or depth limit", "Stop when the stated decision can be made with explicit confidence."],
      ["Expected output", "A decision-defined evidence note and the smallest follow-up contract set."], ["Decision criterion", "The product owner can choose without inventing missing evidence."],
    ],
    workflow: [
      ["Actors", "Player, coach, operator, and the responsible delivery agent where applicable."], ["Initial state", context], ["States", "Use only the states already present in the product and this contract."],
      ["Transitions", outcome], ["Triggers", "The user or operational action described by the source contract."], ["Permissions", "Preserve existing authorization and privacy boundaries."],
      ["Error paths", "Failures remain visible and retryable without silent partial completion."], ["Cancellation path", "Cancellation leaves canonical repository and product state valid."],
      ["Retry and duplicate-action behaviour", "Retries are idempotent or explicitly rejected."], ["Audit and notification expectations", "Record material state changes; notify only the actor who can respond."],
    ],
    ui: [
      ["User goal", outcome], ["Entry point", `The existing ${item.legacy.data.lane || "product"} surface named in the source contract.`], ["Default state", context],
      ["Loading state", "Keep the current context visible while work is pending."], ["Empty state", "Explain why no content exists and provide the next valid action."], ["Error state", "Show an actionable error without discarding user input."],
      ["Success state", outcome], ["Disabled state", "Unavailable actions remain visibly disabled with an accessible explanation."], ["Responsive behaviour", "Preserve hierarchy from phone through desktop web."],
      ["Keyboard and focus behaviour", "All actions are keyboard reachable and focus follows state changes predictably."], ["Accessibility expectations", "Labels, contrast, focus, and semantics meet the platform baseline."],
      ["Visual reference", "Use the existing one&a product language; the migration does not authorize a redesign."],
    ],
  };
  return (blocks[profile] ?? []).map(([title, body]) => `## ${title}\n\n${body}`).join("\n\n");
};

const statusOverrides = new Map();

const mapStatus = (legacyStatus, legacyId) => {
  if (statusOverrides.has(legacyId)) return statusOverrides.get(legacyId);
  if (legacyStatus === "in_progress") return { state: "active", resolution: null };
  if (legacyStatus === "defined" && sprintLegacyIds.includes(legacyId)) return { state: "defined", resolution: null };
  if (legacyStatus === "done") return { state: "done", resolution: "completed" };
  if (legacyStatus === "rejected") return { state: "done", resolution: "obsolete" };
  return { state: "backlog", resolution: null };
};

const priorityMap = { P0: "critical", P1: "high", P2: "medium", P3: "low" };
const migrationRecords = [];
const observationRecords = [];

if (existsSync(workspace) && !replace) throw new Error(`Refusing to replace existing workspace ${workspace}; inspect it first or pass --replace.`);
rmSync(workspace, { recursive: true, force: true });
for (const directory of ["backlog", "defined", "active", "review", "done", "observations/new", "observations/resolved", "batches/backlog", "batches/defined", "batches/active", "batches/done", "profiles", "claims", "events", "decisions"]) {
  mkdirSync(join(processRoot, directory), { recursive: true });
}
for (const filename of readdirSync(resolve("profiles")).filter((name) => name.endsWith(".yaml"))) {
  cpSync(resolve("profiles", filename), join(processRoot, "profiles", filename));
}
mkdirSync(join(specRoot, "forms"), { recursive: true });
for (const filename of readdirSync(resolve("templates/workspace/spec/forms")).filter((name) => name.endsWith(".yaml"))) {
  const source = resolve("templates/workspace/spec/forms", filename);
  cpSync(source, join(specRoot, "forms", filename));
  const directory = parse(readFileSync(source, "utf8")).directory;
  mkdirSync(join(specRoot, String(directory)), { recursive: true });
}

for (const item of expanded) {
  const legacy = item.legacy;
  const legacyId = String(legacy.data.id);
  const status = mapStatus(String(legacy.data.status), legacyId);
  const profiles = profileFor(legacy);
  const dependencies = [...new Set([...(legacy.sections.get("dependencies") ?? "").matchAll(/O-\d+/g)].flatMap((match) => idMap.get(match[0]) ?? []))];
  const openQuestions = cleanText(legacy.sections.get("open questions"), "None.");
  const hasBlockingQuestions = openQuestions !== "None.";
  const acceptance = cleanText(legacy.sections.get("acceptance criteria"), `- The outcome is observable: ${cleanText(item.outcome, item.title)}`);
  const verification = cleanText(legacy.sections.get("verification"), "- Verify the observable outcome against the source evidence and the affected product seam.");
  const scope = cleanText(legacy.sections.get("scope") ?? legacy.sections.get("scope notes") ?? legacy.sections.get("known context") ?? legacy.sections.get("context"), cleanText(legacy.sections.get("why"), "The migrated source contract defines the bounded scope."));
  const nonGoals = cleanText(legacy.sections.get("out of scope"), "No additional non-goals were stated in the legacy contract.");
  const reviewEvidence = status.state === "done" ? `\n\n## Review evidence\n\n${status.reason ?? cleanText(legacy.sections.get("result"), `Legacy ${legacy.data.status} state preserved during migration preview.`)}` : "";
  const bodyProfiles = profiles.map((profile) => profileSections(profile, item)).filter(Boolean).join("\n\n");
  const content = `# ${item.id} — ${item.title}\n\n## Outcome\n\n${cleanText(item.outcome, item.title)}\n\n## Scope\n\n${scope}\n\n## Non-goals\n\n${nonGoals}\n\n## Acceptance\n\n${acceptance}\n\n## Verification\n\n${verification}\n\n## Constraints\n\nMigrated from ${legacyId}; lane: ${legacy.data.lane || "cross-cutting"}; legacy status: ${legacy.data.status}.\n\n## Open decisions\n\n${openQuestions}\n\n${bodyProfiles ? `${bodyProfiles}\n\n` : ""}${reviewEvidence}\n\n## Legacy source contract\n\nThe complete legacy body is preserved below. Its headings are demoted only to keep the Kotta contract structure unambiguous.\n\n${preservedLegacyContract(legacy)}\n\n## Execution notes\n\nMigration preview only. Source: scrum/tickets/${legacy.filename}. No product implementation or human defined approval is implied.\n`;
  const createdAt = String(legacy.data.created_at ?? today).slice(0, 10);
  const data = {
    id: item.id,
    title: item.title,
    status: status.state,
    origin: "imported",
    types: [String(legacy.data.type ?? "other")],
    profiles,
    priority: priorityMap[legacy.backlog.priority] ?? "medium",
    risk: String(legacy.data.type) === "bug" ? "high" : "medium",
    batch: contractBatches.get(item.id) ?? null,
    depends_on: dependencies,
    blocks: [],
    branch: null,
    pull_request: null,
    created_at: createdAt,
    updated_at: today,
    ...(status.resolution ? { resolution: status.resolution } : {}),
    ...(legacy.data.status === "parked" ? { blocked: true, blocked_reason: "Legacy work was parked; human reactivation is required." } : {}),
    ...(status.state === "active" ? { branch: String(legacy.data.branch), assigned_agent: "legacy-scrum" } : {}),
  };
  const filename = `${item.id}-${slugify(item.title)}.md`;
  writeFileSync(join(processRoot, status.state, filename), matter.stringify(content, data));
  migrationRecords.push({
    id: item.id,
    legacy_id: legacyId,
    legacy_title: String(legacy.data.title),
    title: item.title,
    lane: legacy.data.lane || "cross-cutting",
    legacy_status: legacy.data.status,
    status: status.state,
    backlog_section: legacy.backlog.section,
    story_points: legacy.data.story_points ?? null,
    priority_source: legacy.backlog.priority,
    ready_candidate: status.state === "backlog" && !hasBlockingQuestions && acceptance.length > 20 && verification.length > 20 && legacy.data.status !== "parked",
    status_correction: status.reason ?? null,
    split: item.splitIndex !== null,
    source_file: `scrum/tickets/${legacy.filename}`,
  });
}

const observationTypeFor = (legacy) => {
  const type = String(legacy.data.type ?? "other");
  if (type === "bug") return "bug";
  if (type === "research") return "risk";
  if (type === "decision") return "inconsistency";
  if (type === "other") return "technical-debt";
  if (type === "operations") return "risk";
  return "improvement";
};
const severityFor = (legacy) => ({ P0: "critical", P1: "high", P2: "medium", P3: "low" })[legacy.backlog.priority] ?? (String(legacy.data.status) === "parked" ? "low" : "medium");
const backlogEvidence = (legacy) => {
  const compact = legacy.backlog.compact || "";
  const summary = compact.replace(/^\s*-\s+\[[^\]]+\]\([^)]+\)\s+—\s+[^;]+;\s*/, "").trim();
  return summary && summary !== compact ? summary : `See scrum/tickets/${legacy.filename}.`;
};

observationLegacy.forEach((legacy) => {
  const legacyId = String(legacy.data.id);
  const id = legacyId;
  const title = String(legacy.data.title);
  const observation = cleanText(legacy.sections.get("why") ?? legacy.sections.get("known context") ?? legacy.sections.get("context"), title);
  const evidence = cleanText(legacy.sections.get("result"), observedEvidence(legacy) || backlogEvidence(legacy));
  const impact = cleanText(legacy.sections.get("outcome"), "The observation may affect correctness, product trust, maintainability, or delivery safety; a human disposition is still required.");
  const suggested = String(legacy.data.status) === "parked"
    ? "Keep parked unless the recorded reactivation condition becomes true; then investigate before creating work."
    : "Review the evidence and explicitly create or attach a contract only if the outcome is worth scheduling.";
  const data = {
    id, title, status: "new", origin: "agent", observation_type: observationTypeFor(legacy),
    confidence: evidence.includes("See scrum/tickets/") ? "medium" : "high",
    severity: severityFor(legacy), discovered_during: null,
    created_at: String(legacy.data.created_at ?? today).slice(0, 10),
  };
  const content = `# ${id} — ${title}\n\n## Observation\n\n${observation}\n\n## Evidence\n\n${evidence}\n\nLegacy source: ${legacyId} · scrum/tickets/${legacy.filename}.\n\n## Impact hypothesis\n\n${impact}\n\n## Confidence\n\n${data.confidence === "high" ? "High: the legacy record contains concrete observation or result evidence." : "Medium: the observation is recorded, but should be rechecked before scheduling work."}\n\n## Suggested disposition\n\n${suggested}\n\n## Legacy source contract\n\nThe complete legacy body is preserved below. Its headings are demoted only to keep the Kotta observation structure unambiguous.\n\n${preservedLegacyContract(legacy)}\n`;
  const filename = `${id}-${slugify(title)}.md`;
  writeFileSync(join(processRoot, "observations/new", filename), matter.stringify(content, data));
  observationRecords.push({ id, legacy_id: legacyId, title, legacy_status: legacy.data.status, observation_type: data.observation_type, severity: data.severity, source_file: `scrum/tickets/${legacy.filename}` });
});

const activeRecord = migrationRecords.find((record) => record.status === "active");
if (activeRecord) {
  const legacy = contractLegacy.find((candidate) => String(candidate.data.id) === activeRecord.legacy_id);
  writeFileSync(join(processRoot, "claims", `${activeRecord.id}.yaml`), stringify({
    contract: activeRecord.id,
    agent: "legacy-scrum",
    branch: String(legacy?.data.branch),
    worktree: ".",
    started_at: String(legacy?.data.started_at),
    session_id: `migration-${activeRecord.legacy_id}`,
  }));
}

for (const batch of batchDefinitions) {
  const data = {
    id: batch.id, kind: batch.kind, title: batch.title, status: batch.status, contracts: batch.contracts,
    execution: { mode: "dependency-aware", parallelism: 2, stop_on_failure: true },
    authority: { create_observations: true, create_subcontracts: false, reorder_independent_contracts: true, change_scope: false },
    created_at: today, updated_at: today,
  };
  const content = `# ${batch.id} — ${batch.title}\n\n## Goal\n\n${batch.goal}\n\n## Completion\n\nEvery referenced contract is accepted and done; obsolete items have an explicit disposition.\n\n## Execution notes\n\nMigration preview batch. Ordering remains dependency-aware and requires human commitment before execution.\n`;
  writeFileSync(join(processRoot, "batches", batch.status, `${batch.id}-${slugify(batch.title)}.md`), matter.stringify(content, data));
}

const statusCounts = migrationRecords.reduce((counts, contract) => ({ ...counts, [contract.status]: (counts[contract.status] ?? 0) + 1 }), {});
const metadata = {
  project: "one&a",
  source_workspace: sourceRoot,
  source_snapshot: `${String(now.toISOString())} · branch recorded separately in source artifacts`,
  generated_at: now.toISOString(),
  legacy_ticket_count: legacyContracts.length,
  migrated_ticket_count: migrationRecords.length,
  observation_count: observationRecords.length,
  excluded_terminal_count: terminalLegacy.length,
  package_count: batchDefinitions.length,
  status_counts: statusCounts,
  ready_candidate_count: migrationRecords.filter((contract) => contract.ready_candidate).length,
  split_audit: splitAudit,
  // Frozen artefact keys: `migration.json` records what the legacy import produced and is read back
  // by the board under exactly these names. The vocabulary rename deliberately stops at this file.
  tickets: migrationRecords,
  findings: observationRecords,
  excluded_terminal: terminalLegacy.map((legacy) => ({ legacy_id: legacy.data.id, legacy_status: legacy.data.status, source_file: `scrum/tickets/${legacy.filename}` })),
  packages: batchDefinitions.map(({ legacy, ...batch }) => batch),
};
writeFileSync(join(workspace, "migration.json"), `${JSON.stringify(metadata, null, 2)}\n`);
writeFileSync(join(workspace, "config.yaml"), stringify({
  version: 3,
  project: { name: "one&a" },
  workflow: { require_human_sign_approval: true, require_human_done_approval: true, allow_agent_observations: true, allow_agent_defined_contracts: false },
  git: { base_branch: "main", protected_branches: ["main", "master", "develop"], worktrees: "auto", worktree_root: ".worktrees", branch_pattern: "{prefix}/{id}-{slug}" },
  batches: { default_parallelism: 2, stop_on_failure: true },
  validation: { strict: true, reject_unknown_profiles: true, require_verification_for_defined: true, require_review_evidence_for_done: true },
}));
writeFileSync(join(workspace, "README.md"), "# one&a Kotta workspace\n\nMigrated from the legacy Scrum files. Open work was deliberately separated into human-approved contracts and evidence awaiting disposition as observations. The legacy `scrum/` directory remains the historical source snapshot until cutover is explicitly accepted.\n");
writeFileSync(join(processRoot, "index.md"), `# Kotta Status\n\n> Generated migration workspace. Do not edit this index manually.\n\n- ${metadata.migrated_ticket_count} executable or explicitly requested contracts\n- ${metadata.observation_count} observations awaiting human disposition\n- ${metadata.excluded_terminal_count} terminal legacy records preserved only in migration.json\n- ${metadata.package_count} outcome batches\n- ${metadata.ready_candidate_count} backlog contracts have enough evidence to discuss readiness\n`);

console.log(JSON.stringify({ ok: true, source: legacyContracts.length, tickets: migrationRecords.length, findings: observationRecords.length, excludedTerminal: terminalLegacy.length, packages: batchDefinitions.length, output: workspace }, null, 2));
