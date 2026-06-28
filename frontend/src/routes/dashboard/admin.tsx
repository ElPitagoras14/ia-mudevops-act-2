import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/dashboard/admin')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
    if (context.auth.user?.role !== 'admin') throw redirect({ to: '/dashboard/user' })
  },
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        Welcome, {user?.username}
      </h1>
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Total Books</h2>
          <Link to="/books" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
            View all books &rarr;
          </Link>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Total Users</h2>
          <Link to="/users" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
            Manage users &rarr;
          </Link>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Active Reservations</h2>
          <Link to="/reservations" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
            View all reservations &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
