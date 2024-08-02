import { ClientToServerEvents, ServerToClientEvents } from '@apis/games-ws'
import { createWsEffect } from '@core/io-client'
import { io, Socket } from 'socket.io-client'
import { env } from '../../env'
import { getSentryTracing } from '../../sentry'

export const gamesWs: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  env.gamesWs.url,
  {
    transports: ['websocket', 'polling', 'webtransport'],
    withCredentials: true,
  },
)

const sendSentryTracingFx = createWsEffect(gamesWs, 'sentry/tracing')

gamesWs.on('connect', () => {
  const tracing = getSentryTracing()
  if (!tracing) return
  sendSentryTracingFx(tracing)
})
