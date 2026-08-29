import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { describe, expect, test } from "vitest";

/**
 * "Identifiers are minted by Kotta, not written by hand: an author asking for a node gets one
 * already carrying its id and its form's skeleton" (UC-01m0f0wn89ny7vx515ke3ksnra). Everything the
 * scaffold contains is read from the form's own registry entry, so a project that registers its own
 * form gets the same service with nothing added here — which is what the custom-form case proves.
 */

const cli = resolve("dist/cli/index.js");
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" });
const attempt = (cwd: string, args: string[]) => spawnSync("node", [cli, ...args], { cwd, encoding: "utf8" });
const run = (cwd: string, args: string[]) => {
  const result = spawnSync("node", [cli, ...args, "--json"], { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
  return JSON.parse(result.stdout) as { ok: boolean; data: { id: string; form: string; title: string; path: string; unanswered: string[]; sections: string[] } };
};

function workspace(label: string): string {
  const root = mkdtempSync(join(tmpdir(), `kotta-spec-new-${label}-`));
  git(root, "init", "-b", "main");
  git(root, "config", "user.name", "Kotta Test");
  git(root, "config", "user.email", "test@example.com");
  writeFileSync(join(root, "README.md"), "fixture\n");
  execFileSync("node", [cli, "init", "--json"], { cwd: root });
  git(root, "add", ".");
  git(root, "commit", "-m", "initial");
  return root;
}

describe("kotta spec new", () => {
  test("hands the author a node carrying its minted id, its form, and the shape the registry declares", () => {
    const root = workspace("shape");

    const created = run(root, ["spec", "new", "use-case", "--title", "Export a report"]).data;

    expect(created.id).toMatch(/^UC-[0-9a-hjkmnp-tv-z]{26}$/);
    // The filename convention every registered form declares: slug, then the id's last eight.
    expect(created.path).toBe(`.kotta/spec/use-cases/export-a-report-${created.id.slice(-8)}.md`);
    const file = readFileSync(join(root, created.path), "utf8");
    const parsed = matter(file);
    expect(parsed.data).toMatchObject({ id: created.id, form: "use-case", title: "Export a report" });
    // A section per required heading, and a field per outgoing edge, both read from the form.
    for (const heading of ["Intent", "Preconditions", "Main success scenario", "Alternatives"]) {
      expect(file).toContain(`## ${heading}`);
    }
    expect(parsed.data.actor).toEqual([]);
    expect(parsed.data.goal).toEqual([]);
    expect(created.unanswered).toEqual(["actor", "goal"]);
    // The form's own questions, and which of them this node answers itself.
    expect(file).toContain("Which actor owns this interaction? Answer in frontmatter 'actor'.");
    expect(file).toContain("What example proves this use case? Answered by a example node naming this one.");
  });

  test("serves a form the project registered itself, with nothing about it compiled in", () => {
    const root = workspace("custom");
    writeFileSync(join(root, ".kotta/spec/forms/risk.yaml"), [
      "id: risk", "version: 1", "directory: risks", "canonical_source: Project",
      "description: A named risk the project carries.",
      "identity:", "  prefix: RK", '  format: "<prefix>-<26-character lowercase Crockford ULID>"', '  filename: "<slug>-<last 8 id characters>.md"',
      "required_fields:", "  frontmatter: [id, form, title, severity]",
      "  body_headings: [Exposure, Mitigation]",
      "required_edges: []",
      "recognition_signals:", "  - The project carries a risk nobody owns.", "",
    ].join("\n"));

    const created = run(root, ["spec", "new", "risk", "--title", "Vendor lock-in"]).data;

    expect(created.id).toMatch(/^RK-[0-9a-hjkmnp-tv-z]{26}$/);
    expect(created.path).toBe(`.kotta/spec/risks/vendor-lock-in-${created.id.slice(-8)}.md`);
    const parsed = matter(readFileSync(join(root, created.path), "utf8"));
    // The field the project's own form requires is laid out, unanswered and named as such.
    expect(parsed.data.severity).toBeNull();
    expect(created.unanswered).toEqual(["severity"]);
    expect(created.sections).toEqual(["Exposure", "Mitigation"]);
  });

  test("an unregistered form is refused by naming the ones there are, and nothing is written", () => {
    const root = workspace("unknown");
    const before = readdirSync(join(root, ".kotta/spec"));

    const refusal = attempt(root, ["spec", "new", "nonesuch", "--title", "Whatever"]);

    expect(refusal.status).toBe(1);
    const said = refusal.stdout + refusal.stderr;
    expect(said).toContain("No form 'nonesuch' is registered");
    expect(said).toContain("use-case");
    expect(said).toContain("business-rule");
    expect(readdirSync(join(root, ".kotta/spec"))).toEqual(before);
    expect(git(root, "status", "--porcelain")).toBe("");
  });

  test("the scaffold is a draft: nothing is committed, and validation asks the form's own question for each unanswered part", () => {
    const root = workspace("draft");

    const created = run(root, ["spec", "new", "use-case", "--title", "Export a report"]).data;

    // Left for the human yes that lands it: written, untracked, uncommitted.
    expect(git(root, "status", "--porcelain", "-uall")).toContain(created.path);
    expect(git(root, "log", "-1", "--format=%s").trim()).toBe("initial");

    const validation = attempt(root, ["validate"]);
    expect(validation.status).toBe(1);
    const said = validation.stdout + validation.stderr;
    expect(said).toContain("Which actor owns this interaction?");
    expect(said).toContain("Which goal does this use case serve?");
    expect(said).toContain("missing or leaves empty the required section 'Intent'");
    // The result said this would happen rather than letting the red arrive unexplained.
    const spoken = attempt(root, ["spec", "new", "use-case", "--title", "Another report"]);
    expect(spoken.stdout).toContain("nothing was committed");
    expect(spoken.stdout).toContain("names each unanswered part with its form's own question");
  });

  test("a node is never overwritten", () => {
    const root = workspace("collision");
    const created = run(root, ["spec", "new", "glossary-term", "--title", "Coordinator branch"]).data;
    const written = readFileSync(join(root, created.path), "utf8");

    // The same title mints a different id, so the filenames differ; the collision case is the
    // destination itself, which is refused rather than replaced.
    const second = run(root, ["spec", "new", "glossary-term", "--title", "Coordinator branch"]).data;
    expect(second.path).not.toBe(created.path);
    expect(readFileSync(join(root, created.path), "utf8")).toBe(written);
    expect(existsSync(join(root, second.path))).toBe(true);
  });
});
