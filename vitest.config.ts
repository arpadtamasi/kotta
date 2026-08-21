import { tmpdir } from "node:os";
import { join } from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // The board is JSX; the CLI is not. `automatic` lets a .tsx test render a component
  // without importing React, matching how `npm run build:ui` compiles the board.
  esbuild: { jsx: "automatic" },
  test: {
    // The coordinator suite spends over a minute in synchronous Git fixtures. Fork-pool RPC can
    // time out while that child process is busy even though every test passes; threads keep the
    // control channel responsive and give the release gate a truthful exit status.
    pool: "threads",
    fileParallelism: false,
    testTimeout: 15_000,
    // Node is the default for every test file. A UI test opts into the browser-like
    // environment per file with `// @vitest-environment jsdom` on its first line, so
    // no CLI test can drift into jsdom by editing shared config. See tests/ui/.
    environment: "node",
    // No test may launch a real browser: every `kotta ui` here — in process or spawned,
    // which inherits this — hands its URL to a no-op instead of the platform opener.
    // No test may install skills into the operator's real home. `kotta init` installs them, so
    // every test that initializes a workspace — most of them — would otherwise write to
    // ~/.claude/skills. Redirected once here, and inherited by spawned CLI processes, exactly as
    // the browser opener above.
    env: { KOTTA_UI_OPEN_COMMAND: "true", KOTTA_SKILLS_HOME: join(tmpdir(), "kotta-test-skills") },
    // Kotta gives every active task a linked worktree under `worktree_root` (.worktrees by
    // default), and each one is a full checkout carrying its own copy of tests/. Vitest ignores
    // .gitignore when discovering tests, so without this the suite runs once per open task
    // against a `dist/` resolved from this root — a result that means nothing in either direction.
    exclude: [...configDefaults.exclude, "site/tests/**", ".worktrees/**"],
  },
});
