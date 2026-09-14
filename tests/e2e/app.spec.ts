import { expect, test } from "@playwright/test";

/**
 * Foundation smoke tests: the application boots, all five destinations
 * render, keyboard users can reach content, and dialogs behave.
 */
test.describe("application boots and navigates", () => {
  test("home renders product identity and primary actions", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Know what you're signing." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Review a document" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Compare two versions" })).toBeVisible();
  });

  test("all primary destinations render without errors", async ({ page }) => {
    for (const path of ["/", "/documents", "/review", "/compare", "/ask"]) {
      await page.goto(path);
      await expect(page.locator("#main-content")).toBeVisible();
    }
  });

  test("review route renders the three-region shell for a document", async ({ page }) => {
    // Seeded sample document: deterministic across runs.
    await page.goto("/review/sample-service-agreement");
    await expect(page.getByRole("navigation", { name: "Document sections" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Document viewer" })).toBeVisible();
    await expect(page.getByLabel("PlainTerms intelligence panel")).toBeVisible();
  });

  test("unknown routes show the friendly not-found state", async ({ page }) => {
    await page.goto("/no-such-place");
    await expect(page.getByText("We couldn't find that")).toBeVisible();
  });

  test("keyboard users can skip to content and reach navigation", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toContainText("Skip to main content");
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("settings sheet opens and closes with Escape", async ({ page }) => {
    await page.goto("/");
    // First-load dev compilation can delay hydration; retry the open until
    // the client is interactive instead of assuming instant readiness.
    await expect(async () => {
      await page.getByRole("button", { name: "Open settings" }).click({ timeout: 5000 });
      await expect(page.getByRole("dialog", { name: "Settings" })).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 90000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Settings" })).toBeHidden();
  });
});
