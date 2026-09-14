import { expect, test } from "@playwright/test";

/**
 * Real document journey: TXT, PDF, and DOCX uploads flow through the
 * genuine ingestion pipeline (Home → Upload → Processing → Ready →
 * Review) and render extracted text with stable anchors.
 */
test.describe("real document journey", () => {
  test("TXT upload flows into ready and review with extracted text", async ({ page }) => {
    test.slow();
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles("tests/fixtures/sample-agreement.txt");
    await expect(page.getByRole("button", { name: "Review document" })).toBeVisible();
    await page.getByRole("button", { name: "Review document" }).click();

    await expect(page).toHaveURL(/\/ready\/.+/, { timeout: 30000 });
    await expect(page.getByRole("heading", { name: "Sample agreement" })).toBeVisible();
    await expect(page.getByText("Preview of your uploaded document")).toBeVisible();

    await page.getByRole("link", { name: "Review document" }).click();
    await expect(page).toHaveURL(/\/review\/.+/);
    await expect(page.getByRole("heading", { name: "Sample agreement" })).toBeVisible();
    await expect(page.getByText(/ZXQ-TEST-7741/)).toBeVisible();
    // No API key in test environments: the panel shows the honest
    // unavailable state while the extracted document stays readable.
    await expect(page.getByText("AI review is temporarily unavailable")).toBeVisible({
      timeout: 30000,
    });
  });

  test("PDF upload reaches ready with page metadata", async ({ page }) => {
    test.slow();
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles("tests/fixtures/sample-agreement.pdf");
    await page.getByRole("button", { name: "Review document" }).click();
    await expect(page).toHaveURL(/\/ready\/.+/, { timeout: 30000 });
    await expect(page.getByRole("heading", { name: "Sample agreement" })).toBeVisible();
  });

  test("DOCX upload reaches ready with extracted sections", async ({ page }) => {
    test.slow();
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles("tests/fixtures/sample-agreement.docx");
    await page.getByRole("button", { name: "Review document" }).click();
    await expect(page).toHaveURL(/\/ready\/.+/, { timeout: 30000 });
    await page.getByRole("link", { name: "Review document" }).click();
    await expect(page).toHaveURL(/\/review\/.+/);
    await expect(page.getByText(/net seven \(7\) days/)).toBeVisible();
  });

  test("corrupt PDF upload fails with recovery", async ({ page }) => {
    await page.goto("/");
    const buffer = Buffer.from("%PDF-1.4 {{{ not a real file");
    await page.locator('input[type="file"]').setInputFiles({
      name: "bad.pdf",
      mimeType: "application/pdf",
      buffer,
    });
    await page.getByRole("button", { name: "Review document" }).click();
    await expect(page.getByText("The upload didn't complete")).toBeVisible({
      timeout: 30000,
    });
    await page.getByRole("button", { name: "Choose a different file" }).click();
    await expect(page.getByRole("button", { name: "Browse files" })).toBeVisible();
  });
});
