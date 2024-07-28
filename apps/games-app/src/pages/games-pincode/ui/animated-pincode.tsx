import { getPincodeHighlight } from '@games/model'
import { useUnit } from 'effector-react'
import { AnimationPlaybackControls } from 'framer-motion'
import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { $$pincodePage } from '../model'
import styles from './styles.module.css'

let animate: typeof import('framer-motion/dom').animate | null = null

import('framer-motion/dom').then((module) => {
  animate = module.animate
})

function formatPincode(number: number) {
  return number.toFixed(0).padStart(4, '0')
}

const placeholders = [
  'CODE',
  'PLAY',
  'LUCK',
  'GAME',
  'SPIN',
  'CASH',
  'ROLL',
  'GEMS',
  'RISK',
  'SLOT',
  'TAKE',
  'WISH',
]

function getRandomPlaceholder() {
  const index = Math.floor(Math.random() * placeholders.length)
  return placeholders[index]
}

const PincodeNumber = memo(() => {
  const current = useUnit($$pincodePage.$activePincode)
  const previousRef = useRef(current)
  const number1Ref = useRef<HTMLSpanElement>(null)
  const number2Ref = useRef<HTMLSpanElement>(null)
  const number3Ref = useRef<HTMLSpanElement>(null)
  const number4Ref = useRef<HTMLSpanElement>(null)

  const numbers = useMemo(
    () => [number1Ref, number2Ref, number3Ref, number4Ref],
    [number1Ref, number2Ref, number3Ref, number4Ref],
  )

  useLayoutEffect(() => {
    const updateNumbers = (value: number) => {
      const pincode =
        value === -1 ? getRandomPlaceholder() : formatPincode(value)

      for (const [i, node] of numbers.entries()) {
        if (!node.current) return
        node.current.textContent = pincode[i]
      }
    }

    const highlight = (value: number) => {
      const highlight = getPincodeHighlight(value)

      for (const [i, node] of numbers.entries()) {
        const element = node.current
        if (!element) return
        const highlighted = highlight[i]
        const currentHighlight = element.dataset.highlight

        if (!highlighted) element.dataset.highlight = 'none'
        else if (currentHighlight === '1') element.dataset.highlight = '2'
        else element.dataset.highlight = '1'
      }
    }

    const clearHighlight = () => {
      for (const node of numbers) {
        const element = node.current
        if (!element) return
        element.dataset.highlight = 'none'
      }
    }

    if (previousRef.current === current) {
      updateNumbers(current)
      return
    }

    let controls: AnimationPlaybackControls | null = null

    clearHighlight()

    if (animate) {
      controls = animate(previousRef.current, current, {
        duration: 0.5,
        onUpdate(value) {
          updateNumbers(value)
        },
        onComplete() {
          $$pincodePage.animationFinished()
          highlight(current)
        },
      })
    } else {
      updateNumbers(current)
      highlight(current)
    }

    previousRef.current = current
    return () => controls?.stop()
  }, [current, numbers])

  return (
    <div className="flex gap-2 items-center justify-center font-medium text-3xl">
      <span className={styles.pincodeNumber} ref={number1Ref} />
      <span className={styles.pincodeNumber} ref={number2Ref} />
      <span className={styles.pincodeNumber} ref={number3Ref} />
      <span className={styles.pincodeNumber} ref={number4Ref} />
    </div>
  )
})

export const AnimatedPincode = () => {
  return (
    <div className="flex items-center justify-center min-h-32">
      <PincodeNumber />
    </div>
  )
}
