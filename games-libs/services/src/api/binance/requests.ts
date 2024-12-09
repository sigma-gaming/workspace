import { request } from './request'
import { GetTickerPriceOutput, GetTickerPricePayload } from './types'

export const getTickerPrice = async (
  payload: GetTickerPricePayload,
): Promise<GetTickerPriceOutput> => {
  return request<GetTickerPriceOutput>({
    method: 'GET',
    endpoint: '/v3/ticker/price',
    query: {
      symbols: JSON.stringify(payload.symbols),
    },
  })
}
