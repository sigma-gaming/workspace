import { useUnit } from 'effector-react'
import { AnimationPlaybackControls } from 'framer-motion'
import { memo, useLayoutEffect, useRef } from 'react'
import { $$pincodePage } from '../model'

let animate: typeof import('framer-motion/dom').animate | null = null

import('framer-motion/dom').then((module) => {
  animate = module.animate
})

function formatPincode(number: number) {
  return number.toFixed(0).padStart(4, '0')
}

const PincodeNumber = memo(() => {
  const current = useUnit($$pincodePage.$activePincode)
  const previousRef = useRef(current)
  const nodeRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return

    if (previousRef.current === current) {
      node.textContent = formatPincode(current)
      return
    }

    let controls: AnimationPlaybackControls | null = null

    if (animate) {
      controls = animate(previousRef.current, current, {
        duration: 0.5,
        onUpdate(value) {
          const text = formatPincode(value)
          if (!node) return
          node.textContent = text
        },
      })
    } else {
      const text = formatPincode(current)
      node.textContent = text
    }

    previousRef.current = current
    return () => controls?.stop()
  }, [current])

  return <span style={{ display: 'inline-block' }} ref={nodeRef} />
})

export const AnimatedPincode = () => {
  return (
    <div className="flex items-center justify-center min-h-32">
      <PincodeNumber />
    </div>
  )
}
