import { Icons, useLazyAnimate } from '@core/ui'
import { formatGem, gemFloat } from '@games/model'
import { Skeleton, Text } from '@mantine/core'
import { useUnit } from 'effector-react'
import { memo, useRef } from 'react'
import { $$balance } from '../../entities/balance'

export const Balance = memo(() => {
  const balanceLoading = useUnit($$balance.$loading)

  return (
    <div className="flex flex-col gap-1 items-end">
      <Skeleton visible={balanceLoading} width="fit-content">
        <Text className="!leading-tight text-xs lg:text-sm select-none">
          Баланс
        </Text>
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

const AnimatedBalance = () => {
  const loaded = useUnit($$balance.$loaded)
  if (!loaded) return null
  return <AnimatedBalanceInternal />
}

const AnimatedBalanceInternal = () => {
  const balance = useUnit($$balance.$available)
  const nodeRef = useRef<HTMLSpanElement>(null)

  useLazyAnimate(balance, {
    onUpdate: (current, previous) => {
      const fractionDigits = Math.max(
        getFractionDigits(current),
        getFractionDigits(previous),
      )

      return (value) => {
        const node = nodeRef.current
        if (!node) return
        const text = formatGem(gemFloat(value), fractionDigits)
        node.textContent = text
      }
    },
  })

  return <span style={{ display: 'inline-block' }} ref={nodeRef} />
}
