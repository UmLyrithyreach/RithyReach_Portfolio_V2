import { test, expect } from "@playwright/test";
import { email, projects, skillCategories, skillLevelLabel, skills, socials } from "@/lib/data";

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

      // At the top of the page the shared bar is slid away (opacity 0, inert); the visible nav is the
      // hero's own masthead.
      const navAnchor = page.locator(`section#home nav[aria-label="Primary"] a[href="${hash}"]`);
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

  test("skills list shows all 11 technologies, each with its level word, grouped by category", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".hero-veil")).toBeHidden({ timeout: 5000 });

    const list = page.locator("section#skills dl.season-skills");
    await expect(list.locator(".season-skill-name")).toHaveCount(skills.length);
    await expect(list.locator("dt")).toHaveCount(skillCategories.length);

    for (const skill of skills) {
      const item = list.locator(".season-skill", {
        has: page.locator(".season-skill-name", { hasText: new RegExp(`^${skill.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") }),
      });
      await expect(item.locator(".season-skill-level")).toHaveText(new RegExp(skillLevelLabel(skill.level), "i"));
    }
  });

  test("/projects renders every project card with h3 title and matching live/code hrefs (section#works on / shows the feature overview, no cards)", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    const routes = [
      { path: "/", scope: "section#works ", expected: [] as typeof projects },
      { path: "/projects", scope: "", expected: projects },
    ];

    for (const { path: routePath, scope, expected } of routes) {
      await page.goto(routePath);
      if (routePath === "/") {
        await expect(page.locator(".hero-veil")).toBeHidden({ timeout: 5000 });
      }

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

  test("contact footer offers the email button and every social link, opening in a new tab", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".hero-veil")).toBeHidden({ timeout: 5000 });

    const contact = page.locator("section#contact");
    await expect(contact.locator(`a[href="mailto:${email}"]`).first()).toBeAttached();
    for (const url of Object.values(socials)) {
      const link = contact.locator(`a[href="${url}"]`).first();
      await expect(link).toBeAttached();
      await expect(link).toHaveAttribute("target", "_blank");
    }
  });
});
