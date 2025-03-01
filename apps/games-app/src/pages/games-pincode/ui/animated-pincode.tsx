import { Icons, LazyWrapper, useLazyAnimate } from '@core/ui'
import { trimText } from '@core/utils'
import { useUnit } from 'effector-react'
import { lazy, memo, useMemo, useRef } from 'react'
import { $$profile } from '../../../entities/profile'
import { PincodeMode } from '../../../shared/api/core'
import { getPincodeHighlight } from '../lib/config'
import { $$pincodePage } from '../model'
import styles from './styles.module.css'

const WinInfo = lazy(async () => {
  const module = await import('./win-info')
  return { default: module.WinInfo }
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
  return placeholders[index]!
}

const PincodeNumber = memo(() => {
  const current = useUnit($$pincodePage.$activePincode)
  const mode = useUnit($$pincodePage.fields.mode.$value)
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
      node.current.textContent = pincode[i]!
    }
  }

  const highlight = (value: number) => {
    const highlight = getPincodeHighlight(mode, value)

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
  const name = useUnit($$profile.$name)
  const mode = useUnit($$pincodePage.fields.mode.$value)

  return (
    <div className="w-full flex items-center justify-center min-h-32 select-none">
      <div className="relative flex items-center justify-center p-4 aspect-[1.588/1] max-w-[424px] w-full bg-[#25273E] bg-opacity-60 rounded-xl">
        <div className="hidden sm:flex absolute bottom-4 left-4 items-start gap-2 opacity-30 -rotate-90 origin-top-left translate-y-8">
          <Icons.Sigma color="currentColor" width={32} height={32} />
          <p className="text-xl font-medium uppercase leading-tight">Sigma</p>
        </div>

        <p className="absolute top-4 right-4 opacity-50 font-medium leading-none">
          {mode === PincodeMode.Hardcore && 'HARDCORE'}
          {mode === PincodeMode.Easy && 'EASY'}
        </p>

        <LazyWrapper>
          <WinInfo />
        </LazyWrapper>

        <p className="hidden sm:block absolute bottom-4 right-4 items-start opacity-30 font-medium leading-none">
          {trimText(name, 20)}
        </p>

        <div className="flex flex-col gap-1 mt-8 sm:mt-0">
          <span className="text-sm font-medium opacity-30">Pin</span>
          <PincodeNumber />
        </div>
      </div>
    </div>
  )
}
