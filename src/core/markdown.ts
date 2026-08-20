import matter from "gray-matter";

export interface MarkdownEntity {
  data: Record<string, unknown>;
  content: string;
}

// gray-matter memoizes on the source string and hands every caller the same frontmatter object.
// Commands edit frontmatter in place, so a shared instance lets one caller's edit reach the next
// parse of an identical file. Each caller gets its own copy instead.
export function parseMarkdown(source: string): MarkdownEntity {
  const parsed = matter(source);
  return { data: structuredClone(parsed.data) as Record<string, unknown>, content: parsed.content };
}

export function renderMarkdown(data: Record<string, unknown>, content: string): string {
  return matter.stringify(content.trimStart(), data);
}

function headingSections(content: string, heading: RegExp): Map<string, string> {
  const result = new Map<string, string>();
  const lines = content.split(/\r?\n/);
  let current: string | undefined;
  let fenced = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const match = !fenced ? heading.exec(line) : null;
    if (match) {
      current = match[1].trim().toLowerCase();
      result.set(current, "");
    } else if (current) {
      result.set(current, `${result.get(current) ?? ""}${line}\n`);
    }
  }
  return result;
}

export function sections(content: string): Map<string, string> {
  return headingSections(content, /^##\s+(.+?)\s*$/);
}

export function subsections(content: string): Map<string, string> {
  return headingSections(content, /^###\s+(.+?)\s*$/);
}
