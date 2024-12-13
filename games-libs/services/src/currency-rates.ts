import { createLazyInstance } from '@core/di'
import { sleep } from '@core/utils'
import { Currency } from '@dbs/games-types'
import { CurrencyExchangeRates } from '@games/model'
import { binanceApi, BinanceSymbol } from './api/binance'
import { coincapApi, CoincapSymbol } from './api/coincap'
import { gamesCache } from './cache'

const symbolCurrencyMap: Record<BinanceSymbol, Currency> = {
  [BinanceSymbol.BTCUSDT]: Currency.BTC,
  [BinanceSymbol.ETHUSDT]: Currency.ETH,
  [BinanceSymbol.LTCUSDT]: Currency.LTC,
  [BinanceSymbol.TRXUSDT]: Currency.TRX,
  [BinanceSymbol.TONUSDT]: Currency.TON,
  [BinanceSymbol.NOTUSDT]: Currency.NOT,
  [BinanceSymbol.BNBUSDT]: Currency.BNB,
  [BinanceSymbol.DOGEUSDT]: Currency.DOGE,
}

export class CurrencyRatesService {
  private async getLatestRates(): Promise<CurrencyExchangeRates> {
    await sleep(1000)

    const [fiatRatesResponse, cryptoRatesResponse] = await Promise.allSettled([
      coincapApi.getRates(),
      binanceApi.getTickerPrice({
        symbols: [
          BinanceSymbol.BTCUSDT,
          BinanceSymbol.ETHUSDT,
          BinanceSymbol.LTCUSDT,
          BinanceSymbol.TRXUSDT,
          BinanceSymbol.TONUSDT,
          BinanceSymbol.NOTUSDT,
          BinanceSymbol.BNBUSDT,
          BinanceSymbol.DOGEUSDT,
        ],
      }),
    ])

    const rates: CurrencyExchangeRates = {}

    if (fiatRatesResponse.status === 'fulfilled') {
      const fiatRates = fiatRatesResponse.value

      const fiatRawRatesMap = fiatRates.reduce(
        (acc, rate) => {
          acc[rate.symbol] = Number(rate.rateUsd)
          return acc
        },
        {} as Partial<Record<CoincapSymbol, number>>,
      )

      const rub = fiatRawRatesMap[CoincapSymbol.RUB]
      const kzt = fiatRawRatesMap[CoincapSymbol.KZT]
      const kgs = fiatRawRatesMap[CoincapSymbol.KGS]
      const uzs = fiatRawRatesMap[CoincapSymbol.UZS]
      const uah = fiatRawRatesMap[CoincapSymbol.UAH]
      const usd = fiatRawRatesMap[CoincapSymbol.USD]
      const eur = fiatRawRatesMap[CoincapSymbol.EUR]
      const usdt = fiatRawRatesMap[CoincapSymbol.USDT]

      if (rub && usd) {
        rates.RUB = 100
        rates.USD = rates.RUB / rub
        if (eur) rates.EUR = eur * rates.USD
        if (kzt) rates.KZT = kzt * rates.USD
        if (kgs) rates.KGS = kgs * rates.USD
        if (uzs) rates.UZS = uzs * rates.USD
        if (uah) rates.UAH = uah * rates.USD
        if (usdt) rates.USDT_ERC20 = usdt * rates.USD
        if (usdt) rates.USDT_TRC20 = usdt * rates.USD
      }
    }

    if (cryptoRatesResponse.status === 'fulfilled' && rates.USDT_TRC20) {
      const tickerPrices = cryptoRatesResponse.value

      for (const ticker of tickerPrices) {
        const currency = symbolCurrencyMap[ticker.symbol]
        rates[currency] = Number(ticker.price) * rates.USDT_TRC20
      }
    }

    return rates
  }

  async getRates(): Promise<CurrencyExchangeRates | null> {
    return gamesCache.currencyRates.get()
  }

  async updateRates(): Promise<void> {
    const rates = await this.getLatestRates()
    await gamesCache.currencyRates.set(rates)
  }

  async convert(amount: number, from: Currency, to: Currency): Promise<number> {
    const rates = await this.getRates()

    if (!rates) {
      throw new Error('Currency rates not available')
    }

    if (!rates[from] || !rates[to]) {
      throw new Error('Specified currency rates not available')
    }

    return (amount * rates[from]) / rates[to]
  }

  async convertGems(amount: number, to: Currency): Promise<number> {
    const rates = await this.getRates()

    if (!rates) {
      throw new Error('Currency rates not available')
    }

    if (!rates[to]) {
      throw new Error('Specified currency rates not available')
    }

    return amount / rates[to]
  }
}

export const currencyRatesService = createLazyInstance(CurrencyRatesService)
