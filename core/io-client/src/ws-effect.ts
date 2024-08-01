/* eslint-disable @typescript-eslint/ban-types */
import { RouteException } from '@core/exceptions'
import { createEffect, Effect } from 'effector'
import { Socket } from 'socket.io-client'
import {
  EventNames,
  EventsMap,
  WsActionInput,
  WsActionOutput,
  WsActionResult,
} from './types'

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

export function createWsEffect<
  ClientToServerEvents extends EventsMap,
  K extends EventNames<ClientToServerEvents>,
>(socket: Socket<any, ClientToServerEvents>, event: K) {
  type ThisPayload = WsActionInput<ClientToServerEvents, K>
  type ThisOutput = WsActionOutput<ClientToServerEvents, K>

  return createEffect(async (input: ThisPayload) => {
    const defer = createDefer<ThisOutput>()

    const ack = (_: unknown, result: WsActionResult<ThisOutput>) => {
      if (result[0] === 1) defer.resolve(result[1])
      else defer.reject(new RouteException(result[1]))
    }

    const parameters = [input !== undefined ? input : null, ack] as Parameters<
      ClientToServerEvents[K]
    >

    socket.timeout(5000).emit(event, ...parameters)
    return defer.promise
  }) as Effect<ThisPayload, ThisOutput, RouteException<unknown>>
}
