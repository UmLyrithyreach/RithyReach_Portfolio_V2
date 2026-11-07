import path from "node:path";
import { test, expect } from "@playwright/test";

const widths = [360, 390, 768, 1024, 1280, 1440];
const routes = ["/", "/projects"];

test.describe("Responsive Checks, Overflow & Screenshots (G4 + G5)", () => {
  for (const width of widths) {
    for (const route of routes) {
      const routeName = route === "/" ? "home" : "projects";

      test(`${routeName} at ${width}px`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.setViewportSize({ width, height: 900 });

        await page.goto(route, { waitUntil: "networkidle" });

        if (route === "/") {
          await expect(page.locator(".hero-veil")).toBeHidden({
            timeout: 5000,
          });
        }

        // Scroll through the page to trigger whileInView animations
        await page.evaluate(async () => {
          const step = 400;
          const max = document.documentElement.scrollHeight;
          for (let y = 0; y <= max; y += step) {
            window.scrollTo(0, y);
            await new Promise((resolve) => setTimeout(resolve, 40));
          }
          window.scrollTo(0, 0);
        });

        await page.waitForTimeout(600);

        // Assert document.documentElement.scrollWidth <= window.innerWidth
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(
          scrollWidth,
          `Horizontal overflow at ${width}px on ${route}: scrollWidth ${scrollWidth} > innerWidth ${innerWidth}`,
        ).toBeLessThanOrEqual(innerWidth);

        // Collect boundingBoxes of all [data-testid=project-card] and assert no pair intersects
        const cards = page.locator('[data-testid="project-card"]');
        const count = await cards.count();
        expect(count, `Expected 5 project cards on ${route}`).toBe(5);

        const boxes: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          title: string;
        }> = [];

        for (let i = 0; i < count; i++) {
          const card = cards.nth(i);
          const box = await card.boundingBox();
          expect(
            box,
            `Project card #${i} has null bounding box at ${width}px on ${route}`,
          ).not.toBeNull();
          if (box) {
            const title =
              (await card.locator("h3").first().textContent())?.trim() ||
              `card-${i}`;
            boxes.push({ ...box, title });
          }
        }

        const tolerance = 0.5;
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i];
            const b = boxes[j];

            const overlapX = Math.max(
              0,
              Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x),
            );
            const overlapY = Math.max(
              0,
              Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y),
            );

            const intersects = overlapX > tolerance && overlapY > tolerance;
            expect(
              intersects,
              `Project cards "${a.title}" and "${b.title}" intersect at ${width}px on ${route}: overlap ${overlapX.toFixed(2)}px x ${overlapY.toFixed(2)}px`,
            ).toBe(false);
          }
        }

        // Save full-page screenshot to screenshots/<route-name>-<width>.png
        const screenshotPath = path.join(
          process.cwd(),
          "screenshots",
          `${routeName}-${width}.png`,
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
      });
    }
  }
});
