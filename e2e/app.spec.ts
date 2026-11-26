import { test, expect } from "@playwright/test";
import { projects } from "@/lib/data";

test.describe("Portfolio E2E Behaviors (G3)", () => {
  test("every section renders on /, has an h2, exactly one h1 on /, and no achievements section", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".hero-veil")).toBeHidden({ timeout: 5000 });

    const sectionIds = ["home", "intro", "expertise", "works", "process"];
    for (const id of sectionIds) {
      const section = page.locator(`section#${id}`);
      await expect(section).toBeAttached();
      await expect(section).toBeVisible();
      await expect(section.locator("h2").first()).toBeAttached();
    }

    // Exactly one <h1> on /
    await expect(page.locator("h1")).toHaveCount(1);

    // Old fake achievements block and the old About section are NOT on the page
    for (const gone of ["achievements", "about"]) {
      await expect(page.locator(`section#${gone}`)).toHaveCount(0);
    }
  });

  test("/projects renders every project card with h3 title and matching live/code hrefs", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    const routes = [
      { path: "/projects", scope: "", expected: projects },
    ];

    for (const { path: routePath, scope, expected } of routes) {
      await page.goto(routePath);

      const cards = page.locator(`${scope}[data-testid="project-card"]`);
      await expect(cards).toHaveCount(expected.length);

      for (const project of expected) {
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
});
