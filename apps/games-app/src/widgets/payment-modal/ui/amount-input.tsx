import { GemInput, Icons } from '@core/ui'
import { formatGem, gemFloat, gemInt } from '@games/model'
import { useUnit } from 'effector-react'
import { forwardRef, memo } from 'react'
import { $operation, $selectedConfig, fields } from '../model/form'

export const AmountInput = memo(
  forwardRef<HTMLInputElement>((_, ref) => {
    if (!ref) {
      throw new Error('Ref is required')
    }

    if (typeof ref === 'function') {
      throw new TypeError('Ref should be a ref object')
    }

    const operation = useUnit($operation)
    const gemAmount = useUnit(fields.gemAmount.$value)
    const selectedCurrency = useUnit(fields.currency.$value)
    const selectedConfig = useUnit($selectedConfig)

    const getRequirements = () => {
      if (!selectedConfig) return null
      const { minAmount, maxAmount } = selectedConfig
      return `${formatGem(gemFloat(minAmount))}g - ${formatGem(gemFloat(maxAmount))}g`
    }

    const requirements = getRequirements()

    const getRequirementsWidth = () => {
      const length = requirements?.length ?? 0
      return Math.max(length * 7 + 24, 12)
    }

    return (
      <GemInput
        ref={ref}
        classNames={{ section: 'w-fit' }}
        styles={{
          input: {
            paddingLeft: 36,
            paddingRight: getRequirementsWidth(),
          },
        }}
        label={
          'Сумма гемов к ' + (operation === 'deposit' ? 'пополнению' : 'выводу')
        }
        placeholder="Введите сумму"
        value={gemAmount}
        onChange={fields.gemAmount.update}
        min={selectedConfig?.minAmount ?? gemInt(1)}
        max={selectedConfig?.maxAmount ?? gemInt(10000)}
        disabled={!selectedCurrency}
        leftSectionPointerEvents="none"
        leftSection={<Icons.Gem className="mx-2 size-5 text-primary-400" />}
        rightSectionPointerEvents="none"
        rightSection={
          requirements && (
            <p className="px-3 text-sm opacity-65">{requirements}</p>
          )
        }
      />
    )
  }),
)
