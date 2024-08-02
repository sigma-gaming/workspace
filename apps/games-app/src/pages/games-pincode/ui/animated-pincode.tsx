import { Icons, useLazyAnimate } from '@core/ui'
import { getPincodeHighlight } from '@games/model'
import { useUnit } from 'effector-react'
import { memo, useMemo, useRef } from 'react'
import { $$pincodePage } from '../model'
import styles from './styles.module.css'

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
  const number1Ref = useRef<HTMLSpanElement>(null)
  const number2Ref = useRef<HTMLSpanElement>(null)
  const number3Ref = useRef<HTMLSpanElement>(null)
  const number4Ref = useRef<HTMLSpanElement>(null)

  const numbers = useMemo(
    () => [number1Ref, number2Ref, number3Ref, number4Ref],
    [number1Ref, number2Ref, number3Ref, number4Ref],
  )

  const updateNumbers = (value: number) => {
    const pincode = value === -1 ? getRandomPlaceholder() : formatPincode(value)

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

  useLazyAnimate(current, {
    onBefore: () => {
      return () => clearHighlight()
    },
    onUpdate: () => {
      return (value) => updateNumbers(value)
    },
    onComplete: () => {
      return () => {
        $$pincodePage.animationFinished()
        highlight(current)
      }
    },
  })

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
    <div className="w-full flex items-center justify-center min-h-32 select-none">
      <div className="relative flex items-center justify-center p-4 aspect-[1.588/1] max-w-[424px] w-full bg-[#25273E] bg-opacity-40 rounded-xl">
        <div className="hidden sm:flex absolute bottom-4 left-4 items-start gap-2 opacity-25 -rotate-90 origin-top-left translate-y-8">
          <Icons.Sigma color="currentColor" width={32} height={32} />
          <p className="text-xl font-medium uppercase leading-tight">Sigma</p>
        </div>
        <PincodeNumber />
      </div>
    </div>
  )
}
