import { Currency } from '@dbs/games-types'
import { Select } from '@mantine/core'
import { useUnit } from 'effector-react'
import { forwardRef, memo } from 'react'
import { $currencies, $currencyConfig, $operation, fields } from '../model/form'

const currencyLabelMap: Record<Currency, string> = {
  [Currency.RUB]: 'Рубль',
  [Currency.KZT]: 'Тенге',
  [Currency.KGS]: 'Кыргызский сом',
  [Currency.UZS]: 'Узбекский сом',
  [Currency.UAH]: 'Украинская гривна',
  [Currency.USD]: 'Доллар',
  [Currency.EUR]: 'Евро',
  [Currency.TRX]: 'TRX',
  [Currency.USDT_TRC20]: 'USDT (TRC20)',
  [Currency.USDT_ERC20]: 'USDT (ERC20)',
  [Currency.BTC]: 'BTC',
  [Currency.LTC]: 'LTC',
  [Currency.TON]: 'TON',
  [Currency.NOT]: 'NOT',
  [Currency.ETH]: 'ETH',
  [Currency.BNB]: 'BNB',
  [Currency.DOGE]: 'DOGE',
}

export const CurrencySelect = memo(
  forwardRef<HTMLInputElement>((_, ref) => {
    const operation = useUnit($operation)
    const selectedCurrency = useUnit(fields.currency.$value)
    const selectedProvider = useUnit(fields.provider.$value)
    const currencies = useUnit($currencies)
    const currencyConfig = useUnit($currencyConfig)

    if (currencyConfig?.only) {
      return null
    }

    return (
      <Select
        ref={ref}
        label="Валюта"
        placeholder="Выберите валюту"
        description={`В этой валюте будет ${operation === 'deposit' ? 'происходить оплата' : 'сделана выплата'}`}
        value={selectedCurrency ? String(selectedCurrency) : null}
        onChange={(value) => fields.currency.update(Number(value) as Currency)}
        allowDeselect={false}
        disabled={!selectedProvider || currencies.length < 2}
        data={currencies.map(({ currency }) => ({
          label: currencyLabelMap[currency],
          value: String(currency),
        }))}
      />
    )
  }),
)
