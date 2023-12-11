import { EventCallable } from 'effector'
import { useUnit } from 'effector-react'
import { ParsedUrlQuery } from 'querystring'
import { useCallback, useEffect, useRef } from 'react'

type AnyCallback = (...args: unknown[]) => unknown

function useActualCallback<T extends AnyCallback>(callback: T): T {
  const callbackRef = useRef<T>(callback)
  callbackRef.current = callback
  const wrapper = (...args: Parameters<T>) => callbackRef.current(...args)
  return useCallback(wrapper as T, [])
}

export function useClientMountedEvent(event: EventCallable<void>): void
export function useClientMountedEvent<T>(
  event: EventCallable<T>,
  createPayload: void extends T ? void : () => T,
): void

export function useClientMountedEvent<T>(
  event: EventCallable<T>,
  createPayload: void extends T ? void : () => T,
) {
  const scopedEvent = useUnit(event, { forceScope: true })
  const actualCreatePayload = useActualCallback(() => createPayload?.() as T)

  return useEffect(() => {
    scopedEvent(actualCreatePayload())
  }, [scopedEvent, actualCreatePayload])
}

export function useClientUnmountedEvent(event: EventCallable<void>): void
export function useClientUnmountedEvent<T extends ParsedUrlQuery>(
  event: EventCallable<T>,
  createPayload: void extends T ? void : () => T,
): void

export function useClientUnmountedEvent<T>(
  event: EventCallable<T>,
  createPayload: void extends T ? void : () => T,
) {
  const scopedEvent = useUnit(event, { forceScope: true })
  const actualCreatePayload = useActualCallback(() => createPayload?.() as T)

  return useEffect(() => {
    return () => {
      scopedEvent(actualCreatePayload())
    }
  }, [scopedEvent, actualCreatePayload])
}
