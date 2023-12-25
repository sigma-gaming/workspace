import { $$effectify, Page } from '@effectify/core/client'
import { initialize } from '@effectify/core/server'
import { allSettled, fork, Scope, serialize } from 'effector'
import { Provider } from 'effector-react'
import { Request, Response } from 'express'
import { debug } from 'patronum'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { AppView } from './app/view'
import { pages } from './pages'
import { router } from './routing'

interface InitializeOptions {
  url: string
  req: Request
  res: Response
}

export async function init({ url, req, res }: InitializeOptions) {
  const scope = fork({
    values: [[$$effectify.$context, { req, res }]],
  })

  debug.registerScope(scope, { name: '/' + url })

  return initialize({
    url,
    scope,
    pages,
    router,
  })
}

interface RenderOptions {
  page?: Page<object>
  scope: Scope
}

export async function render({ page, scope }: RenderOptions) {
  await allSettled($$effectify.serverStarted, { scope })

  let metaHtml = ''

  if (page?.meta?.head) {
    const HeadView = page.meta.head

    metaHtml = renderToString(
      <Provider value={scope}>
        <HeadView />
      </Provider>,
    )
  }

  const appElement = (
    <Provider value={scope}>
      <AppView />
    </Provider>
  )

  const serialized = serialize(scope)
  const initialValues = JSON.stringify(serialized)

  return { appElement, metaHtml, initialValues }
}
