import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility baseline: no serious or critical axe violations on any
 * foundation route. Minor/moderate findings are reported, not gated, so
 * the suite stays honest without blocking on judgment calls.
 */
const ROUTES = [
  "/",
  "/documents",
  "/review/sample-service-agreement",
  "/compare",
  "/ask",
  "/ready/sample-service-agreement",
];

for (const route of ROUTES) {
  test(`no serious accessibility violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(
      blocking.map((violation) => `${violation.id}: ${violation.help}`),
      `axe violations on ${route}`,
    ).toEqual([]);
  });
}
