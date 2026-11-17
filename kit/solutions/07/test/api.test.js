// Tests de caractérisation de l'API : ils figent le comportement actuel, défauts compris,
// pour que le remaniement de l'étape suivante ne change rien sans qu'on le voie.
// Ils remplissent la base pointée par DATABASE_URL : jamais la base de production.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

process.env.RECRUITER_TOKEN ??= 'jeton-de-test';
const { createApp, pool } = await import('../src/server.js');
const { RECRUITER_TOKEN } = await import('../src/auth.js');

let server;
let base;
const recruiter = { 'x-recruiter-token': RECRUITER_TOKEN };

before(async () => {
  execFileSync(process.execPath, ['db/seed.js'], { stdio: 'ignore' });
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  server.close();
  await pool.end();
});

const candidate = {
  offer_id: 1,
  first_name: 'Alix',
  last_name: 'Testeur',
  email: 'alix.testeur@example.com',
  phone: '06 00 00 00 01',
};

test('la liste des offres renvoie les 4 offres ouvertes', async () => {
  const offers = await (await fetch(`${base}/offers`)).json();
  assert.equal(offers.length, 4);
});

test('une candidature complète est enregistrée', async () => {
  const res = await fetch(`${base}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidate),
  });
  assert.equal(res.status, 201);
  assert.ok((await res.json()).id > 0);
});

test('une candidature sans nom ni email valide est refusée avec la liste des erreurs', async () => {
  const res = await fetch(`${base}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offer_id: 1, first_name: 'Alix', email: 'pas-un-email' }),
  });
  assert.equal(res.status, 400);
  assert.deepEqual((await res.json()).errors, ['last_name est obligatoire', 'email invalide']);
});

test('la liste des candidatures est refusée sans jeton recruteur', async () => {
  const res = await fetch(`${base}/applications`);
  assert.equal(res.status, 401);
});

test('la liste fusionne les candidatures qui ont le même email', async () => {
  const rows = await (await fetch(`${base}/applications`, { headers: recruiter })).json();
  const emails = rows.map((r) => r.email);
  assert.equal(new Set(emails).size, emails.length);
  assert.deepEqual(rows.map((r) => r.id), [...rows.map((r) => r.id)].sort((a, b) => a - b));
});

test('la recherche filtre sur le nom, sans tenir compte des majuscules', async () => {
  const rows = await (await fetch(`${base}/applications?q=MAR`, { headers: recruiter })).json();
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => r.last_name.toLowerCase().includes('mar')));
});

test('les filtres par statut et par offre se combinent', async () => {
  const rows = await (await fetch(`${base}/applications?status=new&offer=1`, { headers: recruiter })).json();
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => r.status === 'new' && r.offer_id === 1));
});

test('le filtre par date garde les candidatures récentes', async () => {
  const rows = await (await fetch(`${base}/applications?from=2026-01-01`, { headers: recruiter })).json();
  assert.ok(rows.length > 0);
  assert.ok(rows.every((r) => new Date(r.created_at) >= new Date('2026-01-01')));
});

test("l'export CSV a une ligne d'en-tête puis une ligne par candidature", async () => {
  const csv = await (await fetch(`${base}/applications/export.csv`, { headers: recruiter })).text();
  const lines = csv.trim().split('\n');
  assert.equal(lines[0], 'id;prenom;nom;email;telephone;statut');
  assert.ok(lines.length > 30);
});

test('un recruteur change le statut d’une candidature', async () => {
  const res = await fetch(`${base}/applications/1`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...recruiter },
    body: JSON.stringify({ ...candidate, status: 'interview' }),
  });
  assert.equal(res.status, 200);
});
