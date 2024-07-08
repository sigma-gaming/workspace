import './global.css'
import { ThemeProvider, useMedia } from '@core/ui'
import { Notifications } from '@mantine/notifications'
import { createRoutesView, RouterProvider } from 'atomic-router-react'
import { useUnit } from 'effector-react'
import { MaintenanceOverlay } from '../features/maintenance/overlay.tsx'
import { PAGES } from '../pages'
import { NotFoundPageView } from '../pages/not-found'
import { router } from '../routing'
import { RouteLayout } from '../routing/types.ts'
import { usePageTitle } from '../shared/meta/title.ts'

export const PageViews = createRoutesView({
  routes: PAGES.map(({ layout, ...record }) => record),
  otherwise: NotFoundPageView,
})

const OptimizedPages = () => {
  const activeRoutes = useUnit(router.$activeRoutes)

  let ActiveLayout: RouteLayout | null = null
  let activeTitle: string | null = null
  let hasActiveRoute = false

  for (const { route, layout, title } of PAGES) {
    const routes = Array.isArray(route) ? route : [route]
    const isActive = routes.some((route) => activeRoutes.includes(route))
    if (!isActive) continue

    hasActiveRoute = true

    if (layout) {
      ActiveLayout = layout
    }

    if (title) {
      activeTitle = title
    }
  }

  usePageTitle(hasActiveRoute ? activeTitle : '404')

  if (!ActiveLayout) {
    return <PageViews />
  }

  return (
    <ActiveLayout>
      <PageViews />
    </ActiveLayout>
  )
}

export const AppView = () => {
  const isMobile = useMedia({ to: 'md' })

  return (
    <RouterProvider router={router}>
      <ThemeProvider>
        <Notifications
          limit={3}
          position="bottom-left"
          containerWidth={320}
          bottom={isMobile ? 64 : 'var(--mantine-spacing-md)'}
        />
        <OptimizedPages />
        <MaintenanceOverlay />
      </ThemeProvider>
    </RouterProvider>
  )
}
