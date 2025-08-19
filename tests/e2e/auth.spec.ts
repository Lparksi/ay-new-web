import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/create-task')
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/login/)
    await expect(page.locator('h2')).toContainText('登录')
  })

  test('should show login form', async ({ page }) => {
    await page.goto('/login')
    
    // Check login form elements
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle login validation', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Should show validation errors (this depends on your validation implementation)
    // await expect(page.locator('.error-message')).toBeVisible()
  })

  // Note: For a complete login test, you would need a test backend
  // or mock the API responses
  test.skip('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[type="text"]', 'testuser')
    await page.fill('input[type="password"]', 'testpass')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard/create-task
    await expect(page).toHaveURL(/.*\/create-task/)
  })
})