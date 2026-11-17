// Remplit la base avec des données fictives : offres et candidatures.
import { readFileSync } from 'node:fs';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('Définissez DATABASE_URL : la base à remplir');
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const offers = [
  ['Développeur·se back-end Node.js', 'Produit'],
  ['Chargé·e de recrutement', 'RH'],
  ['Ingénieur·e DevOps', 'Plateforme'],
  ['Product owner', 'Produit'],
];

const firstNames = ['Camille', 'Louis', 'Inès', 'Hugo', 'Léa', 'Nathan', 'Chloé', 'Yanis', 'Manon', 'Adam', 'Sarah', 'Théo'];
const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent'];
const statuses = ['new', 'new', 'reviewed', 'interview', 'rejected'];

const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
await pool.query('DROP TABLE IF EXISTS applications; DROP TABLE IF EXISTS offers;');
await pool.query(sql);
for (const [title, team] of offers) {
  await pool.query('INSERT INTO offers (title, team) VALUES ($1, $2)', [title, team]);
}
let n = 0;
for (let i = 0; i < 36; i++) {
  const first = firstNames[i % firstNames.length];
  const last = lastNames[(i * 5 + Math.floor(i / 12)) % lastNames.length];
  const email = `${first}.${last}@example.com`.toLowerCase();
  const year = i < 8 ? 2019 : 2026;
  await pool.query(
    `INSERT INTO applications (offer_id, first_name, last_name, email, phone, cover_letter, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [(i % 4) + 1, first, last, email, `06 12 34 ${String(10 + i).padStart(2, '0')} 00`,
      'Bonjour, votre offre m’intéresse.', statuses[i % statuses.length], `${year}-0${(i % 9) + 1}-15T10:00:00Z`],
  );
  n++;
}
// Deux candidatures en double : même personne, même email.
await pool.query(`INSERT INTO applications (offer_id, first_name, last_name, email, phone, status)
  VALUES (1, 'Camille', 'Martin', 'camille.martin@example.com', '06 12 34 10 00', 'new'),
         (3, 'Hugo', 'Robert', 'hugo.robert@example.com', '06 12 34 13 00', 'new')`);
console.log(`Base remplie : ${offers.length} offres, ${n + 2} candidatures.`);
await pool.end();
