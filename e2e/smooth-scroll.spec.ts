import { test, expect } from "@playwright/test";

test.describe("Smooth scrolling (Lenis + GSAP)", () => {
  test("Lenis drives the page scroll and eases a wheel step over several frames", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/\blenis\b/, { timeout: 5000 });
    await expect(page.locator(".site-veil")).toHaveCount(0, { timeout: 8000 });

    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 800);
    await page.waitForTimeout(50);
    const early = await page.evaluate(() => window.scrollY);
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBeGreaterThan(700);
    // Eased, not jumped: shortly after the wheel the page is still on its way.
    expect(early).toBeLessThan(700);
  });

  test("reduced motion keeps native scrolling (no Lenis)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("load");
    await expect(page.locator("html")).not.toHaveClass(/\blenis\b/);
  });
});
