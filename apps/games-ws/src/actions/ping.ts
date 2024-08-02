import { createWsAction } from '../ws-action'

export const PingAction = createWsAction({
  name: 'ping',
  async handler(): Promise<'pong'> {
    return 'pong'
  },
})
