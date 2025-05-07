import { createSubscriptionFactory } from '@core/client'
import { SocketRejectionReason } from '@core/exceptions'
import { HubConnectionBuilder, JsonHubProtocol } from '@microsoft/signalr'
import { createEffect, createEvent, createStore, sample } from 'effector'
import { condition, interval, not } from 'patronum'
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

const $shouldBeConnected = createStore(false)
  .on(connect, () => true)
  .on(disconnect, () => false)

const $connected = createStore(false)
  .on(connected, () => true)
  .on(disconnected, () => false)

const { tick: tryReconnect } = interval({
  start: connect,
  stop: disconnect,
  timeout: 5000,
})

connection.onreconnected(() => connected())
connection.onclose(() => disconnected())

sample({
  source: reconnect,
  filter: $shouldBeConnected,
  target: reconnectFx,
})

condition({
  source: $shouldBeConnected,
  if: Boolean,
  then: connectFx,
  else: disconnectFx,
})

sample({
  clock: connectFx.done,
  target: connected,
})

sample({
  clock: tryReconnect,
  filter: not($connected),
  target: reconnect,
})

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
