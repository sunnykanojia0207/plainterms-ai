import { expect, test } from "@playwright/test";

/**
 * Comparison workspace without an API key: setup renders with preselected
 * samples, the run reaches the honest unavailable state, and same-document
 * selection is refused. Live-model behavior is verified manually (see
 * DEVELOPMENT.md) when a key is available.
 */
test.describe("comparison workspace", () => {
  test("setup preselects both samples and reports unavailability", async ({ page }) => {
    await page.goto("/compare");
    await expect(page.getByRole("heading", { name: "Compare versions" })).toBeVisible();
    const left = page.getByLabel("Version 1 · earlier");
    const right = page.getByLabel("Version 2 · later");
    await expect(left).toHaveValue("sample-service-agreement-v1");
    await expect(right).toHaveValue("sample-service-agreement");
    await expect(page.getByText("Comparison is temporarily unavailable")).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });

  test("same-document selection shows a notice instead of running", async ({ page }) => {
    await page.goto("/compare");
    const right = page.getByLabel("Version 2 · later");
    // Retry-tolerant: first-load dev hydration can swallow an early change.
    await expect(async () => {
      await right.selectOption("sample-service-agreement-v1");
      await expect(page.getByText("Choose two different documents to compare.")).toBeVisible({
        timeout: 2000,
      });
    }).toPass({ timeout: 30000 });
  });
});
