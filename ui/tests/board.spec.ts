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
  await page.locator(".process-line summary", { hasText: "proposal" }).click();
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

test("a phrase from a rule's body is found with /, and a copied address opens the same screen (EX-01m4ghr8w38wt1tweg4bb2r1te, EX-01m4ggqcemksxzh5hwaf95ha1m)", async ({ page, context }) => {
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

test.describe("finding one's way in the hierarchy (QA-01m4gmdm6r7t4ajnxa3515ccvd)", () => {
  test("the outline starts on the first screen, the gaps take two lines, any goal is two actions from anywhere (EX-01m4gmdn3rgp6nyh7a5c34eh2c)", async ({ page }) => {
    await page.goto("/?view=tree");
    const outline = page.locator("#tree-outline");
    await expect(outline).toBeVisible();
    const top = await outline.evaluate((element) => element.getBoundingClientRect().top);
    expect(top).toBeLessThan(735);
    const gaps = page.locator("details.tree-gaps");
    if (await gaps.count()) {
      const height = await gaps.locator("summary").evaluate((summary) => summary.getBoundingClientRect().height);
      const line = await gaps.locator("summary").evaluate((summary) => parseFloat(getComputedStyle(summary).lineHeight) || 20);
      expect(height).toBeLessThanOrEqual(line * 2 + 8);
    }
    await expect(page.locator(".tree-drop")).toHaveCount(0);
    await page.locator(".stage").evaluate((stage) => { stage.scrollTop = stage.scrollHeight; });
    // From deep in the view: one action to the outline, one to the goal.
    await page.locator(".tree-to-outline").click();
    await outline.getByRole("button", { name: "Each partner can answer honestly, in private" }).click();
    const head = page.locator("details.tree-goal > summary", { hasText: "Each partner can answer honestly, in private" }).first();
    await expect(head).toBeInViewport();
    expect(await head.evaluate((summary) => (summary.parentElement as HTMLDetailsElement).open)).toBe(true);
  });

  test("a rule is three actions from anywhere, at desktop and at phone width (EX-01m4gmtcgffy7y5rd5ztk2jysn)", async ({ page }) => {
    for (const width of [1312, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 800 : 735 });
      await page.goto("/?view=tree");
      await page.locator(".stage").evaluate((stage) => { stage.scrollTop = stage.scrollHeight; });
      await page.locator(".tree-to-outline").click();
      await page.locator("#tree-outline").getByRole("button", { name: "Deal or join tonight's round" }).or(page.locator("#tree-outline").getByRole("button", { name: "Both phones play one shared round" })).first().click();
      await page.locator("details.tree-uc > summary", { hasText: "Deal or join tonight's round" }).first().click();
      await expect(page.getByRole("button", { name: "Every new round contains two equal sides" }).first()).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
});

test("stepping back in the drawer returns to where the reader left the node (EX-01m4gmdn9dhm640cr5j8aq0701)", async ({ page }) => {
  await page.goto("/?view=tree");
  await page.getByRole("button", { name: "expand all" }).click();
  await page.locator(".tree-uc__title", { hasText: "Choose a side and answer the cards" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  const left = await dialog.evaluate((element) => element.scrollTop);
  await dialog.getByRole("button", { name: "Each partner can answer honestly, in private" }).last().click();
  await expect(dialog).toHaveAttribute("aria-label", /Each partner can answer honestly/);
  expect(await dialog.evaluate((element) => element.scrollTop)).toBe(0);
  await expect(dialog.locator(".drawer__title")).toBeFocused();
  await dialog.getByRole("button", { name: "← Back" }).click();
  await expect(dialog).toHaveAttribute("aria-label", /Choose a side and answer the cards/);
  expect(Math.abs(await dialog.evaluate((element) => element.scrollTop) - left)).toBeLessThanOrEqual(10);
});

test.describe("the product before the process (QA-01m4gvndbn0hfx4fwq5jhjj5cg)", () => {
  for (const address of ["/?view=tree", "/?view=tree&change=review"]) {
    test(`the purpose and the journey come first, under one process line — ${address} (EX-01m4gvndhk3168ex3qyrrh9300, EX-01m4gvndqfnkd48n1m57tjv0c7)`, async ({ page }) => {
      await page.goto(address);
      const outline = page.locator("#tree-outline");
      await expect(outline).toBeVisible();
      const bands = await page.locator(".view.tree").evaluate((view) => {
        const outlineTop = view.querySelector("#tree-outline")!.getBoundingClientRect().top;
        return [...view.children].filter((child) => child.getBoundingClientRect().bottom <= outlineTop + 1).map((child) => child.className.split(" ")[0]);
      });
      expect(bands.length).toBeLessThanOrEqual(3);
      const line = page.locator(".process-line");
      if (await line.count()) {
        // One line: every part of it on the same row, none wrapped below another.
        const { rows, color } = await line.evaluate((element) => ({ rows: new Set([...element.children].map((child) => Math.round(child.getBoundingClientRect().top))).size, color: getComputedStyle(element).backgroundColor }));
        expect(rows).toBe(1);
        expect(color).not.toMatch(/rgb\(2[0-9]{2}, [0-9]{1,2}, [0-9]{1,2}\)/);
      }
      await expect(page.locator(".tree-journeys")).toBeInViewport({ ratio: 1 });
      await expect(outline.getByRole("button").first()).toBeInViewport();
      await expect(page.locator(".tree-req__meta", { hasText: /business rule/ })).toHaveCount(0);
    });
  }

  test("a goal's row expands, its title opens the drawer, and a journey step opens its place where it is", async ({ page }) => {
    await page.goto("/?view=tree");
    await page.locator("details.tree-goal > summary").first().locator(".tree-count").click();
    const head = page.locator("details.tree-goal > summary", { hasText: "Each partner can answer honestly, in private" }).first();
    await head.locator(".tree-count").click();
    expect(await head.evaluate((summary) => (summary.parentElement as HTMLDetailsElement).open)).toBe(true);
    await head.locator(".tree-goal__title").click();
    await expect(page.getByRole("dialog")).toHaveAttribute("aria-label", /Each partner can answer honestly/);
    await page.keyboard.press("Escape");
    await page.locator(".stage").evaluate((stage) => { stage.scrollTop = 0; });
    const before = await page.locator(".stage").evaluate((stage) => stage.scrollTop);
    const step = page.locator(".journey__step").nth(2);
    const height = await step.evaluate((element) => element.getBoundingClientRect().height);
    await step.click();
    expect(Math.abs(await page.locator(".stage").evaluate((stage) => stage.scrollTop) - before)).toBeLessThanOrEqual(height);
  });
});
