import { allSettled, fork, serialize } from 'effector'
import { Provider } from 'effector-react'
import { createMemoryHistory } from 'history'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { AppView } from './app/view'
import { $$user } from './entities/user'
import { router } from './routing'
import { $$ssrContext } from './shared/api/ssr-context'

export async function render(url: string, cookies = '') {
  const scope = fork({
    values: new Map([[$$ssrContext.$cookies, cookies]]),
  })

  const history = createMemoryHistory({ initialEntries: [url] })
  await allSettled(router.setHistory, { scope, params: history })
  await allSettled($$user.request, { scope })

  const html = ReactDOMServer.renderToString(
    <Provider value={scope}>
      <AppView />
    </Provider>,
  )

  const initialValues = JSON.stringify(serialize(scope))

  return { html, initialValues }
}
