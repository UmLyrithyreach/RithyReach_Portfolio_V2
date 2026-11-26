import { test, expect } from "@playwright/test";
import { works } from "@/lib/works";

test.describe("Works section", () => {
  test("reduced motion lists every project as a padded card", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const cards = page.locator("section#works .wk-list .wk-card");
    await expect(cards).toHaveCount(works.length);
    // The card's side padding must not collapse to 0 when the project list (and its width) is absent.
    const padding = await cards.first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return [parseFloat(cs.paddingLeft), parseFloat(cs.paddingRight)];
    });
    expect(padding[0]).toBeGreaterThan(0);
    expect(padding[1]).toBeGreaterThan(0);
  });

  test("the project list jumps to a project and only that card is interactive", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const section = page.locator("section#works");
    // Scroll into the pinned deck so the list appears.
    await page.evaluate(() => {
      const s = document.querySelector("section#works")!;
      window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY + 400);
    });
    const last = works[works.length - 1];
    const entry = section.locator(".wk-index button", { hasText: last.title });
    await expect(entry).toBeVisible({ timeout: 5000 });
    await entry.click();
    await expect(entry).toHaveAttribute("aria-current", "step", { timeout: 5000 });
    // Exactly one slide's content is interactive, and it is the chosen project.
    const live = section.locator(".wk-slide-content:not([inert])");
    await expect(live).toHaveCount(1);
    await expect(live.locator("h3")).toHaveText(last.title);
  });
});
