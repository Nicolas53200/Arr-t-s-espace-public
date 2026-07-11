import { test, expect } from "@playwright/test";

test.describe("Pages publiques", () => {
  test("page de bienvenue accessible sans auth", async ({ page }) => {
    await page.goto("/bienvenue");
    await expect(page.getByRole("heading", { name: "Actes360" })).toBeVisible();
  });

  test("page login affiche le formulaire", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("page login affiche les comptes demo", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=admin@saint-avoye.fr")).toBeVisible();
  });
});
