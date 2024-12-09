import { GemInput, Icons } from '@core/ui'
import { formatGem, gemFloat } from '@games/model'
import { useUnit } from 'effector-react'
import { forwardRef, useEffect, useState } from 'react'
import { $operation, $providerConfig, fields } from '../model/form'

export const AmountInput = forwardRef<HTMLInputElement>((_, ref) => {
  if (!ref) {
    throw new Error('Ref is required')
  }

  if (typeof ref === 'function') {
    throw new TypeError('Ref should be a ref object')
  }

  const operation = useUnit($operation)
  const amount = useUnit(fields.amount.$value)
  const selectedCurrency = useUnit(fields.currency.$value)
  const providerConfig = useUnit($providerConfig)
  const [internal, setInternal] = useState(() => amount)

  useEffect(() => {
    setInternal(amount)
  }, [amount])

  const syncValue = (value: number) => {
    fields.amount.update(value)
  }

  useEffect(() => {
    const input = ref.current
    if (!input) return
    if (document.activeElement === input) return
    syncValue(internal)
  }, [ref, internal])

  const getRequirements = () => {
    if (!providerConfig) return null
    const { minAmount, maxAmount } = providerConfig.entry
    return `${formatGem(gemFloat(minAmount))}g - ${formatGem(gemFloat(maxAmount))}g`
  }

  const requirements = getRequirements()

  const getCurrencyClueWidth = () => {
    const length = requirements?.length ?? 0
    return Math.max(length * 8, 12)
  }

  return (
    <GemInput
      ref={ref}
      classNames={{ section: 'w-fit' }}
      styles={{
        input: {
          paddingLeft: 36,
          paddingRight: getCurrencyClueWidth(),
        },
      }}
      label={
        'Сумма гемов к ' + (operation === 'deposit' ? 'пополнению' : 'выводу')
      }
      placeholder="Введите сумму"
      value={internal}
      onChange={setInternal}
      onBlur={() => {
        let updated = internal

        if (providerConfig) {
          const { minAmount, maxAmount } = providerConfig.entry
          if (internal < minAmount) updated = minAmount
          else if (internal > maxAmount) updated = maxAmount
        }

        setInternal(updated)
        syncValue(updated)
      }}
      disabled={!selectedCurrency}
      leftSectionPointerEvents="none"
      leftSection={<Icons.Gem className="mx-2 size-5 text-primary-400" />}
      rightSectionPointerEvents="none"
      rightSection={
        requirements && (
          <p className="px-2 text-sm opacity-65">{requirements}</p>
        )
      }
    />
  )
})
