import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests run against the production build (vite preview) in the Microsoft Edge
 * already installed on Windows, so no Playwright browser download is needed.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5181',
    channel: 'msedge',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 5181 --strictPort',
    url: 'http://localhost:5181',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
