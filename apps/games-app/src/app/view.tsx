import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './global.css'
import { Notifications } from '@mantine/notifications'
import { RouterProvider } from 'atomic-router-react'
import { PageViews } from '../pages'
import { router } from '../routing'
import { ThemeProvider } from '../shared/ui/theme'

export const AppView = () => {
  return (
    <RouterProvider router={router}>
      <ThemeProvider>
        <Notifications />
        <PageViews />
      </ThemeProvider>
    </RouterProvider>
  )
}
