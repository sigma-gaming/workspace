import '@mantine/core/styles.css'
import './global.css'
import { HomePageView } from '../pages/home'
import { ThemeProvider } from '../shared/ui/theme'

export const AppView = () => {
  return (
    <ThemeProvider>
      <HomePageView />
    </ThemeProvider>
  )
}
