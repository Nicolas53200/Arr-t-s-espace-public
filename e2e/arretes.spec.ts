import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Gestion des arretes", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("liste des arretes actifs", async ({ page }) => {
    await page.click('a[href="/actifs"], nav >> text=Actifs');
    await expect(page).toHaveURL(/actifs/);
    await expect(page.locator("text=Arretes actifs")).toBeVisible();
    await expect(page.locator("text=en cours")).toBeVisible();
  });

  test("creation d'un nouvel arrete - etape type", async ({ page }) => {
    await page.goto("/nouveau");
    await expect(page.locator("text=Circulation interdite")).toBeVisible();
  });

  test("historique affiche les archives", async ({ page }) => {
    await page.goto("/historique");
    await expect(page.locator("h1, h2, h3").filter({ hasText: "Historique" })).toBeVisible();
    await expect(page.locator("text=archives")).toBeVisible();
  });

  test("validation affiche la page", async ({ page }) => {
    await page.goto("/validation");
    await expect(page.locator("h1, h2, h3").filter({ hasText: "Validation" })).toBeVisible();
  });

  test("bouton Nouvel arrete visible pour admin", async ({ page }) => {
    await page.goto("/actifs");
    await expect(page.locator("text=Nouvel arrete")).toBeVisible();
  });
});
