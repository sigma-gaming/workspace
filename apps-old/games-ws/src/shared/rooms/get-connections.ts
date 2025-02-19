import { io } from '../../io'

export function getRoomConnections(room: string) {
  const rooms = io._nsps.get('/')?.adapter.rooms
  return rooms?.get(room)?.size ?? 0
}
