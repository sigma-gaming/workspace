import { PaymentProvider } from '@dbs/games-types'
import { Select } from '@mantine/core'
import { useUnit } from 'effector-react'
import { forwardRef, memo } from 'react'
import { $operation, $providers, fields } from '../model/form'

export const ProviderSelect = memo(
  forwardRef<HTMLInputElement>((_, ref) => {
    const operation = useUnit($operation)
    const selectedProvider = useUnit(fields.provider.$value)
    const providers = useUnit($providers)

    if (providers.length <= 1) {
      return null
    }

    return (
      <Select
        ref={ref}
        label="Платёжный сервис"
        placeholder="Выберите платёжный сервис"
        description={`Если не получается ${operation === 'deposit' ? 'пополнить баланс' : 'сделать вывод'}, попробуйте другой вариант`}
        value={selectedProvider}
        onChange={(value) => fields.provider.update(value as PaymentProvider)}
        allowDeselect={false}
        data={providers.map(({ provider }, idx) => ({
          label: `Вариант #${idx + 1}`,
          value: provider,
        }))}
      />
    )
  }),
)
