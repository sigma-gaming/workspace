import '@libs/ui'
import ReactDOM from 'react-dom/client'
import { $$app } from './app/model.ts'
import { AppView } from './app/view.tsx'

const root = ReactDOM.createRoot(document.querySelector('#root')!)
root.render(<AppView />)

$$app.started()
