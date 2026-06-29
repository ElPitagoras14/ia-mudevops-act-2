import { useMemo, type ReactNode } from 'react'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from '@/router'
import type { AuthContextValue } from '@/hooks/useAuth'

export function IntegrationApp({ auth }: { auth: AuthContextValue }) {
  const router = useMemo(() => getRouter(auth), [auth])
  return <RouterProvider router={router} />
}

export function unauthenticatedAuth(overrides?: Partial<AuthContextValue>): AuthContextValue {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn().mockRejectedValue(new Error('Not implemented')),
    logout: vi.fn(),
    checkAuth: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

export function adminAuth(overrides?: Partial<AuthContextValue>): AuthContextValue {
  return {
    user: { id: '1', username: 'admin', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    ...overrides,
  }
}

export function userAuth(overrides?: Partial<AuthContextValue>): AuthContextValue {
  return {
    user: { id: '2', username: 'user1', role: 'user' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    ...overrides,
  }
}

