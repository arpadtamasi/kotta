/**
 * How strongly a file evidences a node. `cited` is the id anywhere in a committed file — what `gap`
 * has always read. `bound` is the id in a test's own name, so a test run can later say which promise
 * went green; the run itself (`prove`) is not part of this reading.
 */

export type EvidenceKind = "code" | "test" | "command";
export type EvidenceLevel = "none" | "cited" | "bound";

export const EVIDENCE_LEVELS: readonly EvidenceLevel[] = ["none", "cited", "bound"];

/** The classification `gap` reports: a path is a test, a command definition, or code. */
export function evidenceKind(path: string): EvidenceKind {
  if (/(?:^|\/)(?:test|tests|spec|specs)(?:\/|$)|\.(?:test|spec)\./i.test(path)) return "test";
  if (/(?:^|\/)(?:bin|cli|commands|scripts)(?:\/|$)|(?:^|\/)package\.json$|\.(?:sh|bash|zsh)$/i.test(path)) return "command";
  return "code";
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The id as it can appear in an identifier: `BR-01ab…` becomes `br_01ab…`. */
function identifierForm(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

/**
 * Does this text name the id in a test's name? JavaScript, TypeScript and Dart name a test with a
 * string (`it(`, `test(`, `describe(`, Dart's `group(` and `testWidgets(`); Rust and Python with an
 * identifier, where the id's separators become underscores. A skipped or todo test is not a binding:
 * `it.skip(`, `xit(` and `#[ignore]` say in the source that nothing runs.
 */
export function bindsInTestName(text: string, id: string): boolean {
  if (!text.includes(id) && !text.toLowerCase().includes(identifierForm(id))) return false;
  const named = new RegExp(`(?:^|[^\\w.$])(?:it|test|describe|group|testWidgets)(?:\\.(?:only|concurrent|sequential))?\\s*\\(\\s*(["'\`])(?:(?!\\1)[^\\n])*${escape(id)}`);
  if (named.test(text)) return true;
  const identifier = escape(identifierForm(id));
  const rust = new RegExp(`#\\[test\\]((?:\\s*#\\[[^\\]]*\\])*)\\s*(?:pub\\s+)?(?:async\\s+)?fn\\s+\\w*${identifier}\\w*`, "gi");
  for (const match of text.matchAll(rust)) if (!/#\[ignore/.test(match[1] ?? "")) return true;
  const python = new RegExp(`\\bdef\\s+test_\\w*${identifier}\\w*\\s*\\(`, "i");
  return python.test(text);
}

/** The level a set of evidence reaches: bound beats cited beats none. */
export function evidenceLevel(files: Array<{ text: string }>, id: string): EvidenceLevel {
  if (!files.length) return "none";
  return files.some((file) => bindsInTestName(file.text, id)) ? "bound" : "cited";
}
