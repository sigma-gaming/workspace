export enum CoincapSymbol {
  RUB = 'RUB',
  KZT = 'KZT',
  KGS = 'KGS',
  UZS = 'UZS',
  UAH = 'UAH',
  USD = 'USD',
  EUR = 'EUR',
  USDT = 'USDT',
}

export type GetRatesOutput = Array<{
  id: string
  symbol: CoincapSymbol
  currencySymbol: string
  rateUsd: string
  type: 'fiat' | 'crypto'
}>
