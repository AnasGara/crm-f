import { test, expect } from '@playwright/test';
import { authService } from './src/services/authService';

test('Leads CRUD verification - programmatic login', async ({ page }) => {
  // Programmatically log in
  const loginResponse = await authService.login({
    email: 'test@example.com',
    password: 'password',
  });

  // Set the token in local storage
  await page.evaluate((token) => {
    localStorage.setItem('authToken', token);
  }, loginResponse.token);

  // Go to the leads page
  await page.goto('http://localhost:5173/dashboard/leads');

  // Wait for the page to load
  await page.waitForURL('http://localhost:5173/dashboard/leads');

  // Verify that the leads page is loaded by checking for a known element
  await expect(page.locator('h1:has-text("Leads")')).toBeVisible();

  // Take a screenshot of the leads page
  await page.screenshot({ path: '/home/jules/verification/leads-page-programmatic.png' });
});
