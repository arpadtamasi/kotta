// A board to measure in a real browser: the intimity structure as reviewed on 2026-10-09, with its
// hypothetical purpose and journey, padded to more than 200 nodes, and one open change with a
// proposal. Written to a fresh repository, then served by `kotta ui`. Used by ui/playwright.config.ts.
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cli = resolve(here, "../dist/cli/index.js");
const port = process.env.KOTTA_BOARD_PORT ?? "4398";
const root = mkdtempSync(join(tmpdir(), "kotta-board-e2e-"));
const git = (...args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], { cwd: root });

const crockford = "0123456789abcdefghjkmnpqrstvwxyz";
let serial = 0;
const mint = (prefix) => { serial += 1; let n = serial, tail = ""; for (let i = 0; i < 8; i++) { tail = crockford[n % 32] + tail; n = Math.floor(n / 32); } return `${prefix}-01m4gh000000000000${tail}`; };
const slug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
const yaml = (value) => Array.isArray(value) ? `\n${value.map((item) => `  - ${item}`).join("\n")}` : ` ${JSON.stringify(value)}`;
function write(directory, front, sections) {
  const head = Object.entries(front).filter(([, value]) => value !== undefined && !(Array.isArray(value) && !value.length)).map(([key, value]) => `${key}:${yaml(value)}`).join("\n");
  const body = Object.entries(sections).map(([name, text]) => `## ${name}\n\n${text}\n`).join("\n");
  const path = join(root, ".kotta/spec", directory, `${slug(front.title)}-${front.id.slice(-8)}.md`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `---\n${head}\nprovenance:\n  level: partly-inferred\n  decided_by: agent-decided\n  sources: []\n---\n# ${front.title}\n\n${body}`);
}

git("init", "-q", "-b", "main");
execFileSync("node", [cli, "init", "--json"], { cwd: root });

const player = mint("A"), visitor = mint("A");
write("actors", { id: player, form: "actor", title: "Player" }, { Role: "Plays.", Goals: "An evening.", Responsibilities: "Answers." });
write("actors", { id: visitor, form: "actor", title: "Visitor" }, { Role: "Visits.", Goals: "To sign in.", Responsibilities: "Signs in." });
const purpose = mint("G");
const goals = Object.fromEntries([
  ["couple", "Two accounts become one private couple"], ["round", "Both phones play one shared round"], ["honest", "Each partner can answer honestly, in private"],
  ["result", "The result reveals mutual interest"], ["apart", "An evening apart can still be played"], ["discreet", "The app can be used where someone could glance over a shoulder"],
  ["install", "The app is opened from the home screen like an app"], ["account", "Each person's couple and round are reached only through their own account"],
].map(([key, title]) => [key, { id: mint("G"), title }]));
const cases = Object.fromEntries([
  ["pair", "Pair with a partner through an invitation", "couple"], ["deal", "Deal or join tonight's round", "round"], ["choose", "Choose a side and answer the cards", "honest"],
  ["wait", "Wait for the partner", "honest"], ["see", "See the shared result", "result"], ["apart", "Play an evening apart", "apart"],
  ["discreetly", "Use the app discreetly", "discreet"], ["home", "Keep the app on the home screen", "install"], ["signIn", "Sign in", "account"], ["signOut", "Sign out", "account"],
].map(([key, title, goal]) => [key, { id: mint("UC"), title, goal }]));
const rules = [];
for (const [key, useCase] of Object.entries(cases)) {
  const own = Array.from({ length: 9 }, (_, index) => ({ id: mint("BR"), title: `${useCase.title} — rule ${index + 1}` }));
  if (key === "deal") own[0].title = "Every new round contains two equal sides";
  useCase.rules = own;
  rules.push(...own);
}
const proof = mint("EX");
const allIds = [];
write("goals", { id: purpose, form: "goal", title: "Find an evening both welcome, without one-sided vulnerability", measured_by: [proof] }, { Outcome: "An evening both welcome.", Context: "Intimity.", "Baseline and target": "More." });
for (const goal of Object.values(goals)) write("goals", { id: goal.id, form: "goal", title: goal.title, serves: [purpose], measured_by: [proof] }, { Outcome: `${goal.title}.`, Context: "Intimity.", "Baseline and target": "More." });
const evening = mint("UC");
write("use-cases", { id: evening, form: "use-case", title: "Spend an evening together", level: "summary", actor: [player], goal: [purpose], includes: ["pair", "deal", "choose", "wait", "see"].map((key) => cases[key].id) }, { Intent: "An evening together.", Preconditions: "None.", "Main success scenario": "1. Pair. 2. Deal. 3. Answer. 4. Wait. 5. See.", Alternatives: "None." });
for (const [key, useCase] of Object.entries(cases)) {
  write("use-cases", { id: useCase.id, form: "use-case", title: useCase.title, level: "user-goal", actor: [key === "signIn" ? visitor : player], goal: [goals[useCase.goal].id], refines: useCase.rules.map((rule) => rule.id), extends: key === "apart" ? [cases.deal.id] : [] }, { Intent: `${useCase.title}.`, Preconditions: "None.", "Main success scenario": "1. It happens.", Alternatives: "None." });
}
for (const rule of rules) {
  const text = rule.title === "Every new round contains two equal sides" ? "The system SHALL deal seven cards per side by default and at least three cards per side in every valid deal." : `The system SHALL keep ${rule.title.toLowerCase()}.`;
  write("business-rules", { id: rule.id, form: "business-rule", title: rule.title }, { Rule: text, Rationale: "Stated.", Scope: "Everywhere." });
  allIds.push(rule.id);
}
for (let index = 0; index < 100; index++) {
  const id = mint("EX");
  write("examples", { id, form: "example", title: `Example ${index + 1}`, subjects: [rules[index % rules.length].id] }, { Given: "A couple.", When: "They play.", Then: "It holds." });
}
write("examples", { id: proof, form: "example", title: "The evening works", subjects: [evening, ...Object.values(cases).map((useCase) => useCase.id)] }, { Given: "A couple.", When: "They play.", Then: "It works." });
git("add", "-A");
git("commit", "-q", "-m", "intimity");

// One open change with a long proposal, left uncommitted, to open the proposal over.
mkdirSync(join(root, ".kotta/changes/review/model"), { recursive: true });
writeFileSync(join(root, ".kotta/changes/review/proposal.md"), `# A long proposal\n\n## Why\n\n${"A reason that takes a while to read. ".repeat(80)}\n\n## What changes\n\n${Array.from({ length: 30 }, (_, index) => `- Point ${index + 1}`).join("\n")}\n\n## Open decisions\n\nNone.\n`);

process.stdout.write(`board fixture at ${root}\n`);
const server = spawn("node", [cli, "ui", "--workspace", root, "--port", port, "--no-open"], { stdio: "inherit" });
const stop = () => { server.kill(); process.exit(0); };
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
