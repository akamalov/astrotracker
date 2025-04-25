import { test, expect } from '@playwright/test';

// Base URL for the running application (configure in playwright.config.ts)
const baseURL = 'http://localhost:4321'; // Default Astro dev port

test.describe('Authentication Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Clear storage before each test to ensure clean state
    await page.goto(baseURL);
    await page.evaluate(() => localStorage.clear());
  });

  test('should allow user to navigate to login page', async ({ page }) => {
    await page.goto(baseURL);
    // Assuming a "Login" link exists in the layout
    await page.locator('nav :text("Login")').click(); // Adjust selector based on actual layout
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h2:has-text("Login")')).toBeVisible();
  });

  test('should allow user to login with valid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);

    // Fill in credentials
    await page.locator('#email').fill('test@example.com'); // Use valid test user credentials
    await page.locator('#password').fill('password123');   // Use valid test user password
    
    // Click login button
    await page.locator('button[type="submit"]:has-text("Sign In")').click();

    // Assertions after successful login:
    // 1. Should redirect to dashboard (or home)
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 }); // Increased timeout for potential API calls
    
    // 2. Should show user-specific content (e.g., welcome message, dashboard heading)
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();

    // 3. Local storage should contain auth token (optional but good check)
    const authStorage = await page.evaluate(() => localStorage.getItem('auth-storage'));
    expect(authStorage).toBeTruthy();
    const parsedAuth = JSON.parse(authStorage || '{}');
    expect(parsedAuth?.state?.isAuthenticated).toBe(true);
    expect(parsedAuth?.state?.token).toBeTruthy();
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);

    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.locator('button[type="submit"]:has-text("Sign In")').click();

    // Assertions for failed login:
    // 1. Should remain on the login page
    await expect(page).toHaveURL(/.*login/);

    // 2. Should display an error message
    // (Adjust selector based on how errors are displayed in LoginForm.tsx)
    const errorLocator = page.locator('.bg-red-100.text-red-700');
    await expect(errorLocator).toBeVisible();
    await expect(errorLocator).toContainText(/failed to login/i); // Or more specific error

    // 3. Local storage should NOT contain auth token
    const authStorage = await page.evaluate(() => localStorage.getItem('auth-storage'));
    const parsedAuth = JSON.parse(authStorage || '{}');
    expect(parsedAuth?.state?.isAuthenticated).toBeFalsy();
    expect(parsedAuth?.state?.token).toBeFalsy();
  });

  // TODO: Add test for logout functionality
  // TODO: Add test for Google OAuth flow (requires handling external redirect and callback)
}); 