import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import type { User } from '@/types'

const mockGetUsers = vi.hoisted(() => vi.fn())
const mockDeleteUser = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({ ...config }),
  redirect: (opts: any) => ({ ...opts, _redirect: true }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/lib/api', () => ({
  api: { getUsers: mockGetUsers, deleteUser: mockDeleteUser },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'admin', role: 'admin' as const },
    isAuthenticated: true,
  }),
}))

import { Route } from '@/routes/users/'
const UsersListPage = Route.component as React.ComponentType<object>

const mockUsers: User[] = [
  { id: '1', username: 'alice', role: 'admin', created_at: '2024-01-01' },
  { id: '2', username: 'user1', role: 'user', created_at: '2024-01-02' },
]

beforeEach(() => {
  vi.clearAllMocks()
})

function renderUsers() {
  return render(<UsersListPage />)
}

describe('Users List', () => {
  it('test_renders_user_list', async () => {
    mockGetUsers.mockResolvedValue(mockUsers)
    renderUsers()
    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'alice' })).toBeInTheDocument()
      expect(screen.getByRole('cell', { name: 'user1' })).toBeInTheDocument()
    })
  })

  it('test_shows_loading_state', async () => {
    let resolve!: (v: any) => void
    mockGetUsers.mockReturnValue(new Promise((r) => { resolve = r }))
    renderUsers()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    await act(async () => { resolve(mockUsers) })
    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'alice' })).toBeInTheDocument()
    })
  })

  it('test_shows_empty_state', async () => {
    mockGetUsers.mockResolvedValue([])
    renderUsers()
    await waitFor(() => {
      expect(screen.queryByText('admin')).not.toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  it('test_shows_error_state', async () => {
    mockGetUsers.mockRejectedValue(new Error('API error'))
    renderUsers()
    await waitFor(() => {
      expect(screen.queryByText('admin')).not.toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  it('test_delete_user_confirmation', async () => {
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => true) as any
    mockGetUsers.mockResolvedValue(mockUsers)
    mockDeleteUser.mockResolvedValue(undefined)

    renderUsers()
    await waitFor(() => {
      expect(screen.getAllByText('Delete')).toHaveLength(2)
    })

    await act(async () => {
      screen.getAllByText('Delete')[0].click()
    })

    expect(window.confirm).toHaveBeenCalled()
    expect(mockDeleteUser).toHaveBeenCalledWith('1')

    window.confirm = originalConfirm
  })

  it('test_navigates_to_create', async () => {
    mockGetUsers.mockResolvedValue(mockUsers)
    renderUsers()
    await waitFor(() => {
      expect(screen.getByText('Create User')).toBeInTheDocument()
    })
    expect(screen.getByText('Create User').closest('a')).toHaveAttribute('href', '/users/new')
  })
})
