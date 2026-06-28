import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { User } from '@/types'

const mockNavigate = vi.hoisted(() => vi.fn())
const mockGetUsers = vi.hoisted(() => vi.fn())
const mockUpdateUser = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    useParams: () => ({ id: '1' }),
  }),
  redirect: (opts: any) => ({ ...opts, _redirect: true }),
  useNavigate: () => mockNavigate,
}))

vi.mock('@/lib/api', () => ({
  api: { getUsers: mockGetUsers, updateUser: mockUpdateUser },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'admin', role: 'admin' as const },
    isAuthenticated: true,
  }),
}))

import { Route } from '@/routes/users/$id'
const EditPage = Route.component as React.ComponentType<object>

const mockUsers: User[] = [
  { id: '1', username: 'existing', role: 'user', created_at: '2024-01-01' },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('User Edit', () => {
  it('test_prefills_form_with_user_data', async () => {
    mockGetUsers.mockResolvedValue(mockUsers)
    render(<EditPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toHaveValue('existing')
    })
  })

  it('test_updates_user_successfully', async () => {
    const user = userEvent.setup()
    mockGetUsers.mockResolvedValue(mockUsers)
    mockUpdateUser.mockResolvedValue({ ...mockUsers[0], username: 'updated' })

    render(<EditPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toHaveValue('existing')
    })

    await user.clear(screen.getByLabelText('Username'))
    await user.type(screen.getByLabelText('Username'), 'updated')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith('1', {
        username: 'updated',
        role: 'user',
      })
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/users' })
  })

  it('test_updates_password_optional', async () => {
    const user = userEvent.setup()
    mockGetUsers.mockResolvedValue(mockUsers)
    mockUpdateUser.mockResolvedValue(mockUsers[0])

    render(<EditPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toHaveValue('existing')
    })

    await user.clear(screen.getByLabelText('Username'))
    await user.type(screen.getByLabelText('Username'), 'updated')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith('1', {
        username: 'updated',
        role: 'user',
      })
    })
  })

  it('test_shows_404_for_nonexistent_user', async () => {
    mockGetUsers.mockResolvedValue([])
    render(<EditPage />)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/users' })
    })
  })
})
