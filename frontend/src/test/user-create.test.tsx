import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockNavigate = vi.hoisted(() => vi.fn())
const mockCreateUser = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({ ...config }),
  redirect: (opts: any) => ({ ...opts, _redirect: true }),
  useNavigate: () => mockNavigate,
}))

vi.mock('@/lib/api', () => ({
  api: { createUser: mockCreateUser },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'admin', role: 'admin' as const },
    isAuthenticated: true,
  }),
}))

import { Route } from '@/routes/users/new'
const CreatePage = Route.component as React.ComponentType<object>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('User Create', () => {
  it('test_renders_create_user_form', () => {
    render(<CreatePage />)
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Role')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create User' })).toBeInTheDocument()
  })

  it('test_creates_user_successfully', async () => {
    const user = userEvent.setup()
    mockCreateUser.mockResolvedValue({ id: '3', username: 'newuser', role: 'user', created_at: '2024-01-01' })

    render(<CreatePage />)
    await user.type(screen.getByLabelText('Username'), 'newuser')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Create User' }))

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({ username: 'newuser', password: 'secret', role: 'user' })
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/users' })
  })

  it('test_shows_validation_errors', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    await user.click(screen.getByRole('button', { name: 'Create User' }))
    expect(screen.getByText('Username and password are required')).toBeInTheDocument()
  })

  it('test_shows_duplicate_username_error', async () => {
    const user = userEvent.setup()
    mockCreateUser.mockRejectedValue({ response: { data: { detail: 'Username already exists' } } })

    render(<CreatePage />)
    await user.type(screen.getByLabelText('Username'), 'existing')
    await user.type(screen.getByLabelText('Password'), 'pass')
    await user.click(screen.getByRole('button', { name: 'Create User' }))

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument()
    })
  })

  it('test_role_select_allows_admin_and_user', () => {
    render(<CreatePage />)
    const select = screen.getByLabelText('Role') as HTMLSelectElement
    expect(select).toBeInTheDocument()
    const options = Array.from(select.options).map((o) => o.value)
    expect(options).toContain('admin')
    expect(options).toContain('user')
  })
})
