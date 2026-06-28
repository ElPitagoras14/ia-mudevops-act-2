import type { Book } from '@/types'

interface Props {
  book: Book
  actions?: React.ReactNode
}

export default function BookCard({ book, actions }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{book.title}</h3>
      <p className="mt-1 text-sm text-gray-600">{book.author}</p>
      <p className="mt-1 text-xs text-gray-400">ISBN: {book.isbn}</p>
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            book.available
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {book.available ? 'Available' : 'Reserved'}
        </span>
        {actions && <div>{actions}</div>}
      </div>
    </div>
  )
}
