import { ChatMessageSelect, NotificationSelect } from '@dbs/games-schema'
import { gamesPubsubs } from '@games/redis'
import { sessionService } from '@games/services'
import { Hono } from 'hono'
import { WSContext } from 'hono/ws'
import { upgradeWebSocket } from '../app-base'
import { maintenanceEvents } from '../events/maintenance'

/**
 * Setup
 */

const socketMap = new Map<string, Set<WSContext>>()

export const websocketRoute = new Hono().get(
  '/',
  upgradeWebSocket(async (ctx) => {
    const session = await sessionService.getSession(ctx.req)
    const user = sessionService.getUserSafe(session)
    const userId = user?.id ?? 'anonymous'

    return {
      onOpen(_, ws) {
        const sockets = socketMap.get(userId)
        if (sockets) sockets.add(ws)
        else socketMap.set(userId, new Set([ws]))
      },
      onClose(_, ws) {
        const sockets = socketMap.get(userId)
        if (!sockets) return
        sockets.delete(ws)
        if (sockets.size === 0) socketMap.delete(userId)
      },
    }
  }),
)

/**
 * Business logic
 */

export type SocketEvent =
  | { topic: 'chat/message'; payload: ChatMessageSelect }
  | { topic: 'notification'; payload: NotificationSelect }
  | { topic: 'maintenance/started'; payload: null }

export type SocketTopic = SocketEvent['topic']

function sendToUser(userId: string, event: SocketEvent) {
  const sockets = socketMap.get(userId) ?? new Set()

  sockets.forEach((socket) => {
    socket.send(JSON.stringify(event))
  })
}

function sendToAll(event: SocketEvent) {
  socketMap.forEach((sockets) => {
    sockets.forEach((socket) => {
      socket.send(JSON.stringify(event))
    })
  })
}

gamesPubsubs.chatMessages.subscribe((payload) => {
  sendToAll({ topic: 'chat/message', payload })
})

gamesPubsubs.notifications.subscribe((payload) => {
  if (payload.userId) {
    sendToUser(payload.userId, { topic: 'notification', payload })
  } else {
    sendToAll({ topic: 'notification', payload })
  }
})

maintenanceEvents.subscribePublic((event) => {
  if (event.name === 'started') {
    sendToAll({ topic: 'maintenance/started', payload: null })

    socketMap.forEach((sockets) => {
      sockets.forEach((socket) => {
        socket.close()
      })
    })
  }
})
