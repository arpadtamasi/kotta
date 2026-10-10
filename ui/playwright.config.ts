import { defineConfig } from "@playwright/test";

// The board's browser suite: what only a real layout can measure — the fixed part of the page, the
// scroll a view keeps, the keys, the phone band (QA-01m4ghr80v0r92aw1d9rq9zt6f, QA-01m4ghr864w6xe125fkvrdptmh,
// QA-01m4ghr8h4345h3tt86nb28eqx). It serves the built board over a fixture repository.
const port = process.env.KOTTA_BOARD_PORT ?? "4398";
export default defineConfig({
  testDir: "./tests",
  outputDir: "../test-results/board",
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${port}/`, viewport: { width: 1312, height: 735 }, trace: "retain-on-failure" },
  webServer: {
    command: "node scripts/board-fixture.mjs",
    cwd: new URL("..", import.meta.url).pathname,
    url: `http://127.0.0.1:${port}/api/workspace`,
    reuseExistingServer: false,
    env: { KOTTA_BOARD_PORT: port },
  },
});
