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

test("renders the approved content in order", async ({ page }) => {
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

  await expect(page.locator("[data-unit]")).toHaveCount(9);
  expect(await page.locator("[data-unit]").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-unit")))).toEqual(["hero", "problem", "adds", "openspec", "workflow", "board", "arrivals", "quickstart", "trust"]);
  // The message: nobody reads the long spec, so the agent decides; Kotta shows what it decided.
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nobody reads the long spec. So the agent decides.");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kotta shows you what it decided.");
  await expect(page.locator(".hero-lede")).toContainText("OpenSpec already writes the change in prose.");
  await expect(page.locator(".node-card .prov-badge")).toHaveText(["partly inferred", "the agent decided"]);
  await expect(page.getByRole("heading", { name: "A spec nobody reads is a spec the agent decides." })).toBeVisible();
  await expect(page.locator(".problem-points > div")).toHaveCount(4);
  // What Kotta adds to OpenSpec: the technical spec, the diagrams, the marked decisions, the conversation.
  await expect(page.getByRole("heading", { name: "What Kotta adds to OpenSpec." })).toBeVisible();
  await expect(page.locator(".adds-list h3")).toHaveText(["A technical spec", "Diagrams", "The machine’s decisions, marked", "The conversation, kept"]);
  await expect(page.locator(".adds-list")).toContainText("kotta narrative");
  // Compatibility, with the one command it replaces said out loud.
  await expect(page.getByRole("heading", { name: "On top of OpenSpec. Compatible with it." })).toBeVisible();
  await expect(page.locator("tbody th")).toHaveText(["A change", "The accepted state", "Writing specs yourself", "An existing repository", "Landing a change"]);
  await expect(page.locator("#openspec")).toContainText("openspec validate --specs --strict");
  await expect(page.locator("#openspec")).toContainText("kotta import openspec");
  await expect(page.getByRole("heading", { name: "One change, one human yes." })).toBeVisible();
  await expect(page.locator(".mechanism-flow h3")).toHaveText(["Propose", "Plan", "Approve", "Archive"]);
  await expect(page.getByRole("heading", { name: "Three ways in." })).toBeVisible();
  await expect(page.locator(".arrival-list li")).toHaveCount(3);
  await expect(page.locator(".arrival-list")).toContainText("kotta import openspec");
  await expect(page.locator(".arrival-list")).toContainText("kotta migrate");
  await expect(page.getByRole("link", { name: "Install Kotta" })).toHaveAttribute("href", "#install");
  await expect(page.getByRole("link", { name: "View on GitHub" })).toHaveAttribute("href", "https://github.com/arpadtamasi/kotta");
  await expect(page.getByText("On the list to read before you say yes")).toBeVisible();
  // The board section: a real screenshot, served from the build, and the decision aid beside it.
  await expect(page.getByRole("heading", { name: "See what the machine decided." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kotta, or OpenSpec alone?" })).toBeVisible();
  await expect(page.locator(".decision-aid p")).toHaveCount(2);
  const shot = page.locator(".board-view .board-shot img");
  await shot.scrollIntoViewIfNeeded();
  await expect(shot).toHaveAttribute("alt", /provenance badges/);
  await expect.poll(() => shot.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth)).toBe(1440);
  // The documentation is one click away: header, footer, and the walkthrough beside the screenshot.
  const docs = "https://github.com/arpadtamasi/kotta/tree/main/docs";
  await expect(page.locator("header nav").getByRole("link", { name: "Docs" })).toHaveAttribute("href", docs);
  await expect(page.locator("footer").getByRole("link", { name: "Docs" })).toHaveAttribute("href", docs);
  await expect(page.getByRole("link", { name: "Read the docs" })).toHaveAttribute("href", docs);
  await expect(page.getByRole("link", { name: "Ten-minute walkthrough" })).toHaveAttribute("href", "https://github.com/arpadtamasi/kotta/blob/main/docs/getting-started.md");
  await expect(page.locator("#install")).toContainText(`@arpadtamasi/kotta@${declaredVersion()}`);
  // One Kotta command, not a pinned third-party installer that leaves out the rules file
  // (BR-01m0zx29x1nvccpr4xwyhjr153).
  await expect(page.locator("#install")).toContainText("kotta init");
  await expect(page.locator("#install")).not.toContainText("npx skills@");
  await expect(page.locator("#install")).toContainText("/plan-change");
  await expect(page.locator("#install")).toContainText("kotta plan <change>");
  await expect(page.locator("#install")).toContainText("kotta approve <change> --by you");
  await expect(page.locator("#install")).toContainText("kotta archive <change>");
  // The page describes 1.0: none of the 0.x process vocabulary is left on it.
  const text = (await page.locator("body").innerText()).toLowerCase();
  for (const word of ["task", "claim", "batch", "observation", "worktree", "review gate", ".kotta/process/"]) expect(text, word).not.toContain(word);
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
    page.locator(".node-card"),
    page.getByText("On the list to read before you say yes"),
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
