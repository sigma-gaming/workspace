import { RouteException } from '@core/exceptions'

export type EventsMap = {
  [event: string]: any
}

export type EventNames<Map extends EventsMap> = keyof Map & (string | symbol)

export type WsActionResult<T = unknown> = [1, T] | [0, RouteException<unknown>]

export type WsActionHandler<Input, Output> = (
  input: Input,
  ack: (result: WsActionResult<Output>) => void,
) => void

export type WsAction<N extends string, Input, Output> = {
  name: N
  handler: WsActionHandler<Input, Output>
}

export type WsActionInput<M extends EventsMap, K extends EventNames<M>> =
  M[K] extends WsActionHandler<infer Input, any> ? Input : never

export type WsActionOutput<M extends EventsMap, K extends EventNames<M>> =
  M[K] extends WsActionHandler<any, infer Output> ? Output : never
