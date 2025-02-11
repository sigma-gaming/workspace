import { attach, createEvent, sample } from 'effector'
import { router } from './router'

let promise = Promise.resolve()

const removeQueryParamFx = attach({
  source: router.$history,
  async effect(history, param: string) {
    promise = promise.finally(() => {
      const url = new URL(location.href)
      url.searchParams.delete(param)
      history.replace(url)
    })
  },
})

export const removeQueryParam = createEvent<string>()

sample({
  source: removeQueryParam,
  target: removeQueryParamFx,
})
