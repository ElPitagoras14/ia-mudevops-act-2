import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

const mockNavigate = vi.hoisted(() => vi.fn())
const mockLogin = vi.hoisted(() => vi.fn())
const mockUseAuth = vi.hoisted(() =>
  vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: vi.fn(),
    checkAuth: vi.fn(),
  })),
)

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({ ...config, useParams: () => ({}) }),
  redirect: (opts: any) => ({ ...opts, _redirect: true }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/login' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
  Outlet: () => <div />,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

import { Route } from '@/routes/login'
const LoginPage = Route.component as React.ComponentType<object>

beforeEach(() => {
  mockNavigate.mockReset()
  mockLogin.mockReset()
  mockUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: vi.fn(),
    checkAuth: vi.fn(),
  })
})

function renderLogin() {
  return render(<LoginPage /> as ReactNode)
}

describe('Login Page', () => {
  it('test_renders_login_form', () => {
    renderLogin()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('test_shows_error_empty_submit', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(screen.getByText('All fields are required')).toBeInTheDocument()
  })

  it('test_calls_login_with_credentials', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue(undefined)
    renderLogin()

    await user.type(screen.getByLabelText('Username'), 'admin')
    await user.type(screen.getByLabelText('Password'), 'admin123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'admin123')
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' })
  })

  it('test_shows_error_on_api_failure', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValue({
      response: { data: { detail: 'Invalid credentials' } },
    })
    renderLogin()

    await user.type(screen.getByLabelText('Username'), 'admin')
    await user.type(screen.getByLabelText('Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('test_redirects_when_already_authenticated', () => {
    expect(() => {
      Route.beforeLoad({
        context: {
          auth: {
            user: { id: '1', username: 'admin', role: 'admin' },
            isAuthenticated: true,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            checkAuth: vi.fn(),
          },
        },
      } as any)
    }).toThrow()

    expect(() => {
      Route.beforeLoad({
        context: {
          auth: {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            login: vi.fn(),
            logout: vi.fn(),
            checkAuth: vi.fn(),
          },
        },
      } as any)
    }).not.toThrow()
  })

  it('test_disables_button_while_loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}))
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('Username'), 'admin')
    await user.type(screen.getByLabelText('Password'), 'admin123')
    await user.click(screen.getByRole('button', { name: 'Sign In' }))

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled()
  })
})
