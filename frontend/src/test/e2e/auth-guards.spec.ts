import { test, expect } from '@playwright/test'

test.describe('Auth Guards', () => {
  test('test_unauthenticated_redirect_to_login', async ({ page }) => {
    await page.goto('/books')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('#username')).toBeVisible()
  })

  test('test_user_redirected_from_admin_users_page', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'user')
    await page.fill('#password', 'user123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard\/user/)

    await page.goto('/users')
    await expect(page).toHaveURL(/\/dashboard\/user/)
  })

  test('test_admin_can_access_admin_only_routes', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'admin')
    await page.fill('#password', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard\/admin/)

    await page.getByRole('link', { name: 'Books', exact: true }).click()
    await expect(page).toHaveURL(/\/books/)
    await expect(page.getByRole('heading', { name: 'Books' })).toBeVisible()

    await page.getByRole('link', { name: 'Create Book' }).click()
    await expect(page).toHaveURL(/\/books\/new/)
    await expect(page.getByRole('heading', { name: 'Create Book' })).toBeVisible()

    await page.getByRole('link', { name: 'Dashboard' }).click()
    await expect(page).toHaveURL(/\/dashboard\/admin/)

    await page.getByRole('link', { name: 'Users', exact: true }).click()
    await expect(page).toHaveURL(/\/users/)
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  })
})
