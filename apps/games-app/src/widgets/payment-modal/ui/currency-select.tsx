import { Currency } from '@dbs/games-types'
import { Select } from '@mantine/core'
import { useUnit } from 'effector-react'
import { forwardRef, memo } from 'react'
import { $currencies, $currencyConfig, $operation, fields } from '../model/form'

const currencyLabelMap: Record<Currency, string> = {
  RUB: 'Рубль',
  KZT: 'Тенге',
  KGS: 'Кыргызский сом',
  UZS: 'Узбекский сом',
  UAH: 'Украинская гривна',
  USD: 'Доллар',
  EUR: 'Евро',
  TRX: 'TRX',
  USDT_TRC20: 'USDT (TRC20)',
  USDT_ERC20: 'USDT (ERC20)',
  BTC: 'BTC',
  LTC: 'LTC',
  TON: 'TON',
  NOT: 'NOT',
  ETH: 'ETH',
  BNB: 'BNB',
  DOGE: 'DOGE',
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
        value={selectedCurrency}
        onChange={(value) => fields.currency.update(value as Currency)}
        allowDeselect={false}
        disabled={!selectedProvider || currencies.length < 2}
        data={currencies.map(({ currency }) => ({
          label: currencyLabelMap[currency],
          value: currency,
        }))}
      />
    )
  }),
)
