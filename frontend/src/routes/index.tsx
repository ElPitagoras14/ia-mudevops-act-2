import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' })
    }
    const role = context.auth.user?.role
    if (role === 'admin') {
      throw redirect({ to: '/dashboard/admin' })
    }
    throw redirect({ to: '/dashboard/user' })
  },
  component: () => null,
})
