import type { Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "admin@saint-avoye.fr");
  await page.fill("#password", "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}

export async function loginAsRedacteur(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "redacteur@saint-avoye.fr");
  await page.fill("#password", "redac123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}

export async function loginAsLecteur(page: Page) {
  await page.goto("/login");
  await page.fill("#email", "lecteur@saint-avoye.fr");
  await page.fill("#password", "lect123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}
