/* eslint-disable @typescript-eslint/naming-convention */
import { Queue } from './queue'

export type inferQueuePayload<T> =
  T extends Queue<infer TPayload, unknown> ? TPayload : never

export type inferQueueOutput<T> =
  T extends Queue<unknown, infer TOutput> ? TOutput : never
