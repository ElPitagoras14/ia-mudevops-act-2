import { useEffect, useState } from 'react'
import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { Book } from '@/types'

export const Route = createFileRoute('/books/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
  },
  component: BooksListPage,
})

function BooksListPage() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [reserving, setReserving] = useState<string | null>(null)

  const fetchBooks = async () => {
    try {
      const data = await api.getBooks()
      setBooks(data)
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return
    try {
      await api.deleteBook(id)
      setBooks((prev) => prev.filter((b) => b.id !== id))
    } catch {
      /* handled by interceptor */
    }
  }

  const handleReserve = async (bookId: string) => {
    setReserving(bookId)
    try {
      await api.reserveBook(bookId)
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, available: false } : b)),
      )
    } catch {
      /* handled by interceptor */
    } finally {
      setReserving(null)
    }
  }

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase()),
  )

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-8 text-gray-500">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Books</h1>
        {user?.role === 'admin' && (
          <Link
            to="/books/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Book
          </Link>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by title or author..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ISBN</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((book) => (
              <tr key={book.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{book.title}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{book.author}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{book.isbn}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      book.available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {book.available ? 'Available' : 'Reserved'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {user?.role === 'admin' ? (
                    <div className="flex gap-2">
                      <Link
                        to="/books/$id"
                        params={{ id: book.id }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(book.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    book.available && (
                      <button
                        onClick={() => handleReserve(book.id)}
                        disabled={reserving === book.id}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {reserving === book.id ? 'Reserving...' : 'Reserve'}
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
