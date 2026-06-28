import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

interface Props {
  children: React.ReactNode
  roles?: UserRole[]
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      navigate({ to: '/login' })
      return
    }
    if (roles && user && !roles.includes(user.role)) {
      navigate({ to: `/dashboard/${user.role}` })
    }
  }, [isAuthenticated, isLoading, user, roles, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (roles && user && !roles.includes(user.role)) return null

  return <>{children}</>
}
