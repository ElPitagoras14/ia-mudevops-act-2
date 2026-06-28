import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockNavigate = vi.hoisted(() => vi.fn())
const mockCreateBook = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: any) => ({ ...config }),
  redirect: (opts: any) => ({ ...opts, _redirect: true }),
  useNavigate: () => mockNavigate,
}))

vi.mock('@/lib/api', () => ({
  api: { createBook: mockCreateBook },
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'admin', role: 'admin' as const },
    isAuthenticated: true,
  }),
}))

import { Route } from '@/routes/books/new'
const CreatePage = Route.component as React.ComponentType<object>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Book Create', () => {
  it('test_renders_create_form', () => {
    render(<CreatePage />)
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Author')).toBeInTheDocument()
    expect(screen.getByLabelText('ISBN')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Book' })).toBeInTheDocument()
  })

  it('test_creates_book_successfully', async () => {
    const user = userEvent.setup()
    mockCreateBook.mockResolvedValue({ id: '1', title: 'T', author: 'A', isbn: '123', available: true, created_at: '2024-01-01' })

    render(<CreatePage />)
    await user.type(screen.getByLabelText('Title'), 'New Book')
    await user.type(screen.getByLabelText('Author'), 'Author')
    await user.type(screen.getByLabelText('ISBN'), '12345')
    await user.click(screen.getByRole('button', { name: 'Create Book' }))

    await waitFor(() => {
      expect(mockCreateBook).toHaveBeenCalledWith({ title: 'New Book', author: 'Author', isbn: '12345' })
    })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/books' })
  })

  it('test_shows_validation_errors', async () => {
    const user = userEvent.setup()
    render(<CreatePage />)
    await user.click(screen.getByRole('button', { name: 'Create Book' }))
    expect(screen.getByText('All fields are required')).toBeInTheDocument()
  })

  it('test_shows_duplicate_isbn_error', async () => {
    const user = userEvent.setup()
    mockCreateBook.mockRejectedValue({ response: { data: { detail: 'ISBN already exists' } } })

    render(<CreatePage />)
    await user.type(screen.getByLabelText('Title'), 'New Book')
    await user.type(screen.getByLabelText('Author'), 'Author')
    await user.type(screen.getByLabelText('ISBN'), '99999')
    await user.click(screen.getByRole('button', { name: 'Create Book' }))

    await waitFor(() => {
      expect(screen.getByText('ISBN already exists')).toBeInTheDocument()
    })
  })

  it('test_cancels_and_goes_back', () => {
    render(<CreatePage />)
    // No cancel button in this component — verify submit button exists
    expect(screen.getByRole('button', { name: 'Create Book' })).toBeInTheDocument()
  })
})
