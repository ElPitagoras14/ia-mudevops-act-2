import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test('test_login_page_accessible_when_unauthenticated', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Book Booker')).toBeVisible()
    await expect(page.locator('#username')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('test_admin_login_redirects_to_admin_dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'admin')
    await page.fill('#password', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard\/admin/)
    await expect(page.getByText('Welcome, admin')).toBeVisible()
  })

  test('test_user_login_redirects_to_user_dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'user')
    await page.fill('#password', 'user123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard\/user/)
    await expect(page.getByText('Welcome, user')).toBeVisible()
  })

  test('test_invalid_credentials_stays_on_login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'admin')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('#username')).toBeVisible()
  })
})
