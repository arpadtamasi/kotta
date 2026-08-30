/**
 * One parse of a task's review evidence, shared by everything that reads it.
 *
 * The sweep decides whether a deviation was declared; settling decides whether there is anything to
 * settle. Two readings of the same prose would eventually disagree about the same task, and the
 * disagreement would be silent — so there is one.
 */

/** One section of a task's review evidence, trimmed; empty when the section is absent. */
export function reviewSection(body: string, heading: string): string {
  const lines = body.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `### ${heading}`);
  if (start < 0) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith("#"));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
}

/** Text a caller wrote to say there was nothing to declare. */
export function declaredNothing(text: string): boolean {
  const normalised = text.toLowerCase().replace(/[.\s]+$/, "");
  return !normalised || normalised === "none" || normalised === "not declared" || normalised === "n/a";
}
