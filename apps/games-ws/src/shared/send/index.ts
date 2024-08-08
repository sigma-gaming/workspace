import { io } from '../../io'
import { ServerToClientEvents } from '../../types'
import { userRoom } from '../rooms/user'

export function sendToUser<K extends keyof ServerToClientEvents>(
  userId: string,
  event: K,
  ...payload: Parameters<ServerToClientEvents[K]>
) {
  io.to(userRoom(userId)).emit(event, ...payload)
}

export function sendToAllGlobal<K extends keyof ServerToClientEvents>(
  event: K,
  ...payload: Parameters<ServerToClientEvents[K]>
) {
  io.emit(event, ...payload)
}

export function sendToAllLocal<K extends keyof ServerToClientEvents>(
  event: K,
  ...payload: Parameters<ServerToClientEvents[K]>
) {
  io.local.emit(event, ...payload)
}
