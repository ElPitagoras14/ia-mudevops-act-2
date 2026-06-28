import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Book } from '@/types'

const mockGetBooks = vi.hoisted(() => vi.fn())
const mockDeleteBook = vi.hoisted(() => vi.fn())
const mockReserveBook = vi.hoisted(() => vi.fn())
const mockUseAuth = vi.hoisted(() =>
  vi.fn(() => ({
    user: { id: '1', username: 'admin', role: 'admin' as const },
  })),
)

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({ ...config }),
  redirect: (opts: any) => ({ ...opts, _redirect: true }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/lib/api', () => ({
  api: {
    getBooks: mockGetBooks,
    deleteBook: mockDeleteBook,
    reserveBook: mockReserveBook,
  },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}))

import { Route } from '@/routes/books/'
const BooksListPage = Route.component as React.ComponentType<object>

const mockBooks: Book[] = [
  { id: '1', title: 'Book A', author: 'Author A', isbn: '111', available: true, created_at: '2024-01-01' },
  { id: '2', title: 'Book B', author: 'Author B', isbn: '222', available: false, created_at: '2024-01-02' },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAuth.mockReturnValue({
    user: { id: '1', username: 'admin', role: 'admin' as const },
  })
})

function renderBooks() {
  return render(<BooksListPage />)
}

describe('Books List', () => {
  it('test_renders_book_list', async () => {
    mockGetBooks.mockResolvedValue(mockBooks)
    renderBooks()
    await waitFor(() => {
      expect(screen.getByText('Book A')).toBeInTheDocument()
      expect(screen.getByText('Book B')).toBeInTheDocument()
    })
  })

  it('test_shows_loading_state', async () => {
    let resolve!: (v: any) => void
    mockGetBooks.mockReturnValue(new Promise((r) => { resolve = r }))
    renderBooks()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    await act(async () => { resolve(mockBooks) })
    await waitFor(() => {
      expect(screen.getByText('Book A')).toBeInTheDocument()
    })
  })

  it('test_shows_empty_state', async () => {
    mockGetBooks.mockResolvedValue([])
    renderBooks()
    await waitFor(() => {
      expect(screen.queryByText('Book A')).not.toBeInTheDocument()
    })
  })

  it('test_shows_error_state', async () => {
    mockGetBooks.mockRejectedValue(new Error('API error'))
    renderBooks()
    await waitFor(() => {
      expect(screen.queryByText('Book A')).not.toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })
  })

  it('test_admin_sees_edit_delete', async () => {
    mockGetBooks.mockResolvedValue(mockBooks)
    renderBooks()
    await waitFor(() => {
      expect(screen.getAllByText('Edit')).toHaveLength(2)
      expect(screen.getAllByText('Delete')).toHaveLength(2)
    })
  })

  it('test_user_sees_reserve_for_available', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', username: 'user1', role: 'user' as const },
    })
    mockGetBooks.mockResolvedValue(mockBooks)
    renderBooks()
    await waitFor(() => {
      expect(screen.getByText('Reserve')).toBeInTheDocument()
    })
    // Only 1 Reserve button (book 1 is available, book 2 is not)
    expect(screen.getAllByText('Reserve')).toHaveLength(1)
  })

  it('test_user_no_reserve_for_unavailable', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: '2', username: 'user1', role: 'user' as const },
    })
    mockGetBooks.mockResolvedValue(mockBooks)
    renderBooks()
    await waitFor(() => {
      expect(screen.queryByText('Reserve')).toBeInTheDocument()
    })
    // Book 2 (unavailable) should be reservable — verify there's only one Reserve button
    const rows = screen.getAllByRole('row').slice(1) // skip header
    expect(rows).toHaveLength(2)
  })

  it('test_delete_requires_confirmation', async () => {
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => true) as any
    mockGetBooks.mockResolvedValue(mockBooks)
    mockDeleteBook.mockResolvedValue(undefined)

    renderBooks()
    await waitFor(() => {
      expect(screen.getAllByText('Delete')).toHaveLength(2)
    })

    await act(async () => {
      screen.getAllByText('Delete')[0].click()
    })

    expect(window.confirm).toHaveBeenCalled()
    expect(mockDeleteBook).toHaveBeenCalledWith('1')

    window.confirm = originalConfirm
  })

  it('test_search_filters_books', async () => {
    const user = userEvent.setup()
    mockGetBooks.mockResolvedValue(mockBooks)
    renderBooks()

    await waitFor(() => {
      expect(screen.getByText('Book A')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search by title or author...')
    await user.type(searchInput, 'Book A')

    expect(screen.getByText('Book A')).toBeInTheDocument()
    expect(screen.queryByText('Book B')).not.toBeInTheDocument()
  })
})
