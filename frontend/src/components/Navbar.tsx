import { Link, useLocation } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const { pathname } = useLocation()

  if (pathname === '/login' || !isAuthenticated || !user) return null;

  const dashboardUrl = `/dashboard/${user.role}`

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold text-gray-900">
            Book Booker
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to={dashboardUrl}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </Link>
            <Link
              to="/books"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Books
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/users"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Users
              </Link>
            )}
            {user.role === 'user' && (
              <Link
                to="/reservations"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                My Reservations
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.username}</span>
          <button
            onClick={logout}
            className="cursor-pointer rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
