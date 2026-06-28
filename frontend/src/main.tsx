import { useMemo, StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'
import { AuthProvider, useAuth } from './hooks/useAuth'

function AuthRouterWrapper() {
  const auth = useAuth()
  const router = useMemo(() => getRouter(auth), [auth])
  return <RouterProvider router={router} />
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <AuthProvider>
        <AuthRouterWrapper />
      </AuthProvider>
    </StrictMode>,
  )
}
