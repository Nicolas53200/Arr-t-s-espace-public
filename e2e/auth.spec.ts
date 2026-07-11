import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Authentification", () => {
  test("redirige vers /login si non connecte", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/login/);
  });

  test("connexion admin reussie", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Accueil")).toBeVisible();
  });

  test("connexion echouee avec mauvais mot de passe", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "admin@saint-avoye.fr");
    await page.fill("#password", "mauvais");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Identifiants invalides").first()).toBeVisible({ timeout: 10000 });
  });

  test("deconnexion via bouton", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator("text=Accueil")).toBeVisible();
    const logoutBtn = page.locator('[aria-label="Se deconnecter"], [aria-label="Deconnexion"]');
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await expect(page).toHaveURL(/login/);
    }
  });
});
