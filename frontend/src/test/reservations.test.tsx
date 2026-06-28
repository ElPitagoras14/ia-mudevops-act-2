import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import type { Reservation } from '@/types'

const mockGetAllReservations = vi.hoisted(() => vi.fn())
const mockGetMyReservations = vi.hoisted(() => vi.fn())
const mockReturnBook = vi.hoisted(() => vi.fn())
const mockUseAuth = vi.hoisted(() =>
  vi.fn(() => ({
    user: { id: '1', username: 'admin', role: 'admin' as const },
  })),
)

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({ ...config }),
  redirect: (opts: any) => ({ ...opts, _redirect: true }),
}))

vi.mock('@/lib/api', () => ({
  api: {
    getAllReservations: mockGetAllReservations,
    getMyReservations: mockGetMyReservations,
    returnBook: mockReturnBook,
  },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

import { Route } from '@/routes/reservations/'
const ReservationsPage = Route.component as React.ComponentType<object>

const activeReservation: Reservation = {
  id: 'r1', book_id: 'b1', book_title: 'Book One', book_author: 'Author A',
  reserved_at: '2024-01-01T00:00:00Z', returned_at: null,
}
const returnedReservation: Reservation = {
  id: 'r2', book_id: 'b2', book_title: 'Book Two', book_author: 'Author B',
  reserved_at: '2024-01-02T00:00:00Z', returned_at: '2024-01-10T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({
    user: { id: '1', username: 'admin', role: 'admin' as const },
  })
})

function renderReservations() {
  return render(<ReservationsPage />)
}

describe('Reservations', () => {
  it('test_renders_reservations_list', async () => {
    mockGetAllReservations.mockResolvedValue([activeReservation, returnedReservation])
    renderReservations()
    await waitFor(() => {
      expect(screen.getByText('Book One')).toBeInTheDocument()
      expect(screen.getByText('Book Two')).toBeInTheDocument()
    })
  })

  it('test_shows_active_badge', async () => {
    mockGetAllReservations.mockResolvedValue([activeReservation])
    renderReservations()
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  it('test_shows_returned_badge', async () => {
    mockGetAllReservations.mockResolvedValue([returnedReservation])
    renderReservations()
    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'Returned' })).toBeInTheDocument()
    })
  })

  it('test_return_button_for_active', async () => {
    mockGetAllReservations.mockResolvedValue([activeReservation])
    renderReservations()
    await waitFor(() => {
      expect(screen.getByText('Return')).toBeInTheDocument()
    })
  })

  it('test_no_return_button_for_returned', async () => {
    mockGetAllReservations.mockResolvedValue([returnedReservation])
    renderReservations()
    await waitFor(() => {
      expect(screen.queryByText('Return')).not.toBeInTheDocument()
    })
  })

  it('test_return_book_flow', async () => {
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => true) as any
    mockGetAllReservations.mockResolvedValue([activeReservation])
    mockReturnBook.mockResolvedValue({ ...activeReservation, returned_at: '2024-01-11T00:00:00Z' })

    renderReservations()
    await waitFor(() => {
      expect(screen.getByText('Return')).toBeInTheDocument()
    })

    await act(async () => {
      screen.getByText('Return').click()
    })

    expect(window.confirm).toHaveBeenCalledWith('Return this book?')
    expect(mockReturnBook).toHaveBeenCalledWith('r1')

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'Returned' })).toBeInTheDocument()
    })

    window.confirm = originalConfirm
  })

  it('test_shows_loading_state', async () => {
    let resolve!: (v: any) => void
    mockGetAllReservations.mockReturnValue(new Promise((r) => { resolve = r }))
    renderReservations()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    await act(async () => { resolve([activeReservation]) })
    await waitFor(() => {
      expect(screen.getByText('Book One')).toBeInTheDocument()
    })
  })

  it('test_shows_empty_state', async () => {
    mockGetAllReservations.mockResolvedValue([])
    renderReservations()
    await waitFor(() => {
      expect(screen.queryByText('Book One')).not.toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  it('test_shows_error_state', async () => {
    mockGetAllReservations.mockRejectedValue(new Error('API error'))
    renderReservations()
    await waitFor(() => {
      expect(screen.queryByText('Book One')).not.toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })
})
