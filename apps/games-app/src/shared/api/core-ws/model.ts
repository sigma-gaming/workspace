import { createSubscriptionFactory } from '@core/client'
import { SocketRejectionReason } from '@core/exceptions'
import { HubConnectionBuilder, JsonHubProtocol } from '@microsoft/signalr'
import { createEffect, createEvent, createStore, sample } from 'effector'
import { env } from '../../env'
import { Event, EventName } from './generated'

const connection = new HubConnectionBuilder()
  .withUrl(env.gamesWs.url)
  .withHubProtocol(new JsonHubProtocol())
  .withAutomaticReconnect()
  .build()

const connectFx = createEffect(() => connection.start())
const disconnectFx = createEffect(() => connection.stop())

const reconnectFx = createEffect(() => {
  disconnectFx()
  connectFx()
})

const connect = createEvent()
const disconnect = createEvent()
const reconnect = createEvent()

const connected = createEvent()
const disconnected = createEvent()
const rejected = createEvent<SocketRejectionReason>()

sample({ source: connect, target: connectFx })
sample({ source: disconnect, target: disconnectFx })
sample({ source: reconnect, target: reconnectFx })

const $connected = createStore(false)
  .on(connected, () => true)
  .on(disconnected, () => false)

connection.onreconnected(() => connected())
connection.onclose(() => disconnected())

const subscriptionFactory = createSubscriptionFactory<EventName, Event>(
  connection,
)

export const $$coreWs = {
  connect,
  disconnect,
  reconnect,
  rejected,
  $connected,
  subscriptionFactory,
}
