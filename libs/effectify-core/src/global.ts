import { createEvent, createStore } from 'effector'
import { Context } from './client-types'

const serverStarted = createEvent({ name: '@@effectify/serverStarted' })
const clientStarted = createEvent({ name: '@@effectify/clientStarted' })

const $context = createStore<Context>(
  {},
  {
    name: '@@effectify/$context',
    serialize: 'ignore',
  },
)

export const $$effectify = {
  serverStarted,
  clientStarted,
  $context,
}
