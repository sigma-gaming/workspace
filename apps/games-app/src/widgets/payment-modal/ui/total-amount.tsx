import { Icons } from '@core/ui'
import { Currency } from '@dbs/games-types'
import { useUnit } from 'effector-react'
import { memo, ReactNode } from 'react'
import {
  $exchangeRateMissing,
  $exchangeRates,
  $totalAmount,
  fields,
} from '../model/form'

const formatters = {
  rub: new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }),
  kzt: new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency: 'KZT',
    maximumFractionDigits: 0,
  }),
  kgs: new Intl.NumberFormat('ru-KG', {
    style: 'currency',
    currency: 'KGS',
    maximumFractionDigits: 0,
  }),
  uzs: new Intl.NumberFormat('ru-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }),
  uah: new Intl.NumberFormat('ru-UA', {
    style: 'currency',
    currency: 'UAH',
    maximumFractionDigits: 0,
  }),
  usd: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }),
  eur: new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }),
}

const currencyFormatterMap: Record<Currency, (value: number) => string> = {
  [Currency.RUB]: (value) => formatters.rub.format(value),
  [Currency.KZT]: (value) => formatters.kzt.format(value),
  [Currency.KGS]: (value) => formatters.kgs.format(value),
  [Currency.UZS]: (value) => formatters.uzs.format(value),
  [Currency.UAH]: (value) => formatters.uah.format(value),
  [Currency.USD]: (value) => formatters.usd.format(value),
  [Currency.EUR]: (value) => formatters.eur.format(value),
  [Currency.USDT_TRC20]: (value) => formatters.usd.format(value),
  [Currency.USDT_ERC20]: (value) => formatters.usd.format(value),
  [Currency.TRX]: (value) => value.toFixed(2),
  [Currency.BTC]: (value) => value.toFixed(8),
  [Currency.LTC]: (value) => value.toFixed(8),
  [Currency.TON]: (value) => value.toFixed(8),
  [Currency.NOT]: (value) => value.toFixed(8),
  [Currency.ETH]: (value) => value.toFixed(8),
  [Currency.BNB]: (value) => value.toFixed(8),
  [Currency.DOGE]: (value) => value.toFixed(8),
}

const currencyIconMap: Partial<Record<Currency, ReactNode>> = {
  [Currency.TON]: <Icons.Ton className="size-6" />,
}

export const TotalAmount = memo(() => {
  const totalAmount = useUnit($totalAmount)
  const selectedCurrency = useUnit(fields.currency.$value)
  const exchangeRates = useUnit($exchangeRates)
  const exchangeRateMissing = useUnit($exchangeRateMissing)

  if (!exchangeRates || !selectedCurrency) {
    return null
  }

  const icon = currencyIconMap[selectedCurrency]

  if (exchangeRateMissing) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {icon && <div className="shrink-0">{icon}</div>}
          <p className="text-4xl font-[450] truncate">?</p>
        </div>
        <p className="text-sm leading-tight text-dimmed opacity-80">
          К сожалению, нам не&nbsp;удалось расчитать курс обмена&nbsp;валюты.
          Рекомендуем проверить сумму на&nbsp;следующем шаге
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon && <div className="shrink-0">{icon}</div>}
        <p className="text-4xl font-[450] truncate">
          {currencyFormatterMap[selectedCurrency](totalAmount)}
        </p>
      </div>
      <p className="text-sm leading-tight text-dimmed opacity-80">
        Итоговая сумма с&nbsp;комиссией. Финальная сумма на стороне провайдера
        может отличаться от&nbsp;показанной
      </p>
    </div>
  )
})
