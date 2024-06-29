import './global.css'
import { ThemeProvider } from '@core/ui'
import { HomePageView } from '../pages/home'

export const AppView = () => {
  return (
    <ThemeProvider>
      <HomePageView />
    </ThemeProvider>
  )
}
