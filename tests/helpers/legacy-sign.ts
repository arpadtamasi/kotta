import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Lifecycle tests written before accepted-spec coverage exercise the compatibility workflow on
 * purpose. Product-default coverage behavior has its own integration suite; these fixtures opt in
 * explicitly instead of weakening the production gate.
 */
export function retainLegacySignGate(root: string): void {
  for (const directory of [".kotta", ".a-team"]) {
    const path = join(root, directory, "config.yaml");
    if (!existsSync(path)) continue;
    const config = readFileSync(path, "utf8");
    writeFileSync(path, config.replace("require_human_sign_approval: false", "require_human_sign_approval: true"));
    return;
  }
  throw new Error(`No Kotta workspace config under ${root}.`);
}
