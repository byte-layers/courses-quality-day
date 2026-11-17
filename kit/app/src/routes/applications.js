import { Router } from 'express';
import _ from 'lodash';
import { requireRecruiter } from '../auth.js';
import { isValidEmail, normalizePhone } from '../utils.js';

export function applicationsRouter(pool) {
  const router = Router();

  // Dépôt d'une candidature, ouvert au public
  router.post('/', async (req, res) => {
    const data = req.body || {};
    const errors = [];
    if (!data.first_name || data.first_name.trim().length == 0) {
      errors.push('first_name est obligatoire');
    }
    if (!data.last_name || data.last_name.trim().length == 0) {
      errors.push('last_name est obligatoire');
    }
    if (!isValidEmail(data.email)) {
      errors.push('email invalide');
    }
    if (data.phone && data.phone.length > 20) {
      errors.push('phone trop long');
    }
    if (!data.offer_id) {
      errors.push('offer_id est obligatoire');
    }
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    console.log('Nouvelle candidature de ' + data.email + ' (' + data.phone + ')');
    const result = await pool.query(
      `INSERT INTO applications (offer_id, first_name, last_name, email, phone, cover_letter)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.offer_id, data.first_name, data.last_name, data.email, normalizePhone(data.phone), data.cover_letter],
    );
    res.status(201).json({ id: result.rows[0].id });
  });

  // Liste pour les recruteurs, avec recherche et filtres
  router.get('/', requireRecruiter, async (req, res) => {
    let sql = 'SELECT a.*, o.title AS offer_title FROM applications a JOIN offers o ON o.id = a.offer_id';
    if (req.query.q) {
      sql += " WHERE a.last_name ILIKE '%" + req.query.q + "%'";
    }
    const result = await pool.query(sql);
    let rows = result.rows;

    // filtres
    const out = [];
    for (const r of rows) {
      if (req.query.status) {
        if (r.status == req.query.status) {
          if (req.query.offer) {
            if (r.offer_id == req.query.offer) {
              out.push(r);
            }
          } else {
            out.push(r);
          }
        }
      } else {
        if (req.query.offer) {
          if (r.offer_id == req.query.offer) {
            if (req.query.from) {
              if (new Date(r.created_at) >= new Date(req.query.from)) {
                out.push(r);
              }
            } else {
              out.push(r);
            }
          }
        } else {
          if (req.query.from) {
            if (new Date(r.created_at) >= new Date(req.query.from)) {
              out.push(r);
            }
          } else {
            out.push(r);
          }
        }
      }
    }

    // don't know why this works but the duplicates disappear
    const tmp = [];
    for (let i = 0; i < out.length; i++) {
      let found = false;
      for (let j = 0; j < tmp.length; j++) {
        if (tmp[j].email == out[i].email) {
          found = true;
        }
      }
      if (!found) {
        tmp.push(out[i]);
      }
    }
    console.log('Liste consultée : ' + tmp.map((x) => x.email).join(', '));
    res.json(_.sortBy(tmp, 'id'));
  });

  // Export CSV pour le tableur des RH
  router.get('/export.csv', requireRecruiter, async (req, res) => {
    const result = await pool.query('SELECT * FROM applications ORDER BY id');
    let csv = 'id;prenom;nom;email;telephone;statut\n';
    for (const r of result.rows) {
      let first = r.first_name;
      if (first.includes(';') || first.includes('"')) {
        first = '"' + first.replace(/"/g, '""') + '"';
      }
      let last = r.last_name;
      if (last.includes(';') || last.includes('"')) {
        last = '"' + last.replace(/"/g, '""') + '"';
      }
      let email = r.email;
      if (email.includes(';') || email.includes('"')) {
        email = '"' + email.replace(/"/g, '""') + '"';
      }
      csv += r.id + ';' + first + ';' + last + ';' + email + ';' + (r.phone || '') + ';' + r.status + '\n';
    }
    res.type('text/csv').send(csv);
  });

  // Changement de statut par un recruteur
  router.put('/:id', requireRecruiter, async (req, res) => {
    const data = req.body || {};
    const errors = [];
    if (!data.first_name || data.first_name.trim().length == 0) {
      errors.push('first_name est obligatoire');
    }
    if (!data.last_name || data.last_name.trim().length == 0) {
      errors.push('last_name est obligatoire');
    }
    if (!isValidEmail(data.email)) {
      errors.push('email invalide');
    }
    if (data.phone && data.phone.length > 20) {
      errors.push('phone trop long');
    }
    if (!data.status) {
      errors.push('status est obligatoire');
    }
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }
    await pool.query(
      'UPDATE applications SET first_name = $1, last_name = $2, email = $3, phone = $4, status = $5 WHERE id = $6',
      [data.first_name, data.last_name, data.email, normalizePhone(data.phone), data.status, req.params.id],
    );
    res.json({ ok: true });
  });

  return router;
}
