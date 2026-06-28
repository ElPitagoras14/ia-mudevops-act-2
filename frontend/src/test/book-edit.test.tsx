import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Book } from '@/types'

const mockNavigate = vi.hoisted(() => vi.fn())
const mockGetBook = vi.hoisted(() => vi.fn())
const mockUpdateBook = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({
    ...config,
    useParams: () => ({ id: '1' }),
  }),
  redirect: (opts: any) => ({ ...opts, _redirect: true }),
  useNavigate: () => mockNavigate,
}))

vi.mock('@/lib/api', () => ({
  api: { getBook: mockGetBook, updateBook: mockUpdateBook },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'admin', role: 'admin' as const },
    isAuthenticated: true,
  }),
}))

import { Route } from '@/routes/books/$id'
const EditPage = Route.component as React.ComponentType<object>

const mockBook: Book = {
  id: '1', title: 'Original Title', author: 'Original Author',
  isbn: '12345', available: true, created_at: '2024-01-01',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Book Edit', () => {
  it('test_prefills_form_with_book_data', async () => {
    mockGetBook.mockResolvedValue(mockBook)
    render(<EditPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toHaveValue('Original Title')
      expect(screen.getByLabelText('Author')).toHaveValue('Original Author')
      expect(screen.getByLabelText('ISBN')).toHaveValue('12345')
    })
  })

  it('test_updates_book_successfully', async () => {
    const user = userEvent.setup()
    mockGetBook.mockResolvedValue(mockBook)
    mockUpdateBook.mockResolvedValue({ ...mockBook, title: 'Updated' })

    render(<EditPage />)
    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toHaveValue('Original Title')
    })

    await user.clear(screen.getByLabelText('Title'))
    await user.type(screen.getByLabelText('Title'), 'Updated Title')
    await user.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(mockUpdateBook).toHaveBeenCalledWith('1', {
        title: 'Updated Title', author: 'Original Author', isbn: '12345',
      })
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/books' })
  })

  it('test_shows_404_for_nonexistent_book', async () => {
    mockGetBook.mockRejectedValue(new Error('Not found'))
    render(<EditPage />)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/books' })
    })
  })

  it('test_cancels_edit', async () => {
    mockGetBook.mockResolvedValue(mockBook)
    render(<EditPage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
    })
  })
})
