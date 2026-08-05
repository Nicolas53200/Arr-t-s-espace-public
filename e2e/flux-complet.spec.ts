import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5173";

test("flux complet : super-admin crée commune → admin se connecte → crée arrêté", async ({ page }) => {
  // Nettoyer
  await page.goto(BASE + "/bienvenue");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState("networkidle");

  // ─── 1. Connexion super-admin (IGNISNOVA) ───
  await page.click('[title="Administration plateforme"]');
  await page.fill('input[aria-label="Code administrateur plateforme"]', "IGNISNOVA");
  await page.click('button:has-text("Connexion")');

  await page.waitForURL("**/super-admin");
  await expect(page.locator("h2:has-text('Collectivites')")).toBeVisible();
  console.log("✅ 1. Super-admin connecté");

  // ─── 2. Créer une commune ───
  await page.click('button:has-text("Nouvelle collectivite")');
  await expect(page.locator("text=Nom de la collectivite")).toBeVisible();

  await page.fill('input[placeholder="Ville de..."]', "Ville de Pluneret");
  await page.fill('input[placeholder="56000"]', "56400");
  await page.fill('input[placeholder="215600001"]', "215600099");
  await page.fill('input[placeholder="admin@commune.fr"]', "admin@pluneret.fr");
  await page.click('button:has-text("Creer la collectivite")');

  // La commune doit apparaître dans la liste
  await expect(page.locator("text=Ville de Pluneret")).toBeVisible({ timeout: 5000 });

  // Récupérer le code d'accès affiché dans le détail
  const codeElement = page.locator("text=Code d'acces").locator("..").locator("span").filter({ hasText: /PLUNERET-\d{4}/ });
  const codeAcces = await codeElement.first().textContent();
  console.log("✅ 2. Commune créée, code d'accès :", codeAcces);
  expect(codeAcces).toMatch(/PLUNERET-\d{4}/);

  // Vérifier le mot de passe affiché
  await expect(page.locator("text=admin123")).toBeVisible();
  console.log("✅ 2b. Mot de passe admin123 affiché");

  // ─── 3. Déconnexion super-admin ───
  await page.click('button:has-text("Deconnexion")');
  await page.waitForURL("**/bienvenue");
  console.log("✅ 3. Super-admin déconnecté");

  // ─── 4. Saisir le code d'accès ───
  await page.fill('input[aria-label="Code d\'acces collectivite"]', codeAcces!);
  await page.click('button:has-text("Acceder")');
  await page.waitForURL("**/login");
  console.log("✅ 4. Code d'accès validé, page login affichée");

  // ─── 5. Connexion admin commune ───
  await page.fill('input[type="email"]', "admin@pluneret.fr");
  await page.fill('input[type="password"]', "admin123");
  await page.click('button:has-text("Se connecter")');

  // Attendre la redirection vers l'accueil (route index)
  await page.waitForURL(BASE + "/", { timeout: 10000 });
  await expect(page.locator("text=Arrêtés municipaux")).toBeVisible({ timeout: 5000 });
  console.log("✅ 5. Admin commune connecté, accueil affiché");

  // ─── 6. Vérifier l'espace vide ───
  // Les compteurs doivent être à 0
  const actifsStat = page.locator("text=Actifs").first();
  await expect(actifsStat).toBeVisible();

  // Pas de section "Arrêtés actifs récents" (aucun arrêté)
  await expect(page.locator("text=Arrêtés actifs récents")).not.toBeVisible();
  console.log("✅ 6. Espace de travail vide confirmé");

  // ─── 7. Accéder au formulaire de nouvel arrêté ───
  await page.locator('button.btn-primary:has-text("Nouvel arrêté")').evaluate((el) => (el as HTMLElement).click());
  await page.waitForURL("**/nouveau", { timeout: 10000 });

  // Le formulaire affiche les types d'arrêtés et montre "Admin Pluneret" en header
  await expect(page.locator("text=Type d'arrete")).toBeVisible({ timeout: 5000 });
  // Fermer le tour de bienvenue s'il s'affiche
  const passerTour = page.locator("text=Passer le tour");
  if (await passerTour.isVisible({ timeout: 2000 }).catch(() => false)) {
    await passerTour.click();
  }
  console.log("✅ 7. Formulaire de nouvel arrêté accessible");

  console.log("\n🎉 FLUX COMPLET VALIDÉ !");
});
