import { loggerService } from '@core/logger'

type RequestParams = {
  method: 'GET'
  endpoint: string
  query?: Record<string, any>
}

const logger = loggerService.logger.child('BinanceAPI')

export const request = async <T>({
  method,
  endpoint,
  query,
}: RequestParams): Promise<T> => {
  let url = `https://data-api.binance.vision/api${endpoint}`

  const queryString = new URLSearchParams(query).toString()

  if (queryString) {
    url += `?${queryString}`
  }

  const response = await fetch(url, { method })

  const json = await response.json()

  if (!response.ok) {
    logger.error('Request failed')
    logger.error(json)
    throw json
  }

  return json as T
}
