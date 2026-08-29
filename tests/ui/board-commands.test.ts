import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";
import { declaredCliCommands } from "../../src/core/operations.js";

/**
 * The board is read-only, and it still puts commands in front of a human. One operation, one
 * declaration binds it for exactly that reason (BR-01m0nsyasfnjc9s4073r8zb33j): being unable to act
 * is not being unable to mislead. It printed `kotta task sign <id> --approve` through a whole
 * vocabulary rename — `sign` had become `define` on the CLI, in the MCP tools, in the skills and in
 * the rules file — because the other two surfaces are derived and compared, and this one was a
 * literal nothing read.
 *
 * So this reads the board's own source rather than a list kept beside it: a second hand-maintained
 * list would be the same failure with one more step in it.
 */

const source = resolve("ui/src/App.tsx");

/** Where a command path ends: an option, a placeholder, an interpolation, or the end of the text. */
const ARGUMENT = /^(?:-|<|\$\{|…|"|'|`)/;

/**
 * What the reader sees, not what the file holds: a command is written across JSX, so `<code>` tags
 * and entity-escaped placeholders sit inside the very string being read. Scanning the raw line
 * truncated `kotta batch new` to `kotta batch` and called the board wrong about a command it prints
 * correctly.
 */
function rendered(line: string): string {
  return line.replace(/<\/?[a-zA-Z][^>]*>/g, " ").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

interface PrintedCommand {
  command: string;
  line: number;
  text: string;
}

/** Every `kotta …` the board puts on screen, with the line it is printed from. */
function printedCommands(): PrintedCommand[] {
  const found: PrintedCommand[] = [];
  const lines = readFileSync(source, "utf8").split(/\r?\n/);
  lines.forEach((text, index) => {
    for (const match of rendered(text).matchAll(/\bkotta ([^"'`\n]*)/g)) {
      const words: string[] = [];
      for (const word of match[1].split(/\s+/)) {
        if (!word || ARGUMENT.test(word)) break;
        // A trailing punctuation mark belongs to the sentence, not to the command.
        const bare = word.replace(/[.,;:)]+$/, "");
        if (!bare || !/^[a-z][a-z-]*$/.test(bare)) break;
        words.push(bare);
      }
      if (words.length) found.push({ command: words.join(" "), line: index + 1, text: text.trim() });
    }
  });
  return found;
}

describe("the commands the board prints", () => {
  test("are found at all, so a passing suite is never an empty walk", () => {
    const printed = printedCommands();
    expect(printed.length).toBeGreaterThan(8);
    expect(printed.map((entry) => entry.command)).toContain("task define");
  });

  test("every one is a command the operation registry declares", () => {
    const declared = new Set(declaredCliCommands());
    const undeclared = printedCommands().filter((entry) => !declared.has(entry.command));

    // Named, with the line, so the next rename is a failing test rather than a puzzled operator.
    expect(undeclared.map((entry) => `ui/src/App.tsx:${entry.line} prints 'kotta ${entry.command}': ${entry.text}`)).toEqual([]);
  });

  test("the removed word is gone from the board, on both sites that printed it", () => {
    const text = readFileSync(source, "utf8");
    expect(text).not.toContain("task sign");
    // And the prose that carried it no longer has defining follow validation round the wrong way.
    expect(text).not.toContain("until it validates, then define it");
  });
});
