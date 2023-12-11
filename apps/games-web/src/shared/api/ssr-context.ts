import { combine, createStore } from 'effector'

export interface SSRContext extends Record<string, unknown> {
  cookies: string
}

const $cookies = createStore('')
const $context = combine<SSRContext>({ cookies: $cookies })

export const $$ssrContext = {
  $cookies,
  $context,
}
