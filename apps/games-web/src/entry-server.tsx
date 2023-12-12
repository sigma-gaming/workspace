import { allSettled, fork, serialize } from 'effector'
import { Provider } from 'effector-react'
import { createMemoryHistory } from 'history'
import { Writable } from 'node:stream'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { AppView } from './app/view'
import { $$user } from './entities/user'
import { router } from './routing'
import { $$SSRContext } from './shared/api'

interface Options {
  stream: Writable
  url: string
  cookies?: string
}

export async function render({ stream, url, cookies = '' }: Options) {
  const scope = fork({
    values: [[$$SSRContext.$cookies, cookies]],
  })

  const history = createMemoryHistory({ initialEntries: [url] })
  await allSettled(router.setHistory, { scope, params: history })
  await allSettled($$user.request, { scope })

  const { pipe } = ReactDOMServer.renderToPipeableStream(
    <Provider value={scope}>
      <AppView />
    </Provider>,
    {
      onShellReady() {
        pipe(stream)
      },
    },
  )

  const serialized = serialize(scope)
  const initialValues = JSON.stringify(serialized)

  return { initialValues }
}
