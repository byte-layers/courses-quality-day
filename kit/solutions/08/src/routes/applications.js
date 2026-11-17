import { Router } from 'express';
import { requireRecruiter } from '../auth.js';
import { query } from '../db.js';
import { toCsv } from '../csv.js';
import { logger } from '../logger.js';
import { normalizePhone } from '../utils.js';
import { validateApplication } from '../validation.js';

const CSV_COLUMNS = [
  { header: 'id', field: 'id' },
  { header: 'prenom', field: 'first_name' },
  { header: 'nom', field: 'last_name' },
  { header: 'email', field: 'email' },
  { header: 'telephone', field: 'phone' },
  { header: 'statut', field: 'status' },
];

// Construit la clause WHERE et ses paramètres à partir des filtres de la recherche.
function buildFilters({ q, status, offer, from }) {
  const conditions = [];
  const params = [];
  const add = (column, operator, value) => {
    params.push(value);
    conditions.push(`${column} ${operator} $${params.length}`);
  };
  if (q) add('a.last_name', 'ILIKE', `%${q}%`);
  if (status) add('a.status', '=', status);
  if (offer) add('a.offer_id', '=', Number(offer));
  if (from) add('a.created_at', '>=', from);
  return { where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

// Une même personne peut postuler plusieurs fois : on garde sa première candidature.
function keepFirstByEmail(rows) {
  const seen = new Map();
  for (const row of rows) {
    if (!seen.has(row.email)) seen.set(row.email, row);
  }
  return [...seen.values()];
}

export function applicationsRouter() {
  const router = Router();

  // Dépôt d'une candidature, ouvert au public
  router.post('/', async (req, res) => {
    const data = req.body || {};
    const errors = validateApplication(data, ['offer_id']);
    if (errors.length > 0) return res.status(400).json({ errors });
    const result = await query(
      `INSERT INTO applications (offer_id, first_name, last_name, email, phone, cover_letter)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.offer_id, data.first_name, data.last_name, data.email, normalizePhone(data.phone), data.cover_letter],
    );
    logger.info(`Nouvelle candidature n° ${result.rows[0].id}`);
    res.status(201).json({ id: result.rows[0].id });
  });

  // Liste pour les recruteurs, avec recherche et filtres
  router.get('/', requireRecruiter, async (req, res) => {
    const { where, params } = buildFilters(req.query);
    const result = await query(
      `SELECT a.*, o.title AS offer_title FROM applications a JOIN offers o ON o.id = a.offer_id
       ${where} ORDER BY a.id`,
      params,
    );
    res.json(keepFirstByEmail(result.rows));
  });

  // Export CSV pour le tableur des RH
  router.get('/export.csv', requireRecruiter, async (req, res) => {
    const result = await query('SELECT * FROM applications ORDER BY id');
    res.type('text/csv').send(toCsv(CSV_COLUMNS, result.rows));
  });

  // Droit à l'effacement (RGPD, art. 17) : specs/erasure.md
  router.delete('/', requireRecruiter, async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ errors: ['email est obligatoire'] });
    const result = await query('DELETE FROM applications WHERE email = $1', [email]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'aucune candidature pour cet email' });
    logger.info(`Effacement : ${result.rowCount} candidature(s) supprimée(s)`);
    res.json({ deleted: result.rowCount });
  });

  // Mise à jour par un recruteur
  router.put('/:id', requireRecruiter, async (req, res) => {
    const data = req.body || {};
    const errors = validateApplication(data, ['status']);
    if (errors.length > 0) return res.status(400).json({ errors });
    await query(
      'UPDATE applications SET first_name = $1, last_name = $2, email = $3, phone = $4, status = $5 WHERE id = $6',
      [data.first_name, data.last_name, data.email, normalizePhone(data.phone), data.status, req.params.id],
    );
    res.json({ ok: true });
  });

  return router;
}
