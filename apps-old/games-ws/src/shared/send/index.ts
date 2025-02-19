import { io } from '../../io'
import { EmitScope, metrics, UserType } from '../../metrics'
import { ServerToClientEvents } from '../../types'
import { getRoomConnections } from '../rooms/get-connections'
import { userRoom } from '../rooms/user'

export function sendToUser<K extends keyof ServerToClientEvents>(
  userId: string,
  event: K,
  ...payload: Parameters<ServerToClientEvents[K]>
) {
  io.to(userRoom(userId)).emit(event, ...payload)

  metrics.eventsSentTotalCounter.inc({
    user_type: UserType.Authenticated,
    emit_scope: EmitScope.User,
  })
}

export function sendToUserOptimized<K extends keyof ServerToClientEvents>(
  userId: string,
  event: K,
  ...payload: Parameters<ServerToClientEvents[K]>
) {
  const connections = getRoomConnections(userRoom(userId))
  if (connections < 2) return
  io.to(userRoom(userId)).emit(event, ...payload)

  metrics.eventsSentTotalCounter.inc({
    user_type: UserType.Authenticated,
    emit_scope: EmitScope.UserOptimized,
  })
}

export function sendToAllGlobal<K extends keyof ServerToClientEvents>(
  event: K,
  ...payload: Parameters<ServerToClientEvents[K]>
) {
  io.emit(event, ...payload)

  metrics.eventsSentTotalCounter.inc({
    user_type: UserType.Unknown,
    emit_scope: EmitScope.Global,
  })
}

export function sendToAllLocal<K extends keyof ServerToClientEvents>(
  event: K,
  ...payload: Parameters<ServerToClientEvents[K]>
) {
  io.local.emit(event, ...payload)

  metrics.eventsSentTotalCounter.inc({
    user_type: UserType.Authenticated,
    emit_scope: EmitScope.Local,
  })
}
