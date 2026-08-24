import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

/**
 * Lifecycle fixtures need an accepted specification node to cover their acceptance conditions
 * with: since the sign gate retired, `task define` is the only route out of backlog and it always
 * checks coverage. One shared glossary term keeps every fixture on the product path.
 */
export const FIXTURE_SPEC_ID = "GT-01m0c000000000000000000fxt";

export const FIXTURE_ACCEPTANCE = "The fixture promise is delivered.";

/** Land the shared glossary term in a freshly initialized workspace. */
export function acceptFixtureSpec(root: string, workspace = ".kotta"): string {
  const directory = join(root, workspace, "spec/glossary-terms");
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, `fixture-promise-${FIXTURE_SPEC_ID.slice(-8)}.md`), [
    "---", `id: ${FIXTURE_SPEC_ID}`, "form: glossary-term", "title: Fixture promise", "---", "",
    "## Definition", "", FIXTURE_ACCEPTANCE, "",
    "## Usage", "", "A fixture task names this node to cover its acceptance.", "",
    "## Non-examples", "", "An acceptance condition no accepted node promises.", "",
  ].join("\n"));
  return FIXTURE_SPEC_ID;
}

export interface CoveredDefinitionOptions {
  /** Acceptance conditions, each covered by every id in `spec`. */
  acceptance?: string[];
  outcome?: string;
  verification?: string;
  spec?: string[];
  /** Extra frontmatter lines (`depends_on`, `blocks`, `priority`, …), verbatim. */
  frontmatter?: string[];
}

/**
 * The file `task define --from` takes: the task's own template body with its placeholders filled
 * in — so profile-required sections survive — plus the frontmatter that maps every acceptance
 * condition to an accepted node.
 */
export function coveredDefinition(taskPath: string, options: CoveredDefinitionOptions = {}): string {
  const acceptance = options.acceptance ?? [FIXTURE_ACCEPTANCE];
  const spec = options.spec ?? [FIXTURE_SPEC_ID];
  const body = readFileSync(taskPath, "utf8").split(/^---$/m).slice(2).join("---").replace(/^\n+/, "")
    .replace("Describe the observable outcome.", options.outcome ?? "The fixture promise is observable.")
    .replace("- Define an observable condition.", acceptance.map((condition) => `- ${condition}`).join("\n"))
    .replace("- Explain how acceptance will be checked.", `- ${options.verification ?? "Run the integration test."}`);
  const path = join(tmpdir(), `kotta-definition-${basename(taskPath)}`);
  writeFileSync(path, [
    "---",
    ...(options.frontmatter ?? []),
    "spec:", ...spec.map((id) => `  - ${id}`),
    "coverage:",
    ...acceptance.flatMap((condition) => [`  "${condition}":`, ...spec.map((id) => `    - ${id}`)]),
    "---", "", body,
  ].join("\n"));
  return path;
}
