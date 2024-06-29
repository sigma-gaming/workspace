import EventEmitter from 'node:events'

interface EventConfig<T> {
  type: 'public' | 'internal'
  __type__: T
}

interface PublicEventConfig<T> extends EventConfig<T> {
  type: 'public'
  __type__: T
}

interface InternalEventConfig<T> extends EventConfig<T> {
  type: 'internal'
  __type__: T
}

type InferPayload<T> = T extends EventConfig<infer P> ? P : never

interface Events {
  [key: string]: EventConfig<unknown>
}

type PublicEvents<T extends Events> = {
  [K in keyof T as T[K] extends PublicEventConfig<unknown> ? K : never]: T[K]
}

type InternalEvents<T extends Events> = {
  [K in keyof T as T[K] extends InternalEventConfig<unknown> ? K : never]: T[K]
}

type EventDto<T extends Events> = {
  [K in keyof T]: { name: K; payload: InferPayload<T[K]> }
}[keyof T]

export type PublicEventOf<T extends Events> = EventDto<PublicEvents<T>>
export type InternalEventOf<T extends Events> = EventDto<InternalEvents<T>>

export function publicEvent<T>(): PublicEventConfig<T> {
  return { type: 'public', __type__: null as T }
}

export function internalEvent<T>(): InternalEventConfig<T> {
  return { type: 'internal', __type__: null as T }
}

export function createEvents<T extends Events>(config: T) {
  const emitter = new EventEmitter()
  const publicEmitter = new EventEmitter()
  const internalEmitter = new EventEmitter()

  const allEmitter = new EventEmitter()
  const allPublicEmitter = new EventEmitter()
  const allInternalEmitter = new EventEmitter()

  const publicEvents = new Set(
    Object.entries(config)
      .filter(([, { type }]) => type === 'public')
      .map(([key]) => key),
  )

  const internalEvents = new Set(
    Object.entries(config)
      .filter(([, { type }]) => type === 'internal')
      .map(([key]) => key),
  )

  function emit<K extends keyof T>(
    event: K,
    ...payload: T[K] extends EventConfig<void> ? [] : [InferPayload<T[K]>]
  ) {
    const key = event as string
    emitter.emit(key, payload[0])
    allEmitter.emit('event', { name: key, payload: payload[0] })

    if (publicEvents.has(key)) {
      publicEmitter.emit(key, payload[0])
      allPublicEmitter.emit('event', { name: key, payload: payload[0] })
    }

    if (internalEvents.has(key)) {
      internalEmitter.emit(key, payload[0])
      allInternalEmitter.emit('event', { name: key, payload: payload[0] })
    }
  }

  function subscribe<K extends keyof T>(
    event: K,
    handler: (payload: InferPayload<T[K]>) => void,
  ) {
    const key = event as string
    emitter.on(key, handler)
    return { unsubscribe: () => emitter.off(key, handler) }
  }

  function subscribeAll(handler: (dto: EventDto<T>) => void) {
    allEmitter.on('event', handler)
    return { unsubscribe: () => allEmitter.off('event', handler) }
  }

  function subscribePublic(handler: (dto: EventDto<PublicEvents<T>>) => void) {
    allPublicEmitter.on('event', handler)
    return { unsubscribe: () => allPublicEmitter.off('event', handler) }
  }

  function subscribeInternal(
    handler: (dto: EventDto<InternalEvents<T>>) => void,
  ) {
    allInternalEmitter.on('event', handler)
    return { unsubscribe: () => allInternalEmitter.off('event', handler) }
  }

  return {
    emit,
    subscribe,
    subscribeAll,
    subscribePublic,
    subscribeInternal,
  }
}
