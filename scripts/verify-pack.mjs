import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const report = process.argv[2]
  ? JSON.parse(readFileSync(resolve(process.argv[2]), "utf8"))
  : JSON.parse(execFileSync("npm", ["pack", "--json", "--ignore-scripts"], { encoding: "utf8" }));
if (!Array.isArray(report) || report.length !== 1) throw new Error("Expected one npm pack result.");

const files = report[0].files.map((entry) => String(entry.path));
const requiredRoots = ["dist/", "ui-dist/", "schemas/", "skills/", "templates/"];
for (const root of requiredRoots) {
  if (!files.some((path) => path.startsWith(root))) throw new Error(`Packed artifact is missing ${root}`);
}

const forbidden = files.filter((path) =>
  path.startsWith("src/") ||
  path.startsWith("site-dist/") ||
  path.startsWith(".github/") ||
  path.startsWith("tests/") ||
  /(^|\/)(\.env|\.npmrc|id_rsa|.*\.pem)$/.test(path)
);
if (forbidden.length) throw new Error(`Packed artifact contains forbidden files: ${forbidden.join(", ")}`);

process.stdout.write(`${JSON.stringify({ name: report[0].name, version: report[0].version, integrity: report[0].integrity, files }, null, 2)}\n`);
