import { test, expect } from '@playwright/test'

test.describe('Reservations (Admin)', () => {
  test('test_admin_sees_all_reservations_page', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'admin')
    await page.fill('#password', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard\/admin/)

    await page.getByRole('link', { name: /View all reservations/ }).click()
    await expect(page).toHaveURL(/\/reservations/)
    await expect(page.getByRole('heading', { name: 'All Reservations' })).toBeVisible()
  })

  test('test_admin_sees_user_reservations_with_status', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'user')
    await page.fill('#password', 'user123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard\/user/)

    await page.getByRole('link', { name: /Browse books/ }).click()
    await expect(page).toHaveURL(/\/books/)
    const bookRow = page.getByRole('row', { name: /Cien años/ })
    await bookRow.getByRole('button', { name: 'Reserve' }).click()

    await page.getByRole('button', { name: 'Logout' }).click()
    await page.waitForURL(/\/login/)

    await page.fill('#username', 'admin')
    await page.fill('#password', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard\/admin/)

    await page.getByRole('link', { name: /View all reservations/ }).click()
    await expect(page).toHaveURL(/\/reservations/)
    await expect(page.getByText('Cien años')).toBeVisible()
    const adminRow = page.getByRole('row', { name: /Cien años/ })
    await expect(adminRow.getByText('Active')).toBeVisible()
  })
})
