import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['github']],

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start vite in dev mode with COOP/COEP enabled for SAB testing
  webServer: {
    // Use cross-env for cross-platform env var support (works on Windows)
    command: 'npx cross-env VITE_ENABLE_COOP=1 VITE_ENABLE_SAB=1 npm run dev',
    port: 5173,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
