import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

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

  await expect(page.locator("[data-unit]")).toHaveCount(6);
  expect(await page.locator("[data-unit]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-unit")))).toEqual(["hero", "problem", "workflow", "comparison", "quickstart", "trust"]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Everything we learned about spelling out exactly what we want.");
  await expect(page.getByText("Without the rigidity that kept us from doing it properly. Designed to be executed by AI. Your job is to figure out what you want.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The agent is no longer the bottleneck. Human oversight is." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Keep AI-sized output inside human-sized work batches." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create your first task" })).toHaveAttribute("href", "#install");
  await expect(page.getByRole("link", { name: "See the workflow" })).toHaveAttribute("href", "#how");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(page.locator("tbody th")).toHaveText(["Agent chat", "Jira / Linear", "Agent orchestrator", "Kotta"]);
  await expect(page.locator("#install")).toContainText("@arpadtamasi/kotta@0.6.0");
  await expect(page.locator("#install")).toContainText("npx skills@1.5.20 add arpadtamasi/kotta");
  await expect(page.locator("#install")).toContainText("Continue in chat");
  await expect(page.locator("#install")).toContainText("## Acceptance");
  expect([...responseTypes.entries()].find(([path]) => path.endsWith(".css"))?.[1]).toContain("text/css");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(243, 242, 242)");
  expect(requests.some((url) => new URL(url).pathname.startsWith("/api/"))).toBe(false);
  expect(failedResponses).toEqual([]);
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

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    expect(await page.getByRole("link", { name: "Skip to content" }).evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe("none");
    expect(await page.locator(".button").first().evaluate((element) => parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThanOrEqual(0.01);
    await page.screenshot({ path: testInfo.outputPath(`${viewport.name}-full.png`), fullPage: true });
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
  await expect(page.getByRole("link", { name: "Create your first task" })).toHaveAttribute("href", "#install");
  await context.close();
});
