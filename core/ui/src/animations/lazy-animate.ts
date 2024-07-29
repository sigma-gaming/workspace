import { AnimationPlaybackControls } from 'framer-motion'
import { useLayoutEffect, useRef } from 'react'

export const lazyAnimateRef: {
  current: typeof import('framer-motion/dom').animate | null
} = {
  current: null,
}

import('framer-motion/dom').then((module) => {
  lazyAnimateRef.current = module.animate
})

export function useLazyAnimate(
  current: number,
  {
    duration = 0.5,
    onBefore = () => () => {},
    onUpdate,
    onComplete = () => () => {},
  }: {
    duration?: number
    onBefore?: (current: number, previous: number) => () => void
    onUpdate: (
      current: number,
      previous: number,
    ) => null | ((value: number) => void)
    onComplete?: (current: number, previous: number) => () => void
  },
) {
  const previousRef = useRef(current)
  const onBeforeRef = useRef(onBefore)
  const onUpdateRef = useRef(onUpdate)
  const onCompleteRef = useRef(onComplete)
  onBeforeRef.current = onBefore
  onUpdateRef.current = onUpdate
  onCompleteRef.current = onComplete

  useLayoutEffect(() => {
    let previous = current

    const before = onBeforeRef.current(current, previous)
    const update = onUpdateRef.current(current, previous)
    const complete = onCompleteRef.current(current, previous)

    if (!update) {
      previousRef.current = current
      return
    }

    before()

    if (previousRef.current === current) {
      update(current)
      complete()
      return
    }

    let controls: AnimationPlaybackControls | null = null

    previous = previousRef.current

    if (lazyAnimateRef.current) {
      controls = lazyAnimateRef.current(previous, current, {
        duration,
        onUpdate(value) {
          update(value)
        },
        onComplete() {
          complete()
        },
      })
    } else {
      update(current)
      complete()
    }

    previousRef.current = current
    return () => controls?.stop()
  }, [current, onUpdateRef, onCompleteRef, onBeforeRef, duration])
}
