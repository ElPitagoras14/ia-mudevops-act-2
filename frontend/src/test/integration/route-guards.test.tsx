import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { IntegrationApp } from './setup'

const mockUseAuth = vi.hoisted(() => vi.fn(() => ({
  user: null, isAuthenticated: false, isLoading: false,
  login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn(),
})))

const mockGetBooks = vi.hoisted(() => vi.fn())
const mockGetAllReservations = vi.hoisted(() => vi.fn())
const mockGetUsers = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }))

vi.mock('@/lib/api', () => ({
  api: {
    getBooks: mockGetBooks,
    getMyReservations: vi.fn().mockResolvedValue([]),
    getAllReservations: mockGetAllReservations,
    getUsers: mockGetUsers,
    getMe: vi.fn().mockRejectedValue(new Error('No token')),
    login: vi.fn().mockRejectedValue(new Error('No')),
  },
}))

vi.mock('@tanstack/react-devtools', () => ({ TanStackDevtools: () => null }))
vi.mock('@tanstack/react-router-devtools', () => ({ TanStackRouterDevtoolsPanel: () => null }))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetBooks.mockResolvedValue([])
  mockGetAllReservations.mockResolvedValue([])
  mockGetUsers.mockResolvedValue([])
})

describe('Route Guards', () => {
  it('test_unauthenticated_redirect_to_login', async () => {
    mockUseAuth.mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false,
      login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn(),
    })
    render(<IntegrationApp auth={{ user: null, isAuthenticated: false, isLoading: false, login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn() }} />)
    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })
  })

  it('test_user_redirected_from_admin_to_user_dashboard', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', username: 'user1', role: 'user' }, isAuthenticated: true, isLoading: false,
      login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn(),
    })
    render(<IntegrationApp auth={{ user: { id: '2', username: 'user1', role: 'user' }, isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn() }} />)
    await waitFor(() => {
      expect(screen.getByText('Welcome, user1')).toBeInTheDocument()
    })
    expect(screen.queryByText('Manage users')).not.toBeInTheDocument()
  })

  it('test_admin_can_access_admin_routes', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'admin', role: 'admin' }, isAuthenticated: true, isLoading: false,
      login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn(),
    })
    render(<IntegrationApp auth={{ user: { id: '1', username: 'admin', role: 'admin' }, isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn() }} />)
    await waitFor(() => {
      expect(screen.getByText('Welcome, admin')).toBeInTheDocument()
    })
    expect(screen.getByText('Manage users →')).toBeInTheDocument()
  })
})
