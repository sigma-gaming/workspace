import { loggerService } from '@core/logger'

type RequestParams = {
  method: 'GET'
  endpoint: string
  query?: Record<string, any>
}

const logger = loggerService.logger.child('CoincapAPI')

export const request = async <T>({
  method,
  endpoint,
  query,
}: RequestParams): Promise<T> => {
  let url = `https://api.coincap.io/v2${endpoint}`

  const queryString = new URLSearchParams(query).toString()

  if (queryString) {
    url += `?${queryString}`
  }

  const response = await fetch(url, { method })

  const json = (await response.json()) as any

  if (!response.ok) {
    logger.error('Request failed')
    logger.error(json)
    throw json
  }

  return json.data as T
}
