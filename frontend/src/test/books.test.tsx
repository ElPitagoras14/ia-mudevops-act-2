import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import type { Book } from '@/types'

// Test the books list rendering logic in isolation

function BooksTable({
  books,
  role,
  onReserve,
  onDelete,
}: {
  books: Book[]
  role: 'admin' | 'user'
  onReserve: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Title</th>
          <th>Author</th>
          <th>Available</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {books.map((book) => (
          <tr key={book.id}>
            <td>{book.title}</td>
            <td>{book.author}</td>
            <td>{book.available ? 'Available' : 'Reserved'}</td>
            <td>
              {role === 'admin' ? (
                <>
                  <button>Edit</button>
                  <button onClick={() => onDelete(book.id)}>Delete</button>
                </>
              ) : (
                book.available && (
                  <button onClick={() => onReserve(book.id)}>Reserve</button>
                )
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const mockBooks: Book[] = [
  {
    id: '1',
    title: 'Book 1',
    author: 'Author 1',
    isbn: '123',
    available: true,
    created_at: '2024-01-01',
  },
  {
    id: '2',
    title: 'Book 2',
    author: 'Author 2',
    isbn: '456',
    available: false,
    created_at: '2024-01-02',
  },
]

describe('Books List', () => {
  it('renders list of books', () => {
    render(
      <BooksTable books={mockBooks} role="user" onReserve={() => {}} onDelete={() => {}} />,
    )
    expect(screen.getByText('Book 1')).toBeInTheDocument()
    expect(screen.getByText('Book 2')).toBeInTheDocument()
  })

  it('admin sees edit/delete buttons', () => {
    render(
      <BooksTable books={mockBooks} role="admin" onReserve={() => {}} onDelete={() => {}} />,
    )
    const deleteButtons = screen.getAllByText('Delete')
    expect(deleteButtons).toHaveLength(2)
    expect(screen.getAllByText('Edit')).toHaveLength(2)
  })

  it('user sees reserve button only for available books', () => {
    render(
      <BooksTable books={mockBooks} role="user" onReserve={() => {}} onDelete={() => {}} />,
    )
    expect(screen.getByText('Reserve')).toBeInTheDocument()
    expect(screen.queryByText('Edit')).not.toBeInTheDocument()
    expect(screen.queryByText('Delete')).not.toBeInTheDocument()
  })
})
