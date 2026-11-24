import { defineConfig } from '@playwright/test';

/**
 * By default the suite builds the site and runs against `vite preview`. Set BASE_URL to run the
 * same tests against a deployment instead, e.g.
 *   BASE_URL=https://datworks-w9bw.vercel.app npm run test:e2e
 */
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5181';
const remote = !!process.env.BASE_URL;

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
    baseURL: BASE_URL,
    channel: 'msedge',
    headless: true,
    trace: 'retain-on-failure',
    // Tests start as returning visitors, so the "developing" intro plays its short version.
    // e2e/home.spec.ts clears this to test the first visit.
    storageState: {
      cookies: [],
      origins: [{ origin: new URL(BASE_URL).origin, localStorage: [{ name: 'datworks:developed', value: '1' }] }],
    },
  },
  webServer: remote
    ? undefined
    : {
        command: 'npm run build && npx vite preview --port 5181 --strictPort',
        url: 'http://localhost:5181',
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
