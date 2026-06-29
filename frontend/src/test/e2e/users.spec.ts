import { test, expect } from '@playwright/test'

test.describe('Users (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('#username', 'admin')
    await page.fill('#password', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/\/dashboard\/admin/)
  })

  test('test_admin_can_create_user', async ({ page }) => {
    await page.getByRole('link', { name: /Manage users/ }).click()
    await expect(page).toHaveURL(/\/users/)

    await page.getByRole('link', { name: 'Create User' }).click()
    await expect(page).toHaveURL(/\/users\/new/)
    await expect(page.getByRole('heading', { name: 'Create User' })).toBeVisible()

    const username = `e2euser_${Date.now()}`
    await page.locator('#username').fill('')
    await page.locator('#username').type(username, { delay: 30 })
    await page.locator('#password').fill('')
    await page.locator('#password').type('testpass123', { delay: 30 })
    await page.getByRole('button', { name: 'Create User' }).click()

    await expect(page).toHaveURL(/\/users/)
    await expect(page.getByText(username)).toBeVisible()
  })

  test('test_admin_can_edit_user', async ({ page }) => {
    await page.getByRole('link', { name: /Manage users/ }).click()
    await expect(page).toHaveURL(/\/users/)

    const userRow = page.getByRole('row', { name: 'user' }).last()
    await userRow.getByRole('link', { name: 'Edit' }).click()
    await expect(page).toHaveURL(/\/users\//)
    await expect(page.getByRole('heading', { name: 'Edit User' })).toBeVisible()
  })

  test('test_admin_can_delete_user', async ({ page }) => {
    await page.getByRole('link', { name: /Manage users/ }).click()
    await expect(page).toHaveURL(/\/users/)

    const username = `delete_me_${Date.now()}`
    await page.getByRole('link', { name: 'Create User' }).click()
    await page.locator('#username').fill('')
    await page.locator('#username').type(username, { delay: 30 })
    await page.locator('#password').fill('')
    await page.locator('#password').type('testpass123', { delay: 30 })
    await page.getByRole('button', { name: 'Create User' }).click()
    await expect(page).toHaveURL(/\/users/)
    const createdRow = page.getByRole('row', { name: username })
    await expect(createdRow).toBeVisible()

    page.on('dialog', (dialog) => dialog.accept())
    await createdRow.getByRole('button', { name: 'Delete' }).click()
    await expect(createdRow).not.toBeVisible()
  })

  test('test_user_list_shows_role_badges', async ({ page }) => {
    await page.getByRole('link', { name: /Manage users/ }).click()
    await expect(page).toHaveURL(/\/users/)

    const adminRow = page.getByRole('row', { name: /admin admin/ })
    await expect(adminRow).toBeVisible()
  })
})
