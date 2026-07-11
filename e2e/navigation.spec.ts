import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Navigation principale", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("accueil affiche les statistiques", async ({ page }) => {
    await expect(page.locator("text=Accueil")).toBeVisible();
  });

  test("navigation vers Arretes actifs", async ({ page }) => {
    await page.click('a[href="/actifs"], nav >> text=Actifs');
    await expect(page).toHaveURL(/actifs/);
  });

  test("navigation vers Historique", async ({ page }) => {
    await page.click('a[href="/historique"], nav >> text=Historique');
    await expect(page).toHaveURL(/historique/);
  });

  test("navigation vers References", async ({ page }) => {
    await page.click('a[href="/references"], nav >> text=Ref');
    await expect(page).toHaveURL(/references/);
  });

  test("navigation vers Tableau de bord", async ({ page }) => {
    await page.click('a[href="/tableau-de-bord"], nav >> text=Tableau');
    await expect(page).toHaveURL(/tableau-de-bord/);
  });

  test("navigation vers Journal", async ({ page }) => {
    await page.click('a[href="/journal"], nav >> text=Journal');
    await expect(page).toHaveURL(/journal/);
  });

  test("navigation vers Admin", async ({ page }) => {
    await page.click('a[href="/admin"], nav >> text=Admin');
    await expect(page).toHaveURL(/admin/);
  });

  test("page 404 pour route inconnue", async ({ page }) => {
    await page.goto("/route-inexistante");
    await expect(page.locator("text=Page non trouvee")).toBeVisible();
  });
});
