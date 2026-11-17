// Tests du droit à l'effacement, écrits avant le code à partir de specs/erasure.md.
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
  base = `http://127.0.0.1:${server.address().port}/api/applications`;
});

after(async () => {
  server.close();
  await pool.end();
});

const erase = (email, headers = recruiter) =>
  fetch(`${base}?email=${encodeURIComponent(email)}`, { method: 'DELETE', headers });

test('E4 : sans jeton recruteur, la demande est refusée et rien n’est supprimé', async () => {
  const res = await erase('camille.martin@example.com', {});
  assert.equal(res.status, 401);
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM applications WHERE email = $1', ['camille.martin@example.com']);
  assert.equal(rows[0].n, 2);
});

test('E1 : toutes les candidatures de l’email sont supprimées', async () => {
  const res = await erase('camille.martin@example.com');
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { deleted: 2 });
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM applications WHERE email = $1', ['camille.martin@example.com']);
  assert.equal(rows[0].n, 0);
});

test('E2 : un email inconnu donne 404', async () => {
  const res = await erase('personne@example.com');
  assert.equal(res.status, 404);
});

test('E3 : sans email, la demande est refusée', async () => {
  const res = await fetch(base, { method: 'DELETE', headers: recruiter });
  assert.equal(res.status, 400);
});
