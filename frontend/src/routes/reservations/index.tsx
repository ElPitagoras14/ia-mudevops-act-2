import { useEffect, useState } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { Reservation } from '@/types'

export const Route = createFileRoute('/reservations/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
  },
  component: ReservationsPage,
})

function ReservationsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReservations = async () => {
    try {
      const data = isAdmin ? await api.getAllReservations() : await api.getMyReservations()
      setReservations(data)
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [isAdmin])

  const handleReturn = async (reservationId: string) => {
    if (!confirm('Return this book?')) return
    try {
      await api.returnBook(reservationId)
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, returned_at: new Date().toISOString() } : r,
        ),
      )
    } catch {
      /* handled by interceptor */
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-8 text-gray-500">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        {isAdmin ? 'All Reservations' : 'My Reservations'}
      </h1>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Book</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Author</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reserved</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Returned</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {reservations.map((r) => {
              const active = !r.returned_at
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{r.book_title}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{r.book_author}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {new Date(r.reserved_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {r.returned_at ? new Date(r.returned_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {active ? 'Active' : 'Returned'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {active && (
                      <button
                        onClick={() => handleReturn(r.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
