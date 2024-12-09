export enum BinanceSymbol {
  BTCUSDT = 'BTCUSDT',
  ETHUSDT = 'ETHUSDT',
  LTCUSDT = 'LTCUSDT',
  TRXUSDT = 'TRXUSDT',
  TONUSDT = 'TONUSDT',
  NOTUSDT = 'NOTUSDT',
  BNBUSDT = 'BNBUSDT',
  DOGEUSDT = 'DOGEUSDT',
}

export type GetTickerPricePayload = {
  symbols: BinanceSymbol[]
}

export type GetTickerPriceOutput = Array<{
  symbol: BinanceSymbol
  price: string
}>
