import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockUseAuth = vi.hoisted(() =>
  vi.fn(() => ({
    user: { id: '1', username: 'admin', role: 'admin' as const },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  })),
)

const mockUseLocation = vi.hoisted(() => vi.fn(() => ({ pathname: '/books' })))

vi.mock('@tanstack/react-router', () => ({
  useLocation: () => mockUseLocation(),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

import Navbar from '@/components/Navbar'

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    user: { id: '1', username: 'admin', role: 'admin' as const },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  })
  mockUseLocation.mockReturnValue({ pathname: '/books' })
})

describe('Navbar', () => {
  it('test_shows_admin_links', () => {
    render(<Navbar />)
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.queryByText('My Reservations')).not.toBeInTheDocument()
  })

  it('test_shows_user_links', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', username: 'user1', role: 'user' as const },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    })
    render(<Navbar />)
    expect(screen.getByText('My Reservations')).toBeInTheDocument()
    expect(screen.queryByText('Users')).not.toBeInTheDocument()
  })

  it('test_hides_navbar_on_login_page', () => {
    mockUseLocation.mockReturnValue({ pathname: '/login' })
    const { container } = render(<Navbar />)
    expect(container.innerHTML).toBe('')
  })

  it('test_shows_username', () => {
    render(<Navbar />)
    expect(screen.getByText('admin')).toBeInTheDocument()
  })

  it('test_logout_button_works', async () => {
    const logout = vi.fn()
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'admin', role: 'admin' as const },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout,
      checkAuth: vi.fn(),
    })
    const user = userEvent.setup()
    render(<Navbar />)
    await user.click(screen.getByText('Logout'))
    expect(logout).toHaveBeenCalledOnce()
  })

  it('test_dashboard_link_visible', () => {
    render(<Navbar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
