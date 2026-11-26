import { test, expect } from "@playwright/test";

test("a reload always starts at the top, even from deep in the page or on a #hash", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 6000));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(5000);
  await page.reload();
  await page.waitForLoadState("load");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.goto("/#works");
  await page.reload();
  await page.waitForLoadState("load");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => [window.scrollY, location.hash])).toEqual([0, ""]);
});
