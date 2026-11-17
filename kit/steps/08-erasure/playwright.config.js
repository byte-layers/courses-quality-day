// Tests de bout en bout : Playwright démarre l'application, puis pilote un navigateur.
import { defineConfig } from '@playwright/test';

const port = Number(process.env.PORT || 3000);

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: 'node db/seed.js && node src/server.js',
    url: `http://localhost:${port}/api/offers`,
    reuseExistingServer: !process.env.CI,
  },
});
