import { test } from '@playwright/test';

test('Debug rendering', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: '/home/jules/verification/debug-screenshot.png' });
});
