import express from 'express';
import pg from 'pg';
import { offersRouter } from './routes/offers.js';
import { applicationsRouter } from './routes/applications.js';

// HACK: valeur par défaut pour aller plus vite en local, à déplacer un jour
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://rhpilot:rhpilot@localhost:5432/rhpilot',
});

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(new URL('../public', import.meta.url).pathname));
  app.use('/api/offers', offersRouter(pool));
  app.use('/api/applications', applicationsRouter(pool));
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, () => console.log(`RHPilot sur http://localhost:${port}`));
}
