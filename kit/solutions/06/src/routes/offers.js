import { Router } from 'express';
import { query } from '../db.js';

export function offersRouter() {
  const router = Router();
  router.get('/', async (req, res) => {
    const result = await query('SELECT id, title, team FROM offers WHERE open = TRUE ORDER BY id');
    res.json(result.rows);
  });
  return router;
}
