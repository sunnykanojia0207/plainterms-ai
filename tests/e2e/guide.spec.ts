import { expect, test } from "@playwright/test";

/**
 * Review Guide entry without an API key: the Review workspace offers
 * creation, and generation reaches the honest unavailable state without
 * disturbing the document. Live-model guides are verified manually
 * (see DEVELOPMENT.md).
 */
test.describe("review guide entry", () => {
  test("review offers creation and reports unavailability", async ({ page }) => {
    await page.goto("/review/sample-service-agreement");
    await expect(page.getByRole("button", { name: "Review Guide" })).toBeVisible();
    await page.getByRole("button", { name: "Review Guide" }).click();
    await expect(page.getByText("Preparing your Review Guide")).toBeVisible();
    await expect(page.getByText("Review Guide is temporarily unavailable")).toBeVisible({
      timeout: 30000,
    });
    // The document itself is untouched.
    await expect(page.getByText(/Contractor assigns to the Client/)).toBeVisible();
  });
});
