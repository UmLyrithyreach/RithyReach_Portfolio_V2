import { test, expect } from "@playwright/test";
import { projects, skillCategories } from "@/lib/data";

test.describe("Portfolio E2E Behaviors (G3)", () => {
  test("every section renders on /, has an h2, exactly one h1 on /, and no achievements section", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".hero-veil")).toBeHidden({ timeout: 5000 });

    const sectionIds = ["home", "skills", "works", "about", "contact"];
    for (const id of sectionIds) {
      const section = page.locator(`section#${id}`);
      await expect(section).toBeAttached();
      await expect(section).toBeVisible();
      await expect(section.locator("h2").first()).toBeAttached();
    }

    // Exactly one <h1> on /
    await expect(page.locator("h1")).toHaveCount(1);

    // Old fake achievements block is NOT on the page
    await expect(page.locator("section#achievements")).toHaveCount(0);
  });

  test("each nav anchor click scrolls section top within -5px..120px of viewport top", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator(".hero-veil")).toBeHidden({ timeout: 5000 });

    const links = [
      { hash: "#home", id: "home" },
      { hash: "#skills", id: "skills" },
      { hash: "#works", id: "works" },
      { hash: "#about", id: "about" },
      { hash: "#contact", id: "contact" },
    ];

    for (const { hash, id } of links) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);

      const navAnchor = page
        .locator(`header nav[aria-label="Primary"] a[href="${hash}"]`)
        .first();
      await navAnchor.click();

      await expect
        .poll(
          async () => {
            return page.evaluate((targetId) => {
              const el = document.getElementById(targetId);
              if (!el) return -999;
              const rect = el.getBoundingClientRect();
              return rect.top;
            }, id);
          },
          {
            timeout: 7000,
            intervals: [100, 200, 400],
          },
        )
        .toBeGreaterThanOrEqual(-5);

      await expect
        .poll(
          async () => {
            return page.evaluate((targetId) => {
              const el = document.getElementById(targetId);
              if (!el) return 9999;
              const rect = el.getBoundingClientRect();
              return rect.top;
            }, id);
          },
          {
            timeout: 7000,
            intervals: [100, 200, 400],
          },
        )
        .toBeLessThanOrEqual(120);
    }
  });

  test("at mobile viewport (390x844), clicking [data-hero-burger] opens #hero-menu (role=dialog) and pressing Escape closes it", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".hero-veil")).toBeHidden({ timeout: 5000 });

    const burger = page.locator("[data-hero-burger]");
    await expect(burger).toBeVisible();

    const menu = page.locator("#hero-menu");
    await expect(menu).toBeHidden();

    await burger.click();
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute("role", "dialog");

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("skills filter changes the count of visible skill cards (11 total -> category subset -> 11 on All)", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".hero-veil")).toBeHidden({ timeout: 5000 });

    const allCards = page.locator('[data-testid="skill-card"]');
    await expect(allCards).toHaveCount(11);

    // Pick first category e.g. frontend
    const cat = skillCategories[0].toLowerCase();
    const filterBtn = page.locator(`[data-testid="skill-filter-${cat}"]`);
    await filterBtn.click();

    await expect
      .poll(async () => allCards.count(), { timeout: 3000 })
      .toBeLessThan(11);

    const filteredCount = await allCards.count();
    expect(filteredCount).toBeGreaterThan(0);

    // Return to all
    await page.click('[data-testid="skill-filter-all"]');
    await expect
      .poll(async () => allCards.count(), { timeout: 3000 })
      .toBe(11);
  });

  test("both / (inside section#works) and /projects render all 5 project cards with h3 title and matching live/code hrefs", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    const routes = [
      { path: "/", scope: "section#works " },
      { path: "/projects", scope: "" },
    ];

    for (const { path: routePath, scope } of routes) {
      await page.goto(routePath);
      if (routePath === "/") {
        await expect(page.locator(".hero-veil")).toBeHidden({ timeout: 5000 });
      }

      const cards = page.locator(`${scope}[data-testid="project-card"]`);
      await expect(cards).toHaveCount(projects.length);

      for (const project of projects) {
        const card = cards.filter({ hasText: project.title });
        await expect(card).toBeVisible();

        const heading = card.locator("h3").first();
        await expect(heading).toHaveText(project.title);

        if (project.live) {
          const liveLink = card.locator('[data-testid="project-live"]');
          await expect(liveLink).toHaveAttribute("href", project.live);
        } else {
          await expect(card.locator('[data-testid="project-live"]')).toHaveCount(0);
        }

        if (project.code) {
          const codeLink = card.locator('[data-testid="project-code"]');
          await expect(codeLink).toHaveAttribute("href", project.code);
        } else {
          await expect(card.locator('[data-testid="project-code"]')).toHaveCount(0);
        }
      }
    }
  });

  test("contact form inside section#contact empty submit shows 3 errors and filling valid clears them and shows status", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".hero-veil")).toBeHidden({ timeout: 5000 });

    const contactSection = page.locator("section#contact");
    const submitBtn = contactSection.locator('button[type="submit"]');

    // Submit empty
    await submitBtn.click();

    const formErrors = contactSection.locator('[data-testid="form-error"]');
    await expect(formErrors).toHaveCount(3);

    for (const err of await formErrors.all()) {
      await expect(err).toHaveAttribute("role", "alert");
      await expect(err).toBeVisible();
    }

    const successStatus = contactSection.locator('[role="status"]');
    await expect(successStatus).toHaveCount(0);

    // Fill valid data
    await contactSection.locator('input[name="name"]').fill("Reach Kaizen");
    await contactSection
      .locator('input[name="email"]')
      .fill("reach@example.com");
    await contactSection
      .locator('textarea[name="message"]')
      .fill("Hello Reach, let us build something great together!");

    await submitBtn.click();

    await expect(formErrors).toHaveCount(0);
    await expect(contactSection.locator('[role="status"]')).toHaveCount(1);
    await expect(contactSection.locator('[role="status"]')).toBeVisible();
  });
});
