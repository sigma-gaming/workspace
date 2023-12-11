import { allSettled, fork } from 'effector'
import { Provider } from 'effector-react'
import { createBrowserHistory } from 'history'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppView } from './app/view.tsx'
import { router } from './routing'

const scope = fork({ values: window.INITIAL_VALUES })

const history = createBrowserHistory()

allSettled(router.setHistory, { scope, params: history }).then(() => {
  ReactDOM.hydrateRoot(
    document.querySelector('#root')!,
    <Provider value={scope}>
      <AppView />
    </Provider>,
  )
})
