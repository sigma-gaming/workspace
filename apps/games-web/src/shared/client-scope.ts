import { fork } from 'effector'
import { debug } from 'patronum'

export const clientScope = fork({ values: window.INITIAL_VALUES })

if (process.env.NODE_ENV === 'development') {
  debug.registerScope(clientScope, { name: 'Client' })
}
