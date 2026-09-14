import { expect, test } from "@playwright/test";

/**
 * Ask workspace without an API key: scope renders, scoped deep links show
 * their chip, and submissions reach the honest unavailable state.
 * Live-model answers are verified manually (see DEVELOPMENT.md).
 */
test.describe("ask workspace", () => {
  test("renders scope, suggestions, and composer", async ({ page }) => {
    await page.goto("/ask");
    await expect(page.getByRole("heading", { name: "Ask" })).toBeVisible();
    await expect(page.getByText("Try asking")).toBeVisible();
    await expect(page.getByRole("button", { name: "What are my payment terms?" })).toBeVisible();
    await expect(page.getByLabel("Ask about this document")).toBeVisible();
  });

  test("clause deep link shows its scope chip", async ({ page }) => {
    await page.goto("/ask?doc=sample-service-agreement-v1&section=sec-payment");
    await expect(page.getByText("Scoped to")).toBeVisible();
    await expect(page.getByText("3. Payment Terms", { exact: true })).toBeVisible();
  });

  test("submitting without a key reaches the unavailable state", async ({ page }) => {
    await page.goto("/ask");
    await page.getByLabel("Ask about this document").fill("What are my payment terms?");
    await page.getByRole("button", { name: "Ask" }).click();
    await expect(page.getByText("Answers are temporarily unavailable")).toBeVisible({
      timeout: 30000,
    });
  });

  test("suggestion submits a scoped question", async ({ page }) => {
    await page.goto("/ask");
    await page.getByRole("button", { name: "How are disputes handled?" }).click();
    await expect(page.getByText("Answers are temporarily unavailable")).toBeVisible({
      timeout: 30000,
    });
  });
});
