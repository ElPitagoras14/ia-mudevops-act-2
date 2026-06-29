import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntegrationApp } from './setup'

const mockUseAuth = vi.hoisted(() => vi.fn(() => ({
  user: null, isAuthenticated: false, isLoading: false,
  login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn(),
})))

const mockLogin = vi.hoisted(() => vi.fn())
const mockGetMe = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }))

vi.mock('@/lib/api', () => ({
  api: {
    login: mockLogin,
    getMe: mockGetMe,
    getBooks: vi.fn().mockResolvedValue([]),
    getMyReservations: vi.fn().mockResolvedValue([]),
    getAllReservations: vi.fn().mockResolvedValue([]),
    getUsers: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@tanstack/react-devtools', () => ({ TanStackDevtools: () => null }))
vi.mock('@tanstack/react-router-devtools', () => ({ TanStackRouterDevtoolsPanel: () => null }))

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  Object.defineProperty(window, 'location', {
    value: { ...window.location, href: '' },
    writable: true,
  })
})

describe('Login Flow', () => {
  it('test_login_redirects_admin_to_dashboard', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ access_token: 'token', token_type: 'bearer' })
    mockGetMe.mockResolvedValue({ id: '1', username: 'admin', role: 'admin' })
    mockUseAuth.mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false,
      login: mockLogin, logout: vi.fn(), checkAuth: vi.fn(),
    })

    const { rerender } = render(<IntegrationApp auth={{ user: null, isAuthenticated: false, isLoading: false, login: mockLogin, logout: vi.fn(), checkAuth: vi.fn() }} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Username'), 'admin')
    await user.type(screen.getByLabelText('Password'), 'admin123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })

    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'admin', role: 'admin' }, isAuthenticated: true, isLoading: false,
      login: mockLogin, logout: vi.fn(), checkAuth: vi.fn(),
    })
    rerender(<IntegrationApp auth={{ user: { id: '1', username: 'admin', role: 'admin' }, isAuthenticated: true, isLoading: false, login: mockLogin, logout: vi.fn(), checkAuth: vi.fn() }} />)

    await waitFor(() => {
      expect(screen.getByText('Welcome, admin')).toBeInTheDocument()
    })
    expect(screen.getByText('Manage users →')).toBeInTheDocument()
  })

  it('test_login_redirects_user_to_dashboard', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ access_token: 'token', token_type: 'bearer' })
    mockGetMe.mockResolvedValue({ id: '2', username: 'user1', role: 'user' })
    mockUseAuth.mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false,
      login: mockLogin, logout: vi.fn(), checkAuth: vi.fn(),
    })

    const { rerender } = render(<IntegrationApp auth={{ user: null, isAuthenticated: false, isLoading: false, login: mockLogin, logout: vi.fn(), checkAuth: vi.fn() }} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Username'), 'user1')
    await user.type(screen.getByLabelText('Password'), 'user123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })

    mockUseAuth.mockReturnValue({
      user: { id: '2', username: 'user1', role: 'user' }, isAuthenticated: true, isLoading: false,
      login: mockLogin, logout: vi.fn(), checkAuth: vi.fn(),
    })
    rerender(<IntegrationApp auth={{ user: { id: '2', username: 'user1', role: 'user' }, isAuthenticated: true, isLoading: false, login: mockLogin, logout: vi.fn(), checkAuth: vi.fn() }} />)

    await waitFor(() => {
      expect(screen.getByText('Welcome, user1')).toBeInTheDocument()
    })
    expect(screen.queryByText('Manage users')).not.toBeInTheDocument()
  })

  it('test_login_failure_stays_on_login', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({ response: { data: { detail: 'Invalid credentials' } } })
    mockUseAuth.mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false,
      login: mockLogin, logout: vi.fn(), checkAuth: vi.fn(),
    })

    render(<IntegrationApp auth={{ user: null, isAuthenticated: false, isLoading: false, login: mockLogin, logout: vi.fn(), checkAuth: vi.fn() }} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Username'), 'admin')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })

  it('test_logout_redirects_to_login', async () => {
    const logoutFn = vi.fn(() => {
      window.location.href = '/login'
    })
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'admin', role: 'admin' }, isAuthenticated: true, isLoading: false,
      login: vi.fn(), logout: logoutFn, checkAuth: vi.fn(),
    })

    const { rerender } = render(<IntegrationApp auth={{ user: { id: '1', username: 'admin', role: 'admin' }, isAuthenticated: true, isLoading: false, login: vi.fn(), logout: logoutFn, checkAuth: vi.fn() }} />)

    await waitFor(() => {
      expect(screen.getByText('Welcome, admin')).toBeInTheDocument()
    })

    await userEvent.setup().click(screen.getByText('Logout'))

    expect(logoutFn).toHaveBeenCalled()
    expect(window.location.href).toBe('/login')

    mockUseAuth.mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false,
      login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn(),
    })
    rerender(<IntegrationApp auth={{ user: null, isAuthenticated: false, isLoading: false, login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn() }} />)

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument()
    })
  })
})
