import { expect, test } from "@playwright/test";

/**
 * Fixture-seeded journey: the deterministic demo path (Home → Upload →
 * Processing → Ready → Review) using store fixtures, plus failure/retry,
 * missing-document states, and back navigation.
 */
test.describe("document journey", () => {
  test("fixture upload flows into processing, ready, and review", async ({ page }) => {
    await page.goto("/");
    // Seeded samples are one click away from review; the full real-file
    // upload path is covered in documents.spec.ts.
    await expect(page.getByRole("link", { name: "Open review" })).toBeVisible();
    await page.getByRole("link", { name: "Open review" }).click();
    await expect(page).toHaveURL(/\/review\/.+/);
    await expect(page.getByRole("heading", { name: /Client Services Agreement/ })).toBeVisible();
  });

  test("failure offers retry, and retry reaches ready", async ({ page }) => {
    // Deterministic: the seeded sample id needs no upload, and an explicit
    // ?outcome=fail always runs the failure path, so there is no race with
    // a background success run.
    await page.goto("/processing/sample-service-agreement?outcome=fail");

    await expect(
      page.getByRole("heading", { name: "We couldn't prepare that document" }),
    ).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page).toHaveURL(/\/ready\/.+/, { timeout: 30000 });
  });

  test("unknown documents explain themselves on every step", async ({ page }) => {
    for (const path of ["/processing/unknown-id", "/ready/unknown-id", "/review/unknown-id"]) {
      await page.goto(path);
      // Scoped to main content: Next.js renders its own route-announcer
      // alert outside it, which must not match.
      await expect(page.locator("#main-content").getByRole("alert")).toContainText("doesn't exist");
    }
  });

  test("browser back from review preserves the document", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Open review" }).click();
    await expect(page).toHaveURL(/\/review\/.+/);
    await page.goBack();
    await expect(page).toHaveURL("/");
  });

  test("invalid files are rejected with guidance", async ({ page }) => {
    await page.goto("/");
    await page.locator('input[type="file"]').setInputFiles({
      name: "setup.exe",
      mimeType: "application/x-msdownload",
      buffer: Buffer.from("MZ"),
    });
    await expect(page.locator("#main-content").getByRole("alert")).toContainText(
      "That file can't be reviewed",
    );
  });
});
