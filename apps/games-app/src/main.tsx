import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppView } from './app/view.tsx'
import { appStarted } from './shared/events.ts'

const root = ReactDOM.createRoot(document.querySelector('#root')!)
root.render(<AppView />)

appStarted()
