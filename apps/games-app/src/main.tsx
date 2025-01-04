import './setup-dayjs.ts'
import '@core/ui'
import './setup-sticky.ts'
import './shared/sentry/setup.ts'
import ReactDOM from 'react-dom/client'
import { $$app } from './app/model.ts'
import { AppView } from './app/view.tsx'

const root = ReactDOM.createRoot(document.querySelector('#root')!)
root.render(<AppView />)

$$app.started()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(
    import.meta.env.MODE === 'production'
      ? `/sw.js?random=${Math.random().toString().slice(2)}`
      : '/dev-sw.js?dev-sw',
  )
}
