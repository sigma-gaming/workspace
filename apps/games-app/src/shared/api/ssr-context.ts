import { createStore } from 'effector'

const $cookies = createStore('', { serialize: 'ignore' })

export const $$SSRContext = {
  $cookies,
}
