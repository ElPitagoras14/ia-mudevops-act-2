import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { AuthContextValue } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import '../styles.css'

export const Route = createRootRouteWithContext<{ auth: AuthContextValue }>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Navbar />
      <Outlet />
      <TanStackDevtools
        config={{ position: 'bottom-right' }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </>
  )
}
