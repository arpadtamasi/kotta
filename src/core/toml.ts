/**
 * Just enough TOML to read the manifests module discovery needs — `pyproject.toml` and `Cargo.toml`:
 * tables, arrays of tables, dotted and quoted keys, strings, arrays, inline tables, booleans and
 * numbers. A manifest this cannot read is reported by the caller as unreadable, never guessed at.
 */

export type TomlValue = string | number | boolean | TomlValue[] | TomlTable;
export interface TomlTable { [key: string]: TomlValue }

class Reader {
  index = 0;
  constructor(readonly text: string) {}

  get done(): boolean { return this.index >= this.text.length; }
  peek(offset = 0): string { return this.text[this.index + offset] ?? ""; }
  startsWith(token: string): boolean { return this.text.startsWith(token, this.index); }

  fail(message: string): never {
    const line = this.text.slice(0, this.index).split("\n").length;
    throw new Error(`TOML line ${line}: ${message}`);
  }

  /** Spaces and tabs only; newlines end a key/value pair outside arrays. */
  skipInline(): void {
    while (this.peek() === " " || this.peek() === "\t") this.index += 1;
  }

  /** Whitespace, newlines and comments — the filler allowed between array items and statements. */
  skipAll(): void {
    for (;;) {
      const char = this.peek();
      if (char === " " || char === "\t" || char === "\r" || char === "\n") this.index += 1;
      else if (char === "#") while (!this.done && this.peek() !== "\n") this.index += 1;
      else return;
    }
  }

  expect(char: string): void {
    if (this.peek() !== char) this.fail(`expected '${char}'`);
    this.index += 1;
  }

  key(): string[] {
    const parts: string[] = [];
    for (;;) {
      this.skipInline();
      const char = this.peek();
      if (char === "\"" || char === "'") parts.push(this.string());
      else {
        const match = /^[A-Za-z0-9_-]+/.exec(this.text.slice(this.index));
        if (!match) this.fail("expected a key");
        parts.push(match[0]);
        this.index += match[0].length;
      }
      this.skipInline();
      if (this.peek() !== ".") return parts;
      this.index += 1;
    }
  }

  string(): string {
    if (this.startsWith("\"\"\"") || this.startsWith("'''")) {
      const quote = this.text.slice(this.index, this.index + 3);
      this.index += 3;
      if (this.peek() === "\n") this.index += 1;
      const end = this.text.indexOf(quote, this.index);
      if (end < 0) this.fail("unterminated multi-line string");
      const raw = this.text.slice(this.index, end);
      this.index = end + 3;
      return quote === "'''" ? raw : unescape(raw);
    }
    const quote = this.peek();
    this.index += 1;
    let raw = "";
    while (!this.done && this.peek() !== quote) {
      if (this.peek() === "\n") this.fail("unterminated string");
      if (quote === "\"" && this.peek() === "\\") { raw += this.text.slice(this.index, this.index + 2); this.index += 2; continue; }
      raw += this.peek();
      this.index += 1;
    }
    this.expect(quote);
    return quote === "'" ? raw : unescape(raw);
  }

  value(): TomlValue {
    this.skipInline();
    const char = this.peek();
    if (char === "\"" || char === "'") return this.string();
    if (char === "[") {
      this.index += 1;
      const items: TomlValue[] = [];
      for (;;) {
        this.skipAll();
        if (this.peek() === "]") { this.index += 1; return items; }
        items.push(this.value());
        this.skipAll();
        if (this.peek() === ",") { this.index += 1; continue; }
        this.skipAll();
        this.expect("]");
        return items;
      }
    }
    if (char === "{") {
      this.index += 1;
      const table: TomlTable = {};
      this.skipInline();
      if (this.peek() === "}") { this.index += 1; return table; }
      for (;;) {
        const key = this.key();
        this.expect("=");
        assign(table, key, this.value(), this);
        this.skipInline();
        if (this.peek() === ",") { this.index += 1; continue; }
        this.expect("}");
        return table;
      }
    }
    const match = /^[^\s,\]}#]+/.exec(this.text.slice(this.index));
    if (!match) this.fail("expected a value");
    this.index += match[0].length;
    const bare = match[0];
    if (bare === "true") return true;
    if (bare === "false") return false;
    const number = Number(bare.replaceAll("_", ""));
    // Dates and anything else unusual stay text: nothing here reads them as values.
    return Number.isFinite(number) ? number : bare;
  }
}

function unescape(raw: string): string {
  return raw.replace(/\\(u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8}|.)/g, (_all, code: string) => {
    if (code[0] === "u" || code[0] === "U") return String.fromCodePoint(parseInt(code.slice(1), 16));
    return ({ n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", "\"": "\"", "\\": "\\" } as Record<string, string>)[code] ?? code;
  });
}

function isTable(value: TomlValue | undefined): value is TomlTable {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function descend(table: TomlTable, path: string[], reader: Reader): TomlTable {
  let current = table;
  for (const part of path) {
    let next = current[part];
    if (Array.isArray(next) && next.length && isTable(next[next.length - 1])) next = next[next.length - 1];
    if (next === undefined) { next = {}; current[part] = next; }
    if (!isTable(next)) reader.fail(`'${part}' is not a table`);
    current = next;
  }
  return current;
}

function assign(table: TomlTable, key: string[], value: TomlValue, reader: Reader): void {
  const parent = descend(table, key.slice(0, -1), reader);
  parent[key[key.length - 1]] = value;
}

export function parseToml(text: string): TomlTable {
  const reader = new Reader(text.replace(/^﻿/, ""));
  const root: TomlTable = {};
  let current = root;
  for (;;) {
    reader.skipAll();
    if (reader.done) return root;
    if (reader.startsWith("[[")) {
      reader.index += 2;
      const path = reader.key();
      reader.expect("]");
      reader.expect("]");
      const parent = descend(root, path.slice(0, -1), reader);
      const name = path[path.length - 1];
      const existing = parent[name] ?? [];
      if (!Array.isArray(existing)) reader.fail(`'${name}' is not an array of tables`);
      const list = existing as TomlValue[];
      const entry: TomlTable = {};
      list.push(entry);
      parent[name] = list;
      current = entry;
      continue;
    }
    if (reader.peek() === "[") {
      reader.index += 1;
      const path = reader.key();
      reader.expect("]");
      current = descend(root, path, reader);
      continue;
    }
    const key = reader.key();
    reader.expect("=");
    assign(current, key, reader.value(), reader);
    reader.skipInline();
    if (reader.peek() === "#") reader.skipAll();
    else if (!reader.done && reader.peek() !== "\n" && reader.peek() !== "\r") reader.fail("expected the end of the line");
  }
}

/** A nested value by path, or undefined — the shape every manifest reader needs. */
export function tomlGet(table: TomlTable, ...path: string[]): TomlValue | undefined {
  let current: TomlValue | undefined = table;
  for (const part of path) {
    if (!isTable(current)) return undefined;
    current = current[part];
  }
  return current;
}

export function tomlTable(value: TomlValue | undefined): TomlTable {
  return isTable(value) ? value : {};
}
