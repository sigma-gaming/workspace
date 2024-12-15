import { DomainApp } from '@dbs/games-types-private'
import { domainService, gamesPubsubs } from '@games/services'
import { createAdapter } from '@socket.io/redis-adapter'
import { Server } from 'socket.io'
import { ClientToServerEvents, ServerToClientEvents } from './types'

export const io = new Server<ClientToServerEvents, ServerToClientEvents>({
  adapter: createAdapter(gamesPubsubs.pub, gamesPubsubs.sub),
  allowRequest(req, callback) {
    const matches = domainService.originMatches(req.headers.origin, [
      DomainApp.GamesApp,
      DomainApp.ControlApp,
    ])

    if (matches) callback(null, true)
    else callback('Origin not allowed', false)
  },
})
