import { useEffect, useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import type { UserMe } from '@/types'

const mockLogin = vi.hoisted(() => vi.fn())
const mockGetMe = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api', () => ({
  api: {
    login: mockLogin,
    getMe: mockGetMe,
  },
}))

const adminUser: UserMe = { id: '1', username: 'admin', role: 'admin' }
const TOKEN_KEY = 'access_token'

beforeEach(() => {
  localStorage.clear()
  mockLogin.mockReset()
  mockGetMe.mockReset()
})

function AuthLogger() {
  const auth = useAuth()
  if (auth.isLoading) return <div data-testid="loading">loading</div>
  return (
    <div>
      <span data-testid="auth">{String(auth.isAuthenticated)}</span>
      <span data-testid="user">{auth.user?.username ?? 'null'}</span>
    </div>
  )
}

function LoginButton() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const handleClick = async () => {
    setLoading(true)
    setError('')
    try {
      await login('admin', 'admin123')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div>
      <button onClick={handleClick}>Login</button>
      {error && <div data-testid="error">{error}</div>}
      {loading && <div data-testid="login-loading">logging in</div>}
    </div>
  )
}

function LogoutButton() {
  const { logout } = useAuth()
  return <button onClick={logout}>Logout</button>
}

function renderApp(children?: React.ReactNode) {
  return render(
    <AuthProvider>
      <AuthLogger />
      {children}
    </AuthProvider>,
  )
}

describe('useAuth', () => {
  it('test_initial_state_unauthenticated', async () => {
    mockGetMe.mockRejectedValue(new Error('no token'))
    renderApp()
    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
  })

  it('test_login_success', async () => {
    mockGetMe.mockResolvedValue(adminUser)
    mockLogin.mockResolvedValue({ access_token: 'tok', token_type: 'bearer' })

    renderApp(<LoginButton />)
    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('false')
    })

    await act(async () => {
      screen.getByText('Login').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('admin')
    })
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok')
    expect(mockLogin).toHaveBeenCalledWith({ username: 'admin', password: 'admin123' })
  })

  it('test_login_failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))

    renderApp(<LoginButton />)
    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('false')
    })

    await act(async () => {
      screen.getByText('Login').click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials')
    })
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('test_logout', async () => {
    const origHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { ...window.location, href: '' },
      writable: true,
    })

    mockGetMe.mockResolvedValue(adminUser)
    mockLogin.mockResolvedValue({ access_token: 'tok', token_type: 'bearer' })

    renderApp(
      <>
        <LoginButton />
        <LogoutButton />
      </>,
    )
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('false'))

    await act(async () => { screen.getByText('Login').click() })
    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('true'))

    await act(async () => { screen.getByText('Logout').click() })

    expect(screen.getByTestId('auth')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('null')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(window.location.href).toBe('/login')

    Object.defineProperty(window, 'location', {
      value: { ...window.location, href: origHref },
      writable: true,
    })
  })

  it('test_checkAuth_restores_session', async () => {
    localStorage.setItem(TOKEN_KEY, 'valid-token')
    mockGetMe.mockResolvedValue(adminUser)

    renderApp()
    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('true')
      expect(screen.getByTestId('user')).toHaveTextContent('admin')
    })
  })

  it('test_checkAuth_invalid_token', async () => {
    localStorage.setItem(TOKEN_KEY, 'invalid-token')
    mockGetMe.mockRejectedValue(new Error('Invalid token'))

    renderApp()
    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('null')
    })
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
