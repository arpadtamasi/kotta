import { expect, test } from "@playwright/test";

/*
 * The board in a real browser, on the intimity fixture (scripts/board-fixture.mjs): what only a real
 * layout can measure. Keeps QA-01m4ghr80v0r92aw1d9rq9zt6f (calm), QA-01m4ghr864w6xe125fkvrdptmh
 * (found and linked), QA-01m4ghr8h4345h3tt86nb28eqx (the view holds still) and the phone band of
 * QA-01m0f0wn89pg0x4zymz08mh15w (accessible web surfaces).
 */

const fixedHeight = (page: import("@playwright/test").Page) => page.locator(".stage").evaluate((stage) => stage.getBoundingClientRect().top);

test("the change fits one calm screen: the fixed part stays under 120 pixels, the proposal opens in the flow (EX-01m4ghr8pn9bjgmcm557zf5xdt)", async ({ page }) => {
  await page.goto("/?change=review");
  await expect(page.getByRole("region", { name: "Open change: A long proposal" })).toBeVisible();
  expect(await fixedHeight(page)).toBeLessThanOrEqual(120);
  await page.getByText("Proposal", { exact: true }).click();
  await expect(page.getByText("Point 30")).toBeAttached();
  expect(await fixedHeight(page)).toBeLessThanOrEqual(120);
  await page.goto("/");
  await expect(page.locator(".spec-group").first()).toBeVisible();
  for (const head of await page.locator(".spec-group").all()) {
    const rows = head.locator(".spec-row");
    if ((await rows.count()) < 2) continue;
    await expect(head.locator(".spec-group__shared")).toContainText("partly filled in");
    await expect(rows.first()).not.toContainText("partly filled in");
  }
});

test("a phrase from a rule's body is found with /, and a copied address opens the same screen (EX-01m4ghr8w38wt1tweg4bb2r1te)", async ({ page, context }) => {
  await page.goto("/?view=tree");
  await page.locator("body").press("/");
  await expect(page.getByRole("searchbox")).toBeFocused();
  await page.keyboard.type("at least three cards");
  await page.getByRole("button", { name: /Every new round contains two equal sides/ }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const address = page.url();
  const other = await context.newPage();
  await other.goto(address);
  await expect(other.getByRole("dialog", { name: /Every new round contains two equal sides/ })).toBeVisible();
  await expect(other.getByRole("searchbox")).toHaveValue("at least three cards");
  await other.keyboard.press("Escape");
  await expect(other.getByRole("dialog")).toHaveCount(0);
});

test("the tree is walked with the arrow keys, and back steps along the opened nodes", async ({ page }) => {
  await page.goto("/?view=tree");
  await page.getByRole("button", { name: "expand all" }).click();
  const first = page.locator(".tree [data-tree-item]").first();
  await first.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".tree [data-tree-item]").nth(1)).toBeFocused();
  await page.getByRole("button", { name: "Every new round contains two equal sides" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Deal or join tonight's round" }).first().click();
  await expect(dialog).toHaveAttribute("aria-label", /Deal or join tonight's round/);
  await dialog.getByRole("button", { name: "← Back" }).click();
  await expect(dialog).toHaveAttribute("aria-label", /Every new round contains two equal sides/);
});

test("returning to the tree finds it where it was left; a view switched to opens at its top (EX-01m4ghr97pebezq1r7qmwzrtgt)", async ({ page }) => {
  await page.goto("/?view=tree");
  await page.getByRole("button", { name: "expand all" }).click();
  await page.locator(".stage").evaluate((stage) => { stage.scrollTop = 900; });
  const left = await page.locator(".stage").evaluate((stage) => stage.scrollTop);
  await page.getByRole("button", { name: /^Use cases/ }).click();
  expect(await page.locator(".stage").evaluate((stage) => stage.scrollTop)).toBe(0);
  await page.getByRole("button", { name: /^Hierarchy/ }).click();
  expect(Math.abs(await page.locator(".stage").evaluate((stage) => stage.scrollTop) - left)).toBeLessThanOrEqual(10);
});

test("scrolling over a diagram scrolls the page", async ({ page }) => {
  await page.goto("/?view=use-cases");
  const flow = page.locator(".flow");
  await expect(flow).toBeVisible({ timeout: 15_000 });
  const before = await page.locator(".stage").evaluate((stage) => stage.scrollTop);
  await flow.hover();
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.locator(".stage").evaluate((stage) => stage.scrollTop)).toBeGreaterThan(before);
});

test("on a phone every view stays named and reachable, and nothing scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/");
  for (const name of ["Specification", "Hierarchy", "Use cases", "Stories", "Entities", "State machines"]) {
    await expect(page.getByRole("button", { name: new RegExp(`^${name}`) })).toBeAttached();
  }
  await page.getByRole("button", { name: /^Hierarchy/ }).click();
  await expect(page.getByRole("heading", { name: "Hierarchy" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
