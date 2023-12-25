import { $$effectify } from '@effectify/core/client'
import { allSettled, fork } from 'effector'
import { Provider } from 'effector-react'
import { createBrowserHistory } from 'history'
import { debug } from 'patronum'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppView } from './app/view.tsx'
import { router } from './routing'

import.meta.hot?.on('vite:beforeFullReload', () => {
  throw '(skipping full reload)'
})

export const scope = fork({ values: window.INITIAL_VALUES })

if (process.env.NODE_ENV === 'development') {
  debug.registerScope(scope, { name: 'Client' })
}

const history = createBrowserHistory()

ReactDOM.hydrateRoot(
  document.querySelector('#root')!,
  <Provider value={scope}>
    <AppView />
  </Provider>,
)

void allSettled(router.setHistory, { scope, params: history }).then(() => {
  void allSettled($$effectify.clientStarted, { scope })
})
