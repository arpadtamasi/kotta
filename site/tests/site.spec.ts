import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

/** The one version any published surface may name (BR-01m0zx29x1nvccpr4xwyhjr153). */
function declaredVersion(): string {
  return (JSON.parse(readFileSync(resolve("package.json"), "utf8")) as { version: string }).version;
}

test("renders the approved content task in order", async ({ page }) => {
  const requests: string[] = [];
  const failedResponses: string[] = [];
  const responseTypes = new Map<string, string>();
  page.on("request", (request) => requests.push(request.url()));
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin !== "http://127.0.0.1:4174") return;
    responseTypes.set(url.pathname, response.headers()["content-type"] ?? "");
    if (!response.ok()) failedResponses.push(response.url());
  });
  await page.goto("./");

  await expect(page.locator("[data-unit]")).toHaveCount(7);
  expect(await page.locator("[data-unit]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-unit")))).toEqual(["hero", "problem", "arrivals", "workflow", "comparison", "quickstart", "trust"]);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("The last 10% is the whole job.");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Start there.");
  await expect(page.getByText("checks that run instead of being narrated")).toBeVisible();
  await expect(page.getByText("run: npx playwright test — verified: exit 0")).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI can execute more work than you can continuously observe." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "The agreement becomes executable." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Three ways in." })).toBeVisible();
  await expect(page.locator(".arrival-list li")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Install Kotta" })).toHaveAttribute("href", "#install");
  await expect(page.getByRole("link", { name: "View on GitHub" })).toHaveAttribute("href", "https://github.com/arpadtamasi/kotta");
  await expect(page.getByText("Human decision required")).toBeVisible();
  await expect(page.getByText("One agent · one branch · one isolated worktree.")).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await expect(page.locator("tbody th")).toHaveText(["Agent chat", "Issue tracker", "Agent runtime", "Spec generator", "Kotta"]);
  await expect(page.locator("#install")).toContainText(`@arpadtamasi/kotta@${declaredVersion()}`);
  // One Kotta command, not a pinned third-party installer that leaves out the rules file
  // (BR-01m0zx29x1nvccpr4xwyhjr153).
  await expect(page.locator("#install")).toContainText("kotta init");
  await expect(page.locator("#install")).not.toContainText("npx skills@");
  await expect(page.locator("#install")).toContainText("/setup-kotta");
  await expect(page.locator("#install")).toContainText("/define-task");
  expect([...responseTypes.entries()].find(([path]) => path.endsWith(".css"))?.[1]).toContain("text/css");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(243, 242, 242)");
  expect(requests.some((url) => new URL(url).pathname.startsWith("/api/"))).toBe(false);
  expect(failedResponses).toEqual([]);
});

test("desktop first viewport carries the offer, action and control mechanism", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("./");

  const essentials = [
    page.getByRole("heading", { level: 1 }),
    page.getByRole("link", { name: "Install Kotta" }),
    page.getByRole("link", { name: "View on GitHub" }),
    page.locator(".task-record"),
    page.getByText("Human decision required"),
  ];
  for (const essential of essentials) {
    await expect(essential).toBeVisible();
    const box = await essential.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(900);
  }
});

for (const viewport of viewports) {
  test(`${viewport.name} layout, accessibility, links and motion`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""))).toEqual([]);

    const ids = await page.locator("[id]").evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const href of await page.locator('a[href^="#"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")!))) {
      await expect(page.locator(href)).toHaveCount(1);
    }
    for (const href of await page.locator('a[href^="http"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")!))) {
      expect(new URL(href).protocol).toBe("https:");
    }

    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-full.png`), fullPage: true });
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    expect(await page.getByRole("link", { name: "Skip to content" }).evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
    expect(await page.locator(".button").first().evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThanOrEqual(0.01);
  });
}

test("offers a keyboard-reachable bug-reporting path at every supported width", async ({ page }) => {
  const issueForm = "https://github.com/arpadtamasi/kotta/issues/new?template=bug.yml";
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("./");
    const reporting = page.getByRole("link", { name: "Report a bug" });
    await expect(reporting).toHaveCount(2);
    for (const link of await reporting.all()) await expect(link).toHaveAttribute("href", issueForm);
    // Visible without scrolling to the footer, at both widths.
    await expect(reporting.first()).toBeVisible();
    await reporting.first().focus();
    await expect(reporting.first()).toBeFocused();
    expect(await reporting.first().evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
  }
});

test("remains readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4174/kotta/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Install Kotta" })).toHaveAttribute("href", "#install");
  await context.close();
});
