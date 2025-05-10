import { Select } from '@mantine/core'
import { useUnit } from 'effector-react'
import { forwardRef, memo } from 'react'
import { Currency } from '../../../shared/api/core'
import { $currencyOptions, $operation, fields } from '../model/form'

const currencyLabelMap: Record<Currency, string> = {
  [Currency.Rub]: 'Рубль',
  [Currency.Kzt]: 'Тенге',
  [Currency.Kgs]: 'Кыргызский сом',
  [Currency.Uzs]: 'Узбекский сом',
  [Currency.Uah]: 'Украинская гривна',
  [Currency.Usd]: 'Доллар',
  [Currency.Eur]: 'Евро',
  [Currency.Trx]: 'TRX',
  [Currency.UsdtTrc20]: 'USDT (TRC20)',
  [Currency.UsdtErc20]: 'USDT (ERC20)',
  [Currency.Btc]: 'BTC',
  [Currency.Ltc]: 'LTC',
  [Currency.Ton]: 'TON',
  [Currency.Not]: 'NOT',
  [Currency.Eth]: 'ETH',
  [Currency.Bnb]: 'BNB',
  [Currency.Doge]: 'DOGE',
}

export const CurrencySelect = memo(
  forwardRef<HTMLInputElement>((_, ref) => {
    const operation = useUnit($operation)
    const selectedCurrency = useUnit(fields.currency.$value)
    const selectedMethod = useUnit(fields.method.$value)
    const currencies = useUnit($currencyOptions)

    if (currencies.length < 2 || !selectedMethod) {
      return null
    }

    return (
      <Select
        ref={ref}
        label="Валюта"
        placeholder="Выберите валюту"
        description={`В этой валюте будет ${operation === 'deposit' ? 'происходить оплата' : 'сделана выплата'}`}
        value={selectedCurrency ? String(selectedCurrency) : null}
        onChange={(value) => fields.currency.update(value as Currency)}
        allowDeselect={false}
        data={currencies.map((currency) => ({
          label: currencyLabelMap[currency],
          value: String(currency),
        }))}
      />
    )
  }),
)
