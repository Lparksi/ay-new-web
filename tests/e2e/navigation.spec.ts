import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should show navigation bar', async ({ page }) => {
    await page.goto('/')
    
    // Check if navbar is visible
    await expect(page.locator('.navbar')).toBeVisible()
    await expect(page.locator('.navbar-brand')).toContainText('AY Admin')
  })

  test('should show login button when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Should show login button
    await expect(page.locator('text=登录')).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=登录')
    await expect(page).toHaveURL(/.*\/login/)
  })

  // This test would require authentication setup
  test.skip('should show navigation links when authenticated', async ({ page }) => {
    // Mock authentication or login first
    await page.goto('/')
    
    await expect(page.locator('text=创建任务')).toBeVisible()
    await expect(page.locator('text=用户管理')).toBeVisible()
    await expect(page.locator('text=商家管理')).toBeVisible()
    await expect(page.locator('text=标签管理')).toBeVisible()
  })
})