// Première tentative de test de bout en bout (2024), jamais branchée dans le pipeline.
const { test, expect } = require('@playwright/test');

test('un candidat peut postuler', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.fill('#first_name', 'Test');
  await page.fill('#last_name', 'E2E');
  await page.fill('#email', 'test@example.com');
  await page.click('#submit-btn');
  await expect(page.locator('.success')).toBeVisible();
});
