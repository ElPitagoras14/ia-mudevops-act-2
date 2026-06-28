import { useEffect, useState } from 'react'
import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { api } from '@/lib/api'
import type { User } from '@/types'

export const Route = createFileRoute('/users/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) throw redirect({ to: '/login' })
    if (context.auth.user?.role !== 'admin') throw redirect({ to: '/dashboard/user' })
  },
  component: UsersListPage,
})

function UsersListPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch {
      /* handled by interceptor */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    try {
      await api.deleteUser(id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
    } catch {
      /* handled by interceptor */
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-8 text-gray-500">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Link
          to="/users/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create User
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{u.username}</td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <div className="flex gap-2">
                    <Link
                      to="/users/$id"
                      params={{ id: u.id }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
