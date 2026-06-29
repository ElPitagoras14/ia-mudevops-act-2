import { test, expect } from '@playwright/test'

test.describe('Books - User', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'user')
    await page.fill('#password', 'user123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard\/user/)
  })

  test('test_user_can_browse_books', async ({ page }) => {
    await page.getByRole('link', { name: /Browse books/ }).click()
    await expect(page).toHaveURL(/\/books/)
    await expect(page.getByText('1984')).toBeVisible()
    await expect(page.getByText('Cien años de soledad')).toBeVisible()
  })

  test('test_user_can_reserve_available_book', async ({ page }) => {
    await page.getByRole('link', { name: /Browse books/ }).click()
    await expect(page).toHaveURL(/\/books/)

    const row = page.getByRole('row', { name: /1984/ })
    await expect(row.getByRole('button', { name: 'Reserve' })).toBeVisible()
    await row.getByRole('button', { name: 'Reserve' }).click()
    await expect(row.getByText('Reserved')).toBeVisible()
  })

  test('test_user_sees_reserved_book_and_can_return', async ({ page }) => {
    await page.getByRole('link', { name: /Browse books/ }).click()
    await expect(page).toHaveURL(/\/books/)

    const row = page.getByRole('row', { name: /El principito/ })
    await row.getByRole('button', { name: 'Reserve' }).click()

    await page.getByRole('link', { name: 'My Reservations' }).click()
    await expect(page).toHaveURL(/\/reservations/)
    await expect(page.getByText('El principito')).toBeVisible()
    await expect(row.getByText('Active')).toBeVisible()

    page.on('dialog', (dialog) => dialog.accept())
    await row.getByRole('button', { name: 'Return' }).click()
    await expect(page.getByText('Returned')).toBeVisible()
  })
})
