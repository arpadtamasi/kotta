import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";

const ISSUE_FORM_URL = "https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml";
const REQUIRED_REPORT_FIELDS = ["summary", "reproduction", "expected", "actual", "version"];
const read = (path: string) => readFileSync(resolve(path), "utf8");

const cli = resolve("dist/cli/index.js");
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as Record<string, unknown>;
};

type IssueFormField = {
  type: string;
  id?: string;
  attributes?: { label?: string; description?: string; options?: Array<{ label: string; required?: boolean }> };
  validations?: { required?: boolean };
};

describe("bug.yml issue form", () => {
  const form = parse(read(".github/ISSUE_TEMPLATE/bug.yml")) as { name?: string; description?: string; body?: IssueFormField[] };

  test("is a valid GitHub Issue Form reachable through the published template URL", () => {
    // The URL's `template=` value is the filename; a rename silently breaks every entry point.
    expect(new URL(ISSUE_FORM_URL).searchParams.get("template")).toBe("bug.yml");
    expect(existsSync(resolve(".github/ISSUE_TEMPLATE/bug.yml"))).toBe(true);
    expect(form.name).toBeTruthy();
    expect(form.description).toBeTruthy();
    expect(Array.isArray(form.body)).toBe(true);
    const allowed = new Set(["markdown", "input", "textarea", "dropdown", "checkboxes"]);
    for (const field of form.body ?? []) {
      expect(allowed.has(field.type)).toBe(true);
      expect(field.attributes).toBeTruthy();
      if (field.type === "markdown") expect(field.id).toBeUndefined();
      else {
        expect(field.id).toBeTruthy();
        expect(field.attributes?.label).toBeTruthy();
      }
    }
    const ids = (form.body ?? []).map((field) => field.id).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("requires the minimum report and keeps optional diagnostics off by default", () => {
    const required = (form.body ?? []).filter((field) => field.validations?.required).map((field) => field.id);
    expect(required).toEqual(expect.arrayContaining(REQUIRED_REPORT_FIELDS));

    const consent = (form.body ?? []).find((field) => field.id === "diagnostics-consent");
    expect(consent?.type).toBe("checkboxes");
    expect(consent?.validations?.required ?? false).toBe(false);
    // Every diagnostic is enumerated and unchecked: consent is per report, never inferred.
    expect(consent?.attributes?.options?.length).toBeGreaterThan(0);
    for (const option of consent?.attributes?.options ?? []) expect(option.required ?? false).toBe(false);

    const diagnostics = (form.body ?? []).find((field) => field.id === "diagnostics");
    expect(diagnostics?.validations?.required ?? false).toBe(false);
    expect(`${diagnostics?.attributes?.description}`).toMatch(/redact/i);

    const disclosure = (form.body ?? []).find((field) => field.id === "disclosure");
    expect(disclosure?.attributes?.options?.every((option) => option.required)).toBe(true);

    const intro = (form.body ?? []).find((field) => field.type === "markdown");
    expect(`${intro?.attributes?.value ?? ""}`).toMatch(/secrets/i);
  });
});

describe("visual entry points", () => {
  const site = read("site/index.html");
  const board = read("ui/src/App.tsx");
  const bundle = readdirSync(resolve("ui-dist/assets"))
    .filter((name) => name.endsWith(".js"))
    .map((name) => read(join("ui-dist/assets", name)))
    .join("\n");

  test("the public site links to the issue form from a persistent labelled action", () => {
    const links = [...site.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0]);
    const reporting = links.filter((link) => link.includes(ISSUE_FORM_URL));
    // Header and footer: the action is reachable without hunting for the repository.
    expect(reporting.length).toBeGreaterThanOrEqual(2);
    for (const link of reporting) {
      expect(link).toContain("Report a bug");
      expect(link).toContain('rel="noreferrer noopener"');
    }
    // Narrow widths hide the section links, never the reporting one.
    expect(read("site/styles.css")).toContain(".site-header nav a:not(.nav-support) { display: none; }");
  });

  test("the local board links to the same issue form with an unambiguous accessible name", () => {
    expect(board).toContain(`const BUG_REPORT_URL = "${ISSUE_FORM_URL}";`);
    const anchor = board.match(/<a className="rail__report"[\s\S]*?<\/a>/)?.[0] ?? "";
    expect(anchor).toContain("href={BUG_REPORT_URL}");
    expect(anchor).toContain("Report a bug");
    expect(anchor).toMatch(/aria-label="Report a bug[^"]*"/);
    expect(anchor).toContain('rel="noreferrer noopener"');
    // Says out loud that the handoff leaves the workspace.
    expect(board).toMatch(/rail__report-note[\s\S]*?Nothing from this workspace is sent/);
    expect(bundle).toContain(ISSUE_FORM_URL);
  });

  test("the board carries no reporting write path of its own", () => {
    const reportingRegion = board.slice(board.indexOf("rail__report"), board.indexOf("rail__meta"));
    expect(reportingRegion).not.toMatch(/fetch\(|postJson\(/);
  });
});

describe("report-kotta-bug skill task", () => {
  const skill = read("skills/report-kotta-bug/SKILL.md");
  const frontmatter = parse(skill.split("---")[1]) as { name?: string; description?: string };

  test("is discoverable with the same frontmatter task as the other published skills", () => {
    expect(frontmatter.name).toBe("report-kotta-bug");
    expect(frontmatter.description).toMatch(/bug|defect/i);
    // Published through the packed `skills/` allowlist, like every other bundled skill.
    expect((JSON.parse(read("package.json")) as { files: string[] }).files).toContain("skills");
  });

  test("prepares the same minimum report as the human path", () => {
    const draft = skill.split("## 4. Outbound draft")[1]?.split("```markdown")[1]?.split("```")[0] ?? "";
    expect(draft).toContain("### Summary");
    expect(draft).toContain("### Reproduction steps");
    expect(draft).toContain("### Expected behaviour");
    expect(draft).toContain("### Actual behaviour");
    expect(draft).toContain("### Kotta version");
    // The default outbound payload carries no diagnostics, paths, logs, or conversation.
    expect(draft).not.toMatch(/diagnostic|\/Users\/|process\.env|log file|conversation/i);
  });

  test("gates evidence, duplicates, sanitization, approval, and submission", () => {
    expect(skill).toMatch(/observed facts.*impact hypothes/is);
    expect(skill).toContain("gh issue list --repo arpadtamasi/kotta");
    expect(skill).toMatch(/absolute filesystem paths/i);
    expect(skill).toMatch(/tokens, credentials, `\.env` values, environment variable values, and Git remote URLs/);
    expect(skill).toMatch(/repository contents, task bodies, log files, and the agent conversation/);
    expect(skill).toMatch(/before any external write/i);
    expect(skill).toContain("gh issue create --repo arpadtamasi/kotta");
    expect(skill).toMatch(/rejects or cancels: create no\nissue, send nothing/);
    expect(skill).toMatch(/general approval to file the issue is not consent/i);
    expect(skill).toMatch(/Never infer consent, never carry it to the next report/);
    expect(skill).toMatch(/reuses the same approved draft/);
    expect(skill).toMatch(/never store, request, or read a GitHub token/i);
  });

  test("keeps the failure path recoverable and credential-free", () => {
    const fallback = skill.split("## 7. When submission is not possible")[1] ?? "";
    expect(fallback).toMatch(/copyable Markdown/);
    expect(fallback).toContain(ISSUE_FORM_URL);
    expect(fallback).toMatch(/do not retry silently/i);
  });

  test("documents maintainer capture as a observation rather than a task", () => {
    const triage = skill.split("## 8. For Kotta maintainers only")[1] ?? "";
    expect(triage).toContain("kotta observation new --title");
    expect(triage).toContain("--type bug");
    expect(triage).toMatch(/A GitHub Issue never creates a\ntask by itself/);
    // The user's own workspace is never mutated by reporting.
    expect(skill).toMatch(/no task, no\nobservation, no decision is created locally/);
  });
});

describe("documentation", () => {
  const readme = read("README.md");

  test("points installed and public users at the same reporting task", () => {
    expect(readme).toContain("## Report a bug");
    expect(readme).toContain(ISSUE_FORM_URL);
    expect(readme).toContain("`report-kotta-bug`");
    expect(readme).toMatch(/off by default and\nrequire a separate per-report opt-in/);
    expect(readme).toMatch(/Kotta stores no GitHub\ncredential/);
    expect(readme).toContain("kotta observation new --title");
  });
});

describe("maintainer triage of a submitted issue", () => {
  test("captures the issue URL as a observation and creates no task", () => {
    const root = mkdtempSync(join(tmpdir(), "kotta-bug-report-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: root });
    execFileSync("git", ["config", "user.name", "Test User"], { cwd: root });
    execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root });
    writeFileSync(join(root, "README.md"), "fixture\n");
    run(root, ["init"]);

    const issueUrl = "https://github.com/arpadtamasi/kotta/issues/1234";
    const created = run(root, [
      "observation", "new",
      "--title", "kotta task brief fails without profiles",
      "--type", "bug",
      "--evidence", `${issueUrl} — reported: \`kotta task brief T-001\` exits 1 on a task with no profiles. Reported version 0.2.2.`,
    ]) as { ok: boolean; data: { id: string; path: string } };
    expect(created.ok).toBe(true);
    const observationId = created.data.id;

    const observation = readFileSync(created.data.path, "utf8");
    expect(observation).toContain(issueUrl);
    expect(observation).toContain("Reported version 0.2.2");
    expect(observation).toContain("observation_type: bug");
    expect(observation).toContain("status: new");
    expect(run(root, ["observation", "validate", observationId])).toMatchObject({ ok: true });

    // The issue exists; scheduled work does not follow from that alone.
    for (const state of ["backlog", "defined", "active", "review", "done"]) {
      const directory = join(root, ".kotta", state);
      expect(existsSync(directory) ? readdirSync(directory).filter((name) => name.endsWith(".md")) : []).toEqual([]);
    }

    // Only an explicitly approved disposition may schedule work.
    const unapproved = spawnSync("node", [cli, "observation", "resolve", observationId, "--disposition", "create-task", "--json"], { cwd: root, encoding: "utf8" });
    expect(unapproved.status).not.toBe(0);
    expect(`${unapproved.stdout}${unapproved.stderr}`).toMatch(/approval/i);
    expect(readdirSync(join(root, ".kotta/process/backlog")).filter((name) => name.endsWith(".md"))).toEqual([]);

    const resolved = run(root, ["observation", "resolve", observationId, "--disposition", "create-task", "--approve"]) as { ok: boolean; data: { taskId: string } };
    expect(resolved.ok).toBe(true);
    const taskFile = readdirSync(join(root, ".kotta/process/backlog")).filter((name) => name.endsWith(".md"));
    expect(taskFile).toEqual([`kotta-task-brief-fails-without-profiles-${resolved.data.taskId.slice(-8)}.md`]);
    expect(readFileSync(join(root, ".kotta/process/backlog", taskFile[0]), "utf8")).toContain(`source_observation: ${observationId}`);
  });
});
