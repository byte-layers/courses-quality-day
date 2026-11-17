import express from 'express';
import { config } from './config.js';
import { logger } from './logger.js';
import { offersRouter } from './routes/offers.js';
import { applicationsRouter } from './routes/applications.js';

export { pool } from './db.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.static(new URL('../public', import.meta.url).pathname));
  app.use('/api/offers', offersRouter());
  app.use('/api/applications', applicationsRouter());
  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createApp().listen(config.port, () => logger.info(`RHPilot sur http://localhost:${config.port}`));
}
