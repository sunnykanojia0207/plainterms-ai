import { expect, test } from "@playwright/test";

/**
 * Action Pack entry without an API key: the Review workspace offers
 * creation, and generation reaches the honest unavailable state without
 * disturbing the document. Live-model packs are verified manually
 * (see DEVELOPMENT.md).
 */
test.describe("action pack entry", () => {
  test("review offers creation and reports unavailability", async ({ page }) => {
    await page.goto("/review/sample-service-agreement");
    await expect(page.getByRole("button", { name: "Create Action Pack" })).toBeVisible();
    await page.getByRole("button", { name: "Create Action Pack" }).click();
    await expect(page.getByText("Preparing your Action Pack")).toBeVisible();
    await expect(page.getByText("Action Pack is temporarily unavailable")).toBeVisible({
      timeout: 30000,
    });
    // The document itself is untouched.
    await expect(page.getByText(/Contractor assigns to the Client/)).toBeVisible();
  });
});
