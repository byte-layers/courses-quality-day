import { Router } from 'express';

export function offersRouter(pool) {
  const router = Router();
  router.get('/', async (req, res) => {
    const result = await pool.query('SELECT id, title, team FROM offers WHERE open = TRUE ORDER BY id');
    res.json(result.rows);
  });
  return router;
}
