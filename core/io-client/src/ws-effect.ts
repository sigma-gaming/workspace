/* eslint-disable @typescript-eslint/ban-types */
import {
  InternalServerException,
  recreateException,
  RouteException,
} from '@core/exceptions'
import { createDefer } from '@core/utils'
import { createEffect, Effect } from 'effector'
import { Socket } from 'socket.io-client'
import {
  EventNames,
  EventsMap,
  WsActionInput,
  WsActionOutput,
  WsActionResult,
} from './types'

export function createWsEffect<
  ClientToServerEvents extends EventsMap,
  K extends EventNames<ClientToServerEvents>,
>(socket: Socket<any, ClientToServerEvents>, event: K) {
  type ThisPayload = WsActionInput<ClientToServerEvents, K>
  type ThisOutput = WsActionOutput<ClientToServerEvents, K>

  return createEffect(async (input: ThisPayload) => {
    const defer = createDefer<ThisOutput>()

    const ack = (_: unknown, result?: WsActionResult<ThisOutput>) => {
      if (!result) return defer.reject(new InternalServerException())
      if (result[0] === 1) return defer.resolve(result[1])
      const exception = recreateException(result[1])
      defer.reject(exception ?? new InternalServerException())
    }

    const parameters = [input !== undefined ? input : null, ack] as Parameters<
      ClientToServerEvents[K]
    >

    socket.timeout(5000).emit(event, ...parameters)
    return defer.promise
  }) as Effect<ThisPayload, ThisOutput, RouteException<unknown>>
}
