import { describe, expect, test } from "vitest";
import { parseMarkdown, sections } from "../../src/core/markdown.js";

describe("Markdown section parsing", () => {
  test("ignores headings quoted inside fenced examples", () => {
    const parsed = sections(`## Outcome

Real outcome.

\`\`\`markdown
## Not a real section
\`\`\`

## Scope

Bounded scope.
`);

    expect([...parsed.keys()]).toEqual(["outcome", "scope"]);
    expect(parsed.get("outcome")).toContain("Real outcome.");
  });
});

describe("Frontmatter ownership", () => {
  test("hands every caller its own object, so one caller's edit cannot reach the next parse", () => {
    const source = "---\nid: T-001\ndepends_on:\n  - T-002\n---\n\n## Outcome\n\nOwned.\n";

    const first = parseMarkdown(source);
    const second = parseMarkdown(source);
    expect(first.data).not.toBe(second.data);

    first.data.status = "done";
    (first.data.depends_on as string[])[0] = "T-999";

    expect(second.data.status).toBeUndefined();
    expect(second.data.depends_on).toEqual(["T-002"]);
  });
});
