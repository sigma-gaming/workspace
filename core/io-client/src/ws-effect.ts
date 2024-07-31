/* eslint-disable @typescript-eslint/ban-types */
import { createEffect, Effect } from 'effector'
import { Socket } from 'socket.io-client'

export type Defer<T> = {
  readonly promise: Promise<T>
  readonly resolve: (value: T) => void
  readonly reject: (error: Error) => void
}

export function createDefer<T extends unknown = void>(): Defer<T> {
  let resolveFn: Defer<T>['resolve']
  let rejectFn: Defer<T>['reject']

  return {
    promise: new Promise((resolve, reject) => {
      resolveFn = resolve
      rejectFn = reject
    }),
    get resolve() {
      return resolveFn
    },
    get reject() {
      return rejectFn
    },
  }
}

type EventsMap = {
  [event: string]: any
}

export type EventNames<Map extends EventsMap> = keyof Map & (string | symbol)

type AnyFunction = (...args: any[]) => any

type Payload<Events extends EventsMap, K extends keyof Events> = Parameters<
  Events[K]
>[0] extends AnyFunction
  ? void
  : Parameters<Events[K]>[0]

type Ack<Events extends EventsMap, K extends keyof Events> = Parameters<
  Events[K]
>[0] extends AnyFunction
  ? Parameters<Events[K]>[0]
  : Parameters<Events[K]>[1] extends AnyFunction
    ? Parameters<Events[K]>[1]
    : never

type AckOutput<Ack extends AnyFunction> = Parameters<Ack>[0] extends undefined
  ? void
  : Parameters<Ack>[0]

export function createWsEffect<
  ClientToServerEvents extends EventsMap,
  K extends EventNames<ClientToServerEvents>,
>(socket: Socket<any, ClientToServerEvents>, event: K) {
  type ThisPayload = Payload<ClientToServerEvents, K>
  type ThisAck = Ack<ClientToServerEvents, K>
  type ThisAckPayload = AckOutput<ThisAck>

  return createEffect(async (input: Payload<ClientToServerEvents, K>) => {
    const defer = createDefer<unknown>()

    const ack = (output: unknown) => {
      if (output instanceof Error) defer.reject(output)
      else defer.resolve(output)
    }

    const parameters = (
      input !== undefined ? [input, ack] : [ack]
    ) as Parameters<ClientToServerEvents[K]>

    socket.timeout(5000).emit(event, ...parameters)
    return defer.promise
  }) as Effect<ThisPayload, ThisAckPayload>
}
