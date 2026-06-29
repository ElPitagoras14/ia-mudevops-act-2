import { test, expect } from '@playwright/test'

test.describe('Books - Admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'admin')
    await page.fill('#password', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard\/admin/)
  })

  test('test_admin_sees_seed_books', async ({ page }) => {
    await page.getByRole('link', { name: 'Books', exact: true }).click()
    await expect(page).toHaveURL(/\/books/)

    await expect(page.getByRole('heading', { name: 'Books' })).toBeVisible()
    await expect(page.getByText('1984')).toBeVisible()
    await expect(page.getByText('Cien años de soledad')).toBeVisible()
    await expect(page.getByText('Don Quijote de la Mancha')).toBeVisible()
    await expect(page.getByText('El principito')).toBeVisible()
    await expect(page.getByText('La sombra del viento')).toBeVisible()
  })

  test('test_admin_can_create_book_and_it_appears', async ({ page }) => {
    await page.getByRole('link', { name: 'Books', exact: true }).click()
    await expect(page).toHaveURL(/\/books/)

    await page.getByRole('link', { name: 'Create Book' }).click()
    await expect(page).toHaveURL(/\/books\/new/)

    const title = `E2E Test Book ${Date.now()}`
    await page.locator('#title').fill('')
    await page.locator('#title').type(title, { delay: 30 })
    await page.locator('#author').fill('')
    await page.locator('#author').type('E2E Author', { delay: 30 })
    await page.locator('#isbn').fill('')
    await page.locator('#isbn').type(`999-${Date.now()}`, { delay: 30 })
    await page.getByRole('button', { name: 'Create Book' }).click()

    await expect(page).toHaveURL(/\/books/)
    await expect(page.getByText(title)).toBeVisible()
  })

  test('test_admin_can_edit_book', async ({ page }) => {
    await page.getByRole('link', { name: 'Books', exact: true }).click()
    await expect(page).toHaveURL(/\/books/)
    await expect(page.getByText('1984')).toBeVisible()

    await page.getByRole('row', { name: /1984/ }).getByRole('link', { name: 'Edit' }).click()
    await expect(page).toHaveURL(/\/books\//)
    await expect(page.getByRole('heading', { name: 'Edit Book' })).toBeVisible()

    const newTitle = `1984 - Updated ${Date.now()}`
    await page.locator('#title').click()
    await page.locator('#title').fill('')
    await page.locator('#title').type(newTitle, { delay: 30 })
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page).toHaveURL(/\/books/)
    await expect(page.getByText(newTitle)).toBeVisible()
  })

  test('test_admin_can_delete_book', async ({ page }) => {
    await page.getByRole('link', { name: 'Books', exact: true }).click()
    await expect(page).toHaveURL(/\/books/)

    const targetRow = page.getByRole('row', { name: /Don Quijote/ })
    await expect(targetRow).toBeVisible()

    page.on('dialog', (dialog) => dialog.accept())
    await targetRow.getByRole('button', { name: 'Delete' }).click()
    await expect(targetRow).not.toBeVisible()
  })
})
