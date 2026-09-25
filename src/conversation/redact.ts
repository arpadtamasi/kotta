/**
 * The secret and personal-data filter a distilled conversation passes before it is written into the
 * repository. Each kind is replaced by a visible marker, never silently dropped, and counted, so the
 * distillate can say what it removed without repeating it.
 *
 * Order matters: a JWT or a key is replaced before the e-mail and phone patterns could see parts of
 * it, and a home directory last, so a path inside a removed secret is not counted twice.
 */

export const REDACTION_KINDS = ["api-kulcs", "github-token", "aws-kulcs", "jwt", "titok-érték", "e-mail", "telefonszám", "otthoni-útvonal"] as const;
export type RedactionKind = typeof REDACTION_KINDS[number];
export type RedactionCounts = Partial<Record<RedactionKind, number>>;

interface Rule { kind: RedactionKind; pattern: RegExp; replace: (match: string, ...groups: string[]) => string }

const marker = (kind: RedactionKind) => `[${kind} eltávolítva]`;

/** The digits a phone number carries: a match outside 9–15 of them is a date, a version or an id. */
function digits(text: string): number {
  return text.replace(/\D/g, "").length;
}

const RULES: Rule[] = [
  { kind: "jwt", pattern: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, replace: () => marker("jwt") },
  { kind: "api-kulcs", pattern: /\bsk-[A-Za-z0-9_-]{16,}/g, replace: () => marker("api-kulcs") },
  { kind: "github-token", pattern: /\b(?:gh[opsur]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g, replace: () => marker("github-token") },
  { kind: "aws-kulcs", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, replace: () => marker("aws-kulcs") },
  // `password: …`, `api_key=…`, `Authorization: Bearer …`: the name stays, the value goes.
  {
    kind: "titok-érték",
    pattern: /\b((?:api[_-]?key|secret|token|password|passwd|jelszó|authorization)\b["']?\s*[:=]\s*["']?(?:Bearer\s+)?)([^\s"'`,;]{8,})/gi,
    replace: (_match, name) => `${name}${marker("titok-érték")}`,
  },
  { kind: "e-mail", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replace: () => marker("e-mail") },
  {
    kind: "telefonszám",
    // An international (+36 …), a Hungarian trunk (06 30 …) or a bracketed area code (555) … form.
    pattern: /(?<![\w+/.:-])(?:\+\d{1,3}[ .-]?(?:\(\d{1,4}\)[ .-]?)?\d{1,4}(?:[ .-]?\d{2,4}){1,4}|06[ -/]?\d{1,2}[ -/]?\d{3}[ -]?\d{3,4}|\(\d{2,4}\)[ ]?\d{3}[ .-]?\d{4})(?![\w/.:-]*\w)/g,
    replace: (match) => (digits(match) >= 9 && digits(match) <= 15 ? marker("telefonszám") : match),
  },
  { kind: "otthoni-útvonal", pattern: /(?:\/Users|\/home)\/[^/\s"'`]+(?=\/|\b)/g, replace: () => "~" },
  { kind: "otthoni-útvonal", pattern: /[A-Za-z]:\\Users\\[^\\\s"'`]+/g, replace: () => "~" },
  // Claude Code names a project's log folder after its path: `-Users-<name>-Dev-…`.
  { kind: "otthoni-útvonal", pattern: /(?<=\/)-(?:Users|home)-[^-/\s]+(?=-)/g, replace: () => "-~" },
];

/** The text with every secret and personal datum replaced, and how many of each kind went. */
export function redact(text: string, counts: RedactionCounts = {}): { text: string; counts: RedactionCounts } {
  let result = text;
  for (const rule of RULES) {
    result = result.replace(rule.pattern, (match: string, ...rest: unknown[]) => {
      const groups = rest.filter((value): value is string => typeof value === "string");
      const replaced = rule.replace(match, ...groups);
      if (replaced !== match) counts[rule.kind] = (counts[rule.kind] ?? 0) + 1;
      return replaced;
    });
  }
  return { text: result, counts };
}
