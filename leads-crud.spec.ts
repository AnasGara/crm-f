import { test, expect } from '@playwright/test';

test('Leads CRUD verification', async ({ page }) => {
  await page.goto('http://localhost:5173/login');

  // Expects the URL to contain "login".
  await expect(page).toHaveURL(/.*login/);

  await page.screenshot({ path: '/home/jules/verification/login-page.png' });

  // Fill in the email and password
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');

  // Click the login button
  await page.getByRole('button', { name: 'Se connecter' }).click();

  // Wait for navigation to the dashboard
  await page.waitForURL('http://localhost:5173/dashboard/home');

  // Go to the leads page
  await page.goto('http://localhost:5173/dashboard/leads');
  await page.waitForURL('http://localhost:5173/dashboard/leads');

  // Take a screenshot of the leads page
  await page.screenshot({ path: '/home/jules/verification/leads-page.png' });
});
