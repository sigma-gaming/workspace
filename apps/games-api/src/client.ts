import { app } from './app'

export type ApiType = typeof app
export type { SocketEvent, SocketTopic } from './router/websocket'
