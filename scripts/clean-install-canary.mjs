import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";

const target = process.argv[2];
if (!target) throw new Error("Usage: node scripts/clean-install-canary.mjs <package-or-tarball>");
const installationTarget = existsSync(resolve(target)) ? resolve(target) : target;
const expectedVersion = String(JSON.parse(readFileSync(resolve("package.json"), "utf8")).version);
const root = mkdtempSync(join(tmpdir(), "kotta-canary-"));
const prefix = join(root, "prefix");
const repository = join(root, "repository");
mkdirSync(repository, { recursive: true });

const run = (command, args, cwd = repository, environment = process.env) => execFileSync(command, args, {
  cwd,
  env: environment,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
}).trim();

run("npm", ["install", "--global", "--prefix", prefix, installationTarget], root);
const environment = { ...process.env, PATH: `${join(prefix, "bin")}${delimiter}${process.env.PATH ?? ""}` };
// One bin name: `kotta`. The `a-team` alias of the 0.x releases left with 1.0.
const actualVersion = run("kotta", ["--version"], repository, environment);
if (actualVersion !== expectedVersion) throw new Error(`Expected kotta ${expectedVersion}, received ${actualVersion}.`);
run("git", ["init", "-b", "main"]);
writeFileSync(join(repository, "README.md"), "# Canary repository\n");
run("kotta", ["init"], repository, environment);
if (!existsSync(join(repository, ".kotta"))) throw new Error("kotta init did not create a .kotta workspace.");
run("kotta", ["validate"], repository, environment);
process.stdout.write(`${JSON.stringify({ target, version: actualVersion, repository })}\n`);
