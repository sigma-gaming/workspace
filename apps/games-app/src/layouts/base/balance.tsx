import { Skeleton, Text } from '@mantine/core'
import { useUnit } from 'effector-react'
import { AnimationPlaybackControls } from 'framer-motion'
import { memo, useLayoutEffect, useRef } from 'react'
import { $$balance } from '../../entities/balance'
import { formatGem } from '../../shared/lib/format/currency.ts'
import { Icons } from '../../shared/ui/icons/index.tsx'

export const Balance = memo(() => {
  const balanceLoading = useUnit($$balance.$loading)

  return (
    <div className="flex flex-col gap-1 items-end">
      <Skeleton visible={balanceLoading} width="fit-content">
        <Text className="!leading-tight text-xs lg:text-sm">Баланс</Text>
      </Skeleton>
      <Skeleton
        visible={balanceLoading}
        width="fit-content"
        className="min-w-[100px]"
      >
        <div className="flex items-center justify-end gap-1.5">
          <Text
            className="!leading-none text-lg lg:text-xl"
            fw={500}
            c="green.6"
          >
            <AnimatedBalance />
          </Text>
          <Icons.Gem className="w-6 h-6 text-primary-4 -translate-y-[1px]" />
        </div>
      </Skeleton>
    </div>
  )
})

function getFractionDigits(number: number) {
  if (number % 10 !== 0) return 2
  if (number % 100 !== 0) return 1
  return 0
}

let animate: typeof import('framer-motion/dom').animate | null = null

import('framer-motion/dom').then((module) => {
  animate = module.animate
})

const AnimatedBalance = () => {
  const current = useUnit($$balance.$available)
  const loaded = useUnit($$balance.$loaded)
  const previousLoadedRef = useRef(loaded)
  const previousRef = useRef(current)
  const nodeRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return

    if (!previousLoadedRef.current && loaded) {
      previousLoadedRef.current = loaded
      previousRef.current = current
    }

    if (previousRef.current === current) {
      const text = formatGem(current / 100)
      node.textContent = text
      return
    }

    const fractionDigits = Math.max(
      getFractionDigits(current),
      getFractionDigits(previousRef.current),
    )

    let controls: AnimationPlaybackControls | null = null

    if (animate) {
      controls = animate(previousRef.current, current, {
        duration: 0.5,
        onUpdate(value) {
          const text = formatGem(value / 100, fractionDigits)
          if (!node) return
          node.textContent = text
        },
      })
    } else {
      const text = formatGem(current / 100)
      node.textContent = text
    }

    previousRef.current = current
    return () => controls?.stop()
  }, [loaded, current])

  return <span style={{ display: 'inline-block' }} ref={nodeRef} />
}
