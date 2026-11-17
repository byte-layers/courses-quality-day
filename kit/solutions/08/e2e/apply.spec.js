// Parcours essentiel : un candidat postule, un recruteur retrouve sa candidature.
import { test, expect } from '@playwright/test';

test('un candidat postule, puis un recruteur retrouve sa candidature', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Offre').selectOption({ label: 'Ingénieur·e DevOps (Plateforme)' });
  await page.getByLabel('Prénom').fill('Alix');
  await page.getByLabel('Nom', { exact: true }).first().fill('Navigateur');
  await page.getByLabel('Email').fill('alix.navigateur@example.com');
  await page.getByRole('button', { name: 'Envoyer ma candidature' }).click();
  await expect(page.getByRole('status')).toHaveText('Merci, votre candidature est envoyée.');

  await page.getByLabel('Jeton recruteur').fill(process.env.RECRUITER_TOKEN);
  await page.locator('#q').fill('Navigateur');
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page.locator('#rows tr')).toHaveCount(1);
  await expect(page.locator('#rows')).toContainText('alix.navigateur@example.com');
});

test('un nom qui contient du HTML reste du texte dans la liste', async ({ page, request }) => {
  await request.post('/api/applications', {
    data: { offer_id: 1, first_name: '<img src=x onerror=alert(1)>', last_name: 'Piège', email: 'piege@example.com' },
  });
  await page.goto('/');
  await page.getByLabel('Jeton recruteur').fill(process.env.RECRUITER_TOKEN);
  await page.locator('#q').fill('Piège');
  await page.getByRole('button', { name: 'Rechercher' }).click();
  await expect(page.locator('#rows')).toContainText('<img src=x onerror=alert(1)>');
  await expect(page.locator('#rows img')).toHaveCount(0);
});
