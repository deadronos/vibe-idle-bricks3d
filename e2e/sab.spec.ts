import { test, expect } from '@playwright/test';

test('SAB runtime initialization via Settings UI (dev-only)', async ({ page }) => {
  await page.goto('/');

  // If crossOriginIsolated isn't enabled in this environment, skip the test.
  const coi = await page.evaluate(() => (globalThis as unknown as { crossOriginIsolated?: boolean }).crossOriginIsolated);
  test.skip(!coi, 'Cross-origin isolation not enabled in this environment');

  // Open settings
  await page.getByRole('button', { name: 'Settings' }).click();

  // Toggle the SAB settings checkbox
  const sabCheckbox = page.getByLabel('SharedArrayBuffer Physics (Experimental)');
  await expect(sabCheckbox).toBeVisible();
  await sabCheckbox.check();

  // Initialize SAB runtime
  const initBtn = page.getByRole('button', { name: 'Initialize SAB' });
  await expect(initBtn).toBeVisible();
  await initBtn.click();

  // Wait for the status to show Initialized: Yes
  await expect(page.getByText('Initialized: Yes')).toBeVisible({ timeout: 5000 });

  // Shutdown and confirm
  const shutdownBtn = page.getByRole('button', { name: 'Shutdown SAB' });
  await expect(shutdownBtn).toBeVisible();
  await shutdownBtn.click();
  await expect(page.getByText('Initialized: No')).toBeVisible({ timeout: 5000 });
});
