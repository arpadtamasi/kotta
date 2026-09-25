import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";
import { QUIT, json, node, planningWorkspace, run, write } from "./planning-fixture.js";

/**
 * `kotta narrative <change> --from <log|directory>` — the conversation behind a change, distilled into
 * its `conversation.md`: intent verbatim, every proposal with the human's answer and its time, the
 * paths the human turned down, the questions answered, what could not be paired, and the raw source.
 * No secret or personal datum reaches the file, and the file says what was removed.
 */

const CLAUDE = resolve("tests/fixtures/sessions/claude-code.jsonl");
const CODEX = resolve("tests/fixtures/sessions/codex.jsonl");

function repository(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-narrative-${label}-`));
  execFileSync("git", ["init", "-q", "-b", "main"], { cwd: root });
  mkdirSync(join(root, "openspec/changes/add-pause"), { recursive: true });
  return root;
}

const conversation = (root: string, change = "add-pause") => readFileSync(join(root, `openspec/changes/${change}/conversation.md`), "utf8");

/** The text of one `##` section, down to the next. */
function section(content: string, heading: string): string {
  const start = content.indexOf(`\n## ${heading}\n`);
  if (start < 0) return "";
  const end = content.indexOf("\n## ", start + 1);
  return content.slice(start, end < 0 ? undefined : end);
}

describe("kotta narrative", () => {
  test("distils a Claude Code session into the five parts, in order, with each answer beside its proposal", () => {
    const root = repository("claude");
    const result = json(root, ["narrative", "add-pause", "--from", CLAUDE]);
    expect(result.status).toBe(0);
    expect(result.body.data).toMatchObject({
      change: "add-pause", conversation: "openspec/changes/add-pause/conversation.md",
      counts: { intents: 1, approved: 1, rejected: 1, questions: 1, unpaired: 1 },
      sources: [{ format: "claude-code", human: 5, agent: 4 }],
    });
    const content = conversation(root);
    const headings = content.split("\n").filter((line) => line.startsWith("## "));
    expect(headings).toEqual(["## Szándék", "## Javaslatok és válaszok", "## Elvetett utak", "## Kérdések és válaszok", "## Párosítatlan", "## Nyers forrás"]);

    // Intent: the human's own words, verbatim, timestamped.
    expect(section(content, "Szándék")).toContain("### SZ1 · 2026-09-20 10:00 UTC\n\n> Szeretném, hogy a szünet gomb azonnal kilépjen a játékból.");
    // A one-word yes is kept with the proposal it answers, and both times.
    const approved = section(content, "Javaslatok és válaszok");
    expect(approved).toContain("### J1 · 2026-09-20 10:06 UTC");
    expect(approved).toContain("**Ágens** (10:05 UTC):\n\n> Javaslom, hogy a megerősítő ablak a futó játéknál maradjon meg. Mehet?");
    expect(approved).toContain("**Ember** (10:06 UTC):\n\n> igen");
    // The human picked another option than the one the agent recommended.
    const rejected = section(content, "Elvetett utak");
    expect(rejected).toContain("### E1 · 2026-09-20 10:03 UTC");
    expect(rejected).toContain("Az ágens a(z) A változatot ajánlotta; az ember a(z) B változatot választotta.");
    expect(section(content, "Kérdések és válaszok")).toContain("> Soha, a szünet addig tart, amíg a játékos vissza nem jön.");
    // Unsure: listed, never forced into a yes or a no.
    const unpaired = section(content, "Párosítatlan");
    expect(unpaired).toContain("> Megcsináljam a teszteket is?");
    expect(unpaired).toContain("> hmm, előbb nézzük meg a meglévőket");

    // What was left out never reaches the file.
    for (const skipped of ["Sub-agent report", "Base directory", "Request interrupted", "The date changed", "xxxxxxxxxx", "/clear", "tool_result", "pause = ()"]) expect(content).not.toContain(skipped);
    const source = section(content, "Nyers forrás");
    expect(source).toContain("(Claude Code): 9 üzenet feldolgozva (ember 5, ágens 4); kihagyva:");
    expect(source).toContain("4000 karakternél hosszabb beillesztés 1");
    expect(source).toContain("mellékszál 1");
  });

  test("filters secrets and personal data before writing, and lists what it removed by kind", () => {
    const root = repository("redact");
    const result = json(root, ["narrative", "add-pause", "--from", CLAUDE]);
    expect(result.body.data.redactions).toEqual({ "api-kulcs": 1, "e-mail": 1, telefonszám: 1, "otthoni-útvonal": 1 });
    const content = conversation(root);
    for (const secret of ["sk-ant", "FAKEFAKE", "bob@example.com", "123 4567", "/Users/alice"]) expect(content).not.toContain(secret);
    expect(content).toContain("A kulcsom [api-kulcs eltávolítva], írj a [e-mail eltávolítva] címre vagy hívj: [telefonszám eltávolítva]. A repó a ~/dev/game alatt van.");
    expect(section(content, "Nyers forrás")).toContain("### Szűrés\n\n- api-kulcs: 1\n- e-mail: 1\n- telefonszám: 1\n- otthoni-útvonal: 1");
    expect(run(root, ["narrative", "add-pause", "--from", CLAUDE]).stdout).toContain("Filtered before writing: api-kulcs 1, e-mail 1, telefonszám 1, otthoni-útvonal 1.");
  });

  test("reads a Codex session: the request without the IDE context, a no as a path turned down, tokens removed", () => {
    const root = repository("codex");
    const result = json(root, ["narrative", "add-pause", "--from", CODEX]);
    expect(result.status).toBe(0);
    expect(result.body.data.counts).toEqual({ intents: 1, approved: 1, rejected: 1, questions: 1, unpaired: 0 });
    expect(result.body.data.redactions).toEqual({ "github-token": 1, "aws-kulcs": 1, jwt: 1 });
    const content = conversation(root);
    expect(section(content, "Szándék")).toContain("> Add an export button to the report page.");
    expect(content).not.toContain("Context from my IDE setup");
    expect(content).not.toContain("AGENTS.md instructions");
    expect(content).not.toContain("<image>");
    expect(section(content, "Elvetett utak")).toContain("> no, PDF first");
    expect(section(content, "Kérdések és válaszok")).toContain("> A4. The session cookie was [jwt eltávolítva]");
    // The image in between is not the human's answer; the "yes" after it is.
    expect(section(content, "Javaslatok és válaszok")).toContain("> Done. I'd recommend adding a test too — want me to?");
    expect(section(content, "Javaslatok és válaszok")).toContain("> yes");
    expect(section(content, "Nyers forrás")).toContain("(Codex): 7 üzenet feldolgozva (ember 4, ágens 3)");
  });

  test("--since keeps only the later part of a session, and says so", () => {
    const root = repository("since");
    const result = json(root, ["narrative", "add-pause", "--from", CLAUDE, "--since", "2026-09-20T10:05:00Z"]);
    expect(result.body.data.since).toBe("2026-09-20T10:05:00.000Z");
    expect(result.body.data.counts).toEqual({ intents: 0, approved: 1, rejected: 0, questions: 1, unpaired: 1 });
    const content = conversation(root);
    expect(content).not.toContain("Szeretném");
    expect(matter(content).data.since).toBe("2026-09-20T10:05:00.000Z");
    expect(section(content, "Nyers forrás")).toContain("--since előtti 3");
    expect(section(content, "Nyers forrás")).toContain("Csak a 2026-09-20 10:05 UTC utáni üzenetek.");

    const late = json(root, ["narrative", "add-pause", "--from", CLAUDE, "--since", "2027-01-01T00:00:00Z"]);
    expect(late.status).toBe(1);
    expect(late.body.errors?.[0].code).toBe("NARRATIVE_EMPTY");
    expect(json(root, ["narrative", "add-pause", "--from", CLAUDE, "--since", "yesterday"]).body.errors?.[0].message).toContain("is not a time");
  });

  test("reads every log under a directory, and names the files that are not session logs", () => {
    const root = repository("directory");
    const logs = join(root, "logs");
    mkdirSync(join(logs, "codex"), { recursive: true });
    copyFileSync(CLAUDE, join(logs, "a.jsonl"));
    copyFileSync(CODEX, join(logs, "codex", "rollout-b.jsonl"));
    writeFileSync(join(logs, "notes.jsonl"), `${JSON.stringify({ hello: "world" })}\n`);
    const result = json(root, ["narrative", "add-pause", "--from", logs]);
    expect(result.body.data.sources.map((source: { path: string; format: string }) => `${source.format}:${source.path.split("/").pop()}`)).toEqual(["claude-code:a.jsonl", "codex:rollout-b.jsonl"]);
    expect(result.body.data.unrecognized).toHaveLength(1);
    expect(result.body.data.counts).toEqual({ intents: 2, approved: 2, rejected: 2, questions: 2, unpaired: 1 });
    // Numbered across sessions in time order: the Claude session came first.
    const content = conversation(root);
    expect(content.indexOf("### E1 · 2026-09-20")).toBeGreaterThan(0);
    expect(content.indexOf("### E2 · 2026-09-21")).toBeGreaterThan(0);
    expect(section(content, "Nyers forrás")).toContain("`logs/a.jsonl` (Claude Code)");
    expect(section(content, "Nyers forrás")).toContain("`logs/notes.jsonl`: nem munkamenet-napló, kihagyva.");
  });

  test("replaces its own distillate, but never one a human edited or wrote", () => {
    const root = repository("edited");
    expect(json(root, ["narrative", "add-pause", "--from", CLAUDE]).status).toBe(0);
    expect(json(root, ["narrative", "add-pause", "--from", CODEX]).status).toBe(0);
    expect(conversation(root)).toContain("Add an export button");

    const path = join(root, "openspec/changes/add-pause/conversation.md");
    writeFileSync(path, conversation(root).replace("> no, PDF first", "> no, PDF first — and A4 only"));
    const refused = json(root, ["narrative", "add-pause", "--from", CLAUDE]);
    expect(refused.status).toBe(1);
    expect(refused.body.errors?.[0]).toMatchObject({ code: "NARRATIVE_EDITED", message: expect.stringContaining("was edited after") });
    expect(conversation(root)).toContain("and A4 only");

    writeFileSync(path, "# Our notes\n");
    expect(json(root, ["narrative", "add-pause", "--from", CLAUDE]).body.errors?.[0].message).toContain("was not written by 'kotta narrative'");
  });

  test("refuses an unknown change and a file that is no session log", () => {
    const root = repository("refuse");
    expect(json(root, ["narrative", "nope", "--from", CLAUDE]).body.errors?.[0].message).toContain("No change 'nope'");
    const other = join(root, "other.jsonl");
    writeFileSync(other, `${JSON.stringify({ hello: "world" })}\n`);
    expect(json(root, ["narrative", "add-pause", "--from", other]).body.errors?.[0].message).toContain("neither a Claude Code nor a Codex session log");
  });
});

describe("the planning phase reads the conversation", () => {
  test("plan reports the conversation and every citation of it that the board could not open", () => {
    const root = planningWorkspace("narrative");
    expect(json(root, ["plan", "add-pause"]).body.data.conversation).toEqual({ path: null, cited: 0, unresolved: [] });

    expect(json(root, ["narrative", "add-pause", "--from", CLAUDE]).status).toBe(0);
    const cite = (sources: string[]) => write(root, `openspec/changes/add-pause/model/business-rules/quit-confirmation-${QUIT.slice(-8)}.md`, node(
      { id: QUIT, form: "business-rule", title: "Quitting asks for confirmation", capability: "game/session", provenance: { level: "stated", decided_by: "agent-proposed-human-approved", sources, quote: "Javaslom, hogy a megerősítő ablak a futó játéknál maradjon meg. — igen (ember, 10:06)" } },
      { Rule: "The game SHALL ask “Quit? Y/N” before it ends a running game.", Rationale: "r", Scope: "s" }));

    cite(["openspec/changes/add-pause/conversation.md · J1", "openspec/changes/add-pause/conversation.md#E1"]);
    let data = json(root, ["plan", "add-pause"]).body.data;
    expect(data.conversation).toEqual({ path: "openspec/changes/add-pause/conversation.md", cited: 2, unresolved: [] });
    expect(readFileSync(join(root, "openspec/changes/add-pause/planning.md"), "utf8")).toContain("Conversation: openspec/changes/add-pause/conversation.md, cited 2 times.");

    cite(["conversation.md · J1", "openspec/changes/add-pause/conversation.md · J9", "openspec/changes/add-pause/conversation.md"]);
    data = json(root, ["plan", "add-pause"]).body.data;
    expect(data.conversation.unresolved.map((item: { reason: string }) => item.reason)).toEqual([
      expect.stringContaining("repository-relative path"),
      "no heading in openspec/changes/add-pause/conversation.md names 'J9'",
      expect.stringContaining("name the part it cites"),
    ]);
    expect(readFileSync(join(root, "openspec/changes/add-pause/planning.md"), "utf8")).toContain("- Unresolved: Quitting asks for confirmation");
  });
});
