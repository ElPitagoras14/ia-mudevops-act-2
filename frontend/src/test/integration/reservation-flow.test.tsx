import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IntegrationApp } from './setup'

const mockUseAuth = vi.hoisted(() => vi.fn(() => ({
  user: null, isAuthenticated: false, isLoading: false,
  login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn(),
})))

const mockGetBooks = vi.hoisted(() => vi.fn())
const mockReserveBook = vi.hoisted(() => vi.fn())
const mockGetMyReservations = vi.hoisted(() => vi.fn())
const mockReturnBook = vi.hoisted(() => vi.fn())

const bookData = vi.hoisted(() => ({
  id: 'b1', title: 'Test Book', author: 'Test Author',
  isbn: '123', available: true, created_at: '2024-01-01',
}))

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }))

vi.mock('@/lib/api', () => ({
  api: {
    getBooks: mockGetBooks,
    reserveBook: mockReserveBook,
    getMyReservations: mockGetMyReservations,
    returnBook: mockReturnBook,
    getMe: vi.fn(),
    login: vi.fn(),
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

describe('Reservation Flow', () => {
  it('test_full_reserve_and_return_flow', async () => {
    const user = userEvent.setup()

    mockUseAuth.mockReturnValue({
      user: { id: '2', username: 'user1', role: 'user' }, isAuthenticated: true, isLoading: false,
      login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn(),
    })
    mockGetBooks.mockResolvedValue([bookData])
    mockGetMyReservations.mockResolvedValue([])

    render(<IntegrationApp auth={{ user: { id: '2', username: 'user1', role: 'user' }, isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn(), checkAuth: vi.fn() }} />)

    await waitFor(() => {
      expect(screen.getByText('Welcome, user1')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Books'))

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument()
    })

    const reserveBtn = screen.getByText('Reserve')
    expect(reserveBtn).toBeInTheDocument()

    mockReserveBook.mockResolvedValue({
      id: 'r1', book_id: 'b1', book_title: 'Test Book',
      reserved_at: new Date().toISOString(), returned_at: null,
    })

    await user.click(reserveBtn)
    await waitFor(() => {
      expect(mockReserveBook).toHaveBeenCalledWith('b1')
    })

    mockGetMyReservations.mockResolvedValue([{
      id: 'r1', book_id: 'b1', book_title: 'Test Book', book_author: 'Test Author',
      reserved_at: new Date().toISOString(), returned_at: null,
    }])

    await user.click(screen.getByText('My Reservations'))

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument()
    })
    expect(screen.getByText('Active')).toBeInTheDocument()

    const returnBtn = screen.getByText('Return')
    expect(returnBtn).toBeInTheDocument()

    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => true) as any

    mockReturnBook.mockResolvedValue({
      id: 'r1', book_id: 'b1', book_title: 'Test Book', book_author: 'Test Author',
      reserved_at: new Date().toISOString(), returned_at: new Date().toISOString(),
    })

    await user.click(returnBtn)
    expect(window.confirm).toHaveBeenCalledWith('Return this book?')
    expect(mockReturnBook).toHaveBeenCalledWith('r1')

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'Returned' })).toBeInTheDocument()
    })

    window.confirm = originalConfirm
  })
})
