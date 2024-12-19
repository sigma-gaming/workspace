import { createWsAction } from '../ws-action'

export const PingAction = createWsAction({
  name: 'ping',
  log: false,
  async handler(): Promise<'pong'> {
    return 'pong'
  },
})
