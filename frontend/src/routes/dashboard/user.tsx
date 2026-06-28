import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'

export const Route = createFileRoute('/dashboard/user')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
    if (context.auth.user?.role !== 'user') throw redirect({ to: '/dashboard/admin' })
  },
  component: UserDashboardPage,
})

function UserDashboardPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">
        Welcome, {user?.username}
      </h1>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Available Books</h2>
          <Link to="/books" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
            Browse books &rarr;
          </Link>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">My Reservations</h2>
          <Link to="/reservations" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800">
            View reservations &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
