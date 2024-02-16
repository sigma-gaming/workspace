import './global.css'
import { ThemeProvider } from '@libs/ui'
import { Notifications } from '@mantine/notifications'
import { createRoutesView, RouterProvider } from 'atomic-router-react'
import { useUnit } from 'effector-react'
import { PAGES } from '../pages/index.ts'
import { NotFoundPageView } from '../pages/not-found/index.ts'
import { router } from '../routing/index.ts'
import { RouteLayout } from '../routing/types.ts'

export const PageViews = createRoutesView({
  routes: PAGES.map(({ layout, ...record }) => record),
  otherwise: NotFoundPageView,
})

const OptimizedPages = () => {
  const activeRoutes = useUnit(router.$activeRoutes)

  let ActiveLayout: RouteLayout | null = null

  for (const { route, layout } of PAGES) {
    const routes = Array.isArray(route) ? route : [route]
    const isActive = routes.some((route) => activeRoutes.includes(route))
    if (!isActive) continue
    if (!layout) continue
    ActiveLayout = layout
  }

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
  return (
    <RouterProvider router={router}>
      <ThemeProvider>
        <Notifications limit={3} position="bottom-left" containerWidth={320} />
        <OptimizedPages />
      </ThemeProvider>
    </RouterProvider>
  )
}
